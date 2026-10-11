'use client'

import { useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { MonitorDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDictionary } from '@/i18n/client'

export const LazyDesktopDownloadDialog = dynamic(
    () => import('@/components/desktop-download-dialog').then((m) => m.DesktopDownloadDialog),
    { ssr: false }
)

export function DeferredDesktopDownloadDialog() {
    const dict = useDictionary()
    const triggerRef = useRef<HTMLButtonElement>(null)
    const [mounted, setMounted] = useState(false)
    const [open, setOpen] = useState(false)

    return (
        <>
            <Button
                ref={triggerRef}
                size="sm"
                aria-haspopup="dialog"
                aria-expanded={open}
                onClick={() => { setMounted(true); setOpen(true) }}
            >
                <MonitorDown data-icon="inline-start" />
                {dict.desktopDownload.trigger}
            </Button>
            {mounted && (
                <LazyDesktopDownloadDialog
                    open={open}
                    onOpenChange={setOpen}
                    returnFocus={() => triggerRef.current?.focus()}
                    source="top_bar"
                />
            )}
        </>
    )
}
