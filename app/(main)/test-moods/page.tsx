"use client";

import { useState, useEffect } from "react";
import useSWR, { preload } from "swr";
import { api } from "@/lib/api";
import { usePlayer, Track } from "@/contexts/PlayerContext";
import { Play, Loader2, ChevronRight, Music, Sparkles, Globe, AlertCircle } from "lucide-react";

// 국가 목록
const COUNTRIES = [
    { code: "ZZ", name: "🌍 Global", lang: "en" },
    { code: "US", name: "🇺🇸 United States", lang: "en" },
    { code: "KR", name: "🇰🇷 South Korea", lang: "ko" },
    { code: "JP", name: "🇯🇵 Japan", lang: "ja" },
    { code: "GB", name: "🇬🇧 United Kingdom", lang: "en" },
    { code: "DE", name: "🇩🇪 Germany", lang: "de" },
    { code: "FR", name: "🇫🇷 France", lang: "fr" },
    { code: "ES", name: "🇪🇸 Spain", lang: "es" },
    { code: "IT", name: "🇮🇹 Italy", lang: "it" },
    { code: "BR", name: "🇧🇷 Brazil", lang: "pt" },
    { code: "MX", name: "🇲🇽 Mexico", lang: "es" },
    { code: "IN", name: "🇮🇳 India", lang: "hi" },
    { code: "RU", name: "🇷🇺 Russia", lang: "ru" },
    { code: "TW", name: "🇹🇼 Taiwan", lang: "zh_TW" },
    { code: "TR", name: "🇹🇷 Turkey", lang: "tr" },
];

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
    const [country, setCountry] = useState(COUNTRIES[1]); // Default US
    const [detectedCountry, setDetectedCountry] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<{ title: string; params: string } | null>(null);
    const [loadingPlaylistId, setLoadingPlaylistId] = useState<string | null>(null);
    const { setPlaylist, toggleQueue, isQueueOpen } = usePlayer();

    // IP 기반 국가 감지
    useEffect(() => {
        async function detectCountry() {
            try {
                const res = await fetch("https://ipapi.co/json/");
                const data = await res.json();
                const countryCode = data.country_code;
                setDetectedCountry(countryCode);

                const found = COUNTRIES.find(c => c.code === countryCode);
                if (found) {
                    setCountry(found);
                }
            } catch (e) {
                console.log("[TestMoods] IP detection failed");
            }
        }
        detectCountry();
    }, []);

    // Handle browser back button
    useEffect(() => {
        const handlePopState = () => {
            setSelectedCategory(null);
        };
        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

    // Fetch mood categories
    const { data: moodsData, error: moodsError, isLoading: moodsLoading } = useSWR(
        ["/moods", country.code, country.lang],
        () => api.music.moods(country.code, country.lang),
        { revalidateOnFocus: false }
    );

    // Preload all category playlists when moods data is loaded
    useEffect(() => {
        if (moodsData) {
            Object.values(moodsData).forEach((categories: any) => {
                categories.forEach((cat: any) => {
                    if (cat.params) {
                        preload(
                            ["/moods/playlists", cat.params, country.code, country.lang],
                            () => api.music.moodPlaylists(cat.params, country.code, country.lang)
                        );
                    }
                });
            });
        }
    }, [moodsData, country.code, country.lang]);

    // Fetch playlists when category is selected (with country/language)
    const { data: playlistsData, error: playlistsError, isLoading: playlistsLoading } = useSWR(
        selectedCategory ? ["/moods/playlists", selectedCategory.params, country.code, country.lang] : null,
        () => selectedCategory ? api.music.moodPlaylists(selectedCategory.params, country.code, country.lang) : null,
        { revalidateOnFocus: false }
    );

    // Reset selected category when country changes
    useEffect(() => {
        setSelectedCategory(null);
    }, [country.code]);

    // Handle category selection with history
    const handleCategoryClick = (cat: { title: string; params: string }) => {
        window.history.pushState({ category: cat.title }, "", window.location.href);
        setSelectedCategory(cat);
    };

    // Handle back to categories
    const handleBackClick = () => {
        setSelectedCategory(null);
        // Don't push to history, just go back naturally
    };

    // Handle playlist click - load tracks and play
    const handlePlaylistClick = async (playlistId: string) => {
        setLoadingPlaylistId(playlistId);

        try {
            const watchData = await api.music.watch(undefined, playlistId);

            if (!watchData?.tracks || watchData.tracks.length === 0) {
                return;
            }

            const tracks: Track[] = watchData.tracks
                .map((t: any) => playlistTrackToTrack(t))
                .filter((t: Track | null): t is Track => t !== null);

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
                Loading Moods & Genres for {country.name}...
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-purple-500" />
                    <h1 className="text-2xl font-bold text-white">Moods & Genres</h1>
                </div>

                {/* Country Selector */}
                <div className="flex items-center gap-2">
                    {detectedCountry && (
                        <span className="text-xs text-zinc-500">
                            <Globe className="w-3 h-3 inline mr-1" />
                            Detected: {detectedCountry}
                        </span>
                    )}
                    <select
                        value={country.code}
                        onChange={(e) => {
                            const c = COUNTRIES.find((c) => c.code === e.target.value);
                            if (c) setCountry(c);
                        }}
                        className="bg-zinc-800 text-white px-4 py-2 rounded-lg border border-zinc-700 text-sm"
                    >
                        {COUNTRIES.map((c) => (
                            <option key={c.code} value={c.code}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>
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
                                        onClick={() => handleCategoryClick({ title: cat.title, params: cat.params })}
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
                        onClick={handleBackClick}
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
                    ) : !playlistsData || playlistsData.length === 0 ? (
                        <div className="text-center text-zinc-500 py-10 flex flex-col items-center gap-2">
                            <AlertCircle className="w-8 h-8" />
                            <p>No playlists available for this category.</p>
                            <p className="text-xs">Try a different category or country.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {playlistsData.map((playlist: any, i: number) => {
                                const isLoading = loadingPlaylistId === playlist.playlistId;
                                return (
                                    <div
                                        key={playlist.playlistId || i}
                                        className="bg-zinc-900 rounded-lg overflow-hidden cursor-pointer hover:bg-zinc-800 transition-colors group"
                                        onClick={() => playlist.playlistId && !isLoading && handlePlaylistClick(playlist.playlistId)}
                                    >
                                        <div className="relative aspect-square">
                                            {playlist.thumbnails?.length > 0 && (
                                                <img
                                                    src={playlist.thumbnails[playlist.thumbnails.length - 1].url}
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
        </div>
    );
}
