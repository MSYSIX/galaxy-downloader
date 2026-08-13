'use client';

import { useEffect, useRef, useState } from 'react';
import { Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    fetchTodayParseStats,
    TODAY_PARSE_STATS_REFRESH_EVENT,
    type TodayParseStats,
} from '@/lib/parse-stats';
import type { Dictionary } from '@/lib/i18n/types';

const STATS_REFRESH_INTERVAL_MS = 60_000;
const COUNT_ANIMATION_DURATION_MS = 350;

function prefersReducedMotion(): boolean {
    return typeof window !== 'undefined'
        && typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

interface TodayStatsCardProps {
    dict: Pick<Dictionary, 'todayStats'>;
}

export function TodayStatsCard({ dict }: TodayStatsCardProps) {
    const [stats, setStats] = useState<TodayParseStats | null>(null);
    const [displayCount, setDisplayCount] = useState(0);
    const displayedCountRef = useRef<number | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        let disposed = false;
        let latestRequestId = 0;
        const controllers = new Set<AbortController>();

        const refreshStats = (cacheBuster?: string | number) => {
            const requestId = latestRequestId + 1;
            latestRequestId = requestId;
            const controller = new AbortController();
            controllers.add(controller);

            void fetchTodayParseStats({ signal: controller.signal, cacheBuster })
                .then((result) => {
                    if (!disposed && !controller.signal.aborted && requestId === latestRequestId) {
                        if (result && displayedCountRef.current === null) {
                            displayedCountRef.current = result.count;
                            setDisplayCount(result.count);
                        }
                        setStats(result);
                    }
                })
                .finally(() => {
                    controllers.delete(controller);
                });
        };

        const handleParseSuccess = (event: Event) => {
            const cacheBuster = (event as CustomEvent<number>).detail || Date.now();
            refreshStats(cacheBuster);
        };

        refreshStats();
        const intervalId = window.setInterval(refreshStats, STATS_REFRESH_INTERVAL_MS);
        window.addEventListener(TODAY_PARSE_STATS_REFRESH_EVENT, handleParseSuccess);

        return () => {
            disposed = true;
            window.clearInterval(intervalId);
            window.removeEventListener(TODAY_PARSE_STATS_REFRESH_EVENT, handleParseSuccess);
            controllers.forEach((controller) => controller.abort());
        };
    }, []);

    useEffect(() => {
        const targetCount = stats?.count;
        if (targetCount === undefined) {
            return;
        }

        const previousCount = displayedCountRef.current;
        if (animationFrameRef.current !== null) {
            window.cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        if (previousCount === null || targetCount <= previousCount || prefersReducedMotion()) {
            displayedCountRef.current = targetCount;
            setDisplayCount(targetCount);
            return;
        }

        const startedAt = performance.now();
        const updateCount = (now: number) => {
            const progress = Math.min(1, (now - startedAt) / COUNT_ANIMATION_DURATION_MS);
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            const nextCount = Math.round(previousCount + (targetCount - previousCount) * easedProgress);

            displayedCountRef.current = nextCount;
            setDisplayCount(nextCount);

            if (progress < 1) {
                animationFrameRef.current = window.requestAnimationFrame(updateCount);
            } else {
                animationFrameRef.current = null;
            }
        };

        animationFrameRef.current = window.requestAnimationFrame(updateCount);
        return () => {
            if (animationFrameRef.current !== null) {
                window.cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        };
    }, [stats?.count]);

    // 拉取失败或今日尚无数据时不占位，避免展示 0
    if (!stats || stats.count <= 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="h-5 w-5 text-primary" />
                    {dict.todayStats.title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="flex flex-wrap items-baseline gap-2">
                    <span className="text-3xl font-semibold tabular-nums tracking-tight">
                        {displayCount.toLocaleString()}
                    </span>
                    <span className="text-sm text-foreground/75">
                        {dict.todayStats.countLabel}
                    </span>
                </p>
            </CardContent>
        </Card>
    );
}
