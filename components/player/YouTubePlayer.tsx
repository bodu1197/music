"use client";

import { useEffect, useRef } from "react";
import { usePlayer, PlayerState } from "@/contexts/PlayerContext";

// ============================================
// GLOBAL SINGLETON STATE (outside component)
// ============================================
let globalPlayerInstance: YT.Player | null = null;
let globalPlayerReady = false;
let globalPendingVideoId: string | null = null;
let apiScriptLoaded = false;
let apiScriptLoading = false;

const PLAYER_ELEMENT_ID = "youtube-player-global";

interface YouTubePlayerProps {
    className?: string;
}

export default function YouTubePlayer({ className }: YouTubePlayerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mountedRef = useRef(false);

    const {
        currentTrack,
        playerRef,
        setPlayerReady,
        setIsPlaying,
        setCurrentTime,
        setDuration,
        playNext,
        repeatMode,
        volume,
        isMuted,
        playerReady,
    } = usePlayer();

    // Store callbacks in refs to avoid stale closures
    const callbacksRef = useRef({
        setIsPlaying,
        setPlayerReady,
        playNext,
        repeatMode,
        volume,
        isMuted,
    });

    // Update callbacks ref on each render
    callbacksRef.current = {
        setIsPlaying,
        setPlayerReady,
        playNext,
        repeatMode,
        volume,
        isMuted,
    };

    // Initialize YouTube API and player (only once globally)
    useEffect(() => {
        if (mountedRef.current) return;
        mountedRef.current = true;

        console.log("[YouTubePlayer] Component mounted, checking global state...");

        // If player already exists globally, just sync refs
        if (globalPlayerInstance && globalPlayerReady) {
            console.log("[YouTubePlayer] Using existing global player");
            playerRef.current = globalPlayerInstance;
            setPlayerReady(true);

            // If there's a pending video, load it
            if (globalPendingVideoId) {
                console.log("[YouTubePlayer] Loading pending video:", globalPendingVideoId);
                try {
                    globalPlayerInstance.loadVideoById(globalPendingVideoId, 0);
                    globalPendingVideoId = null;
                } catch (e) {
                    console.error("[YouTubePlayer] Error loading pending video:", e);
                }
            }
            return;
        }

        // Create player element if needed
        const ensurePlayerElement = () => {
            let playerDiv = document.getElementById(PLAYER_ELEMENT_ID);
            if (!playerDiv && containerRef.current) {
                playerDiv = document.createElement("div");
                playerDiv.id = PLAYER_ELEMENT_ID;
                containerRef.current.appendChild(playerDiv);
                console.log("[YouTubePlayer] Created player element");
            }
            return playerDiv;
        };

        // Initialize the player
        const initPlayer = () => {
            if (globalPlayerInstance) {
                console.log("[YouTubePlayer] Player already initialized globally");
                return;
            }

            const playerDiv = ensurePlayerElement();
            if (!playerDiv) {
                console.error("[YouTubePlayer] No player element found");
                return;
            }

            if (!window.YT || !window.YT.Player) {
                console.error("[YouTubePlayer] YT.Player not available");
                return;
            }

            console.log("[YouTubePlayer] Creating YT.Player...");

            try {
                globalPlayerInstance = new window.YT.Player(PLAYER_ELEMENT_ID, {
                    height: "100%",
                    width: "100%",
                    playerVars: {
                        playsinline: 1,
                        controls: 0,
                        disablekb: 1,
                        fs: 0,
                        iv_load_policy: 3,
                        modestbranding: 1,
                        rel: 0,
                        origin: window.location.origin,
                    },
                    events: {
                        onReady: (event: YT.PlayerEvent) => {
                            console.log("[YouTubePlayer] Player ready!");
                            globalPlayerReady = true;
                            globalPlayerInstance = event.target;
                            playerRef.current = event.target;
                            callbacksRef.current.setPlayerReady(true);

                            // Set initial volume
                            try {
                                event.target.setVolume(callbacksRef.current.volume);
                                if (callbacksRef.current.isMuted) {
                                    event.target.mute();
                                }
                            } catch (e) {
                                console.error("[YouTubePlayer] Error setting volume:", e);
                            }

                            // Play pending video if any
                            if (globalPendingVideoId) {
                                console.log("[YouTubePlayer] Playing pending video:", globalPendingVideoId);
                                try {
                                    event.target.loadVideoById(globalPendingVideoId, 0);
                                    globalPendingVideoId = null;
                                } catch (e) {
                                    console.error("[YouTubePlayer] Error loading pending video:", e);
                                }
                            }
                        },
                        onStateChange: (event: YT.OnStateChangeEvent) => {
                            const state = event.data;
                            console.log("[YouTubePlayer] State change:", state);

                            switch (state) {
                                case PlayerState.PLAYING:
                                    callbacksRef.current.setIsPlaying(true);
                                    break;
                                case PlayerState.PAUSED:
                                    callbacksRef.current.setIsPlaying(false);
                                    break;
                                case PlayerState.ENDED:
                                    callbacksRef.current.setIsPlaying(false);
                                    if (callbacksRef.current.repeatMode === "one") {
                                        try {
                                            event.target.seekTo(0, true);
                                            event.target.playVideo();
                                        } catch (e) {
                                            console.error("[YouTubePlayer] Error repeating:", e);
                                        }
                                    } else {
                                        callbacksRef.current.playNext();
                                    }
                                    break;
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

        // Load YouTube API if needed
        if (window.YT && window.YT.Player) {
            console.log("[YouTubePlayer] YT API already loaded");
            apiScriptLoaded = true;
            initPlayer();
        } else if (apiScriptLoading) {
            console.log("[YouTubePlayer] API loading, waiting...");
            const checkInterval = setInterval(() => {
                if (apiScriptLoaded && window.YT && window.YT.Player) {
                    clearInterval(checkInterval);
                    initPlayer();
                }
            }, 100);
        } else {
            console.log("[YouTubePlayer] Loading YouTube API...");
            apiScriptLoading = true;

            const existingCallback = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => {
                console.log("[YouTubePlayer] onYouTubeIframeAPIReady called");
                apiScriptLoaded = true;
                apiScriptLoading = false;
                if (existingCallback) existingCallback();
                initPlayer();
            };

            const script = document.createElement("script");
            script.src = "https://www.youtube.com/iframe_api";
            script.async = true;
            document.head.appendChild(script);
        }

        // NO CLEANUP - player should persist!
    }, [playerRef, setPlayerReady]);

    // Watch currentTrack changes and load video
    useEffect(() => {
        if (!currentTrack?.videoId) {
            console.log("[YouTubePlayer] No track to play");
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
    }, [currentTrack?.videoId]);

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
                    // Ignore errors
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
