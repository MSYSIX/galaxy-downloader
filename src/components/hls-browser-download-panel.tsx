'use client'

import { fileSave, supported as supportsStreamingFileSave } from 'browser-fs-access'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, ListVideo } from 'lucide-react'
import pRetry from 'p-retry'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useDictionary } from '@/i18n/client'
import type { ByteRange, HlsSegment } from '@/lib/hls-browser-download'
import {
    buildRangeHeader,
    decryptAes128Cbc,
    importAes128Key,
    inferHlsOutputExtension,
    parseHlsMediaPlaylist,
    pickBestVariant,
    shouldBlockLargeHlsDownloadWithoutStreamingSave,
    sliceHlsSegments,
} from '@/lib/hls-browser-download'
import { HLS_PLAYLIST_ACCEPT } from '@/lib/hls-playback'
import { requestUnifiedParse } from '@/lib/unified-parse'
import { sanitizeFilename } from '@/lib/utils'

const DOWNLOAD_CONCURRENCY = 8
const SEGMENT_DOWNLOAD_RETRIES = 3
const MAX_MASTER_PLAYLIST_DEPTH = 8

class HttpStatusError extends Error {
    status: number

    constructor(status: number, message: string) {
        super(message)
        this.name = 'HttpStatusError'
        this.status = status
    }
}

type PlaylistResolution = {
    title: string
    playlistUrl: string
    variantCount: number
    totalSegments: number
    selectedSegments: HlsSegment[]
    mapUrl: string | null
    mapByterange?: ByteRange
    encrypted: boolean
}

type DownloadSample = {
    bytes: number
    timestamp: number
}

export interface HlsBrowserDownloadPanelProps {
    initialSourceUrl: string
    initialResolvedPlaylistUrl?: string
    initialTitle?: string
    autorun?: boolean
    onBusyChange?: (busy: boolean) => void
    onCancelReady?: (cancel: (() => void) | null) => void
}

function buildFetchHeaders(accept?: string, byterange?: ByteRange): HeadersInit | undefined {
    const headers: Record<string, string> = {}
    if (accept) {
        headers.Accept = accept
    }

    const range = buildRangeHeader(byterange)
    if (range) {
        headers.Range = range
    }

    return Object.keys(headers).length > 0 ? headers : undefined
}

function isAbortError(error: unknown): boolean {
    return error instanceof DOMException && error.name === 'AbortError'
}

function isRetryableStatus(status: number): boolean {
    return status === 408 || status === 425 || status === 429 || (status >= 500 && status < 600)
}

function shouldRetryDownload(error: unknown): boolean {
    if (isAbortError(error)) {
        return false
    }

    if (error instanceof HttpStatusError) {
        return isRetryableStatus(error.status)
    }

    return true
}

async function fetchWorkerText(
    target: string,
    signal: AbortSignal,
    accept?: string
): Promise<string> {
    const response = await fetch(target, {
        cache: 'no-store',
        headers: buildFetchHeaders(accept),
        signal,
    })

    if (!response.ok) {
        throw new HttpStatusError(response.status, `Worker request failed with HTTP ${response.status}`)
    }

    return response.text()
}

function assertWorkerResourceUrl(target: string, workerOrigin: string, allowRoot: boolean): string {
    const parsed = new URL(target)
    if (parsed.origin !== workerOrigin) {
        throw new Error('HLS playlist contains a resource outside the configured Worker origin')
    }

    if (!allowRoot && parsed.pathname !== '/api/hls-proxy') {
        throw new Error('HLS playlist contains an unsigned Worker resource URL')
    }

    return parsed.toString()
}

async function fetchWorkerBytes(
    target: string,
    signal: AbortSignal,
    byterange?: ByteRange
): Promise<Uint8Array> {
    const response = await fetch(target, {
        cache: 'no-store',
        headers: buildFetchHeaders(undefined, byterange),
        signal,
    })

    if (!response.ok) {
        throw new HttpStatusError(response.status, `Worker request failed with HTTP ${response.status}`)
    }

    return new Uint8Array(await response.arrayBuffer())
}

async function fetchBytesWithRetry(
    target: string,
    signal: AbortSignal,
    byterange?: ByteRange
): Promise<Uint8Array> {
    return pRetry(
        () => fetchWorkerBytes(target, signal, byterange),
        {
            retries: SEGMENT_DOWNLOAD_RETRIES,
            factor: 2,
            minTimeout: 500,
            maxTimeout: 4000,
            randomize: true,
            signal,
            shouldRetry: ({ error }) => shouldRetryDownload(error),
        }
    )
}

