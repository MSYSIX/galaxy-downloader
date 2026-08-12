import { describe, expect, it } from 'vitest';

import { getPlatformSupportGroups, getPlatformSupportItems } from '../src/components/downloader/platform-support';
import type { Dictionary } from '../src/lib/i18n/types';

const dict = {
    guide: {
        platformSupport: {
            bilibili: { name: 'Bilibili', summary: 'video' },
            bilibiliTv: { name: 'Bilibili TV', summary: 'tv' },
            douyin: { name: 'Douyin', summary: 'video' },
            hls: { name: 'HLS', summary: 'streaming' },
            youtube: { name: 'YouTube', summary: 'video' },
            telegram: { name: 'Telegram', summary: 'channel' },
            threads: { name: 'Threads', summary: 'post' },
            wechat: { name: 'WeChat', summary: 'article' },
            niconico: { name: 'Niconico', summary: 'video' },
            weibo: { name: 'Weibo', summary: 'post' },
            xiaohongshu: { name: 'Xiaohongshu', summary: 'note' },
            tiktok: { name: 'TikTok', summary: 'video' },
            instagram: { name: 'Instagram', summary: 'post' },
            x: { name: 'X', summary: 'post' },
            vimeo: { name: 'Vimeo', summary: 'content' },
            dailymotion: { name: 'Dailymotion', summary: 'content' },
            streamable: { name: 'Streamable', summary: 'content' },
            reddit: { name: 'Reddit', summary: 'content' },
            newgrounds: { name: 'Newgrounds', summary: 'content' },
            tumblr: { name: 'Tumblr', summary: 'content' },
            pinterest: { name: 'Pinterest', summary: 'content' },
            vk: { name: 'VK', summary: 'content' },
            okru: { name: 'OK.ru', summary: 'content' },
            twitch: { name: 'Twitch', summary: 'content' },
            soundcloud: { name: 'SoundCloud', summary: 'content' },
            applePodcasts: { name: 'Apple Podcasts', summary: 'public audio' },
            kuaishou: { name: 'Kuaishou', summary: 'video' },
            zhihu: { name: 'Zhihu', summary: 'video' },
            generic: { name: 'Web / HLS', summary: 'web video' },
            bluesky: { name: 'Bluesky', summary: 'video' },
            rumble: { name: 'Rumble', summary: 'video' },
            snapchat: { name: 'Snapchat', summary: 'video' },
            coub: { name: 'Coub', summary: 'video' },
            imgur: { name: 'Imgur', summary: 'media' },
            odysee: { name: 'Odysee', summary: 'video' },
            rutube: { name: 'Rutube', summary: 'video' },
            groups: { regional: 'Regional', social: 'Social', web: 'Web' },
            comingSoon: 'Coming soon',
        },
    },
} as const;

describe('getPlatformSupportItems', () => {
    it('lists every platform registered by the API and omits retired frontend-only entries', () => {
        const items = getPlatformSupportItems(dict as unknown as Pick<Dictionary, 'guide'>);

        const keys = items.map((item) => item.key);
        expect(keys).toHaveLength(34);
        expect(keys).toContain('bilibili');
        expect(keys).toContain('bilibiliTv');
        expect(keys).toContain('douyin');
        expect(keys).toContain('wechat');
        expect(keys).toContain('weibo');
        expect(keys).toContain('xiaohongshu');
        expect(keys).toContain('tiktok');
        expect(keys).toContain('youtube');
        expect(keys).toContain('soundcloud');
        expect(keys).toContain('applePodcasts');
        expect(keys).toContain('vk');
        expect(keys).toContain('okru');
        expect(keys).toContain('pinterest');
        expect(keys).toContain('rutube');
        expect(keys).toContain('snapchat');
        expect(keys).toContain('imgur');
        expect(keys).not.toContain('newgrounds');
    });

    it('keeps the catalog grouped for scanning without hiding any entries', () => {
        const groups = getPlatformSupportGroups(dict as unknown as Pick<Dictionary, 'guide'>);

        expect(groups.map((group) => group.key)).toEqual(['regional', 'social', 'web']);
        expect(groups.flatMap((group) => group.items)).toHaveLength(34);
    });
});
