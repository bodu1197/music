"use client";

import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useRef,
    useMemo,
    ReactNode,
    RefObject,
} from "react";

// Track interface
export interface Track {
    videoId: string;
    title: string;
    artist: string;
    thumbnail?: string;
    album?: string;
    duration?: number;
}

// Repeat mode types
export type RepeatMode = "none" | "all" | "one";

// YouTube Player State enum (matches YT.PlayerState)
export const PlayerState = {
    UNSTARTED: -1,
    ENDED: 0,
    PLAYING: 1,
    PAUSED: 2,
    BUFFERING: 3,
    CUED: 5,
} as const;

// Player context type
interface PlayerContextType {
    // State
    currentPlaylist: Track[];
    currentTrackIndex: number;
    currentTrack: Track | null;
    isPlaying: boolean;
    isShuffling: boolean;
    repeatMode: RepeatMode;
    playerReady: boolean;
    volume: number;
    isMuted: boolean;
    currentTime: number;
    duration: number;
    isQueueOpen: boolean;
    isPlaylistMode: boolean;  // YouTube 플레이리스트 모드 (loadVideoById 호출 방지)

    // Actions
    setPlaylist: (tracks: Track[], startIndex?: number) => void;
    addToQueue: (track: Track) => void;
    playTrackByIndex: (index: number) => void;
    playTrack: (track: Track) => void;
    togglePlayPause: () => void;
    playNext: () => void;
    playPrevious: () => void;
    toggleShuffle: () => void;
    toggleRepeat: () => void;
    handleVolumeChange: (volume: number) => void;
    toggleMute: () => void;
    seekTo: (time: number) => void;
    toggleQueue: () => void;
    clearQueue: () => void;
    playYouTubePlaylist: (playlistId: string) => Promise<void>;  // YouTube iFrame API로 직접 재생

