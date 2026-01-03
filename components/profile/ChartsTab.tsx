"use client";

import { useState } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { usePlayer, Track } from "@/contexts/PlayerContext";
import { Play, Loader2, Music, User, Disc } from "lucide-react";
import type { WatchTrack, Artist, ArtistSong, ChartArtist, ChartVideo } from "@/types/music";

interface ChartsTabProps {
    country: { code: string; name: string; lang: string };
}

// playlist track to Track
function playlistTrackToTrack(track: WatchTrack): Track | null {
    if (!track.videoId) return null;
    return {
        videoId: track.videoId,
        title: track.title || "Unknown",
        artist: track.artists?.map((a: Artist) => a.name).join(", ") || "Unknown Artist",
        thumbnail: Array.isArray(track.thumbnail)
            ? track.thumbnail[track.thumbnail.length - 1]?.url
            : "/images/default-album.svg",
    };
}

// artist song to Track
function artistSongToTrack(song: ArtistSong, artistName: string): Track | null {
    if (!song.videoId) return null;
    return {
        videoId: song.videoId,
        title: song.title || "Unknown",
        artist: song.artists?.map((a: Artist) => a.name).join(", ") || artistName,
        thumbnail: song.thumbnails?.[song.thumbnails.length - 1]?.url || "/images/default-album.svg",
        album: song.album?.name,
    };
}

export function ChartsTab({ country }: ChartsTabProps) {
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const { setPlaylist, toggleQueue, isQueueOpen } = usePlayer();

    const { data, error, isLoading } = useSWR(
        ["/charts/cached", country.code, country.lang],
        () => api.music.chartsCached(country.code),
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000,
            keepPreviousData: true,
        }
    );

    // Playlist click handler
    const handlePlaylistClick = async (playlistId: string) => {
        console.log("[ChartsTab] Playlist clicked:", playlistId);
        setLoadingId(playlistId);

        try {
            const playlistData = await api.music.watch(undefined, playlistId);
            console.log("[ChartsTab] Playlist data:", playlistData);

            if (!playlistData?.tracks || playlistData.tracks.length === 0) {
                console.log("[ChartsTab] No tracks");
                return;
            }

            const tracks: Track[] = playlistData.tracks
                .map((t: WatchTrack) => playlistTrackToTrack(t))
                .filter((t: Track | null): t is Track => t !== null);

            console.log("[ChartsTab] Tracks:", tracks.length);

            if (tracks.length > 0) {
                setPlaylist(tracks, 0);
                if (!isQueueOpen) toggleQueue();
            }
        } catch (e) {
            console.error("[ChartsTab] Error:", e);
        } finally {
            setLoadingId(null);
        }
    };

    // Artist click handler
    const handleArtistClick = async (browseId: string, artistName: string) => {
        console.log("[ChartsTab] Artist clicked:", browseId);
        setLoadingId(browseId);

        try {
            const artistData = await api.music.artist(browseId);
            console.log("[ChartsTab] Artist data:", artistData);

            let tracks: Track[] = [];

            if (artistData?.songs?.results) {
                tracks = artistData.songs.results
                    .map((s: ArtistSong) => artistSongToTrack(s, artistName))
                    .filter((t: Track | null): t is Track => t !== null);
            }

            if (tracks.length === 0 && artistData?.videos?.results) {
                tracks = artistData.videos.results
                    .map((v: ChartVideo) => ({
                        videoId: v.videoId,
                        title: v.title || "Unknown",
                        artist: artistName,
                        thumbnail: v.thumbnails?.[v.thumbnails.length - 1]?.url || "/images/default-album.svg",
                    }))
                    .filter((t: Track): t is Track => !!t.videoId);
            }

            console.log("[ChartsTab] Artist tracks:", tracks.length);

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

    if (isLoading && !data) {
        return (
            <div className="py-20 text-center text-zinc-500 animate-pulse">
                Loading charts for {country.name}...
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-20 text-center text-red-500">
                Error: {error.message || "Failed to load charts"}
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Videos Section */}
            {data?.videos && data.videos.length > 0 && (
                <section>
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Music className="w-5 h-5" />
                        Trending Videos
                    </h2>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
                        {data.videos.map((item: ChartVideo, i: number) => {
                            const isItemLoading = !!(loadingId && loadingId === item.playlistId);
                            return (
                                <button
                                    key={item.playlistId || i}
                                    type="button"
                                    className="flex-none w-[200px] group cursor-pointer text-left bg-transparent border-none p-0"
                                    onClick={() => item.playlistId && !isItemLoading && handlePlaylistClick(item.playlistId)}
                                >
                                    <div className="relative aspect-video mb-2 rounded-md overflow-hidden bg-zinc-900">
                                        {item.thumbnails?.[0]?.url && (
                                            <img
                                                src={item.thumbnails[0].url}
                                                alt={item.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                                    <h3 className="text-sm font-medium text-white truncate">{item.title}</h3>
                                </button>
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
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
                        {data.genres.map((item: ChartVideo, i: number) => {
                            const isItemLoading = !!(loadingId && loadingId === item.playlistId);
                            return (
                                <button
                                    key={item.playlistId || i}
                                    type="button"
                                    className="flex-none w-[140px] group cursor-pointer text-left bg-transparent border-none p-0"
                                    onClick={() => item.playlistId && !isItemLoading && handlePlaylistClick(item.playlistId)}
                                >
                                    <div className="relative aspect-square mb-2 rounded-md overflow-hidden bg-zinc-900">
                                        {item.thumbnails?.[0]?.url && (
                                            <img
                                                src={item.thumbnails[0].url}
                                                alt={item.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                                </button>
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
                        Top Artists
                    </h2>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
                        {data.artists.map((artist: ChartArtist, i: number) => {
                            const isItemLoading = !!(loadingId && loadingId === artist.browseId);
                            return (
                                <button
                                    key={artist.browseId || i}
                                    type="button"
                                    className="flex-none w-[100px] text-center group cursor-pointer bg-transparent border-none p-0"
                                    onClick={() => artist.browseId && !isItemLoading && handleArtistClick(artist.browseId, artist.title)}
                                >
                                    <div className="relative aspect-square mb-2 rounded-full overflow-hidden bg-zinc-800">
                                        {artist.thumbnails?.[0]?.url && (
                                            <img
                                                src={artist.thumbnails[0].url}
                                                alt={artist.title}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                                            {isItemLoading ? (
                                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                                            ) : (
                                                <Play className="w-6 h-6 text-white fill-current" />
                                            )}
                                        </div>
                                    </div>
                                    <h3 className="text-xs font-medium text-white truncate">{artist.title}</h3>
                                    <p className="text-xs text-zinc-500 truncate">{artist.subscribers}</p>
                                </button>
                            );
                        })}
                    </div>
                </section>
            )
            }
        </div >
    );
}
