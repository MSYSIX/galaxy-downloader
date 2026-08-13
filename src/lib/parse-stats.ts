import { API_ENDPOINTS } from './config'
import type { UnifiedApiResponse } from './types'

export interface TodayParseStats {
    date: string
    timezone: string
    windowStart: string
    windowEnd: string
    count: number
}

function isTodayParseStats(value: unknown): value is TodayParseStats {
    if (!value || typeof value !== 'object') {
        return false
    }

    const candidate = value as Partial<TodayParseStats>
    return typeof candidate.date === 'string'
        && typeof candidate.count === 'number'
        && Number.isFinite(candidate.count)
        && candidate.count >= 0
}

/**
 * 拉取今日解析次数。展示型数据，失败时返回 null 由调用方静默隐藏。
 */
export async function fetchTodayParseStats(
    options?: { signal?: AbortSignal }
): Promise<TodayParseStats | null> {
    try {
        const response = await fetch(API_ENDPOINTS.stats.today, {
            signal: options?.signal,
        })

        if (!response.ok) {
            return null
        }

        const result = await response.json() as UnifiedApiResponse<TodayParseStats>
        if (!result.success || !isTodayParseStats(result.data)) {
            return null
        }

        return result.data
    } catch {
        return null
    }
}
