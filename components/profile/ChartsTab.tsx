"use client";

import { useState } from "react";
import useSWR from "swr";
import Image from "next/image";
import { usePlayer, Track } from "@/contexts/PlayerContext";
import { Play, Loader2, Music, TrendingUp, ListMusic, TrendingDown, Minus, Users } from "lucide-react";
import { getChartConfig, hasChartSupport } from "@/lib/charts-constants";
import { api } from "@/lib/api";
import type { WatchTrack, Artist } from "@/types/music";

interface ChartsTabProps {
    country: { code: string; name: string; lang: string };
}

interface ChartCard {
    id: string;
    playlistId: string;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    gradient: string;
}

interface ChartArtist {
    title: string;
    browseId: string;
    subscribers: string;
    thumbnail: { url: string; width: number; height: number }[];
    rank: number;
    trend: "up" | "down" | "neutral";
}

// playlist track to Track
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

export function ChartsTab({ country }: Readonly<ChartsTabProps>) {
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const { setPlaylist, toggleQueue, isQueueOpen } = usePlayer();

    const config = getChartConfig(country.code);
    const isSupported = hasChartSupport(country.code);

    // Fetch artists from API (artists rankings change daily)
    const { data: chartsData, isLoading: isLoadingArtists } = useSWR(
        ["/api/charts", country.code],
        () => api.music.chartsCached(country.code),
        { revalidateOnFocus: false }
    );

    const artists: ChartArtist[] = chartsData?.artists || [];

    // Build chart cards from hardcoded IDs
    const chartCards: ChartCard[] = [];

    if (config.topSongs) {
        chartCards.push({
            id: "topSongs",
            playlistId: config.topSongs,
            title: "Top Songs",
            subtitle: `${country.name} Top 100`,
            icon: <ListMusic className="w-8 h-8" />,
            gradient: "from-rose-500 to-orange-500",
        });
    }

    if (config.topVideos) {
        chartCards.push({
            id: "topVideos",
            playlistId: config.topVideos,
            title: "Top Music Videos",
            subtitle: `Trending in ${country.name}`,
            icon: <Music className="w-8 h-8" />,
            gradient: "from-violet-500 to-purple-500",
        });
    }

    if (config.trending) {
        chartCards.push({
            id: "trending",
            playlistId: config.trending,
            title: "Trending",
            subtitle: "What's hot right now",
            icon: <TrendingUp className="w-8 h-8" />,
            gradient: "from-emerald-500 to-teal-500",
        });
    }

    // Playlist click handler
    const handleCardClick = async (card: ChartCard) => {
        if (loadingId) return;

        setLoadingId(card.id);

        try {
            const playlistData = await api.music.watch(undefined, card.playlistId);

            if (!playlistData?.tracks || playlistData.tracks.length === 0) {
                console.log("[ChartsTab] No tracks found");
                return;
            }

            const tracks: Track[] = playlistData.tracks
                .map((t: WatchTrack) => playlistTrackToTrack(t))
                .filter((t: Track | null): t is Track => t !== null);

            if (tracks.length > 0) {
                setPlaylist(tracks, 0);
                if (!isQueueOpen) toggleQueue();
            }
        } catch (e) {
            console.error("[ChartsTab] Error loading playlist:", e);
        } finally {
            setLoadingId(null);
        }
    };

    // Artist click handler - play artist's top songs
    const handleArtistClick = async (artist: ChartArtist) => {
        if (loadingId) return;

        setLoadingId(artist.browseId);

        try {
            const artistData = await api.music.artist(artist.browseId);

            if (!artistData?.songs?.results || artistData.songs.results.length === 0) {
                console.log("[ChartsTab] No artist songs found");
                return;
            }

            const tracks: Track[] = artistData.songs.results
                .slice(0, 20)
                .map((song: { videoId?: string; title?: string; artists?: { name: string }[]; thumbnails?: { url: string }[] }) => ({
                    videoId: song.videoId,
                    title: song.title || "Unknown",
                    artist: song.artists?.map(a => a.name).join(", ") || artist.title,
                    thumbnail: song.thumbnails?.at(-1)?.url || "/images/default-album.svg",
                }))
                .filter((t: Track) => t.videoId);

            if (tracks.length > 0) {
                setPlaylist(tracks, 0);
                if (!isQueueOpen) toggleQueue();
            }
        } catch (e) {
            console.error("[ChartsTab] Error loading artist:", e);
        } finally {
            setLoadingId(null);
        }
    };

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case "up":
                return <TrendingUp className="w-4 h-4 text-green-500" />;
            case "down":
                return <TrendingDown className="w-4 h-4 text-red-500" />;
            default:
                return <Minus className="w-4 h-4 text-zinc-500" />;
        }
    };

    if (!isSupported && country.code !== "ZZ") {
        return (
            <div className="py-12 text-center">
                <div className="text-zinc-400 mb-2">
                    Charts not available for {country.name}
                </div>
                <div className="text-zinc-500 text-sm">
                    Showing Global charts instead
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Chart Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {chartCards.map((card) => {
                    const isCardLoading = loadingId === card.id;

                    return (
                        <button
                            key={card.id}
                            type="button"
                            onClick={() => handleCardClick(card)}
                            disabled={!!loadingId}
                            className={`
                                relative overflow-hidden rounded-xl p-6 text-left
                                bg-gradient-to-br ${card.gradient}
                                transition-all duration-300
                                hover:scale-[1.02] hover:shadow-xl
                                active:scale-[0.98]
                                disabled:opacity-70 disabled:cursor-not-allowed
                                group
                            `}
                        >
                            {/* Background Pattern */}
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute -right-4 -top-4 w-32 h-32 rounded-full bg-white/20" />
                                <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
                            </div>

                            {/* Content */}
                            <div className="relative z-10 flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="text-white/80 mb-3">
                                        {card.icon}
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-1">
                                        {card.title}
                                    </h3>
                                    <p className="text-sm text-white/70">
                                        {card.subtitle}
                                    </p>
                                </div>

                                {/* Play Button */}
                                <div className={`
                                    w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm
                                    flex items-center justify-center
                                    transition-all duration-300
                                    group-hover:bg-white/30 group-hover:scale-110
                                `}>
                                    {isCardLoading ? (
                                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                                    ) : (
                                        <Play className="w-6 h-6 text-white fill-current ml-0.5" />
                                    )}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Top Artists Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-zinc-400" />
                    <h2 className="text-lg font-semibold text-white">
                        Top Artists in {country.name}
                    </h2>
                </div>

                {isLoadingArtists ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
                    </div>
                ) : artists.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {artists.slice(0, 40).map((artist) => {
                            const isArtistLoading = loadingId === artist.browseId;
                            const thumbnailUrl = artist.thumbnail?.at(-1)?.url || "/images/default-artist.svg";

                            return (
                                <button
                                    key={artist.browseId}
                                    type="button"
                                    onClick={() => handleArtistClick(artist)}
                                    disabled={!!loadingId}
                                    className="group flex flex-col items-center p-3 rounded-xl bg-zinc-900/50 hover:bg-zinc-800/80 transition-all duration-200 disabled:opacity-50"
                                >
                                    {/* Rank Badge */}
                                    <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-xs font-bold text-white">
                                        {artist.rank}
                                    </div>

                                    {/* Artist Image */}
                                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden mb-2 ring-2 ring-zinc-700 group-hover:ring-zinc-500 transition-all">
                                        {isArtistLoading ? (
                                            <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                                            </div>
                                        ) : (
                                            <Image
                                                src={thumbnailUrl}
                                                alt={artist.title}
                                                fill
                                                className="object-cover"
                                                sizes="80px"
                                            />
                                        )}
                                    </div>

                                    {/* Artist Name */}
                                    <span className="text-xs sm:text-sm font-medium text-white text-center line-clamp-1 w-full">
                                        {artist.title}
                                    </span>

                                    {/* Trend & Subscribers */}
                                    <div className="flex items-center gap-1 mt-1">
                                        {getTrendIcon(artist.trend)}
                                        <span className="text-xs text-zinc-500">
                                            {artist.subscribers}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-8 text-center text-zinc-500">
                        No artist data available
                    </div>
                )}
            </div>
        </div>
    );
}
