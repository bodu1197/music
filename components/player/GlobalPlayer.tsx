"use client";

import { usePlayer } from "@/contexts/PlayerContext";
import { useLibrary } from "@/contexts/LibraryContext";
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
    Plus,
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
    const player = usePlayer();
    const { openAddToLibraryModal, isTrackInAnyFolder } = useLibrary();
    const { currentTrack } = player;

    // Default thumbnail if none provided
    const thumbnail = currentTrack?.thumbnail || "/images/default-album.svg";

    const handleAddToLibrary = () => {
        if (!currentTrack) return;
        openAddToLibraryModal({
            videoId: currentTrack.videoId,
            title: currentTrack.title,
            artist: currentTrack.artist || "",
            thumbnail: currentTrack.thumbnail || "",
        });
    };

    const isInLibrary = currentTrack ? isTrackInAnyFolder(currentTrack.videoId) : false;

    return (
        <div className="hidden md:flex fixed bottom-0 left-0 w-full bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/10 z-[1001] h-[90px] items-center px-4 md:pl-[245px]">
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
                <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium text-white truncate">
                        {currentTrack?.title || "Ready to play"}
                    </span>
                    <span className="text-xs text-white/60 truncate">
                        {currentTrack?.artist || "Select a song"}
                    </span>
                </div>
                {/* Add to Library Button */}
                {currentTrack && (
                    <button
                        onClick={handleAddToLibrary}
                        className={cn(
                            "w-8 h-8 flex items-center justify-center rounded-full transition-all flex-shrink-0",
                            isInLibrary
                                ? "text-green-400 bg-green-500/20"
                                : "text-white/60 hover:text-white hover:bg-white/10"
                        )}
                        title={isInLibrary ? "In Library" : "Add to Library"}
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Center Section - Controls & Progress */}
            <div className="flex flex-col items-center justify-center flex-1 max-w-[600px] px-4 gap-2">
                <PlayerControls player={player} />
                <ProgressBar player={player} />
            </div>

            {/* Right Section - Volume & Queue */}
            <VolumeControl player={player} />
        </div>
    );
}

// ==========================================
// Sub-Components
// ==========================================

function PlayerControls({ player }: { readonly player: ReturnType<typeof usePlayer> }) {
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
    } = player;

    const getRepeatTitle = () => {
        if (repeatMode === "one") return "Repeat One";
        if (repeatMode === "all") return "Repeat All";
        return "Repeat Off";
    };

    return (
        <div className="flex items-center gap-4">
            {/* ... other buttons ... */}
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

            <button
                onClick={playPrevious}
                className="w-8 h-8 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all"
                title="Previous"
            >
                <SkipBack className="w-4 h-4 fill-current" />
            </button>

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

            <button
                onClick={playNext}
                className="w-8 h-8 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all"
                title="Next"
            >
                <SkipForward className="w-4 h-4 fill-current" />
            </button>

            <button
                onClick={toggleRepeat}
                className={cn(
                    "w-8 h-8 flex items-center justify-center rounded-full transition-all relative",
                    "text-white/80 hover:text-white hover:bg-white/10",
                    repeatMode !== "none" && "text-[#667eea]"
                )}
                title={getRepeatTitle()}
            >
                <Repeat className="w-4 h-4" />
                {repeatMode === "one" && (
                    <span className="absolute -top-0.5 right-0.5 text-[0.5rem] font-bold text-white drop-shadow-[0_0_3px_rgba(0,0,0,0.8)]">1</span>
                )}
                {repeatMode === "all" && (
                    <span className="absolute top-0 right-0 text-[0.35rem] font-bold text-white drop-shadow-[0_0_3px_rgba(0,0,0,0.8)]">ALL</span>
                )}
            </button>
        </div>
    );
}

function ProgressBar({ player }: { readonly player: ReturnType<typeof usePlayer> }) {
    const { currentTime, duration, seekTo } = player;
    const progressRef = useRef<HTMLInputElement>(null);

    const handleProgressChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const newTime = (Number.parseFloat(e.target.value) / 100) * duration;
            seekTo(newTime);
        },
        [duration, seekTo]
    );

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
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
    );
}

function VolumeControl({ player }: { readonly player: ReturnType<typeof usePlayer> }) {
    const { volume, isMuted, toggleMute, handleVolumeChange, toggleQueue, isQueueOpen } = player;


    let VolumeIcon = Volume2;
    if (isMuted || volume === 0) {
        VolumeIcon = VolumeX;
    } else if (volume < 50) {
        VolumeIcon = Volume1;
    }

    return (
        <div className="flex items-center justify-end gap-3 w-[30%]">
            <div className="flex items-center gap-2">
                <button
                    onClick={toggleMute}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all"
                    title={isMuted ? "Unmute" : "Mute"}
                >
                    <VolumeIcon className="w-4 h-4" />
                </button>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(Number.parseInt(e.target.value, 10))}
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
    );
}
