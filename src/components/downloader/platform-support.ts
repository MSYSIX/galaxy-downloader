import type { Dictionary } from '@/lib/i18n/types';

export type PlatformSupportKey =
    | 'bilibili'
    | 'bilibiliTv'
    | 'douyin'
    | 'vimeo'
    | 'dailymotion'
    | 'streamable'
    | 'reddit'
    | 'tumblr'
    | 'pinterest'
    | 'vk'
    | 'okru'
    | 'twitch'
    | 'soundcloud'
    | 'applePodcasts'
    | 'instagram'
    | 'kuaishou'
    | 'niconico'
    | 'telegram'
    | 'threads'
    | 'wechat'
    | 'weibo'
    | 'xiaohongshu'
    | 'youtube'
    | 'zhihu'
    | 'generic'
    | 'tiktok'
    | 'x'
    | 'bluesky'
    | 'rumble'
    | 'snapchat'
    | 'coub'
    | 'imgur'
    | 'odysee'
    | 'rutube';

type PlatformSupportGroupKey = 'regional' | 'social' | 'web';

type PlatformSupportVisual = {
    src?: string;
    darkSrc?: string;
    fallbackLabel?: string;
    frameClassName: string;
    iconClassName?: string;
    badgeLabel?: string;
    badgeClassName?: string;
};

export type PlatformSupportItem = {
    key: PlatformSupportKey;
    name: string;
    host: string;
    visual: PlatformSupportVisual;
};

export type PlatformSupportGroup = {
    key: PlatformSupportGroupKey;
    label: string;
    items: PlatformSupportItem[];
};

type PlatformSupportDictionary = Pick<Dictionary, 'guide'>;

const UNIFIED_FRAME_CLASS_NAME = 'border-slate-200 bg-slate-100/70 dark:border-slate-300/40 dark:bg-slate-800/45';

const PLATFORM_SUPPORT_VISUALS: Record<PlatformSupportKey, PlatformSupportVisual> = {
    bilibili: { src: '/platform-icons/bilibili.svg', frameClassName: UNIFIED_FRAME_CLASS_NAME },
    bilibiliTv: {
        src: '/platform-icons/bilibili.svg',
        frameClassName: UNIFIED_FRAME_CLASS_NAME,
        badgeLabel: 'TV',
        badgeClassName: 'bg-primary text-primary-foreground',
    },
    douyin: { src: '/platform-icons/douyin.ico', frameClassName: UNIFIED_FRAME_CLASS_NAME, iconClassName: 'rounded-sm' },
    vimeo: { src: '/platform-icons/vimeo.svg', frameClassName: UNIFIED_FRAME_CLASS_NAME },
    dailymotion: { src: '/platform-icons/dailymotion.svg', darkSrc: '/platform-icons/dailymotion-dark.svg', frameClassName: UNIFIED_FRAME_CLASS_NAME },
    streamable: { src: '/platform-icons/streamable.png', frameClassName: UNIFIED_FRAME_CLASS_NAME },
    reddit: { src: '/platform-icons/reddit.svg', frameClassName: UNIFIED_FRAME_CLASS_NAME },
    tumblr: { src: '/platform-icons/tumblr.svg', frameClassName: UNIFIED_FRAME_CLASS_NAME },
    pinterest: { src: '/platform-icons/pinterest.svg', frameClassName: UNIFIED_FRAME_CLASS_NAME },
    vk: { src: '/platform-icons/vk.svg', frameClassName: UNIFIED_FRAME_CLASS_NAME },
    okru: { src: '/platform-icons/okru.svg', frameClassName: UNIFIED_FRAME_CLASS_NAME },
    twitch: { src: '/platform-icons/twitch.svg', frameClassName: UNIFIED_FRAME_CLASS_NAME },
    soundcloud: { src: '/platform-icons/soundcloud.svg', frameClassName: UNIFIED_FRAME_CLASS_NAME },
    applePodcasts: { src: '/platform-icons/apple-podcasts.svg', frameClassName: UNIFIED_FRAME_CLASS_NAME },
    instagram: { src: '/platform-icons/instagram.svg', frameClassName: UNIFIED_FRAME_CLASS_NAME },
    kuaishou: { fallbackLabel: 'KS', frameClassName: UNIFIED_FRAME_CLASS_NAME },
    niconico: { src: '/platform-icons/niconico.svg', darkSrc: '/platform-icons/niconico-dark.svg', frameClassName: UNIFIED_FRAME_CLASS_NAME },
    telegram: { src: '/platform-icons/telegram.svg', frameClassName: UNIFIED_FRAME_CLASS_NAME },
    threads: { src: '/platform-icons/threads.svg', darkSrc: '/platform-icons/threads-dark.svg', frameClassName: UNIFIED_FRAME_CLASS_NAME },
    wechat: { src: '/platform-icons/wechat.svg', frameClassName: UNIFIED_FRAME_CLASS_NAME },
    weibo: { src: '/platform-icons/weibo.svg', frameClassName: UNIFIED_FRAME_CLASS_NAME },
    xiaohongshu: { src: '/platform-icons/xiaohongshu.svg', frameClassName: UNIFIED_FRAME_CLASS_NAME },
    youtube: { src: '/platform-icons/youtube.svg', frameClassName: UNIFIED_FRAME_CLASS_NAME },
    zhihu: { fallbackLabel: 'ZH', frameClassName: UNIFIED_FRAME_CLASS_NAME },
    generic: { fallbackLabel: 'WEB', frameClassName: UNIFIED_FRAME_CLASS_NAME },
    tiktok: { src: '/platform-icons/tiktok.svg', darkSrc: '/platform-icons/tiktok-dark.svg', frameClassName: UNIFIED_FRAME_CLASS_NAME },
    x: { src: '/platform-icons/x.svg', darkSrc: '/platform-icons/x-dark.svg', frameClassName: UNIFIED_FRAME_CLASS_NAME },
    bluesky: { fallbackLabel: 'BS', frameClassName: UNIFIED_FRAME_CLASS_NAME },
    rumble: { fallbackLabel: 'RU', frameClassName: UNIFIED_FRAME_CLASS_NAME },
    snapchat: { fallbackLabel: 'SC', frameClassName: UNIFIED_FRAME_CLASS_NAME },
    coub: { fallbackLabel: 'CO', frameClassName: UNIFIED_FRAME_CLASS_NAME },
    imgur: { fallbackLabel: 'IM', frameClassName: UNIFIED_FRAME_CLASS_NAME },
    odysee: { fallbackLabel: 'OD', frameClassName: UNIFIED_FRAME_CLASS_NAME },
    rutube: { fallbackLabel: 'RT', frameClassName: UNIFIED_FRAME_CLASS_NAME },
};

