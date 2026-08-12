import Image from 'next/image';
import type { Dictionary } from '@/lib/i18n/types';
import { cn } from '@/lib/utils';
import { getPlatformSupportGroups } from './platform-support';

interface PlatformSupportGridProps {
    dict: Pick<Dictionary, 'guide'>;
}

export function PlatformSupportGrid({ dict }: PlatformSupportGridProps) {
    const groups = getPlatformSupportGroups(dict);

    return (
        <div className="space-y-4">
            {groups.map((group) => (
                <section key={group.key} aria-label={group.label}>
                    <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">
                        {group.label}
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                        {group.items.map((item) => (
                            <div
                                key={item.key}
                                className="flex min-w-0 items-center gap-1 rounded-md border border-border/70 bg-background/50 px-1.5 py-1.5"
                            >
                                <div
                                    className={cn(
                                        'relative flex h-6 w-6 shrink-0 items-center justify-center rounded-md border',
                                        item.visual.frameClassName,
                                    )}
                                >
                                    {item.visual.src && item.visual.darkSrc ? (
                                        <>
                                            <Image src={item.visual.src} alt="" aria-hidden width={12} height={12} unoptimized className={cn('h-3 w-3 object-contain dark:hidden', item.visual.iconClassName)} />
                                            <Image src={item.visual.darkSrc} alt="" aria-hidden width={12} height={12} unoptimized className={cn('hidden h-3 w-3 object-contain dark:block', item.visual.iconClassName)} />
                                        </>
                                    ) : item.visual.src ? (
                                        <Image src={item.visual.src} alt="" aria-hidden width={12} height={12} unoptimized className={cn('h-3 w-3 object-contain', item.visual.iconClassName)} />
                                    ) : (
                                        <span className="text-[9px] font-semibold uppercase text-foreground/80">
                                            {item.visual.fallbackLabel || item.name.slice(0, 2)}
                                        </span>
                                    )}
                                    {item.visual.badgeLabel ? (
                                        <span className={cn('absolute -right-1 -top-1 rounded-full px-1 py-0.5 text-[7px] font-semibold leading-none shadow-sm', item.visual.badgeClassName)}>
                                            {item.visual.badgeLabel}
                                        </span>
                                    ) : null}
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-[9px] font-semibold leading-3.5 text-foreground">{item.name}</p>
                                    <p className="truncate text-[9px] leading-3 text-muted-foreground">{item.host}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}
