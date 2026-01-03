/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowLeft, Play, Shuffle, Radio, Loader2, Music, Disc, Video, Users, ChevronDown } from "lucide-react";
import { usePlayer, Track } from "@/contexts/PlayerContext";
import { api } from "@/lib/api";

interface ArtistData {
    name: string;
    description?: string;
    subscribers?: string;
    views?: string;
    thumbnails?: { url: string; width: number; height: number }[];
    shuffleId?: string;
    radioId?: string;
    songs?: {
        browseId?: string;
        results?: any[];
    };
    albums?: {
        browseId?: string;
        params?: string;
        results?: any[];
    };
    singles?: {
        browseId?: string;
        params?: string;
        results?: any[];
    };
    videos?: {
        browseId?: string;
        results?: any[];
    };
    related?: {
        results?: any[];
    };
}

export default function ArtistPage() {
    const params = useParams();
    const router = useRouter();
    const artistId = params.id as string;

    const [artist, setArtist] = useState<ArtistData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [playingId, setPlayingId] = useState<string | null>(null);

    // Expanded data states
    const [allSongs, setAllSongs] = useState<any[] | null>(null);
    const [allAlbums, setAllAlbums] = useState<any[] | null>(null);
    const [allSingles, setAllSingles] = useState<any[] | null>(null);
    const [loadingSongs, setLoadingSongs] = useState(false);
    const [loadingAlbums, setLoadingAlbums] = useState(false);
    const [loadingSingles, setLoadingSingles] = useState(false);

    const { setPlaylist, toggleQueue, isQueueOpen } = usePlayer();

    useEffect(() => {
        async function fetchArtist() {
            try {
                setIsLoading(true);
                // Reset expanded data when artist changes
                setAllSongs(null);
                setAllAlbums(null);
                setAllSingles(null);
                const data = await api.music.artist(artistId);
                setArtist(data);
            } catch (e: any) {
                setError(e.message || "Failed to load artist");
            } finally {
                setIsLoading(false);
            }
        }

        if (artistId) {
            fetchArtist();
        }
    }, [artistId]);

    // Load all songs
    const handleLoadAllSongs = async () => {
        if (loadingSongs || allSongs) return;
        setLoadingSongs(true);
        try {
            const data = await api.music.artistSongs(artistId);
            setAllSongs(data.tracks || []);
        } catch (e) {
            console.error("Failed to load all songs:", e);
        } finally {
            setLoadingSongs(false);
        }
    };

    // Load all albums
    const handleLoadAllAlbums = async () => {
        if (loadingAlbums || allAlbums) return;
        setLoadingAlbums(true);
        try {
            const data = await api.music.artistAlbums(artistId, 'albums');
            setAllAlbums(data.items || []);
        } catch (e) {
            console.error("Failed to load all albums:", e);
        } finally {
            setLoadingAlbums(false);
        }
    };

    // Load all singles
    const handleLoadAllSingles = async () => {
        if (loadingSingles || allSingles) return;
        setLoadingSingles(true);
        try {
            const data = await api.music.artistAlbums(artistId, 'singles');
            setAllSingles(data.items || []);
        } catch (e) {
            console.error("Failed to load all singles:", e);
        } finally {
            setLoadingSingles(false);
        }
    };

    // Play a single song/video
    const handlePlaySong = (item: any) => {
        if (!item.videoId) return;
        const track: Track = {
            videoId: item.videoId,
            title: item.title || "Unknown",
            artist: item.artists?.map((a: any) => a.name).join(", ") || artist?.name || "Unknown",
            thumbnail: item.thumbnails?.[item.thumbnails.length - 1]?.url || "/images/default-album.svg",
        };
        setPlaylist([track], 0);
        if (!isQueueOpen) toggleQueue();
    };

    // Play all songs (uses expanded data if available)
    const handlePlayAll = () => {
        const songs = allSongs || artist?.songs?.results || [];
        if (songs.length === 0) return;

        const tracks: Track[] = songs
            .filter((s: any) => s.videoId)
            .map((s: any) => ({
                videoId: s.videoId,
                title: s.title || "Unknown",
                artist: s.artists?.map((a: any) => a.name).join(", ") || artist?.name || "Unknown",
                thumbnail: s.thumbnails?.[s.thumbnails.length - 1]?.url || "/images/default-album.svg",
            }));

        if (tracks.length > 0) {
            setPlaylist(tracks, 0);
            if (!isQueueOpen) toggleQueue();
        }
    };

    // Play album
    const handlePlayAlbum = async (albumId: string) => {
        setPlayingId(albumId);
        try {
            const albumData = await api.music.album(albumId);
            if (albumData?.tracks) {
                const tracks: Track[] = albumData.tracks
                    .filter((t: any) => t.videoId)
                    .map((t: any) => ({
                        videoId: t.videoId,
                        title: t.title || "Unknown",
                        artist: t.artists?.map((a: any) => a.name).join(", ") || artist?.name || "Unknown",
                        thumbnail: albumData.thumbnails?.[albumData.thumbnails.length - 1]?.url || "/images/default-album.svg",
                    }));

                if (tracks.length > 0) {
                    setPlaylist(tracks, 0);
                    if (!isQueueOpen) toggleQueue();
                }
            }
        } catch (e) {
            console.error("Album fetch error:", e);
        } finally {
            setPlayingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            </div>
        );
    }

    if (error || !artist) {
        return (
            <div className="max-w-4xl mx-auto py-8 px-4">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-zinc-400 hover:text-white mb-4">
                    <ArrowLeft className="w-5 h-5" />
                    Back
                </button>
                <div className="text-red-500">Error: {error || "Artist not found"}</div>
            </div>
        );
    }

    const thumbnail = artist.thumbnails?.[artist.thumbnails.length - 1]?.url;
    const displaySongs = allSongs || artist.songs?.results || [];
    const displayAlbums = allAlbums || artist.albums?.results || [];
    const displaySingles = allSingles || artist.singles?.results || [];
    const hasSongsBrowseId = !!artist.songs?.browseId;
    const hasAlbumsBrowseId = !!artist.albums?.browseId;
    const hasSinglesBrowseId = !!artist.singles?.browseId;

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            {/* Back Button */}
            <button onClick={() => router.back()} className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6">
                <ArrowLeft className="w-5 h-5" />
                Back
            </button>

            {/* Artist Header */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
                {/* Thumbnail */}
                <div className="w-48 h-48 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0 relative">
                    {thumbnail ? (
                        <Image src={thumbnail} alt={artist.name} fill className="object-cover" unoptimized />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                            <Users className="w-16 h-16" />
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 text-center md:text-left">
                    <p className="text-sm text-zinc-400 uppercase tracking-wider mb-1">Artist</p>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{artist.name}</h1>
                    {artist.subscribers && (
                        <p className="text-zinc-400 mb-2">{artist.subscribers} subscribers</p>
                    )}
                    {artist.views && (
                        <p className="text-zinc-500 text-sm mb-4">{artist.views}</p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                        <button
                            onClick={handlePlayAll}
                            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-full"
                        >
                            <Play className="w-5 h-5 fill-current" />
                            Play
                        </button>
                        {artist.shuffleId && (
                            <button className="flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-full">
                                <Shuffle className="w-5 h-5" />
                                Shuffle
                            </button>
                        )}
                        {artist.radioId && (
                            <button className="flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-full">
                                <Radio className="w-5 h-5" />
                                Radio
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Description */}
            {artist.description && (
                <div className="mb-8 p-4 bg-zinc-900 rounded-lg">
                    <p className="text-zinc-300 text-sm leading-relaxed">{artist.description}</p>
                </div>
            )}

            {/* Songs Section */}
            {displaySongs.length > 0 && (
                <section className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Music className="w-5 h-5" />
                            Songs
                            <span className="text-sm font-normal text-zinc-400">
                                ({displaySongs.length}{!allSongs && hasSongsBrowseId ? '+' : ''})
                            </span>
                        </h2>
                        {hasSongsBrowseId && !allSongs && (
                            <button
                                onClick={handleLoadAllSongs}
                                disabled={loadingSongs}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-full"
                            >
                                {loadingSongs ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <ChevronDown className="w-4 h-4" />
                                )}
                                Show All
                            </button>
                        )}
                    </div>
                    <div className="space-y-1">
                        {displaySongs.map((song: any, i: number) => (
                            <button
                                key={song.videoId || i}
                                type="button"
                                onClick={() => handlePlaySong(song)}
                                className="w-full flex items-center gap-4 p-3 hover:bg-zinc-800 rounded-lg cursor-pointer group text-left"
                            >
                                <span className="w-6 text-center text-zinc-500 group-hover:hidden">{i + 1}</span>
                                <Play className="w-4 h-4 text-white hidden group-hover:block" />
                                <div className="w-12 h-12 bg-zinc-800 rounded overflow-hidden flex-shrink-0">
                                    {song.thumbnails?.[0]?.url && (
                                        <Image src={song.thumbnails[0].url} alt={song.title} fill className="object-cover" unoptimized />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-white font-medium truncate">{song.title}</h3>
                                    <p className="text-sm text-zinc-400 truncate">
                                        {song.album?.name || ""}
                                    </p>
                                </div>
                                <span className="text-zinc-500 text-sm">{song.duration}</span>
                            </button>
                        ))}
                    </div>
                </section>
            )
            }

            {/* Albums Section */}
            {
                displayAlbums.length > 0 && (
                    <section className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Disc className="w-5 h-5" />
                                Albums
                                <span className="text-sm font-normal text-zinc-400">
                                    ({displayAlbums.length}{!allAlbums && hasAlbumsBrowseId ? '+' : ''})
                                </span>
                            </h2>
                            {hasAlbumsBrowseId && !allAlbums && (
                                <button
                                    onClick={handleLoadAllAlbums}
                                    disabled={loadingAlbums}
                                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-full"
                                >
                                    {loadingAlbums ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4" />
                                    )}
                                    Show All
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {displayAlbums.map((album: any, i: number) => (
                                <button
                                    key={album.browseId || i}
                                    type="button"
                                    onClick={() => album.browseId && handlePlayAlbum(album.browseId)}
                                    className="group cursor-pointer text-left w-full"
                                >
                                    <div className="relative aspect-square mb-2 bg-zinc-800 rounded-lg overflow-hidden">
                                        {album.thumbnails?.[0]?.url && (
                                            <Image src={album.thumbnails[0].url} alt={album.title} fill className="object-cover group-hover:scale-105 transition-transform" unoptimized />
                                        )}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            {playingId === album.browseId ? (
                                                <Loader2 className="w-10 h-10 text-white animate-spin" />
                                            ) : (
                                                <Play className="w-10 h-10 text-white fill-current" />
                                            )}
                                        </div>
                                    </div>
                                    <h3 className="text-white font-medium text-sm truncate">{album.title}</h3>
                                    <p className="text-zinc-500 text-xs">{album.year}</p>
                                </button>
                            ))}
                        </div>
                    </section>
                )
            }

            {/* Singles Section */}
            {
                displaySingles.length > 0 && (
                    <section className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Disc className="w-5 h-5" />
                                Singles
                                <span className="text-sm font-normal text-zinc-400">
                                    ({displaySingles.length}{!allSingles && hasSinglesBrowseId ? '+' : ''})
                                </span>
                            </h2>
                            {hasSinglesBrowseId && !allSingles && (
                                <button
                                    onClick={handleLoadAllSingles}
                                    disabled={loadingSingles}
                                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-full"
                                >
                                    {loadingSingles ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4" />
                                    )}
                                    Show All
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {displaySingles.map((single: any, i: number) => (
                                <button
                                    key={single.browseId || i}
                                    type="button"
                                    onClick={() => single.browseId && handlePlayAlbum(single.browseId)}
                                    className="group cursor-pointer text-left w-full"
                                >
                                    <div className="relative aspect-square mb-2 bg-zinc-800 rounded-lg overflow-hidden">
                                        {single.thumbnails?.[0]?.url && (
                                            <Image src={single.thumbnails[0].url} alt={single.title} fill className="object-cover group-hover:scale-105 transition-transform" unoptimized />
                                        )}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            {playingId === single.browseId ? (
                                                <Loader2 className="w-10 h-10 text-white animate-spin" />
                                            ) : (
                                                <Play className="w-10 h-10 text-white fill-current" />
                                            )}
                                        </div>
                                    </div>
                                    <h3 className="text-white font-medium text-sm truncate">{single.title}</h3>
                                    <p className="text-zinc-500 text-xs">{single.year}</p>
                                </button>
                            ))}
                        </div>
                    </section>
                )
            }

            {/* Videos Section */}
            {
                artist.videos?.results && artist.videos.results.length > 0 && (
                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Video className="w-5 h-5" />
                            Music Videos
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {artist.videos.results.map((video: any, i: number) => (
                                <button
                                    key={video.videoId || i}
                                    type="button"
                                    onClick={() => handlePlaySong(video)}
                                    className="w-full flex gap-4 p-3 hover:bg-zinc-800 rounded-lg cursor-pointer group text-left"
                                >
                                    <div className="relative w-40 aspect-video bg-zinc-800 rounded overflow-hidden flex-shrink-0">
                                        {video.thumbnails?.[0]?.url && (
                                            <Image src={video.thumbnails[0].url} alt={video.title} fill className="object-cover" unoptimized />
                                        )}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Play className="w-8 h-8 text-white fill-current" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-medium line-clamp-2">{video.title}</h3>
                                        <p className="text-sm text-zinc-400 mt-1">{video.views}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>
                )
            }

            {/* Related Artists */}
            {
                artist.related?.results && artist.related.results.length > 0 && (
                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Related Artists
                        </h2>
                        <div className="flex gap-4 overflow-x-auto pb-4">
                            {artist.related.results.map((related: any, i: number) => (
                                <button
                                    key={related.browseId || i}
                                    type="button"
                                    onClick={() => related.browseId && router.push(`/artist/${related.browseId}`)}
                                    className="flex-shrink-0 w-32 text-center cursor-pointer group bg-transparent border-none p-0"
                                >
                                    <div className="w-32 h-32 rounded-full overflow-hidden bg-zinc-800 mb-2 mx-auto">
                                        {related.thumbnails?.[0]?.url && (
                                            <Image src={related.thumbnails[0].url} alt={related.title} fill className="object-cover group-hover:scale-105 transition-transform" unoptimized />
                                        )}
                                    </div>
                                    <h3 className="text-white font-medium text-sm truncate">{related.title}</h3>
                                    <p className="text-zinc-500 text-xs">{related.subscribers}</p>
                                </button>
                            ))}
                        </div>
                    </section >
                )
            }
        </div >
    );
}
