"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import { usePlayer, Track } from "@/contexts/PlayerContext";
import { Play } from "lucide-react";

interface MusicTabProps {
    country: { code: string; name: string; lang: string };
}

// Convert API item to Track
function itemToTrack(item: any): Track | null {
    if (!item.videoId) return null;
    return {
        videoId: item.videoId,
        title: item.title || "Unknown",
        artist: item.artists?.map((a: any) => a.name).join(", ") || "Unknown Artist",
        thumbnail: item.thumbnails?.[item.thumbnails.length - 1]?.url || "/images/default-album.svg",
        album: item.album?.name,
    };
}

export function MusicTab({ country }: MusicTabProps) {
    const { setPlaylist, toggleQueue, isQueueOpen } = usePlayer();

    const { data, error, isLoading } = useSWR(
        ["/music/home", country.code, country.lang],
        () => api.music.home(100, country.code, country.lang),
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000,
            keepPreviousData: true,
        }
    );

    // Handle clicking a track in a section
    const handleTrackClick = (sectionContents: any[], clickedIndex: number) => {
        console.log("[MusicTab] Track clicked, index:", clickedIndex);

        // Convert all items with videoId to tracks
        const tracks: Track[] = sectionContents
            .map(itemToTrack)
            .filter((t): t is Track => t !== null);

        console.log("[MusicTab] Converted tracks:", tracks.length, "items");

        if (tracks.length === 0) {
            console.log("[MusicTab] No playable tracks found");
            return;
        }

        // Find the actual index in the filtered array
        const clickedItem = sectionContents[clickedIndex];
        const trackIndex = tracks.findIndex(t => t.videoId === clickedItem?.videoId);

        console.log("[MusicTab] Setting playlist, starting at index:", trackIndex);
        console.log("[MusicTab] First track:", tracks[trackIndex >= 0 ? trackIndex : 0]);

        // Set playlist starting from clicked track
        setPlaylist(tracks, trackIndex >= 0 ? trackIndex : 0);

        // Open queue sidebar
        if (!isQueueOpen) {
            toggleQueue();
        }
    };

    if (isLoading && !data) {
        return (
            <div className="py-20 text-center text-zinc-500 animate-pulse">
                Loading vibes for {country.name || country.code}...
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-20 text-center text-red-500">
                Error: {error.message || "Failed to load"}
            </div>
        );
    }

    const sections = Array.isArray(data) ? data : [];

    if (sections.length === 0) {
        return (
            <div className="py-20 text-center">
                <p className="text-zinc-400 mb-2">No music data found.</p>
                <p className="text-xs text-zinc-600">Try again later.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {sections.map((shelf: any, sIndex: number) => {
                // 데이터 절대 자르지 않음 - 빈 shelf만 건너뜀
                if (!shelf || !shelf.contents || !Array.isArray(shelf.contents) || shelf.contents.length === 0) return null;

                return (
                    <div key={sIndex} className="mb-8 pl-1">
                        {/* Section Title */}
                        {shelf.title && (
                            <h2 className="mb-3 text-lg font-bold text-zinc-100">{shelf.title}</h2>
                        )}

                        {/* Horizontal Scroll Container */}
                        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 pr-4">
                            {shelf.contents.map((item: any, i: number) => {
                                if (!item) return null;

                                const title = item.title || "No Title";
                                const subtitle = item.artists
                                    ? item.artists.map((a: any) => a.name).join(", ")
                                    : item.year || item.subscribers || ""; // 앨범 년도나 구독자수도 표시
                                const image = item.thumbnails
                                    ? item.thumbnails[item.thumbnails.length - 1].url
                                    : "/images/default-album.svg"; // 기본 이미지 사용

                                // videoId가 있으면 재생 가능
                                const isPlayable = !!item.videoId;

                                return (
                                    <div
                                        key={item.videoId || item.browseId || `item-${sIndex}-${i}`}
                                        className="flex-none w-[140px] group cursor-pointer"
                                        onClick={() => isPlayable && handleTrackClick(shelf.contents, i)}
                                    >
                                        {/* Image with play overlay */}
                                        <div className="relative aspect-square w-full mb-2 bg-zinc-900 rounded-md overflow-hidden border border-zinc-800">
                                            <img
                                                src={image}
                                                alt={title}
                                                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                                            />
                                            {/* Play overlay on hover - 재생 가능한 경우만 */}
                                            {isPlayable && (
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <div className="w-10 h-10 rounded-full bg-[#667eea] flex items-center justify-center shadow-lg">
                                                        <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Text Info */}
                                        <div className="space-y-1">
                                            <h3 className="text-sm font-medium text-white line-clamp-2 leading-tight">
                                                {title}
                                            </h3>
                                            <p className="text-xs text-zinc-400 truncate">{subtitle}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
