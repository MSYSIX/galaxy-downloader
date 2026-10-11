'use client'

import { useEffect, useState } from 'react'
import { ArrowUpRight, Check, ChevronDown, Download, FolderDown, Layers3, LoaderCircle, MonitorDown, RefreshCw, ShieldCheck, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppLocale, useDictionary } from '@/i18n/client'
import { DESKTOP_PLATFORMS, DESKTOP_RELEASES_URL, type DesktopPlatform, type DesktopRelease } from '@/lib/desktop-release'
import { cn, formatBytes } from '@/lib/utils'

interface DesktopDownloadDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    returnFocus?: () => void
    source: 'top_bar' | 'mobile_menu'
}

function trackEvent(name: 'desktop_download_open' | 'desktop_download_click', params: Record<string, string>) {
    const analytics = window as Window & { gtag?: (command: 'event', name: string, params: Record<string, string>) => void }
    analytics.gtag?.('event', name, params)
}

export function DesktopDownloadDialog({ open, onOpenChange, returnFocus, source }: DesktopDownloadDialogProps) {
    const dict = useDictionary().desktopDownload
    const locale = useAppLocale()
    const [platform, setPlatform] = useState<DesktopPlatform | undefined>(() => {
        const ua = navigator.userAgent
        if (/Android|iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return undefined
        if (/Windows/i.test(ua)) return 'windows'
        if (/Macintosh|Mac OS X/i.test(ua)) return 'macos'
        if (/Linux/i.test(ua)) return 'linux'
        return undefined
    })
    const [release, setRelease] = useState<DesktopRelease | null>(null)
    const [loading, setLoading] = useState(true)
    const [failed, setFailed] = useState(false)
    const [attempt, setAttempt] = useState(0)
    const [instructionsOpen, setInstructionsOpen] = useState(false)

    useEffect(() => {
        if (open) trackEvent('desktop_download_open', { source, locale })
    }, [open, source, locale])

    useEffect(() => {
        if (!open) return
        const controller = new AbortController()
        fetch('/api/desktop-release', { signal: controller.signal })
            .then(async (response) => {
                if (!response.ok) throw new Error('Release unavailable')
                return response.json() as Promise<DesktopRelease>
            })
            .then((data) => { if (!controller.signal.aborted) setRelease(data) })
            .catch(() => { if (!controller.signal.aborted) setFailed(true) })
            .finally(() => { if (!controller.signal.aborted) setLoading(false) })

        return () => controller.abort()
    }, [open, attempt])

    const selected = platform ? dict.platforms[platform] : null
    const download = platform ? release?.downloads[platform] : undefined
    const benefits = [
        { icon: FolderDown, ...dict.benefits.local },
        { icon: Layers3, ...dict.benefits.batch },
        { icon: ShieldCheck, ...dict.benefits.ready },
    ]

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-[540px] gap-6 overflow-y-auto rounded-2xl p-5 sm:p-7"
                onCloseAutoFocus={returnFocus ? (event) => { event.preventDefault(); returnFocus() } : undefined}
            >
                <DialogHeader className="gap-3 text-left">
                    <div className="flex items-center gap-3">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-muted">
                            <MonitorDown className="size-6" aria-hidden="true" />
                        </div>
                        <div className="flex min-w-0 flex-col gap-1">
                            <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground">GALAXY DOWNLOADER</p>
                            <DialogTitle>{dict.title}</DialogTitle>
                        </div>
                    </div>
                    <DialogDescription>{dict.description}</DialogDescription>
                </DialogHeader>

                <ul className="flex flex-col gap-4">
                    {benefits.map(({ icon: Icon, title, description }) => (
                        <li key={title} className="flex items-start gap-3">
                            <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                            <div className="flex flex-col gap-1">
                                <p className="text-sm font-medium">{title}</p>
                                <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
                            </div>
                        </li>
                    ))}
                </ul>

                <section className="flex flex-col gap-3 border-t pt-5" aria-label={dict.systemLabel}>
                    <div className="flex items-center justify-between gap-2">
                        <Label htmlFor="desktop-download-system">{dict.systemLabel}</Label>
                        {release && <Badge variant="secondary">v{release.version}</Badge>}
                    </div>
                    <Select value={platform ?? ''} onValueChange={(value: DesktopPlatform) => { setPlatform(value); setInstructionsOpen(false) }}>
                        <SelectTrigger id="desktop-download-system">
                            <SelectValue placeholder={dict.selectSystem} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {DESKTOP_PLATFORMS.map((value) => (
                                    <SelectItem key={value} value={value}>{dict.platforms[value].label}</SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    {selected && <p className="text-xs leading-relaxed text-muted-foreground">{selected.requirements}</p>}

                    <div className="flex min-h-5 items-center gap-2 text-xs text-muted-foreground" role="status" aria-live="polite">
                        {loading ? (
                            <><LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />{dict.loading}</>
                        ) : failed ? (
                            <span>{release ? dict.cachedRelease : dict.loadFailed}</span>
                        ) : download ? (
                            <><Check className="size-3.5" aria-hidden="true" />{dict.latestVersion} · {formatBytes(download.size)} · {platform === 'windows' ? '.exe' : platform === 'macos' ? '.dmg' : 'AppImage'}</>
                        ) : release && platform ? <span>{dict.unavailable}</span> : null}
                    </div>

                    {download && selected ? (
                        <Button size="lg" className="w-full" asChild>
                            <a
                                href={download.url}
                                onClick={() => trackEvent('desktop_download_click', { source, locale, platform: platform!, version: release!.version })}
                            >
                                <Download data-icon="inline-start" />
                                {selected.download}
                            </a>
                        </Button>
                    ) : (
                        <Button size="lg" className="w-full" disabled>
                            {loading && <LoaderCircle data-icon="inline-start" className="animate-spin" />}
                            {loading ? dict.loading : !platform ? dict.selectSystem : selected?.download}
                        </Button>
                    )}
                    {failed && (
                        <Button variant="outline" size="sm" disabled={loading} onClick={() => { setLoading(true); setFailed(false); setAttempt((value) => value + 1) }}>
                            <RefreshCw data-icon="inline-start" />{dict.retry}
                        </Button>
                    )}
                </section>

                {selected && (
                    <Collapsible key={platform} open={instructionsOpen} onOpenChange={setInstructionsOpen} className="flex flex-col gap-2">
                        <div className="flex flex-col gap-1">
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="justify-between px-0">
                                    {dict.installation}
                                    <ChevronDown data-icon="inline-end" className={cn('transition-transform', instructionsOpen && 'rotate-180')} />
                                </Button>
                            </CollapsibleTrigger>
                            <p className="text-xs leading-relaxed text-muted-foreground">{selected.installHint}</p>
                        </div>
                        <CollapsibleContent>
                            <ol className="flex list-decimal flex-col gap-2 pl-5 text-xs leading-relaxed text-muted-foreground">
                                {selected.steps.map((step) => <li key={step}>{step}</li>)}
                            </ol>
                        </CollapsibleContent>
                    </Collapsible>
                )}

                <a href={release?.releaseUrl ?? DESKTOP_RELEASES_URL} target="_blank" rel="noopener noreferrer" className="flex w-fit items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                    {dict.allReleases}<ArrowUpRight className="size-3.5" aria-hidden="true" />
                </a>
                <DialogClose asChild>
                    <Button variant="ghost" size="icon" className="absolute right-3 top-3" aria-label={dict.close}>
                        <X />
                    </Button>
                </DialogClose>
            </DialogContent>
        </Dialog>
    )
}
