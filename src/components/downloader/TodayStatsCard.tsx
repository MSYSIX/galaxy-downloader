'use client';

import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchTodayParseStats, type TodayParseStats } from '@/lib/parse-stats';
import type { Dictionary } from '@/lib/i18n/types';

interface TodayStatsCardProps {
    dict: Pick<Dictionary, 'todayStats'>;
}

export function TodayStatsCard({ dict }: TodayStatsCardProps) {
    const [stats, setStats] = useState<TodayParseStats | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        fetchTodayParseStats({ signal: controller.signal }).then((result) => {
            if (!controller.signal.aborted) {
                setStats(result);
            }
        });

        return () => {
            controller.abort();
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