    // YouTube Player ref (for direct access)
    playerRef: RefObject<YT.Player | null>;
    setPlayerReady: (ready: boolean) => void;
    setIsPlaying: (playing: boolean) => void;
    setCurrentTime: (time: number) => void;
    setDuration: (duration: number) => void;
    setIsPlaylistMode: (mode: boolean) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

interface PlayerProviderProps {
    children: ReactNode;
}

export function PlayerProvider({ children }: Readonly<PlayerProviderProps>) {
    // State
    const [currentPlaylist, setCurrentPlaylist] = useState<Track[]>([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isShuffling, setIsShuffling] = useState(false);
    const [repeatMode, setRepeatMode] = useState<RepeatMode>("none");
    const [playerReady, setPlayerReady] = useState(false);
    const [volume, setVolume] = useState(100);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isQueueOpen, setIsQueueOpen] = useState(false);
    const [isPlaylistMode, setIsPlaylistMode] = useState(false);  // YouTube 플레이리스트 모드

    // YouTube Player ref
    const playerRef = useRef<YT.Player | null>(null);

    // Current track derived state
    const currentTrack =
        currentTrackIndex >= 0 && currentTrackIndex < currentPlaylist.length
            ? currentPlaylist[currentTrackIndex]
            : null;

    // Set playlist and optionally start playing at index
    const setPlaylist = useCallback((tracks: Track[], startIndex = 0) => {
        console.log("[PlayerContext] setPlaylist called:", tracks.length, "tracks, startIndex:", startIndex);
        if (tracks.length > 0 && tracks[startIndex]) {
            console.log("[PlayerContext] Starting with track:", tracks[startIndex].videoId, tracks[startIndex].title);
        }
        setIsPlaylistMode(false);  // 일반 재생 모드로 전환
        setCurrentPlaylist(tracks);
        if (tracks.length > 0 && startIndex >= 0 && startIndex < tracks.length) {
            setCurrentTrackIndex(startIndex);
        } else {
            setCurrentTrackIndex(-1);
        }
    }, []);

    // Add track to queue
    const addToQueue = useCallback((track: Track) => {
        setCurrentPlaylist((prev) => [...prev, track]);
    }, []);

    // Play track by index
    const playTrackByIndex = useCallback(
        (index: number) => {
            if (index < 0 || index >= currentPlaylist.length) {
                return;
            }
            setCurrentTrackIndex(index);

            const track = currentPlaylist[index];
            if (playerRef.current && playerReady && track.videoId) {
                try {
                    playerRef.current.loadVideoById(track.videoId, 0);
                } catch (e) {
                    console.error("Error loading video:", e);
                }
            }
        },
        [currentPlaylist, playerReady]
    );

    // Play a specific track (finds or adds to playlist)
    const playTrack = useCallback(
        (track: Track) => {
            const existingIndex = currentPlaylist.findIndex(
                (t) => t.videoId === track.videoId
            );

            if (existingIndex >= 0) {
                playTrackByIndex(existingIndex);
            } else {
                // Add to playlist and play
                setCurrentPlaylist((prev) => [...prev, track]);
                setCurrentTrackIndex(currentPlaylist.length);

                if (playerRef.current && playerReady && track.videoId) {
                    try {
                        playerRef.current.loadVideoById(track.videoId, 0);
                    } catch (e) {
                        console.error("Error loading video:", e);
                    }
                }
            }
        },
        [currentPlaylist, playTrackByIndex, playerReady]
    );

    // Toggle play/pause
    const togglePlayPause = useCallback(() => {
        if (!playerRef.current || !playerReady) {
            return;
        }

        try {
            const state = playerRef.current.getPlayerState();
            if (state === PlayerState.PLAYING) {
                playerRef.current.pauseVideo();
                setIsPlaying(false);
            } else {
                playerRef.current.playVideo();
                setIsPlaying(true);
            }
        } catch (e) {
            console.error("Error toggling play/pause:", e);
        }
    }, [playerReady]);

    // Play next track
    const playNext = useCallback(() => {
        if (currentPlaylist.length === 0) return;

        const nextIndex = calculateNextIndex(currentTrackIndex, currentPlaylist.length, isShuffling, repeatMode);

        if (nextIndex === -1) {
            setIsPlaying(false);
            setCurrentTrackIndex(-1);
        } else {
            playTrackByIndex(nextIndex);
        }
    }, [currentPlaylist.length, currentTrackIndex, isShuffling, repeatMode, playTrackByIndex]);

    // Play previous track
    const playPrevious = useCallback(() => {
        if (currentPlaylist.length === 0 || !playerRef.current || !playerReady) return;

        // Restart current track if played more than 3 sec
        if (playerRef.current.getCurrentTime() > 3 && currentTrackIndex !== -1) {
            playerRef.current.seekTo(0, true);
            return;
        }

        const prevIndex = calculatePrevIndex(currentTrackIndex, currentPlaylist.length, isShuffling, repeatMode);

        if (prevIndex !== -1) {
            playTrackByIndex(prevIndex);
        }
    }, [currentPlaylist.length, currentTrackIndex, isShuffling, repeatMode, playTrackByIndex, playerReady]);

    // Toggle shuffle
    const toggleShuffle = useCallback(() => {
        // Turning on shuffle disables repeat
        if (!isShuffling) {
            setRepeatMode("none");
        }
        setIsShuffling((prev) => !prev);
    }, [isShuffling]);

    // Toggle repeat mode: none -> all -> one -> none
    const toggleRepeat = useCallback(() => {
        // Turning on repeat disables shuffle
        if (repeatMode === "none") {
            setIsShuffling(false);
        }

        setRepeatMode((prev) => {
            switch (prev) {
                case "none":
                    return "all";
                case "all":
                    return "one";
                case "one":
                    return "none";
                default:
                    return "none";
            }
        });
    }, [repeatMode]);

    // Set volume
    const handleVolumeChange = useCallback((newVolume: number) => {
        const clampedVolume = Math.max(0, Math.min(100, newVolume));
        setVolume(clampedVolume);
        setIsMuted(clampedVolume === 0);

        if (playerRef.current) {
            try {
                playerRef.current.setVolume(clampedVolume);
            } catch (e) {
                console.error("Error setting volume:", e);
            }
        }
    }, []);

    // Toggle mute
    const toggleMute = useCallback(() => {
        if (!playerRef.current) {
            return;
        }

        try {
            if (isMuted) {
                playerRef.current.unMute();
                setIsMuted(false);
            } else {
                playerRef.current.mute();
                setIsMuted(true);
            }
        } catch (e) {
            console.error("Error toggling mute:", e);
        }
    }, [isMuted]);

    // Seek to time
    const seekTo = useCallback((time: number) => {
        if (!playerRef.current) {
            return;
        }

        try {
            playerRef.current.seekTo(time, true);
        } catch (e) {
            console.error("Error seeking:", e);
        }
    }, []);

    // Toggle queue visibility
    const toggleQueue = useCallback(() => {
        setIsQueueOpen((prev) => !prev);
    }, []);

    // Clear queue
    const clearQueue = useCallback(() => {
        setCurrentPlaylist([]);
        setCurrentTrackIndex(-1);
        setIsPlaying(false);
    }, []);

    // 🔥 YouTube iFrame API로 직접 playlist 재생 (백엔드 API 호출 없음!)
    const playYouTubePlaylist = useCallback(async (playlistId: string) => {
        if (!playerRef.current || !playerReady) {
            console.log("[PlayerContext] Player not ready for playlist");
            return;
        }

        console.log("[PlayerContext] 🎵 Loading YouTube playlist directly:", playlistId);

        try {
            // YouTube iFrame API - loadPlaylist
            // YouTube가 플레이리스트의 모든 곡을 직접 로드 (100곡이면 100곡 전부!)
            playerRef.current.loadPlaylist({
                list: playlistId,
                listType: 'playlist',
                index: 0,
                startSeconds: 0
            });

            setIsPlaylistMode(true);  // YouTube 플레이리스트 모드 활성화 - loadVideoById 호출 방지
            setIsPlaying(true);

            // 플레이어가 플레이리스트를 로드할 시간을 줌
            await new Promise(resolve => setTimeout(resolve, 1500));

            // YouTube Player에서 플레이리스트의 videoId 목록 가져오기
            const videoIds = playerRef.current.getPlaylist();
            console.log("[PlayerContext] Playlist loaded, videoIds:", videoIds?.length);

            if (videoIds && videoIds.length > 0) {
                // noembed.com으로 각 videoId의 메타데이터 가져오기
                const tracks: Track[] = await Promise.all(
                    videoIds.map(async (videoId: string) => {
                        try {
                            const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
                            const data = await res.json();
                            return {
                                videoId,
                                title: data.title || "Unknown",
                                artist: data.author_name || "Unknown Artist",
                                thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
                            };
                        } catch {
                            return {
                                videoId,
                                title: "Unknown",
                                artist: "Unknown Artist",
                                thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
                            };
                        }
                    })
                );

                console.log("[PlayerContext] Tracks loaded:", tracks.length);
                setCurrentPlaylist(tracks);
                setCurrentTrackIndex(0);
            }
        } catch (e) {
            console.error("[PlayerContext] Error loading playlist:", e);
        }
    }, [playerReady]);


    // Note: Video loading is handled by YouTubePlayer component
    // which watches currentTrack changes and uses lastVideoIdRef to prevent duplicate loads

    const value = useMemo<PlayerContextType>(() => ({
        // State
        currentPlaylist,
        currentTrackIndex,
        currentTrack,
        isPlaying,
        isShuffling,
        repeatMode,
        playerReady,
        volume,
        isMuted,
        currentTime,
        duration,
        isQueueOpen,
        isPlaylistMode,

        // Actions
        setPlaylist,
        addToQueue,
        playTrackByIndex,
        playTrack,
        togglePlayPause,
        playNext,
        playPrevious,
        toggleShuffle,
        toggleRepeat,
        handleVolumeChange,
        toggleMute,
        seekTo,
        toggleQueue,
        clearQueue,
        playYouTubePlaylist,

        // Refs and setters for YouTube component
        playerRef,
        setPlayerReady,
        setIsPlaying,
        setCurrentTime,
        setDuration,
        setIsPlaylistMode,
    }), [
        currentPlaylist,
        currentTrackIndex,
        currentTrack,
        isPlaying,
        isShuffling,
        repeatMode,
        playerReady,
        volume,
        isMuted,
        currentTime,
        duration,
        isQueueOpen,
        isPlaylistMode,
        setPlaylist,
        addToQueue,
        playTrackByIndex,
        playTrack,
        togglePlayPause,
        playNext,
        playPrevious,
        toggleShuffle,
        toggleRepeat,
        handleVolumeChange,
        toggleMute,
        seekTo,
        toggleQueue,
        clearQueue,
        playYouTubePlaylist,
        // Refs (stable)
        // Setters (stable from useState)
    ]);

    return (
        <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
    );
}

// Hook to use player context
export function usePlayer() {
    const context = useContext(PlayerContext);
    if (context === undefined) {
        throw new Error("usePlayer must be used within a PlayerProvider");
    }
    return context;
}

// Export handleTrackEnd for use in YouTube component
export { PlayerContext };

// Helper functions for index calculation
function calculateNextIndex(
    currentIndex: number,
    total: number,
    isShuffling: boolean,
    repeatMode: RepeatMode
): number {
    if (total === 0) return -1;

    let nextIndex: number;
    if (isShuffling) {
        if (total > 1) {
            // Simple random for now (avoid same track)
            do {
                nextIndex = Math.floor(Math.random() * total);
            } while (nextIndex === currentIndex);
        } else {
            nextIndex = currentIndex;
        }
    } else {
        nextIndex = currentIndex + 1;
    }

    if (nextIndex >= total) {
        if (repeatMode === "all") return 0;
        return -1; // End of playlist
    }
    return nextIndex;
}

function calculatePrevIndex(
    currentIndex: number,
    total: number,
    isShuffling: boolean,
    repeatMode: RepeatMode
): number {
    if (total === 0) return -1;

    let prevIndex: number;
    if (isShuffling) {
        if (total > 1) {
            do {
                prevIndex = Math.floor(Math.random() * total);
            } while (prevIndex === currentIndex);
        } else {
            prevIndex = currentIndex;
        }
    } else {
        prevIndex = currentIndex - 1;
    }

    if (prevIndex < 0) {
        if (repeatMode === "all" || repeatMode === "one") {
            return total - 1;
        }
        return -1; // Beginning of playlist (or do nothing)
    }
    return prevIndex;
}
