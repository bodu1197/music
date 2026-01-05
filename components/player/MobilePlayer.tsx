"use client";

import { usePlayer } from "@/contexts/PlayerContext";
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Shuffle,
    Repeat,
    Heart,
    ListMusic,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRef, useCallback } from "react";

// Format time (seconds) to mm:ss
function formatTime(seconds: number): string {
    if (!seconds || Number.isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function MobilePlayer() {
    const player = usePlayer();
    const { currentTrack, currentTime, duration, seekTo } = player;
    const progressRef = useRef<HTMLDivElement>(null);

    // Handle progress bar click/touch
    const handleProgressClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
            if (!progressRef.current || duration === 0) return;

            const rect = progressRef.current.getBoundingClientRect();
            let clientX: number;

            if ('touches' in e) {
                clientX = e.touches[0].clientX;
            } else {
                clientX = e.clientX;
            }

            const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
            const newTime = percent * duration;
            seekTo(newTime);
        },
        [duration, seekTo]
    );

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    // Don't show if no track
    if (!currentTrack) return null;

    return (
        <div className="md:hidden fixed bottom-[60px] left-0 w-full bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/5 z-[1001]">
            {/* Progress Bar Section */}
            <div className="px-4 pt-3 pb-2">
                <div className="flex items-center gap-3">
                    <span className="text-[11px] text-white/50 min-w-[32px] text-left font-mono tabular-nums">
                        {formatTime(currentTime)}
                    </span>

                    {/* Progress Bar */}
                    <div
                        ref={progressRef}
                        className="flex-1 h-1 bg-white/10 rounded-full cursor-pointer relative overflow-hidden"
                        onClick={handleProgressClick}
                        onTouchStart={handleProgressClick}
                    >
                        <div
                            className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full transition-all duration-100"
                            style={{ width: `${progressPercent}%` }}
                        />
                        {/* Thumb */}
                        <div
                            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-lg transition-all duration-100"
                            style={{ left: `calc(${progressPercent}% - 5px)` }}
                        />
                    </div>

                    <span className="text-[11px] text-white/50 min-w-[32px] text-right font-mono tabular-nums">
                        {formatTime(duration)}
                    </span>
                </div>
            </div>

            {/* Controls Section */}
            <div className="px-4 pb-3">
                <div className="flex items-center justify-between">
                    <MobileControls player={player} />
                </div>
            </div>
        </div>
    );
}

// Mobile Controls Component
function MobileControls({ player }: { readonly player: ReturnType<typeof usePlayer> }) {
    const {
        isPlaying,
        isShuffling,
        repeatMode,
        playerReady,
        currentTrack,
        togglePlayPause,
        playNext,
        playPrevious,
        toggleShuffle,
        toggleRepeat,
        toggleQueue,
        isQueueOpen,
    } = player;

    const getRepeatLabel = () => {
        if (repeatMode === "one") return "1";
        if (repeatMode === "all") return "ALL";
        return null;
    };

    return (
        <div className="flex items-center justify-between w-full">
            {/* Heart / Like Button */}
            <button
                className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-rose-400 active:scale-90 transition-all"
                title="Like"
            >
                <Heart className="w-5 h-5" />
            </button>

            {/* Shuffle */}
            <button
                onClick={toggleShuffle}
                className={cn(
                    "w-10 h-10 flex items-center justify-center transition-all active:scale-90",
                    isShuffling ? "text-[#667eea]" : "text-white/60 hover:text-white"
                )}
                title={isShuffling ? "Shuffle On" : "Shuffle Off"}
            >
                <Shuffle className="w-5 h-5" />
            </button>

            {/* Previous */}
            <button
                onClick={playPrevious}
                className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white active:scale-90 transition-all"
                title="Previous"
            >
                <SkipBack className="w-5 h-5 fill-current" />
            </button>

            {/* Play/Pause - Main Button */}
            <button
                onClick={togglePlayPause}
                disabled={!playerReady && !currentTrack}
                className="w-14 h-14 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-white/20"
                title={isPlaying ? "Pause" : "Play"}
            >
                {isPlaying ? (
                    <Pause className="w-6 h-6 text-black fill-current" />
                ) : (
                    <Play className="w-6 h-6 text-black fill-current ml-0.5" />
                )}
            </button>

            {/* Next */}
            <button
                onClick={playNext}
                className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white active:scale-90 transition-all"
                title="Next"
            >
                <SkipForward className="w-5 h-5 fill-current" />
            </button>

            {/* Repeat */}
            <button
                onClick={toggleRepeat}
                className={cn(
                    "w-10 h-10 flex items-center justify-center transition-all relative active:scale-90",
                    repeatMode !== "none" ? "text-[#667eea]" : "text-white/60 hover:text-white"
                )}
                title={repeatMode === "one" ? "Repeat One" : repeatMode === "all" ? "Repeat All" : "Repeat Off"}
            >
                <Repeat className="w-5 h-5" />
                {getRepeatLabel() && (
                    <span className="absolute -top-0.5 -right-0.5 text-[8px] font-bold bg-[#667eea] text-white rounded-full px-1 min-w-[14px] text-center">
                        {getRepeatLabel()}
                    </span>
                )}
            </button>

            {/* Queue / Playlist */}
            <button
                onClick={toggleQueue}
                className={cn(
                    "w-10 h-10 flex items-center justify-center transition-all active:scale-90",
                    isQueueOpen ? "text-[#667eea]" : "text-white/60 hover:text-white"
                )}
                title="Queue"
            >
                <ListMusic className="w-5 h-5" />
            </button>
        </div>
    );
}