async function resolvePlaylist(
    sourceUrl: string,
    signal: AbortSignal,
    resolvedPlaylistUrl?: string,
    titleOverride?: string
): Promise<PlaylistResolution> {
    let playlistUrl = resolvedPlaylistUrl?.trim() || ''
    let title = titleOverride?.trim() || ''

    if (!playlistUrl) {
        const parsed = await requestUnifiedParse(sourceUrl)
        playlistUrl = parsed.data.downloadVideoUrl || ''

        if (!playlistUrl) {
            throw new Error('No playlist URL was returned by /api/parse')
        }

        title = title || parsed.data.title || parsed.data.desc || ''
    }

    let activePlaylistUrl = playlistUrl
    const workerOrigin = new URL(playlistUrl).origin
    activePlaylistUrl = assertWorkerResourceUrl(activePlaylistUrl, workerOrigin, true)
    let playlistText = await fetchWorkerText(
        activePlaylistUrl,
        signal,
        HLS_PLAYLIST_ACCEPT
    )
    let variantCount = 0
    for (; variantCount < MAX_MASTER_PLAYLIST_DEPTH; variantCount += 1) {
        const bestVariant = pickBestVariant(playlistText, activePlaylistUrl)
        if (!bestVariant) {
            break
        }
        activePlaylistUrl = assertWorkerResourceUrl(bestVariant.url, workerOrigin, false)
        playlistText = await fetchWorkerText(
            activePlaylistUrl,
            signal,
            HLS_PLAYLIST_ACCEPT
        )
    }

    if (pickBestVariant(playlistText, activePlaylistUrl)) {
        throw new Error('HLS master playlist nesting is too deep')
    }

    const mediaPlaylist = parseHlsMediaPlaylist(playlistText, activePlaylistUrl)
    for (const resourceUrl of [
        mediaPlaylist.mapUrl,
        ...mediaPlaylist.segments.flatMap((segment) => [segment.url, segment.keyUrl])
    ]) {
        if (resourceUrl) {
            assertWorkerResourceUrl(resourceUrl, workerOrigin, false)
        }
    }
    const selectedSegments = sliceHlsSegments(mediaPlaylist.segments)

    return {
        title,
        playlistUrl: activePlaylistUrl,
        variantCount,
        totalSegments: mediaPlaylist.segments.length,
        selectedSegments,
        mapUrl: mediaPlaylist.mapUrl,
        mapByterange: mediaPlaylist.mapByterange,
        encrypted: mediaPlaylist.encrypted,
    }
}

async function runWithConcurrency<T>(
    items: T[],
    concurrency: number,
    worker: (item: T, index: number) => Promise<void>
): Promise<void> {
    let nextIndex = 0

    async function runWorker(): Promise<void> {
        while (nextIndex < items.length) {
            const currentIndex = nextIndex
            nextIndex += 1
            await worker(items[currentIndex], currentIndex)
        }
    }

    await Promise.all(
        Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker())
    )
}

function createStreamingDownloadResponse({
    targets,
    resolution,
    signal,
    onChunkDownloaded,
}: {
    targets: Array<{ url: string; byterange?: ByteRange; keyUrl?: string; iv?: Uint8Array }>
    resolution: PlaylistResolution
    signal: AbortSignal
    onChunkDownloaded: (bytes: number) => void
}): Response {
    const keyCache = new Map<string, Promise<CryptoKey>>()
    let started = false

    const stream = new ReadableStream<Uint8Array>({
        pull(controller) {
            if (started) {
                return
            }

            started = true

            void (async () => {
                const pendingChunks = new Map<number, Uint8Array>()
                let nextWriteIndex = 0

                const flushReadyChunks = () => {
                    while (pendingChunks.has(nextWriteIndex)) {
                        const chunk = pendingChunks.get(nextWriteIndex)
                        pendingChunks.delete(nextWriteIndex)
                        nextWriteIndex += 1

                        if (!chunk) {
                            continue
                        }

                        controller.enqueue(chunk)
                    }
                }

                try {
                    await runWithConcurrency(targets, DOWNLOAD_CONCURRENCY, async (target, index) => {
                        const bytes = await fetchBytesWithRetry(
                            target.url,
                            signal,
                            target.byterange
                        )

                        let outputChunk = bytes
                        if (target.keyUrl) {
                            if (!target.iv) {
                                throw new Error('Encrypted HLS segment is missing IV')
                            }

                            if (!keyCache.has(target.keyUrl)) {
                                keyCache.set(target.keyUrl, (async () => {
                                    const rawKey = await fetchBytesWithRetry(
                                        target.keyUrl!,
                                        signal
                                    )
                                    return importAes128Key(rawKey)
                                })())
                            }

                            const cryptoKey = await keyCache.get(target.keyUrl)!
                            outputChunk = await decryptAes128Cbc(bytes, cryptoKey, target.iv)
                        }

                        pendingChunks.set(index, outputChunk)
                        onChunkDownloaded(outputChunk.byteLength)
                        flushReadyChunks()
                    })

                    flushReadyChunks()
                    controller.close()
                } catch (error) {
                    controller.error(error)
                }
            })()
        },
    })

    return new Response(stream)
}

