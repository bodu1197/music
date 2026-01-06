"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { usePlayer, Track } from "@/contexts/PlayerContext";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { Play, Loader2 } from "lucide-react";
import { getHome, getAlbum, extractTracksFromAlbum } from "@/lib/data";
import type { HomeSectionContent, HomeSection, Artist, AlbumTrack, AlbumData } from "@/types/music";

interface MusicTabProps {
    country: { code: string; name: string; lang: string };
}

// Convert API item to Track
function itemToTrack(item: HomeSectionContent): Track | null {
    if (!item.videoId) return null;
    return {
        videoId: item.videoId,
        title: item.title || "Unknown",
        artist: item.artists?.map((a: Artist) => a.name).join(", ") || "Unknown Artist",
        thumbnail: item.thumbnails?.at(-1)?.url || "/images/default-album.svg",
    };
}

// Convert album track to Track
function albumTrackToTrack(track: AlbumTrack, albumInfo: AlbumData): Track | null {
    if (!track.videoId) return null;
    return {
        videoId: track.videoId,
        title: track.title || "Unknown",
        artist: track.artists?.map((a: Artist) => a.name).join(", ") || albumInfo?.artists?.map((a: Artist) => a.name).join(", ") || "Unknown Artist",
        thumbnail: albumInfo?.thumbnails?.at(-1)?.url || "/images/default-album.svg",
        album: albumInfo?.title,
    };
}

export function MusicTab({ country }: Readonly<MusicTabProps>) {
    const { setPlaylist, toggleQueue, isQueueOpen, playYouTubePlaylist } = usePlayer();
    const [loadingId, setLoadingId] = useState<string | null>(null);

    // 🔥 lib/data.ts의 통합 함수 사용 (Supabase 캐시 → API fallback)
    const { data, error, isLoading } = useSWR(
        ["/music/home", country.code, country.lang],
        () => getHome(100, country.code, country.lang),
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000,
            keepPreviousData: true,
        }
    );

    // 케이스 1: videoId 있음 → 섹션 전체가 플레이리스트
    const handleTrackClick = (sectionContents: HomeSectionContent[], clickedIndex: number) => {
        console.log("[MusicTab] Track clicked, index:", clickedIndex);

        const tracks: Track[] = sectionContents
            .map(itemToTrack)
            .filter((t): t is Track => t !== null);

        if (tracks.length === 0) return;

        const clickedItem = sectionContents[clickedIndex];
        const trackIndex = tracks.findIndex(t => t.videoId === clickedItem?.videoId);

        setPlaylist(tracks, Math.max(0, trackIndex));
        if (!isQueueOpen) toggleQueue();
    };

    // 케이스 2: browseId 있음 (앨범) → lib/data.ts 통합 함수 사용
    const handleAlbumClick = async (browseId: string) => {
        console.log("[MusicTab] Album clicked:", browseId);
        setLoadingId(browseId);

        try {
            // 🔥 통합 함수: Supabase 캐시 → API fallback
            const albumData = await getAlbum(browseId);

            if (!albumData) {
                console.warn("[MusicTab] Album not found:", browseId);
                setLoadingId(null);
                return;
            }

            // audioPlaylistId가 있으면 YouTube iFrame으로 즉시 재생
            if (albumData.audioPlaylistId && playYouTubePlaylist) {
                console.log("[MusicTab] ⚡ YouTube iFrame 재생:", albumData.audioPlaylistId);
                playYouTubePlaylist(albumData.audioPlaylistId);
                setLoadingId(null);
                if (!isQueueOpen) toggleQueue();
                return;
            }

            // 트랙 추출 및 재생
            if (albumData.tracks && albumData.tracks.length > 0) {
                const tracks: Track[] = albumData.tracks
                    .map((t: AlbumTrack) => albumTrackToTrack(t, albumData))
                    .filter((t: Track | null): t is Track => t !== null);

                if (tracks.length > 0) {
                    setPlaylist(tracks, 0);
                    if (!isQueueOpen) toggleQueue();
                }
            }
        } catch (e) {
            console.error("[MusicTab] Album fetch error:", e);
        }

        setLoadingId(null);
    };

    // 케이스 3: playlistId 있음 → YouTube iFrame API 직접 재생
    const handlePlaylistClick = (playlistId: string) => {
        console.log("[MusicTab] Playlist clicked:", playlistId);

        if (playYouTubePlaylist) {
            playYouTubePlaylist(playlistId);
        }

        if (!isQueueOpen) toggleQueue();
    };

    // 통합 클릭 핸들러
    const handleItemClick = (item: HomeSectionContent, sectionContents: HomeSectionContent[], index: number) => {
        if (item.videoId) {
            handleTrackClick(sectionContents, index);
        } else if (item.browseId) {
            handleAlbumClick(item.browseId);
        } else if (item.playlistId) {
            handlePlaylistClick(item.playlistId);
        }
    };

    if (isLoading && !data) {
        return (
            <div className="py-20 text-center text-zinc-500 animate-pulse">
                Loading vibes for {country.name || country.code}...
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-20 text-center text-red-500">
                Error: {error.message || "Failed to load"}
            </div>
        );
    }

    const sections = Array.isArray(data) ? data : [];

    if (sections.length === 0) {
        return (
            <div className="py-20 text-center">
                <p className="text-zinc-400 mb-2">No music data found.</p>
                <p className="text-xs text-zinc-600">Try again later.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {sections.map((shelf: HomeSection, sIndex: number) => {
                if (!shelf?.contents?.length) return null;

                return (
                    <div key={`${shelf.title || 'shelf'}-${sIndex}`} className="mb-8 pl-1">
                        {shelf.title && (
                            <h2 className="mb-3 text-lg font-bold text-zinc-100">{shelf.title}</h2>
                        )}

                        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 pr-4">
                            {shelf.contents.map((item: HomeSectionContent, i: number) => {
                                if (!item) return null;

                                const title = item.title || "No Title";
                                const subtitle = item.artists
                                    ? item.artists.map((a: Artist) => a.name).join(", ")
                                    : item.subscribers || "";
                                const image = item.thumbnails?.at(-1)?.url || "/images/default-album.svg";
                                const isPlayable = !!(item.videoId || item.browseId || item.playlistId);
                                const isItemLoading = !!(loadingId && loadingId === item.browseId);

                                return (
                                    <button
                                        key={item.videoId || item.browseId || item.playlistId || `item-${sIndex}-${i}`}
                                        type="button"
                                        className="flex-none w-[140px] group cursor-pointer text-left bg-transparent border-none p-0"
                                        onClick={() => isPlayable && !isItemLoading && handleItemClick(item, shelf.contents, i)}
                                    >
                                        <div className="relative aspect-square w-full mb-2 bg-zinc-900 rounded-md overflow-hidden border border-zinc-800">
                                            <ImageWithFallback
                                                src={image}
                                                alt={title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                sizes="(max-width: 768px) 140px, 160px"
                                                fallbackSrc="/images/default-album.svg"
                                            />
                                            {isPlayable && (
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <div className="w-10 h-10 rounded-full bg-[#667eea] flex items-center justify-center shadow-lg">
                                                        {isItemLoading ? (
                                                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                                                        ) : (
                                                            <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {isItemLoading && (
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                    <div className="w-10 h-10 rounded-full bg-[#667eea] flex items-center justify-center shadow-lg">
                                                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-1">
                                            <h3 className="text-sm font-medium text-white line-clamp-2 leading-tight">
                                                {title}
                                            </h3>
                                            <p className="text-xs text-zinc-400 truncate">{subtitle}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
