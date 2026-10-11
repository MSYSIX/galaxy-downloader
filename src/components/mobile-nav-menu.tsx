'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Menu, MonitorDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { useDictionary } from '@/i18n/client'
import { LazyDesktopDownloadDialog } from '@/components/deferred-desktop-download-dialog'

interface MobileNavMenuProps {
    defaultOpen?: boolean
}

export function MobileNavMenu({
    defaultOpen = false,
}: MobileNavMenuProps) {
    const dict = useDictionary()
    const [open, setOpen] = useState(defaultOpen)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const [desktopMounted, setDesktopMounted] = useState(false)
    const [desktopOpen, setDesktopOpen] = useState(false)

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button ref={triggerRef} variant="ghost" size="icon" aria-label={dict.page.openMenuLabel}>
                        <Menu className="h-5 w-5" />
                    </Button>
                </DialogTrigger>
                <DialogContent
                    showCloseButton={false}
                    aria-describedby={undefined}
                    className="top-auto bottom-4 left-1/2 w-[calc(100%-2rem)] max-w-sm translate-x-[-50%] translate-y-0 rounded-xl p-4"
                    onCloseAutoFocus={desktopOpen ? (event) => event.preventDefault() : undefined}
                >
                    <DialogHeader className="sr-only">
                        <DialogTitle>{dict.page.openMenuLabel}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Button
                            className="w-full justify-start"
                            aria-haspopup="dialog"
                            onClick={() => { setDesktopMounted(true); setDesktopOpen(true); setOpen(false) }}
                        >
                            <MonitorDown data-icon="inline-start" />
                            {dict.desktopDownload.trigger}
                        </Button>
                        <Button variant="outline" className="w-full justify-start" asChild>
                            <a
                                href="https://github.com/lxw15337674/galaxy-downloader"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setOpen(false)}
                            >
                                <Image
                                    src="/platform-icons/github.svg"
                                    alt=""
                                    width={16}
                                    height={16}
                                    aria-hidden="true"
                                    className="dark:invert"
                                />
                                <span>GitHub</span>
                            </a>
                        </Button>
                        <div className="rounded-md border border-border p-1">
                            <ThemeSwitcher fullWidth />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            {desktopMounted && (
                <LazyDesktopDownloadDialog
                    open={desktopOpen}
                    onOpenChange={setDesktopOpen}
                    returnFocus={() => triggerRef.current?.focus()}
                    source="mobile_menu"
                />
            )}
        </>
    )
}