function formatSpeed(bytesPerSecond: number): string {
    if (!Number.isFinite(bytesPerSecond) || bytesPerSecond <= 0) {
        return '--'
    }

    return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} mb/s`
}

function formatEta(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds <= 0) {
        return '00:00'
    }

    const totalSeconds = Math.max(1, Math.round(seconds))
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const remainingSeconds = totalSeconds % 60

    if (hours > 0) {
        return [hours, minutes, remainingSeconds].map((value) => String(value).padStart(2, '0')).join(':')
    }

    return [minutes, remainingSeconds].map((value) => String(value).padStart(2, '0')).join(':')
}

export function HlsBrowserDownloadPanel({
    initialSourceUrl,
    initialResolvedPlaylistUrl,
    initialTitle = '',
    autorun = false,
    onBusyChange,
    onCancelReady,
}: HlsBrowserDownloadPanelProps) {
    const dict = useDictionary()
    const [status, setStatus] = useState(dict.hlsDownload.idleStatus)
    const [resolveLoading, setResolveLoading] = useState(false)
    const [downloadLoading, setDownloadLoading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [failed, setFailed] = useState(false)
    const [speedBytesPerSecond, setSpeedBytesPerSecond] = useState<number | null>(null)
    const [etaSeconds, setEtaSeconds] = useState<number | null>(null)
    const autorunTriggeredRef = useRef(false)
    const mountedRef = useRef(true)
    const activeAbortControllerRef = useRef<AbortController | null>(null)
    const downloadSamplesRef = useRef<DownloadSample[]>([])
    const isBusy = resolveLoading || downloadLoading

    useEffect(() => {
        onBusyChange?.(isBusy)
    }, [isBusy, onBusyChange])

    useEffect(() => {
        return () => {
            mountedRef.current = false
            activeAbortControllerRef.current?.abort()
        }
    }, [])

    const startTask = useCallback(() => {
        activeAbortControllerRef.current?.abort()
        const controller = new AbortController()
        activeAbortControllerRef.current = controller
        return controller
    }, [])

    const finishTask = useCallback((controller: AbortController) => {
        if (activeAbortControllerRef.current === controller) {
            activeAbortControllerRef.current = null
        }
    }, [])

    const cancelActiveTask = useCallback(() => {
        activeAbortControllerRef.current?.abort()
    }, [])

    useEffect(() => {
        onCancelReady?.(cancelActiveTask)

        return () => {
            onCancelReady?.(null)
        }
    }, [cancelActiveTask, onCancelReady])

    const handleStart = useCallback(async (): Promise<void> => {
        const controller = startTask()
        setResolveLoading(true)
        setDownloadLoading(false)
        setFailed(false)
        setProgress(0)
        setSpeedBytesPerSecond(null)
        setEtaSeconds(null)
        downloadSamplesRef.current = []
        setStatus(dict.hlsDownload.resolvingStatus)

        try {
            const resolution = await resolvePlaylist(
                initialSourceUrl.trim(),
                controller.signal,
                initialResolvedPlaylistUrl?.trim(),
                initialTitle.trim()
            )

            if (!mountedRef.current) {
                return
            }

            if (shouldBlockLargeHlsDownloadWithoutStreamingSave(
                resolution.selectedSegments.length,
                supportsStreamingFileSave
            )) {
                setStatus(dict.hlsDownload.largeVideoBrowserLimitedStatus)
                setFailed(true)
                return
            }

            setResolveLoading(false)
            setDownloadLoading(true)
            setStatus(dict.hlsDownload.downloadingStatus)

            const targets = [
                ...(resolution.mapUrl
                    ? [{
                        url: resolution.mapUrl,
                        byterange: resolution.mapByterange,
                    }]
                    : []),
                ...resolution.selectedSegments,
            ]
            let completed = 0
            let downloadedBytes = 0
            const extension = inferHlsOutputExtension(resolution.mapUrl, resolution.selectedSegments)
            const baseTitle = sanitizeFilename(initialTitle || resolution.title || dict.history.unknownTitle)
            const outputName = `${baseTitle || 'hls-browser-download'}-${resolution.selectedSegments.length}-segments.${extension}`
            const mimeType = extension === 'mp4' ? 'video/mp4' : 'video/mp2t'

            const response = createStreamingDownloadResponse({
                targets,
                resolution,
                signal: controller.signal,
                onChunkDownloaded: (bytes) => {
                    completed += 1
                    downloadedBytes += bytes

                    if (!mountedRef.current) {
                        return
                    }

                    const now = Date.now()
                    downloadSamplesRef.current = [
                        ...downloadSamplesRef.current.filter((sample) => now - sample.timestamp <= 8000),
                        { bytes, timestamp: now },
                    ]

                    const samples = downloadSamplesRef.current
                    let nextSpeed: number | null = null

                    if (samples.length >= 2) {
                        const elapsedSeconds = (samples[samples.length - 1].timestamp - samples[0].timestamp) / 1000
                        if (elapsedSeconds > 0) {
                            nextSpeed = samples.reduce((sum, sample) => sum + sample.bytes, 0) / elapsedSeconds
                        }
                    } else if (samples.length === 1 && samples[0].timestamp > now - 1500) {
                        nextSpeed = samples[0].bytes
                    }

                    const averageBytesPerResource = downloadedBytes / completed
                    const remainingResources = targets.length - completed

                    setProgress(Math.round((completed * 100) / targets.length))
                    setSpeedBytesPerSecond(nextSpeed)
                    setEtaSeconds(
                        nextSpeed && averageBytesPerResource > 0
                            ? (remainingResources * averageBytesPerResource) / nextSpeed
                            : null
                    )
                },
            })

            await fileSave(response, {
                fileName: outputName,
                extensions: [`.${extension}`],
                mimeTypes: [mimeType],
            })

            if (!mountedRef.current) {
                return
            }

            setProgress(100)
            setEtaSeconds(0)
            setStatus(dict.hlsDownload.downloadCompletedStatus)
        } catch (error) {
            if (!mountedRef.current) {
                return
            }

            if (isAbortError(error)) {
                setStatus(dict.hlsDownload.idleStatus)
                return
            }

            setStatus(dict.hlsDownload.downloadFailedStatus)
            setFailed(true)
            console.error('Browser HLS download failed:', error)
        } finally {
            finishTask(controller)
            if (mountedRef.current) {
                setResolveLoading(false)
                setDownloadLoading(false)
            }
        }
    }, [dict.history.unknownTitle, dict.hlsDownload.downloadCompletedStatus, dict.hlsDownload.downloadFailedStatus, dict.hlsDownload.downloadingStatus, dict.hlsDownload.idleStatus, dict.hlsDownload.largeVideoBrowserLimitedStatus, dict.hlsDownload.resolvingStatus, finishTask, initialResolvedPlaylistUrl, initialSourceUrl, initialTitle, startTask])

    useEffect(() => {
        if (autorun && initialSourceUrl && !autorunTriggeredRef.current) {
            autorunTriggeredRef.current = true
            window.setTimeout(() => {
                void handleStart()
            }, 0)
        }
    }, [autorun, handleStart, initialSourceUrl])

    return (
        <div className="space-y-5">
            <div className="rounded-md border bg-muted/30 p-3 space-y-3">
                <div className="flex items-start gap-2 text-sm">
                    {failed ? (
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    ) : isBusy ? (
                        <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
                    ) : progress === 100 ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    ) : (
                        <ListVideo className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0 space-y-1">
                        <div className="font-medium">{dict.hlsDownload.statusLabel}</div>
                        <p className="break-words text-muted-foreground">{status}</p>
                    </div>
                </div>
                <Progress value={progress} />
                <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground sm:text-sm">
                    <div className="rounded-md bg-background/60 px-3 py-2">
                        <div>{dict.hlsDownload.progressLabel}</div>
                        <div className="mt-1 font-medium text-foreground">{progress}%</div>
                    </div>
                    <div className="rounded-md bg-background/60 px-3 py-2">
                        <div>{dict.hlsDownload.speedLabel}</div>
                        <div className="mt-1 font-medium text-foreground">
                            {speedBytesPerSecond
                                ? formatSpeed(speedBytesPerSecond)
                                : dict.hlsDownload.calculatingLabel}
                        </div>
                    </div>
                    <div className="rounded-md bg-background/60 px-3 py-2">
                        <div>{dict.hlsDownload.etaLabel}</div>
                        <div className="mt-1 font-medium text-foreground">
                            {etaSeconds == null
                                ? dict.hlsDownload.calculatingLabel
                                : formatEta(etaSeconds)}
                        </div>
                    </div>
                </div>
            </div>

            {failed || (!autorun && !isBusy && progress === 0) ? (
                <div className="flex justify-end">
                    <Button onClick={() => void handleStart()} disabled={isBusy}>
                        {isBusy ? dict.hlsDownload.downloadingButton : dict.hlsDownload.downloadButton}
                    </Button>
                </div>
            ) : null}
        </div>
    )
}
