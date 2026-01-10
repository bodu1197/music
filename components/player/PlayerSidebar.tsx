"use client";

import { usePlayer, Track } from "@/contexts/PlayerContext";
import { useLibrary } from "@/contexts/LibraryContext";
import YouTubePlayer from "./YouTubePlayer";
import { cn } from "@/lib/utils";
import { X, Plus } from "lucide-react";

export default function PlayerSidebar() {
    const {
        currentPlaylist,
        currentTrackIndex,
        playTrackByIndex,
        isQueueOpen,
        toggleQueue,
    } = usePlayer();

    return (
        <>
            {/* Overlay for mobile - only when open */}
            {isQueueOpen && (
                <button
                    type="button"
                    className="fixed inset-0 bg-black/50 z-40 md:hidden w-full h-full border-none cursor-default"
                    onClick={toggleQueue}
                    aria-label="Close queue"
                />
            )}

            {/* Sidebar - always in DOM but translated off-screen when closed */}
            <div
                className={cn(
                    "fixed right-0 top-0 bottom-[139px] md:bottom-[90px] w-full md:w-[350px] lg:w-[400px]",
                    "bg-background/95 border-l border-white/10 z-50",
                    "flex flex-col overflow-hidden",
                    "transition-transform duration-300",
                    isQueueOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* Video Display - ACTUAL YouTube Player (최상단 배치) */}
                <div className="relative w-full">
                    <div className="w-full aspect-video bg-black overflow-hidden">
                        <YouTubePlayer className="w-full h-full" />
                    </div>
                    {/* 닫기 버튼 (모바일에서만 표시) */}
                    <button
                        onClick={toggleQueue}
                        className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/80 transition-all md:hidden z-10"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Queue Title */}
                <div className="px-4 py-2 border-b border-zinc-800">
                    <h4 className="text-white/80 text-sm font-medium">
                        Queue ({currentPlaylist.length} tracks)
                    </h4>
                </div>

                {/* Queue List */}
                <div className="flex-1 overflow-y-auto px-4 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {currentPlaylist.length === 0 ? (
                        <div className="text-center text-zinc-500 py-8">
                            No tracks in queue
                        </div>
                    ) : (
                        <ul className="space-y-1 py-2">
                            {currentPlaylist.map((track, index) => (
                                <QueueItem
                                    key={`${track.videoId}-${index}`}
                                    track={track}
                                    index={index}
                                    isPlaying={index === currentTrackIndex}
                                    onClick={() => playTrackByIndex(index)}
                                />
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </>
    );
}

interface QueueItemProps {
    track: Track;
    index: number;
    isPlaying: boolean;
    onClick: () => void;
}

function QueueItem({ track, index, isPlaying, onClick }: Readonly<QueueItemProps>) {
    const { openAddToLibraryModal, isTrackInAnyFolder } = useLibrary();
    const thumbnail = track.thumbnail || "/images/default-album.svg";
    const isInLibrary = isTrackInAnyFolder(track.videoId);

    const handleAddToLibrary = (e: React.MouseEvent) => {
        e.stopPropagation();
        openAddToLibraryModal({
            videoId: track.videoId,
            title: track.title,
            artist: track.artist || "",
            thumbnail: track.thumbnail || "",
        });
    };

    return (
        <li className="list-none">
            <div
                className={cn(
                    "w-full flex items-center gap-3 p-2 rounded transition-colors group",
                    "hover:bg-white/5",
                    isPlaying && "bg-[#667eea]/20"
                )}
            >
                {/* Track Number / Playing Indicator */}
                <button
                    type="button"
                    onClick={onClick}
                    className="w-6 text-center flex-shrink-0"
                >
                    {isPlaying ? (
                        <div className="flex items-end justify-center gap-[2px] h-4">
                            <span className="w-1 bg-[#667eea] animate-[equalizer_1.2s_ease-in-out_infinite]" style={{ height: "8px" }} />
                            <span className="w-1 bg-[#667eea] animate-[equalizer_1.2s_ease-in-out_infinite_0.2s]" style={{ height: "12px" }} />
                            <span className="w-1 bg-[#667eea] animate-[equalizer_1.2s_ease-in-out_infinite_0.4s]" style={{ height: "6px" }} />
                        </div>
                    ) : (
                        <span className="text-xs text-white/40">{index + 1}</span>
                    )}
                </button>

                {/* Thumbnail */}
                <button
                    type="button"
                    onClick={onClick}
                    className="w-9 h-9 bg-zinc-800 rounded flex-shrink-0 overflow-hidden"
                    style={{
                        backgroundImage: `url(${thumbnail})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                />

                {/* Track Info */}
                <button
                    type="button"
                    onClick={onClick}
                    className="flex-1 min-w-0 text-left"
                >
                    <div
                        className={cn(
                            "text-sm truncate",
                            isPlaying ? "text-white font-medium" : "text-white/80"
                        )}
                    >
                        {track.title}
                    </div>
                    <div className="text-xs text-white/50 truncate">{track.artist}</div>
                </button>

                {/* Add to Library Button */}
                <button
                    type="button"
                    onClick={handleAddToLibrary}
                    className={cn(
                        "w-7 h-7 flex items-center justify-center rounded-full transition-all flex-shrink-0",
                        "opacity-0 group-hover:opacity-100",
                        isInLibrary
                            ? "text-green-400 bg-green-500/20 opacity-100"
                            : "text-white/50 hover:text-white hover:bg-white/10"
                    )}
                    title={isInLibrary ? "In Library" : "Add to Library"}
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>
        </li>
    );
}
