'use client';

import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    fetchTodayParseStats,
    TODAY_PARSE_STATS_REFRESH_EVENT,
    type TodayParseStats,
} from '@/lib/parse-stats';
import type { Dictionary } from '@/lib/i18n/types';

const STATS_REFRESH_INTERVAL_MS = 60_000;

interface TodayStatsCardProps {
    dict: Pick<Dictionary, 'todayStats'>;
}

export function TodayStatsCard({ dict }: TodayStatsCardProps) {
    const [stats, setStats] = useState<TodayParseStats | null>(null);

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
                        {stats.count.toLocaleString()}
                    </span>
                    <span className="text-sm text-foreground/75">
                        {dict.todayStats.countLabel}
                    </span>
                </p>
            </CardContent>
        </Card>
    );
}
