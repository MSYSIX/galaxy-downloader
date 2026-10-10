export const DESKTOP_RELEASES_URL = 'https://github.com/bhwa233/galaxy-downloader-client/releases/latest'
export const DESKTOP_PLATFORMS = ['windows', 'macos', 'linux'] as const

export type DesktopPlatform = (typeof DESKTOP_PLATFORMS)[number]

export interface DesktopDownload {
    name: string
    url: string
    size: number
}

export interface DesktopRelease {
    version: string
    releaseUrl: string
    downloads: Partial<Record<DesktopPlatform, DesktopDownload>>
}
