"use client";

import { useEffect, useRef } from "react";
import { usePlayer, PlayerState } from "@/contexts/PlayerContext";

// ============================================
// GLOBAL SINGLETON STATE (outside component)
// ============================================
let globalPlayerInstance: YT.Player | null = null;
let globalPlayerReady = false;
let globalPendingVideoId: string | null = null;


const PLAYER_ELEMENT_ID = "youtube-player-global";

declare global {
    var onYouTubeIframeAPIReady: (() => void) | undefined;
}

interface YouTubePlayerProps {
    className?: string;
}

export default function YouTubePlayer({ className }: Readonly<YouTubePlayerProps>) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mountedRef = useRef(false);

    const {
        currentTrack,
        playerRef,
        setPlayerReady,
        setIsPlaying,
        setCurrentTime,
        setDuration,
        setCurrentTrackIndex,
        playNext,
        repeatMode,
        volume,
        isMuted,
        isPlaylistMode,
    } = usePlayer();

    // Store callbacks in refs to avoid stale closures
    const callbacksRef = useRef({
        setIsPlaying,
        setPlayerReady,
        setCurrentTrackIndex,
        playNext,
        repeatMode,
        volume,
        isMuted,
        isPlaylistMode,
    });

    useEffect(() => {
        callbacksRef.current = {
            setIsPlaying,
            setPlayerReady,
            setCurrentTrackIndex,
            playNext,
            repeatMode,
            volume,
            isMuted,
            isPlaylistMode,
        };
    });

    // Initialize YouTube API and player (only once globally)
    useEffect(() => {
        if (mountedRef.current) return;
        mountedRef.current = true;

        console.log("[YouTubePlayer] Component mounted, checking global state...");

        // Strategy 1: Use existing global player
        if (globalPlayerInstance && globalPlayerReady) {
            console.log("[YouTubePlayer] Using existing global player");
            playerRef.current = globalPlayerInstance;
            setPlayerReady(true);
            if (globalPendingVideoId) {
                try {
                    globalPlayerInstance.loadVideoById(globalPendingVideoId, 0);
                    globalPendingVideoId = null;
                } catch (e) {
                    console.error("[YouTubePlayer] Error loading pending video:", e);
                }
            }
            return;
        }

        // Strategy 2: Create new player
        const createPlayer = () => {
            if (globalPlayerInstance) return;

            // Ensure container
            let playerDiv = document.getElementById(PLAYER_ELEMENT_ID);
            if (!playerDiv && containerRef.current) {
                playerDiv = document.createElement("div");
                playerDiv.id = PLAYER_ELEMENT_ID;
                containerRef.current.appendChild(playerDiv);
            }

            if (!playerDiv || !globalThis.YT?.Player) return;
            try {
                globalPlayerInstance = new globalThis.YT.Player(PLAYER_ELEMENT_ID, {
                    // ... (rest of config)
                    height: "100%",
                    width: "100%",
                    // @ts-ignore
                    host: 'https://www.youtube.com',
                    playerVars: {
                        playsinline: 1,
                        controls: 0,
                        disablekb: 1,
                        fs: 0,
                        iv_load_policy: 3,
                        modestbranding: 1,
                        rel: 0,
                        origin: typeof window !== 'undefined' ? window.location.origin : 'https://www.youtube.com',
                        enablejsapi: 1,
                        widget_referrer: typeof window !== 'undefined' ? window.location.origin : undefined,
                    },
                    events: {
                        onReady: (event: YT.PlayerEvent) => {
                            globalPlayerReady = true;
                            globalPlayerInstance = event.target;
                            playerRef.current = event.target;
                            // Safe access to refs
                            const cb = callbacksRef.current;
                            cb.setPlayerReady(true);
                            try {
                                event.target.setVolume(cb.volume);
                                if (cb.isMuted) event.target.mute();
                                if (globalPendingVideoId) {
                                    event.target.loadVideoById(globalPendingVideoId, 0);
                                    globalPendingVideoId = null;
                                }
                            } catch (e) { console.debug("Initial setup error", e); }
                        },
                        onStateChange: (event: YT.OnStateChangeEvent) => {
                            const state = event.data;
                            const cb = callbacksRef.current;

                            if (state === PlayerState.PLAYING) {
                                cb.setIsPlaying(true);

                                // 🔥 플레이리스트 모드: 현재 인덱스 동기화
                                if (cb.isPlaylistMode) {
                                    try {
                                        const playlistIndex = event.target.getPlaylistIndex();
                                        if (playlistIndex >= 0) {
                                            cb.setCurrentTrackIndex(playlistIndex);
                                            console.log("[YouTubePlayer] 🎯 Playlist index synced:", playlistIndex);
                                        }
                                    } catch (e) {
                                        console.debug("[YouTubePlayer] Error getting playlist index:", e);
                                    }
                                }
                            } else if (state === PlayerState.PAUSED) {
                                cb.setIsPlaying(false);
                            } else if (state === PlayerState.ENDED) {
                                cb.setIsPlaying(false);
                                // 🔥 플레이리스트 모드에서는 playNext 스킵 - YouTube가 자동으로 다음 곡 관리
                                if (cb.isPlaylistMode) {
                                    console.log("[YouTubePlayer] Playlist mode - skipping playNext");
                                    return;
                                }
                                if (cb.repeatMode === "one") {
                                    event.target.seekTo(0, true);
                                    event.target.playVideo();
                                } else {
                                    cb.playNext();
                                }
                            }
                        },
                        onError: (event: YT.OnErrorEvent) => {
                            console.error("[YouTubePlayer] Error:", event.data);
                            callbacksRef.current.playNext();
                        },
                    },
                });
            } catch (e) {
                console.error("[YouTubePlayer] Error creating player:", e);
            }
        };

        // Initialize logic
        if (globalThis.YT?.Player) {

            createPlayer();
        } else {
            console.log("[YouTubePlayer] Loading YouTube API...");

            const existingCallback = globalThis.onYouTubeIframeAPIReady;
            globalThis.onYouTubeIframeAPIReady = () => {
                if (existingCallback) existingCallback();
                createPlayer();
            };
            if (!document.getElementById("youtube-api-script")) {
                const script = document.createElement("script");
                script.id = "youtube-api-script";
                script.src = "https://www.youtube.com/iframe_api";
                script.async = true;
                document.head.appendChild(script);
            }
        }
    }, [playerRef, setPlayerReady]);

    // Watch currentTrack changes and load video
    useEffect(() => {
        if (!currentTrack?.videoId) {
            console.log("[YouTubePlayer] No track to play");
            return;
        }

        // Skip if in playlist mode (YouTube already managing playback)
        if (isPlaylistMode) {
            console.log("[YouTubePlayer] Playlist mode active, skipping loadVideoById");
            return;
        }

        console.log("[YouTubePlayer] Track changed:", currentTrack.videoId, currentTrack.title);

        // If player is ready, load immediately
        if (globalPlayerReady && globalPlayerInstance) {
            console.log("[YouTubePlayer] Loading video immediately");
            try {
                globalPlayerInstance.loadVideoById(currentTrack.videoId, 0);
            } catch (e) {
                console.error("[YouTubePlayer] Error loading video:", e);
            }
        } else {
            // Store as pending
            console.log("[YouTubePlayer] Player not ready, storing pending video");
            globalPendingVideoId = currentTrack.videoId;
        }
    }, [currentTrack?.videoId, currentTrack?.title, isPlaylistMode]);

    // Progress updater
    useEffect(() => {
        const interval = setInterval(() => {
            if (globalPlayerInstance && globalPlayerReady) {
                try {
                    const state = globalPlayerInstance.getPlayerState();
                    if (state === PlayerState.PLAYING) {
                        const time = globalPlayerInstance.getCurrentTime();
                        const dur = globalPlayerInstance.getDuration();
                        setCurrentTime(time);
                        if (dur > 0) {
                            setDuration(dur);
                        }
                    }
                } catch (e) {
                    // Ignore errors during progress update
                    console.debug("Progress update error:", e);
                }
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [setCurrentTime, setDuration]);

    return (
        <div
            ref={containerRef}
            className={className}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                backgroundColor: "#000",
            }}
        >
            {/* Player element will be created dynamically */}
        </div>
    );
}
