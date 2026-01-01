"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePlayer, PlayerState } from "@/contexts/PlayerContext";

interface YouTubePlayerProps {
    className?: string;
}

// Track if API script is loaded
let apiLoaded = false;
let apiLoading = false;

export default function YouTubePlayer({ className }: YouTubePlayerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerIdRef = useRef(`yt-player-${Math.random().toString(36).substr(2, 9)}`);
    const initAttemptedRef = useRef(false);
    const lastVideoIdRef = useRef<string | null>(null);

    const {
        currentTrack,
        currentTrackIndex,
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

    // Handle player state changes
    const onPlayerStateChange = useCallback(
        (event: YT.OnStateChangeEvent) => {
            const state = event.data;

            switch (state) {
                case PlayerState.PLAYING:
                    setIsPlaying(true);
                    break;
                case PlayerState.PAUSED:
                    setIsPlaying(false);
                    break;
                case PlayerState.ENDED:
                    setIsPlaying(false);
                    if (repeatMode === "one") {
                        if (playerRef.current) {
                            try {
                                playerRef.current.seekTo(0, true);
                                playerRef.current.playVideo();
                            } catch (e) {
                                console.error("Error repeating track:", e);
                            }
                        }
                    } else {
                        playNext();
                    }
                    break;
            }
        },
        [repeatMode, playNext, setIsPlaying, playerRef]
    );

    // Handle player ready
    const onPlayerReady = useCallback(
        (event: YT.PlayerEvent) => {
            console.log("[YouTubePlayer] Player ready");
            playerRef.current = event.target;
            setPlayerReady(true);

            try {
                event.target.setVolume(volume);
                if (isMuted) {
                    event.target.mute();
                }
            } catch (e) {
                console.error("Error setting initial volume:", e);
            }
        },
        [setPlayerReady, volume, isMuted, playerRef]
    );

    // Handle player error
    const onPlayerError = useCallback(
        (event: YT.OnErrorEvent) => {
            console.error("YouTube Player Error:", event.data);
            playNext();
        },
        [playNext]
    );

    // Initialize YouTube player
    const initializePlayer = useCallback(() => {
        if (!containerRef.current || !window.YT || !window.YT.Player) {
            console.log("[YouTubePlayer] Cannot initialize - missing dependencies");
            return;
        }

        if (playerRef.current) {
            console.log("[YouTubePlayer] Player already exists");
            return;
        }

        let playerDiv = document.getElementById(playerIdRef.current);
        if (!playerDiv) {
            playerDiv = document.createElement("div");
            playerDiv.id = playerIdRef.current;
            containerRef.current.appendChild(playerDiv);
        }

        console.log("[YouTubePlayer] Creating new YT.Player");
        try {
            new window.YT.Player(playerIdRef.current, {
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
                    onReady: onPlayerReady,
                    onStateChange: onPlayerStateChange,
                    onError: onPlayerError,
                },
            });
        } catch (e) {
            console.error("Error creating YouTube player:", e);
        }
    }, [onPlayerReady, onPlayerStateChange, onPlayerError, playerRef]);

    // Load YouTube IFrame API
    useEffect(() => {
        if (initAttemptedRef.current) return;
        initAttemptedRef.current = true;

        if (window.YT && window.YT.Player) {
            apiLoaded = true;
            initializePlayer();
            return;
        }

        if (apiLoading) {
            const checkReady = setInterval(() => {
                if (apiLoaded && window.YT && window.YT.Player) {
                    clearInterval(checkReady);
                    initializePlayer();
                }
            }, 100);
            return;
        }

        apiLoading = true;

        const originalCallback = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            apiLoaded = true;
            apiLoading = false;
            if (originalCallback) {
                originalCallback();
            }
            initializePlayer();
        };

        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        script.async = true;
        document.head.appendChild(script);

        return () => {
            if (playerRef.current) {
                try {
                    playerRef.current.destroy();
                } catch (e) {
                    console.error("Error destroying player:", e);
                }
                playerRef.current = null;
            }
        };
    }, [initializePlayer, playerRef]);

    // Watch for currentTrack changes and load video
    useEffect(() => {
        if (!playerReady || !playerRef.current || !currentTrack?.videoId) {
            return;
        }

        // Only load if videoId changed
        if (lastVideoIdRef.current === currentTrack.videoId) {
            return;
        }

        console.log("[YouTubePlayer] Loading video:", currentTrack.videoId, currentTrack.title);
        lastVideoIdRef.current = currentTrack.videoId;

        try {
            playerRef.current.loadVideoById(currentTrack.videoId, 0);
        } catch (e) {
            console.error("Error loading video:", e);
        }
    }, [currentTrack, playerReady, playerRef]);

    // Progress updater
    useEffect(() => {
        const interval = setInterval(() => {
            if (playerRef.current && playerReady) {
                try {
                    const state = playerRef.current.getPlayerState();
                    if (state === PlayerState.PLAYING) {
                        const time = playerRef.current.getCurrentTime();
                        const dur = playerRef.current.getDuration();
                        setCurrentTime(time);
                        if (dur > 0) {
                            setDuration(dur);
                        }
                    }
                } catch (e) {
                    // Player might not be ready
                }
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [playerRef, playerReady, setCurrentTime, setDuration]);

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
            <div id={playerIdRef.current} style={{ width: "100%", height: "100%" }} />
        </div>
    );
}
