"use client";

import { usePlayer, Track } from "@/contexts/PlayerContext";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

// Types for YouTube Music API response
interface Thumbnail {
    url: string;
    width: number;
    height: number;
}

interface Artist {
    name: string;
    id?: string;
}

export interface MusicItem {
    videoId?: string;
    playlistId?: string;
    title: string;
    artists?: Artist[];
    thumbnails?: Thumbnail[];
    album?: {
        name: string;
        id?: string;
    };
    duration?: string;
    duration_seconds?: number;
}

export interface MusicSectionData {
    title: string;
    contents: MusicItem[];
}

interface MusicSectionProps {
    section: MusicSectionData;
}

// Convert MusicItem to Track for player
function itemToTrack(item: MusicItem): Track | null {
    if (!item.videoId) return null;

    return {
        videoId: item.videoId,
        title: item.title || "Unknown",
        artist: item.artists?.map((a) => a.name).join(", ") || "Unknown Artist",
        thumbnail: item.thumbnails?.[0]?.url || "/images/default-album.svg",
        album: item.album?.name,
        duration: item.duration_seconds,
    };
}

// Get best thumbnail (prefer larger sizes)
function getBestThumbnail(thumbnails?: Thumbnail[]): string {
    if (!thumbnails || thumbnails.length === 0) return "/images/default-album.svg";
    // Sort by width descending and take the best one (usually 226x226 or similar)
    const sorted = [...thumbnails].sort((a, b) => (b.width || 0) - (a.width || 0));
    return sorted[0]?.url || "/images/default-album.svg";
}

export default function MusicSection({ section }: MusicSectionProps) {
    const { setPlaylist, toggleQueue, isQueueOpen } = usePlayer();

    // Filter items that have videoId (playable tracks)
    const playableItems = section.contents.filter((item) => item.videoId);

    // Handle clicking on a track - play it and create playlist from section
    const handleTrackClick = (clickedIndex: number) => {
        // Convert all playable items to tracks
        const tracks: Track[] = playableItems
            .map(itemToTrack)
            .filter((t): t is Track => t !== null);

        if (tracks.length === 0) return;

        // Set playlist and start from clicked index
        setPlaylist(tracks, clickedIndex);

        // Open queue sidebar
        if (!isQueueOpen) {
            toggleQueue();
        }
    };

    if (playableItems.length === 0) {
        return null;
    }

    return (
        <div className="mb-8">
            {/* Section Title */}
            <h2 className="text-xl font-bold text-white mb-4 px-4">
                {section.title}
            </h2>

            {/* Horizontal scrolling track list */}
            <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 pb-2">
                {playableItems.map((item, index) => (
                    <TrackCard
                        key={item.videoId || index}
                        item={item}
                        onClick={() => handleTrackClick(index)}
                    />
                ))}
            </div>
        </div>
    );
}

interface TrackCardProps {
    item: MusicItem;
    onClick: () => void;
}

function TrackCard({ item, onClick }: TrackCardProps) {
    const thumbnail = getBestThumbnail(item.thumbnails);
    const artistName = item.artists?.map((a) => a.name).join(", ") || "Unknown Artist";

    return (
        <div
            onClick={onClick}
            className={cn(
                "flex-shrink-0 w-[160px] cursor-pointer group",
                "transition-transform hover:scale-[1.02]"
            )}
        >
            {/* Thumbnail with play overlay */}
            <div className="relative aspect-square rounded-lg overflow-hidden bg-zinc-800 mb-2">
                <img
                    src={thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
                {/* Play overlay on hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-[#667eea] flex items-center justify-center shadow-lg">
                        <Play className="w-6 h-6 text-white fill-current ml-1" />
                    </div>
                </div>
            </div>

            {/* Track info */}
            <div className="px-1">
                <p className="text-sm font-medium text-white truncate">
                    {item.title}
                </p>
                <p className="text-xs text-white/60 truncate">
                    {artistName}
                </p>
            </div>
        </div>
    );
}
