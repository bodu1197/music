"use client";

import { usePlayer, Track } from "@/contexts/PlayerContext";
import YouTubePlayer from "./YouTubePlayer";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

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
                    "bg-[#040404] border-l border-zinc-800 z-50",
                    "flex flex-col overflow-hidden",
                    "transition-transform duration-300",
                    isQueueOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                    <h3 className="text-white font-semibold">Now Playing</h3>
                    <button
                        onClick={toggleQueue}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all md:hidden"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Video Display - ACTUAL YouTube Player */}
                <div className="w-full px-4 py-4">
                    <div className="w-full aspect-video bg-black rounded overflow-hidden">
                        <YouTubePlayer className="w-full h-full" />
                    </div>
                </div>

                {/* Queue Title */}
                <div className="px-4 py-2 border-b border-zinc-800">
                    <h4 className="text-white/80 text-sm font-medium">
                        Queue ({currentPlaylist.length} tracks)
                    </h4>
                </div>

                {/* Queue List */}
                <div className="flex-1 overflow-y-auto px-4 pb-4">
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
    const thumbnail = track.thumbnail || "/images/default-album.svg";

    return (
        <li className="list-none">
            <button
                type="button"
                onClick={onClick}
                className={cn(
                    "w-full flex items-center gap-3 p-2 rounded cursor-pointer transition-colors text-left",
                    "hover:bg-white/5",
                    isPlaying && "bg-[#667eea]/20"
                )}
            >
                {/* Track Number / Playing Indicator */}
                <div className="w-6 text-center flex-shrink-0">
                    {isPlaying ? (
                        <div className="flex items-end justify-center gap-[2px] h-4">
                            <span className="w-1 bg-[#667eea] animate-[equalizer_1.2s_ease-in-out_infinite]" style={{ height: "8px" }} />
                            <span className="w-1 bg-[#667eea] animate-[equalizer_1.2s_ease-in-out_infinite_0.2s]" style={{ height: "12px" }} />
                            <span className="w-1 bg-[#667eea] animate-[equalizer_1.2s_ease-in-out_infinite_0.4s]" style={{ height: "6px" }} />
                        </div>
                    ) : (
                        <span className="text-xs text-white/40">{index + 1}</span>
                    )}
                </div>

                {/* Thumbnail */}
                <div
                    className="w-9 h-9 bg-zinc-800 rounded flex-shrink-0 overflow-hidden"
                    style={{
                        backgroundImage: `url(${thumbnail})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                />

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                    <div
                        className={cn(
                            "text-sm truncate",
                            isPlaying ? "text-white font-medium" : "text-white/80"
                        )}
                    >
                        {track.title}
                    </div>
                    <div className="text-xs text-white/50 truncate">{track.artist}</div>
                </div>
            </button>
        </li>
    );
}
