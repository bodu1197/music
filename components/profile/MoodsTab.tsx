"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import useSWR from "swr";
import { api } from "@/lib/api";
import { usePlayer, Track } from "@/contexts/PlayerContext";
import { Play, Loader2, ChevronRight, Music, ChevronLeft, AlertCircle } from "lucide-react";
import { Country } from "@/lib/constants";
import type { WatchTrack, Artist, MoodCategory, MoodPlaylist } from "@/types/music";

interface MoodsTabProps {
    country: Country;
}

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
    const [selectedCategory, setSelectedCategory] = useState<{ title: string; params: string } | null>(null);
    const [loadingPlaylistId, setLoadingPlaylistId] = useState<string | null>(null);
    const { setPlaylist, toggleQueue, isQueueOpen } = usePlayer();

    // Fetch ALL moods data with playlists (server-cached, single request)
    const { data: moodsAllData, error: moodsError, isLoading: moodsLoading } = useSWR(
        ["/moods/all", country.code, country.lang],
        () => api.music.moodsAll(country.code, country.lang),
        { revalidateOnFocus: false }
    );

    // Get playlists for selected category from cached data
    const playlistsData = useMemo((): MoodPlaylist[] | null => {
        if (!selectedCategory || !moodsAllData) return null;

        // Find the category in the data
        for (const categories of Object.values(moodsAllData)) {
            if (Array.isArray(categories)) {
                const found = categories.find((cat) => cat.params === selectedCategory.params);
                if (found && 'playlists' in found) {
                    return (found as { playlists?: MoodPlaylist[] }).playlists || [];
                }
            }
        }
        return [];
    }, [selectedCategory, moodsAllData]);

    // Reset selected category when country changes
    useEffect(() => {
        setSelectedCategory(null);
    }, [country.code]);

    // Handle playlist click - load tracks and play
    const handlePlaylistClick = async (playlistId: string) => {
        setLoadingPlaylistId(playlistId);

        try {
            const watchData = await api.music.watch(undefined, playlistId);

            if (!watchData?.tracks || watchData.tracks.length === 0) {
                return;
            }

            const tracks: Track[] = watchData.tracks
                .map((t: WatchTrack) => playlistTrackToTrack(t))
                .filter((t: Track | null): t is Track => t !== null);

            if (tracks.length > 0) {
                setPlaylist(tracks, 0);
                if (!isQueueOpen) toggleQueue();
            }
        } catch (e) {
            console.error("[MoodsTab] Error:", e);
        } finally {
            setLoadingPlaylistId(null);
        }
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
                /* Playlists Section */
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

                    {!playlistsData || playlistsData.length === 0 ? (
                        <div className="text-center text-zinc-500 py-10 flex flex-col items-center gap-2">
                            <AlertCircle className="w-8 h-8" />
                            <p>No playlists available for this category.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {playlistsData.map((playlist: MoodPlaylist, i: number) => {
                                const isLoading = loadingPlaylistId === playlist.playlistId;
                                return (
                                    <button
                                        key={playlist.playlistId || i}
                                        type="button"
                                        className="bg-zinc-900 rounded-lg overflow-hidden cursor-pointer hover:bg-zinc-800 transition-colors group text-left w-full border-none p-0 block"
                                        onClick={() => playlist.playlistId && !isLoading && handlePlaylistClick(playlist.playlistId)}
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
                                                {isLoading ? (
                                                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                                                ) : (
                                                    <Play className="w-8 h-8 text-white fill-current" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-2">
                                            <h3 className="font-medium text-white text-xs truncate">{playlist.title}</h3>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    {moodsAllData && Object.entries(moodsAllData).map(([sectionTitle, categories]) => (
                        <section key={sectionTitle}>
                            <h2 className="text-sm font-bold text-white mb-3">{sectionTitle}</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {(categories as MoodCategory[]).map((cat: MoodCategory, i: number) => (
                                    <button
                                        key={cat.params || i}
                                        onClick={() => setSelectedCategory({ title: cat.title, params: cat.params })}
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