const PLATFORM_SUPPORT_CATALOG: Array<{ key: PlatformSupportKey; group: PlatformSupportGroupKey; host: string }> = [
    { key: 'bilibili', group: 'regional', host: 'bilibili.com' },
    { key: 'bilibiliTv', group: 'regional', host: 'bilibili.tv' },
    { key: 'douyin', group: 'regional', host: 'douyin.com' },
    { key: 'kuaishou', group: 'regional', host: 'kuaishou.com' },
    { key: 'wechat', group: 'regional', host: 'mp.weixin.qq.com' },
    { key: 'weibo', group: 'regional', host: 'weibo.com' },
    { key: 'xiaohongshu', group: 'regional', host: 'xiaohongshu.com' },
    { key: 'zhihu', group: 'regional', host: 'zhihu.com' },
    { key: 'niconico', group: 'regional', host: 'nicovideo.jp' },
    { key: 'rutube', group: 'regional', host: 'rutube.ru' },
    { key: 'youtube', group: 'social', host: 'youtube.com' },
    { key: 'tiktok', group: 'social', host: 'tiktok.com' },
    { key: 'instagram', group: 'social', host: 'instagram.com' },
    { key: 'x', group: 'social', host: 'x.com' },
    { key: 'threads', group: 'social', host: 'threads.net' },
    { key: 'telegram', group: 'social', host: 't.me' },
    { key: 'bluesky', group: 'social', host: 'bsky.app' },
    { key: 'rumble', group: 'social', host: 'rumble.com' },
    { key: 'snapchat', group: 'social', host: 'snapchat.com' },
    { key: 'coub', group: 'social', host: 'coub.com' },
    { key: 'odysee', group: 'social', host: 'odysee.com' },
    { key: 'vimeo', group: 'social', host: 'vimeo.com' },
    { key: 'dailymotion', group: 'social', host: 'dailymotion.com' },
    { key: 'streamable', group: 'social', host: 'streamable.com' },
    { key: 'twitch', group: 'social', host: 'twitch.tv' },
    { key: 'reddit', group: 'web', host: 'reddit.com' },
    { key: 'tumblr', group: 'web', host: 'tumblr.com' },
    { key: 'pinterest', group: 'web', host: 'pinterest.com' },
    { key: 'vk', group: 'web', host: 'vk.com' },
    { key: 'okru', group: 'web', host: 'ok.ru' },
    { key: 'imgur', group: 'web', host: 'imgur.com' },
    { key: 'soundcloud', group: 'web', host: 'soundcloud.com' },
    { key: 'applePodcasts', group: 'web', host: 'podcasts.apple.com' },
    { key: 'generic', group: 'web', host: 'web video / HLS' },
];

function getEntry(dict: PlatformSupportDictionary, key: PlatformSupportKey) {
    return dict.guide.platformSupport[key];
}

export function getPlatformSupportGroups(dict: PlatformSupportDictionary): PlatformSupportGroup[] {
    const labels = dict.guide.platformSupport.groups;
    const items = PLATFORM_SUPPORT_CATALOG.map(({ key, group, host }) => ({
        group,
        key,
        host,
        name: getEntry(dict, key).name,
        visual: PLATFORM_SUPPORT_VISUALS[key],
    }));

    return (['regional', 'social', 'web'] as const).map((key) => ({
        key,
        label: labels[key],
        items: items.filter((item) => item.group === key).map(({ group: _group, ...item }) => item),
    }));
}

export function getPlatformSupportItems(dict: PlatformSupportDictionary): PlatformSupportItem[] {
    return getPlatformSupportGroups(dict).flatMap((group) => group.items);
}
