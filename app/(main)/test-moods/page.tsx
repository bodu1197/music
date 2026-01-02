"use client";

import { useState } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { usePlayer, Track } from "@/contexts/PlayerContext";
import { Play, Loader2, ChevronRight, Music, Sparkles } from "lucide-react";

// playlist to Track
function playlistTrackToTrack(track: any): Track | null {
    if (!track.videoId) return null;
    return {
        videoId: track.videoId,
        title: track.title || "Unknown",
        artist: track.artists?.map((a: any) => a.name).join(", ") || "Unknown Artist",
        thumbnail: Array.isArray(track.thumbnail)
            ? track.thumbnail[track.thumbnail.length - 1]?.url
            : track.thumbnail?.url || "/images/default-album.svg",
    };
}

export default function TestMoodsPage() {
    const [selectedCategory, setSelectedCategory] = useState<{ title: string; params: string } | null>(null);
    const [loadingPlaylistId, setLoadingPlaylistId] = useState<string | null>(null);
    const { setPlaylist, toggleQueue, isQueueOpen } = usePlayer();

    // Fetch mood categories
    const { data: moodsData, error: moodsError, isLoading: moodsLoading } = useSWR(
        "/moods",
        () => api.music.moods(),
        { revalidateOnFocus: false }
    );

    // Fetch playlists when category is selected
    const { data: playlistsData, error: playlistsError, isLoading: playlistsLoading } = useSWR(
        selectedCategory ? ["/moods/playlists", selectedCategory.params] : null,
        () => selectedCategory ? api.music.moodPlaylists(selectedCategory.params) : null,
        { revalidateOnFocus: false }
    );

    // Handle playlist click - load tracks and play
    const handlePlaylistClick = async (playlistId: string) => {
        console.log("[TestMoods] Playlist clicked:", playlistId);
        setLoadingPlaylistId(playlistId);

        try {
            const watchData = await api.music.watch(undefined, playlistId);
            console.log("[TestMoods] Watch data:", watchData);

            if (!watchData?.tracks || watchData.tracks.length === 0) {
                console.log("[TestMoods] No tracks");
                return;
            }

            const tracks: Track[] = watchData.tracks
                .map((t: any) => playlistTrackToTrack(t))
                .filter((t: Track | null): t is Track => t !== null);

            console.log("[TestMoods] Tracks:", tracks.length);

            if (tracks.length > 0) {
                setPlaylist(tracks, 0);
                if (!isQueueOpen) toggleQueue();
            }
        } catch (e) {
            console.error("[TestMoods] Error:", e);
        } finally {
            setLoadingPlaylistId(null);
        }
    };

    if (moodsLoading) {
        return (
            <div className="p-6 text-center text-zinc-500 animate-pulse">
                Loading Moods & Genres...
            </div>
        );
    }

    if (moodsError) {
        return (
            <div className="p-6 text-center text-red-500">
                Error: {moodsError.message}
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-500" />
                <h1 className="text-2xl font-bold text-white">Moods & Genres (Test)</h1>
            </div>

            {/* Categories Section */}
            {!selectedCategory ? (
                <div className="space-y-8">
                    {moodsData && Object.entries(moodsData).map(([sectionTitle, categories]: [string, any]) => (
                        <section key={sectionTitle}>
                            <h2 className="text-lg font-bold text-white mb-4">{sectionTitle}</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                {categories.map((cat: any, i: number) => (
                                    <button
                                        key={cat.params || i}
                                        onClick={() => setSelectedCategory({ title: cat.title, params: cat.params })}
                                        className="bg-gradient-to-br from-zinc-800 to-zinc-900 hover:from-zinc-700 hover:to-zinc-800 rounded-lg p-4 text-left transition-all group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-white">{cat.title}</span>
                                            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            ) : (
                /* Playlists Section */
                <div className="space-y-6">
                    {/* Back button */}
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className="text-zinc-400 hover:text-white flex items-center gap-2 transition-colors"
                    >
                        ← Back to Categories
                    </button>

                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Music className="w-5 h-5" />
                        {selectedCategory.title}
                    </h2>

                    {playlistsLoading ? (
                        <div className="text-center text-zinc-500 animate-pulse py-10">
                            Loading playlists...
                        </div>
                    ) : playlistsError ? (
                        <div className="text-center text-red-500 py-10">
                            Error: {playlistsError.message}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {playlistsData?.map((playlist: any, i: number) => {
                                const isLoading = loadingPlaylistId === playlist.playlistId;
                                return (
                                    <div
                                        key={playlist.playlistId || i}
                                        className="bg-zinc-900 rounded-lg overflow-hidden cursor-pointer hover:bg-zinc-800 transition-colors group"
                                        onClick={() => playlist.playlistId && !isLoading && handlePlaylistClick(playlist.playlistId)}
                                    >
                                        <div className="relative aspect-square">
                                            {playlist.thumbnails?.[0]?.url && (
                                                <img
                                                    src={playlist.thumbnails[0].url}
                                                    alt={playlist.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                {isLoading ? (
                                                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                                                ) : (
                                                    <Play className="w-10 h-10 text-white fill-current" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <h3 className="font-medium text-white text-sm truncate">{playlist.title}</h3>
                                            {playlist.author && (
                                                <p className="text-xs text-zinc-400 truncate">{playlist.author}</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Debug: Raw Data */}
            <details className="text-xs text-zinc-600">
                <summary className="cursor-pointer">Debug: Raw API Response</summary>
                <pre className="mt-2 p-4 bg-zinc-900 rounded overflow-auto max-h-96">
                    {JSON.stringify(selectedCategory ? playlistsData : moodsData, null, 2)}
                </pre>
            </details>
        </div>
    );
}
