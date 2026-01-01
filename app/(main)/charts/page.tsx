"use client";

import { useState } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { usePlayer, Track } from "@/contexts/PlayerContext";
import { Play, Loader2, TrendingUp, Music, User, Disc } from "lucide-react";

// 국가 목록
const COUNTRIES = [
    { code: "US", name: "United States", lang: "en" },
    { code: "KR", name: "Korea", lang: "ko" },
    { code: "JP", name: "Japan", lang: "ja" },
    { code: "GB", name: "United Kingdom", lang: "en" },
];

// playlist track to Track
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

export default function ChartsPage() {
    const [country, setCountry] = useState(COUNTRIES[0]);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const { setPlaylist, toggleQueue, isQueueOpen } = usePlayer();

    const { data, error, isLoading } = useSWR(
        ["/charts", country.code, country.lang],
        () => api.music.charts(country.code),
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000,
        }
    );

    // 플레이리스트 클릭 핸들러
    const handlePlaylistClick = async (playlistId: string) => {
        console.log("[Charts] Playlist clicked:", playlistId);
        setLoadingId(playlistId);

        try {
            const playlistData = await api.music.watch(undefined, playlistId);
            console.log("[Charts] Playlist data:", playlistData);

            if (!playlistData?.tracks || playlistData.tracks.length === 0) {
                console.log("[Charts] No tracks");
                return;
            }

            const tracks: Track[] = playlistData.tracks
                .map((t: any) => playlistTrackToTrack(t))
                .filter((t: Track | null): t is Track => t !== null);

            console.log("[Charts] Tracks:", tracks.length);

            if (tracks.length > 0) {
                setPlaylist(tracks, 0);
                if (!isQueueOpen) toggleQueue();
            }
        } catch (e) {
            console.error("[Charts] Error:", e);
        } finally {
            setLoadingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="p-6 text-center text-zinc-500 animate-pulse">
                Loading charts for {country.name}...
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-center text-red-500">
                Error: {error.message}
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-6 h-6" />
                    Charts
                </h1>

                {/* Country Selector */}
                <select
                    value={country.code}
                    onChange={(e) => {
                        const c = COUNTRIES.find((c) => c.code === e.target.value);
                        if (c) setCountry(c);
                    }}
                    className="bg-zinc-800 text-white px-4 py-2 rounded-lg border border-zinc-700"
                >
                    {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                            {c.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Videos Section */}
            {data?.videos && data.videos.length > 0 && (
                <section>
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Music className="w-5 h-5" />
                        Trending Videos
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.videos.map((item: any, i: number) => {
                            const isItemLoading = loadingId === item.playlistId;
                            return (
                                <div
                                    key={item.playlistId || i}
                                    className="bg-zinc-900 rounded-lg p-4 cursor-pointer hover:bg-zinc-800 transition-colors group"
                                    onClick={() => item.playlistId && !isItemLoading && handlePlaylistClick(item.playlistId)}
                                >
                                    <div className="relative aspect-video mb-3 rounded overflow-hidden">
                                        {item.thumbnails?.[0]?.url && (
                                            <img
                                                src={item.thumbnails[0].url}
                                                alt={item.title}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            {isItemLoading ? (
                                                <Loader2 className="w-10 h-10 text-white animate-spin" />
                                            ) : (
                                                <Play className="w-10 h-10 text-white fill-current" />
                                            )}
                                        </div>
                                    </div>
                                    <h3 className="font-medium text-white truncate">{item.title}</h3>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Genres Section */}
            {data?.genres && data.genres.length > 0 && (
                <section>
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Disc className="w-5 h-5" />
                        Top by Genre
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {data.genres.map((item: any, i: number) => {
                            const isItemLoading = loadingId === item.playlistId;
                            return (
                                <div
                                    key={item.playlistId || i}
                                    className="bg-zinc-900 rounded-lg p-3 cursor-pointer hover:bg-zinc-800 transition-colors group"
                                    onClick={() => item.playlistId && !isItemLoading && handlePlaylistClick(item.playlistId)}
                                >
                                    <div className="relative aspect-square mb-2 rounded overflow-hidden">
                                        {item.thumbnails?.[0]?.url && (
                                            <img
                                                src={item.thumbnails[0].url}
                                                alt={item.title}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            {isItemLoading ? (
                                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                                            ) : (
                                                <Play className="w-8 h-8 text-white fill-current" />
                                            )}
                                        </div>
                                    </div>
                                    <h3 className="text-sm font-medium text-white truncate">{item.title}</h3>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Artists Section */}
            {data?.artists && data.artists.length > 0 && (
                <section>
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Top Artists ({data.artists.length})
                    </h2>
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                        {data.artists.map((artist: any, i: number) => (
                            <div
                                key={artist.browseId || i}
                                className="text-center group cursor-pointer"
                            >
                                <div className="relative aspect-square mb-2 rounded-full overflow-hidden bg-zinc-800">
                                    {artist.thumbnails?.[0]?.url && (
                                        <img
                                            src={artist.thumbnails[0].url}
                                            alt={artist.title}
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                </div>
                                <h3 className="text-xs font-medium text-white truncate">{artist.title}</h3>
                                <p className="text-xs text-zinc-500">{artist.subscribers}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Debug: Raw Data */}
            <details className="text-xs text-zinc-600">
                <summary className="cursor-pointer">Debug: Raw API Response</summary>
                <pre className="mt-2 p-4 bg-zinc-900 rounded overflow-auto max-h-96">
                    {JSON.stringify(data, null, 2)}
                </pre>
            </details>
        </div>
    );
}
