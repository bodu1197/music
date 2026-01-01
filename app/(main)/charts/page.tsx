"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { usePlayer, Track } from "@/contexts/PlayerContext";
import { Play, Loader2, TrendingUp, Music, User, Disc, Globe } from "lucide-react";

// 전체 국가 목록 (61개국 + Global)
const COUNTRIES = [
    { code: "ZZ", name: "🌍 Global", lang: "en" },
    { code: "AR", name: "🇦🇷 Argentina", lang: "es" },
    { code: "AU", name: "🇦🇺 Australia", lang: "en" },
    { code: "AT", name: "🇦🇹 Austria", lang: "de" },
    { code: "BE", name: "🇧🇪 Belgium", lang: "nl" },
    { code: "BO", name: "🇧🇴 Bolivia", lang: "es" },
    { code: "BR", name: "🇧🇷 Brazil", lang: "pt" },
    { code: "CA", name: "🇨🇦 Canada", lang: "en" },
    { code: "CL", name: "🇨🇱 Chile", lang: "es" },
    { code: "CO", name: "🇨🇴 Colombia", lang: "es" },
    { code: "CR", name: "🇨🇷 Costa Rica", lang: "es" },
    { code: "CZ", name: "🇨🇿 Czech Republic", lang: "cs" },
    { code: "DK", name: "🇩🇰 Denmark", lang: "en" },
    { code: "DO", name: "🇩🇴 Dominican Republic", lang: "es" },
    { code: "EC", name: "🇪🇨 Ecuador", lang: "es" },
    { code: "EG", name: "🇪🇬 Egypt", lang: "ar" },
    { code: "SV", name: "🇸🇻 El Salvador", lang: "es" },
    { code: "FI", name: "🇫🇮 Finland", lang: "en" },
    { code: "FR", name: "🇫🇷 France", lang: "fr" },
    { code: "DE", name: "🇩🇪 Germany", lang: "de" },
    { code: "GR", name: "🇬🇷 Greece", lang: "en" },
    { code: "GT", name: "🇬🇹 Guatemala", lang: "es" },
    { code: "HN", name: "🇭🇳 Honduras", lang: "es" },
    { code: "HU", name: "🇭🇺 Hungary", lang: "en" },
    { code: "IN", name: "🇮🇳 India", lang: "hi" },
    { code: "ID", name: "🇮🇩 Indonesia", lang: "en" },
    { code: "IE", name: "🇮🇪 Ireland", lang: "en" },
    { code: "IL", name: "🇮🇱 Israel", lang: "en" },
    { code: "IT", name: "🇮🇹 Italy", lang: "it" },
    { code: "JP", name: "🇯🇵 Japan", lang: "ja" },
    { code: "KE", name: "🇰🇪 Kenya", lang: "en" },
    { code: "MY", name: "🇲🇾 Malaysia", lang: "en" },
    { code: "MX", name: "🇲🇽 Mexico", lang: "es" },
    { code: "NL", name: "🇳🇱 Netherlands", lang: "nl" },
    { code: "NZ", name: "🇳🇿 New Zealand", lang: "en" },
    { code: "NI", name: "🇳🇮 Nicaragua", lang: "es" },
    { code: "NG", name: "🇳🇬 Nigeria", lang: "en" },
    { code: "NO", name: "🇳🇴 Norway", lang: "en" },
    { code: "PK", name: "🇵🇰 Pakistan", lang: "ur" },
    { code: "PA", name: "🇵🇦 Panama", lang: "es" },
    { code: "PY", name: "🇵🇾 Paraguay", lang: "es" },
    { code: "PE", name: "🇵🇪 Peru", lang: "es" },
    { code: "PH", name: "🇵🇭 Philippines", lang: "en" },
    { code: "PL", name: "🇵🇱 Poland", lang: "en" },
    { code: "PT", name: "🇵🇹 Portugal", lang: "pt" },
    { code: "RO", name: "🇷🇴 Romania", lang: "en" },
    { code: "RU", name: "🇷🇺 Russia", lang: "ru" },
    { code: "SA", name: "🇸🇦 Saudi Arabia", lang: "ar" },
    { code: "SG", name: "🇸🇬 Singapore", lang: "en" },
    { code: "ZA", name: "🇿🇦 South Africa", lang: "en" },
    { code: "KR", name: "🇰🇷 South Korea", lang: "ko" },
    { code: "ES", name: "🇪🇸 Spain", lang: "es" },
    { code: "SE", name: "🇸🇪 Sweden", lang: "en" },
    { code: "CH", name: "🇨🇭 Switzerland", lang: "de" },
    { code: "TW", name: "🇹🇼 Taiwan", lang: "zh_TW" },
    { code: "TH", name: "🇹🇭 Thailand", lang: "en" },
    { code: "TR", name: "🇹🇷 Turkey", lang: "tr" },
    { code: "UG", name: "🇺🇬 Uganda", lang: "en" },
    { code: "UA", name: "🇺🇦 Ukraine", lang: "en" },
    { code: "AE", name: "🇦🇪 UAE", lang: "ar" },
    { code: "GB", name: "🇬🇧 United Kingdom", lang: "en" },
    { code: "US", name: "🇺🇸 United States", lang: "en" },
    { code: "UY", name: "🇺🇾 Uruguay", lang: "es" },
    { code: "VE", name: "🇻🇪 Venezuela", lang: "es" },
    { code: "VN", name: "🇻🇳 Vietnam", lang: "en" },
    { code: "ZW", name: "🇿🇼 Zimbabwe", lang: "en" },
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

// artist song to Track
function artistSongToTrack(song: any, artistName: string): Track | null {
    if (!song.videoId) return null;
    return {
        videoId: song.videoId,
        title: song.title || "Unknown",
        artist: song.artists?.map((a: any) => a.name).join(", ") || artistName,
        thumbnail: song.thumbnails?.[song.thumbnails.length - 1]?.url || "/images/default-album.svg",
        album: song.album?.name,
    };
}

export default function ChartsPage() {
    const [country, setCountry] = useState(COUNTRIES[0]); // Default to Global
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [detectedCountry, setDetectedCountry] = useState<string | null>(null);
    const { setPlaylist, toggleQueue, isQueueOpen } = usePlayer();

    // IP 기반 국가 감지
    useEffect(() => {
        async function detectCountry() {
            try {
                const res = await fetch("https://ipapi.co/json/");
                const data = await res.json();
                const countryCode = data.country_code;

                // 지원하는 국가인지 확인
                const found = COUNTRIES.find(c => c.code === countryCode);
                if (found) {
                    setCountry(found);
                    setDetectedCountry(countryCode);
                } else {
                    // 지원하지 않는 국가 → Global
                    setCountry(COUNTRIES[0]); // ZZ (Global)
                    setDetectedCountry(countryCode);
                }
            } catch (e) {
                console.log("[Charts] IP detection failed, using Global");
                setCountry(COUNTRIES[0]);
            }
        }
        detectCountry();
    }, []);

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

    // 아티스트 클릭 핸들러
    const handleArtistClick = async (browseId: string, artistName: string) => {
        console.log("[Charts] Artist clicked:", browseId);
        setLoadingId(browseId);

        try {
            const artistData = await api.music.artist(browseId);
            console.log("[Charts] Artist data:", artistData);

            // songs.results 또는 videos.results에서 트랙 추출
            let tracks: Track[] = [];

            if (artistData?.songs?.results) {
                tracks = artistData.songs.results
                    .map((s: any) => artistSongToTrack(s, artistName))
                    .filter((t: Track | null): t is Track => t !== null);
            }

            // songs가 없으면 videos에서 시도
            if (tracks.length === 0 && artistData?.videos?.results) {
                tracks = artistData.videos.results
                    .map((v: any) => ({
                        videoId: v.videoId,
                        title: v.title || "Unknown",
                        artist: artistName,
                        thumbnail: v.thumbnails?.[v.thumbnails.length - 1]?.url || "/images/default-album.svg",
                    }))
                    .filter((t: any): t is Track => t.videoId);
            }

            console.log("[Charts] Artist tracks:", tracks.length);

            if (tracks.length > 0) {
                setPlaylist(tracks, 0);
                if (!isQueueOpen) toggleQueue();
            } else {
                console.log("[Charts] No playable tracks for artist");
            }
        } catch (e) {
            console.error("[Charts] Error loading artist:", e);
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-6 h-6" />
                    Charts
                </h1>

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

            {/* Videos Section */}
            {data?.videos && data.videos.length > 0 && (
                <section>
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Music className="w-5 h-5" />
                        Trending Videos
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.videos.map((item: any, i: number) => {
                            const isItemLoading = !!(loadingId && loadingId === item.playlistId);
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
                            const isItemLoading = !!(loadingId && loadingId === item.playlistId);
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
                        {data.artists.map((artist: any, i: number) => {
                            const isItemLoading = !!(loadingId && loadingId === artist.browseId);
                            return (
                                <div
                                    key={artist.browseId || i}
                                    className="text-center group cursor-pointer"
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
                                        {/* Play overlay for artists */}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                                            {isItemLoading ? (
                                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                                            ) : (
                                                <Play className="w-8 h-8 text-white fill-current" />
                                            )}
                                        </div>
                                    </div>
                                    <h3 className="text-xs font-medium text-white truncate">{artist.title}</h3>
                                    <p className="text-xs text-zinc-500">{artist.subscribers}</p>
                                </div>
                            );
                        })}
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
