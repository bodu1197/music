"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import useSWR from "swr";
import { api } from "@/lib/api";
import { usePlayer, Track } from "@/contexts/PlayerContext";
import { Play, ChevronRight, Music, ChevronLeft, AlertCircle } from "lucide-react";
import { Country } from "@/lib/constants";
import type { WatchTrack, Artist } from "@/types/music";

interface MoodsTabProps {
    country: Country;
}

interface MoodPlaylistFull {
    playlistId: string;
    title: string;
    thumbnails: { url: string; width: number; height: number }[];
    tracks: WatchTrack[];
}

interface MoodCategoryFull {
    title: string;
    params: string;
    playlists: MoodPlaylistFull[];
}

type MoodsFullData = Record<string, MoodCategoryFull[]>;

// playlist to Track
function playlistTrackToTrack(track: WatchTrack): Track | null {
    if (!track.videoId) return null;
    return {
        videoId: track.videoId,
        title: track.title || "Unknown",
        artist: track.artists?.map((a: Artist) => a.name).join(", ") || "Unknown Artist",
        thumbnail: Array.isArray(track.thumbnail)
            ? track.thumbnail.at(-1)?.url
            : "/images/default-album.svg",
    };
}

export function MoodsTab({ country }: Readonly<MoodsTabProps>) {
    const [selectedCategory, setSelectedCategory] = useState<MoodCategoryFull | null>(null);
    const { setPlaylist, toggleQueue, isQueueOpen } = usePlayer();

    // Fetch FULL moods data with playlists AND tracks (single request, instant response)
    const { data: moodsFullData, error: moodsError, isLoading: moodsLoading } = useSWR<MoodsFullData>(
        ["/moods/full", country.code, country.lang],
        () => api.music.moodsFull(country.code, country.lang),
        { revalidateOnFocus: false }
    );

    // Reset selected category when country changes
    useEffect(() => {
        setSelectedCategory(null);
    }, [country.code]);

    // Handle playlist click - tracks already in memory!
    const handlePlaylistClick = (playlist: MoodPlaylistFull) => {
        if (!playlist.tracks || playlist.tracks.length === 0) {
            console.log("[MoodsTab] No tracks in playlist");
            return;
        }

        console.log("[MoodsTab] Instant playback from memory!");

        const tracks: Track[] = playlist.tracks
            .map((t: WatchTrack) => playlistTrackToTrack(t))
            .filter((t: Track | null): t is Track => t !== null);

        if (tracks.length > 0) {
            setPlaylist(tracks, 0);
            if (!isQueueOpen) toggleQueue();
        }
    };

    // Handle category click - playlists already in memory!
    const handleCategoryClick = (category: MoodCategoryFull) => {
        console.log("[MoodsTab] Instant category switch from memory!");
        setSelectedCategory(category);
    };

    // Render playlists content (from memory, no loading state needed!)
    const renderPlaylistsContent = () => {
        if (!selectedCategory?.playlists || selectedCategory.playlists.length === 0) {
            return (
                <div className="text-center text-zinc-500 py-10 flex flex-col items-center gap-2">
                    <AlertCircle className="w-8 h-8" />
                    <p>No playlists available for this category.</p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {selectedCategory.playlists.map((playlist: MoodPlaylistFull, i: number) => {
                    return (
                        <button
                            key={playlist.playlistId || i}
                            type="button"
                            className="bg-zinc-900 rounded-lg overflow-hidden cursor-pointer hover:bg-zinc-800 transition-colors group text-left w-full border-none p-0 block"
                            onClick={() => handlePlaylistClick(playlist)}
                        >
                            <div className="relative aspect-square">
                                {playlist.thumbnails && playlist.thumbnails.length > 0 && (
                                    <Image
                                        src={playlist.thumbnails.at(-1)?.url || "/images/default-album.svg"}
                                        alt={playlist.title}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Play className="w-8 h-8 text-white fill-current" />
                                </div>
                            </div>
                            <div className="p-2">
                                <h3 className="font-medium text-white text-xs truncate">{playlist.title}</h3>
                            </div>
                        </button>
                    );
                })}
            </div>
        );
    };

    if (moodsLoading) {
        return (
            <div className="py-20 text-center text-zinc-500 animate-pulse">
                Loading Moods & Genres...
            </div>
        );
    }

    if (moodsError) {
        return (
            <div className="py-20 text-center text-red-500">
                Error: {moodsError.message}
            </div>
        );
    }

    return (
        <div className="space-y-6 px-4">
            {selectedCategory ? (
                /* Playlists Section - Instant from memory! */
                <div className="space-y-4">
                    {/* Back button */}
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className="text-zinc-400 hover:text-white flex items-center gap-1 transition-colors text-sm"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                    </button>

                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Music className="w-5 h-5" />
                        {selectedCategory.title}
                    </h2>

                    {renderPlaylistsContent()}
                </div>
            ) : (
                <div className="space-y-6">
                    {moodsFullData && Object.entries(moodsFullData).map(([sectionTitle, categories]) => (
                        <section key={sectionTitle}>
                            <h2 className="text-sm font-bold text-white mb-3">{sectionTitle}</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {(categories as MoodCategoryFull[]).map((cat: MoodCategoryFull, i: number) => (
                                    <button
                                        key={cat.params || i}
                                        onClick={() => handleCategoryClick(cat)}
                                        className="bg-gradient-to-br from-zinc-800 to-zinc-900 hover:from-zinc-700 hover:to-zinc-800 rounded-lg p-3 text-left transition-all group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-white text-sm">{cat.title}</span>
                                            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
}
