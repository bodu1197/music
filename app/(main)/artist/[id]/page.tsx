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
        <div className="min-h-screen bg-[linear-gradient(135deg,#0f0f23_0%,#1a1a2e_100%)] pb-20">
            {/* Hero Section */}
            <div className="relative w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#667eea]/10 to-transparent pointer-events-none" />
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20 relative z-10">
                    {/* Back Button */}
                    {/* Back Button */}
                    <button onClick={() => router.back()} className="flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors group">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        Back
                    </button>

                    {/* Artist Header */}
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-8 md:gap-12">
                        {/* Thumbnail */}
                        <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden shadow-2xl border-4 border-white/10 flex-shrink-0 relative group">
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10" />
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
                            <p className="text-sm text-[#667eea] font-bold uppercase tracking-widest mb-2">Artist</p>
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{artist.name}</h1>
                            {artist.subscribers && (
                                <p className="text-zinc-400 mb-2">{artist.subscribers} subscribers</p>
                            )}
                            {artist.views && (
                                <p className="text-zinc-500 text-sm mb-4">{artist.views}</p>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                <button
                                    onClick={handlePlayAll}
                                    className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:shadow-lg hover:shadow-[#667eea]/25 text-white font-bold rounded-full transition-all hover:scale-105"
                                >
                                    <Play className="w-5 h-5 fill-current" />
                                    Play
                                </button>
                                {artist.shuffleId && (
                                    <button className="flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold rounded-full transition-all hover:scale-105 backdrop-blur-sm">
                                        <Shuffle className="w-5 h-5" />
                                        Shuffle
                                    </button>
                                )}
                                {artist.radioId && (
                                    <button className="flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold rounded-full transition-all hover:scale-105 backdrop-blur-sm">
                                        <Radio className="w-5 h-5" />
                                        Radio
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* End Hero Wrapper */}

            <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-12">

                {/* Description */}
                {artist.description && (
                    <div className="mb-12 p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
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
                                    className="flex items-center gap-1 px-4 py-2 text-sm bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 rounded-full transition-all"
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
                                    className="w-full flex items-center gap-4 p-4 hover:bg-white/5 border border-transparent hover:border-white/10 rounded-xl cursor-pointer group text-left transition-all"
                                >
                                    <span className="w-6 text-center text-zinc-500 group-hover:hidden font-mono">{i + 1}</span>
                                    <Play className="w-4 h-4 text-[#667eea] hidden group-hover:block" />
                                    <div className="w-12 h-12 bg-white/5 rounded-lg overflow-hidden flex-shrink-0 relative">
                                        {song.thumbnails?.[0]?.url && (
                                            <Image src={song.thumbnails[0].url} alt={song.title} fill className="object-cover" unoptimized />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-medium truncate group-hover:text-[#667eea] transition-colors">{song.title}</h3>
                                        <p className="text-sm text-zinc-400 truncate">
                                            {song.album?.name || ""}
                                        </p>
                                    </div>
                                    <span className="text-zinc-500 text-sm font-mono">{song.duration}</span>
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
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                {displayAlbums.map((album: any, i: number) => (
                                    <button
                                        key={album.browseId || i}
                                        type="button"
                                        onClick={() => album.browseId && handlePlayAlbum(album.browseId)}
                                        className="group cursor-pointer text-left w-full"
                                    >
                                        <div className="relative aspect-square mb-3 bg-white/5 rounded-xl overflow-hidden shadow-lg border border-white/5 group-hover:border-white/10 transition-all">
                                            {album.thumbnails?.[0]?.url && (
                                                <Image src={album.thumbnails[0].url} alt={album.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                                            )}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                {playingId === album.browseId ? (
                                                    <Loader2 className="w-12 h-12 text-white animate-spin" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-[#667eea] flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform">
                                                        <Play className="w-6 h-6 text-white fill-current ml-1" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <h3 className="text-white font-bold text-sm truncate group-hover:text-[#667eea] transition-colors">{album.title}</h3>
                                        <p className="text-zinc-500 text-xs mt-1">{album.year}</p>
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
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                {displaySingles.map((single: any, i: number) => (
                                    <button
                                        key={single.browseId || i}
                                        type="button"
                                        onClick={() => single.browseId && handlePlayAlbum(single.browseId)}
                                        className="group cursor-pointer text-left w-full"
                                    >
                                        <div className="relative aspect-square mb-3 bg-white/5 rounded-xl overflow-hidden shadow-lg border border-white/5 group-hover:border-white/10 transition-all">
                                            {single.thumbnails?.[0]?.url && (
                                                <Image src={single.thumbnails[0].url} alt={single.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                                            )}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                {playingId === single.browseId ? (
                                                    <Loader2 className="w-12 h-12 text-white animate-spin" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-[#667eea] flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform">
                                                        <Play className="w-6 h-6 text-white fill-current ml-1" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <h3 className="text-white font-bold text-sm truncate group-hover:text-[#667eea] transition-colors">{single.title}</h3>
                                        <p className="text-zinc-500 text-xs mt-1">{single.year}</p>
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {artist.videos.results.map((video: any, i: number) => (
                                    <button
                                        key={video.videoId || i}
                                        type="button"
                                        onClick={() => handlePlaySong(video)}
                                        className="w-full flex gap-4 p-3 hover:bg-zinc-800 rounded-lg cursor-pointer group text-left"
                                    >
                                        <div className="relative w-full aspect-video bg-white/5 rounded-xl overflow-hidden shadow-lg border border-white/5 group-hover:border-white/10 transition-all">
                                            {video.thumbnails?.[0]?.url && (
                                                <Image src={video.thumbnails[0].url} alt={video.title} fill className="object-cover" unoptimized />
                                            )}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                <div className="w-12 h-12 rounded-full bg-[#667eea] flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform">
                                                    <Play className="w-6 h-6 text-white fill-current ml-1" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-3">
                                            <h3 className="text-white font-bold line-clamp-2 leading-tight group-hover:text-[#667eea] transition-colors">{video.title}</h3>
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
                                        <div className="w-32 h-32 rounded-full overflow-hidden bg-zinc-800 mb-2 mx-auto relative">
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
        </div>
    );
}
