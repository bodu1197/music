// YouTube IFrame API Type Definitions

declare namespace YT {
    interface PlayerOptions {
        height?: string | number;
        width?: string | number;
        videoId?: string;
        playerVars?: PlayerVars;
        events?: Events;
    }

    interface PlayerVars {
        autoplay?: 0 | 1;
        cc_load_policy?: 0 | 1;
        color?: "red" | "white";
        controls?: 0 | 1 | 2;
        disablekb?: 0 | 1;
        enablejsapi?: 0 | 1;
        end?: number;
        fs?: 0 | 1;
        hl?: string;
        iv_load_policy?: 1 | 3;
        list?: string;
        listType?: "playlist" | "search" | "user_uploads";
        loop?: 0 | 1;
        modestbranding?: 0 | 1;
        origin?: string;
        playlist?: string;
        playsinline?: 0 | 1;
        rel?: 0 | 1;
        start?: number;
        widget_referrer?: string;
    }

    interface Events {
        onReady?: (event: PlayerEvent) => void;
        onStateChange?: (event: OnStateChangeEvent) => void;
        onPlaybackQualityChange?: (event: OnPlaybackQualityChangeEvent) => void;
        onPlaybackRateChange?: (event: OnPlaybackRateChangeEvent) => void;
        onError?: (event: OnErrorEvent) => void;
        onApiChange?: (event: PlayerEvent) => void;
    }

    interface PlayerEvent {
        target: Player;
    }

    interface OnStateChangeEvent extends PlayerEvent {
        data: PlayerState;
    }

    interface OnPlaybackQualityChangeEvent extends PlayerEvent {
        data: string;
    }

    interface OnPlaybackRateChangeEvent extends PlayerEvent {
        data: number;
    }

    interface OnErrorEvent extends PlayerEvent {
        data: number;
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
        constructor(elementId: string | HTMLElement, options: PlayerOptions);

        // Queueing functions
        loadVideoById(videoId: string, startSeconds?: number): void;
        loadVideoById(options: {
            videoId: string;
            startSeconds?: number;
            endSeconds?: number;
        }): void;
        cueVideoById(videoId: string, startSeconds?: number): void;
        cueVideoById(options: {
            videoId: string;
            startSeconds?: number;
            endSeconds?: number;
        }): void;

        // Playback controls
        playVideo(): void;
        pauseVideo(): void;
        stopVideo(): void;
        seekTo(seconds: number, allowSeekAhead?: boolean): void;

        // Volume controls
        mute(): void;
        unMute(): void;
        isMuted(): boolean;
        setVolume(volume: number): void;
        getVolume(): number;

        // Playback status
        getPlayerState(): PlayerState;
        getCurrentTime(): number;
        getDuration(): number;

        // Video information
        getVideoUrl(): string;
        getVideoEmbedCode(): string;

        // Player dimensions
        setSize(width: number, height: number): void;
        getIframe(): HTMLIFrameElement;

        // Destroy
        destroy(): void;
    }
}

interface Window {
    YT?: typeof YT;
    onYouTubeIframeAPIReady?: () => void;
}
