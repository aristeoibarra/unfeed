// YouTube IFrame API Type Definitions

declare namespace YT {
  interface PlayerOptions {
    videoId?: string
    width?: number | string
    height?: number | string
    host?: string
    playerVars?: PlayerVars
    events?: PlayerEvents
  }

  interface PlayerVars {
    autoplay?: 0 | 1
    cc_lang_pref?: string
    cc_load_policy?: 0 | 1
    color?: "red" | "white"
    controls?: 0 | 1 | 2
    disablekb?: 0 | 1
    enablejsapi?: 0 | 1
    end?: number
    fs?: 0 | 1
    hl?: string
    iv_load_policy?: 1 | 3
    list?: string
    listType?: "playlist" | "search" | "user_uploads"
    loop?: 0 | 1
    modestbranding?: 0 | 1
    origin?: string
    playlist?: string
    playsinline?: 0 | 1
    rel?: 0 | 1
    start?: number
    widget_referrer?: string
  }

  interface PlayerEvents {
    onReady?: (event: PlayerEvent) => void
    onStateChange?: (event: OnStateChangeEvent) => void
    onPlaybackQualityChange?: (event: OnPlaybackQualityChangeEvent) => void
    onPlaybackRateChange?: (event: OnPlaybackRateChangeEvent) => void
    onError?: (event: OnErrorEvent) => void
    onApiChange?: (event: PlayerEvent) => void
  }

  interface PlayerEvent {
    target: Player
  }

  interface OnStateChangeEvent {
    target: Player
    data: PlayerState
  }

  interface OnPlaybackQualityChangeEvent {
    target: Player
    data: string
  }

  interface OnPlaybackRateChangeEvent {
    target: Player
    data: number
  }

  interface OnErrorEvent {
    target: Player
    data: number
  }

  enum PlayerState {
    UNSTARTED = -1,
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5,
  }

  class Player {
    constructor(elementId: string | HTMLElement, options: PlayerOptions)

    // Playback controls
    playVideo(): void
    pauseVideo(): void
    stopVideo(): void
    seekTo(seconds: number, allowSeekAhead?: boolean): void

    // Player state
    getPlayerState(): PlayerState
    getCurrentTime(): number
    getDuration(): number
    getVideoLoadedFraction(): number

    // Volume
    mute(): void
    unMute(): void
    isMuted(): boolean
    setVolume(volume: number): void
    getVolume(): number

    // Playback rate
    getPlaybackRate(): number
    setPlaybackRate(suggestedRate: number): void
    getAvailablePlaybackRates(): number[]

    // Video info
    getVideoUrl(): string
    getVideoEmbedCode(): string

    // Playlist
    nextVideo(): void
    previousVideo(): void
    playVideoAt(index: number): void
    getPlaylist(): string[]
    getPlaylistIndex(): number

    // Size
    setSize(width: number, height: number): object

    // Destroy
    destroy(): void

    // Iframe
    getIframe(): HTMLIFrameElement
  }
}

interface Window {
  YT: typeof YT
  onYouTubeIframeAPIReady: () => void
}
