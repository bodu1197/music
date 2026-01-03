"use client";

import { usePlayer } from "@/contexts/PlayerContext";
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Shuffle,
    Repeat,
    Volume2,
    VolumeX,
    Volume1,
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

export default function GlobalPlayer() {
    const {
        currentTrack,
        isPlaying,
        isShuffling,
        repeatMode,
        volume,
        isMuted,
        currentTime,
        duration,
        togglePlayPause,
        playNext,
        playPrevious,
        toggleShuffle,
        toggleRepeat,
        setVolume,
        toggleMute,
        seekTo,
        toggleQueue,
        isQueueOpen,
        playerReady,
    } = usePlayer();

    const progressRef = useRef<HTMLInputElement>(null);
    const volumeRef = useRef<HTMLInputElement>(null);

    // Handle progress bar change
    const handleProgressChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const newTime = (Number.parseFloat(e.target.value) / 100) * duration;
            seekTo(newTime);
        },
        [duration, seekTo]
    );

    // Handle volume change
    const handleVolumeChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setVolume(Number.parseInt(e.target.value, 10));
        },
        [setVolume]
    );

    // Calculate progress percentage
    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    // Get volume icon based on state
    const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;

    // Default thumbnail if none provided
    const thumbnail = currentTrack?.thumbnail || "/images/default-album.svg";

    return (
        <div className="fixed bottom-[49px] md:bottom-0 left-0 w-full bg-black/90 border-t border-white/10 z-50 h-[90px] flex items-center px-4 md:pl-[245px]">
            {/* Left Section - Track Info */}
            <div className="flex items-center gap-3 w-[30%] min-w-0">
                <div
                    className="w-14 h-14 bg-zinc-800 rounded-md flex-shrink-0 overflow-hidden"
                    style={{
                        backgroundImage: `url(${thumbnail})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                />
                <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-white truncate">
                        {currentTrack?.title || "Ready to play"}
                    </span>
                    <span className="text-xs text-white/60 truncate">
                        {currentTrack?.artist || "Select a song"}
                    </span>
                </div>
            </div>

            {/* Center Section - Controls & Progress */}
            <div className="flex flex-col items-center justify-center flex-1 max-w-[600px] px-4 gap-2">
                {/* Control Buttons */}
                <div className="flex items-center gap-4">
                    {/* Shuffle Button */}
                    <button
                        onClick={toggleShuffle}
                        className={cn(
                            "w-8 h-8 flex items-center justify-center rounded-full transition-all",
                            "text-white/80 hover:text-white hover:bg-white/10",
                            isShuffling && "text-[#667eea]"
                        )}
                        title={isShuffling ? "Shuffle On" : "Shuffle Off"}
                    >
                        <Shuffle className="w-4 h-4" />
                    </button>

                    {/* Previous Button */}
                    <button
                        onClick={playPrevious}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all"
                        title="Previous"
                    >
                        <SkipBack className="w-4 h-4 fill-current" />
                    </button>

                    {/* Play/Pause Button */}
                    <button
                        onClick={togglePlayPause}
                        disabled={!playerReady && !currentTrack}
                        className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 hover:scale-105 transition-all disabled:opacity-50"
                        title={isPlaying ? "Pause" : "Play"}
                    >
                        {isPlaying ? (
                            <Pause className="w-5 h-5 text-black fill-current" />
                        ) : (
                            <Play className="w-5 h-5 text-black fill-current ml-0.5" />
                        )}
                    </button>

                    {/* Next Button */}
                    <button
                        onClick={playNext}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all"
                        title="Next"
                    >
                        <SkipForward className="w-4 h-4 fill-current" />
                    </button>

                    {/* Repeat Button with mode indicator */}
                    <button
                        onClick={toggleRepeat}
                        className={cn(
                            "w-8 h-8 flex items-center justify-center rounded-full transition-all relative",
                            "text-white/80 hover:text-white hover:bg-white/10",
                            repeatMode !== "none" && "text-[#667eea]"
                        )}
                        title={
                            repeatMode === "none"
                                ? "Repeat Off"
                                : repeatMode === "all"
                                    ? "Repeat All"
                                    : "Repeat One"
                        }
                    >
                        <Repeat className="w-4 h-4" />
                        {/* Repeat mode indicator */}
                        {repeatMode === "one" && (
                            <span className="absolute -top-0.5 right-0.5 text-[0.5rem] font-bold text-white drop-shadow-[0_0_3px_rgba(0,0,0,0.8)]">
                                1
                            </span>
                        )}
                        {repeatMode === "all" && (
                            <span className="absolute top-0 right-0 text-[0.35rem] font-bold text-white drop-shadow-[0_0_3px_rgba(0,0,0,0.8)]">
                                ALL
                            </span>
                        )}
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="w-full flex items-center gap-3">
                    <span className="text-[11px] text-white/60 min-w-[32px] text-center font-mono">
                        {formatTime(currentTime)}
                    </span>
                    <input
                        ref={progressRef}
                        type="range"
                        min="0"
                        max="100"
                        value={progressPercent}
                        onChange={handleProgressChange}
                        className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer
                            [&::-webkit-slider-thumb]:appearance-none
                            [&::-webkit-slider-thumb]:w-3
                            [&::-webkit-slider-thumb]:h-3
                            [&::-webkit-slider-thumb]:rounded-full
                            [&::-webkit-slider-thumb]:bg-white
                            [&::-webkit-slider-thumb]:cursor-pointer
                            [&::-webkit-slider-thumb]:transition-all
                            hover:[&::-webkit-slider-thumb]:bg-[#667eea]
                            [&::-moz-range-thumb]:w-3
                            [&::-moz-range-thumb]:h-3
                            [&::-moz-range-thumb]:rounded-full
                            [&::-moz-range-thumb]:bg-white
                            [&::-moz-range-thumb]:border-none
                            [&::-moz-range-thumb]:cursor-pointer
                            hover:[&::-moz-range-thumb]:bg-[#667eea]"
                        style={{
                            background: `linear-gradient(to right, #667eea ${progressPercent}%, rgba(255,255,255,0.2) ${progressPercent}%)`,
                        }}
                    />
                    <span className="text-[11px] text-white/60 min-w-[32px] text-center font-mono">
                        {formatTime(duration)}
                    </span>
                </div>
            </div>

            {/* Right Section - Volume & Queue */}
            <div className="flex items-center justify-end gap-3 w-[30%]">
                {/* Volume Controls */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleMute}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all"
                        title={isMuted ? "Unmute" : "Mute"}
                    >
                        <VolumeIcon className="w-4 h-4" />
                    </button>
                    <input
                        ref={volumeRef}
                        type="range"
                        min="0"
                        max="100"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer
                            [&::-webkit-slider-thumb]:appearance-none
                            [&::-webkit-slider-thumb]:w-3
                            [&::-webkit-slider-thumb]:h-3
                            [&::-webkit-slider-thumb]:rounded-full
                            [&::-webkit-slider-thumb]:bg-white
                            [&::-webkit-slider-thumb]:cursor-pointer
                            hover:[&::-webkit-slider-thumb]:bg-[#667eea]
                            [&::-moz-range-thumb]:w-3
                            [&::-moz-range-thumb]:h-3
                            [&::-moz-range-thumb]:rounded-full
                            [&::-moz-range-thumb]:bg-white
                            [&::-moz-range-thumb]:border-none
                            hover:[&::-moz-range-thumb]:bg-[#667eea]"
                        style={{
                            background: `linear-gradient(to right, #fff ${isMuted ? 0 : volume}%, rgba(255,255,255,0.2) ${isMuted ? 0 : volume}%)`,
                        }}
                    />
                </div>

                {/* Queue Toggle */}
                <button
                    onClick={toggleQueue}
                    className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-full transition-all",
                        "text-white/80 hover:text-white hover:bg-white/10",
                        isQueueOpen && "text-[#667eea]"
                    )}
                    title="Queue"
                >
                    <ListMusic className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
