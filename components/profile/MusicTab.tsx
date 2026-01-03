"use client";

import { useState } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { usePlayer, Track } from "@/contexts/PlayerContext";
import { Play, Loader2 } from "lucide-react";
import type { HomeSectionContent, HomeSection, Artist, AlbumData, AlbumTrack, WatchTrack } from "@/types/music";

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
        thumbnail: item.thumbnails?.[item.thumbnails.length - 1]?.url || "/images/default-album.svg",
    };
}

// Convert album track to Track
function albumTrackToTrack(track: AlbumTrack, albumInfo: AlbumData): Track | null {
    if (!track.videoId) return null;
    return {
        videoId: track.videoId,
        title: track.title || "Unknown",
        artist: track.artists?.map((a: Artist) => a.name).join(", ") || albumInfo?.artists?.map((a: Artist) => a.name).join(", ") || "Unknown Artist",
        thumbnail: albumInfo?.thumbnails?.[albumInfo.thumbnails.length - 1]?.url || "/images/default-album.svg",
        album: albumInfo?.title,
    };
}

// Convert playlist track to Track (watch API 응답용)
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

export function MusicTab({ country }: MusicTabProps) {
    const { setPlaylist, toggleQueue, isQueueOpen } = usePlayer();
    const [loadingId, setLoadingId] = useState<string | null>(null); // browseId 또는 playlistId

    const { data, error, isLoading } = useSWR(
        ["/music/home/cached", country.code, country.lang],
        () => api.music.homeCached(100, country.code, country.lang),
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000,
            keepPreviousData: true,
        }
    );

    // 케이스 1: 배너 1개 = videoId 1개 → 섹션 전체가 플레이리스트
    const handleTrackClick = (sectionContents: HomeSectionContent[], clickedIndex: number) => {
        console.log("[MusicTab] Track clicked, index:", clickedIndex);

        // Convert all items with videoId to tracks
        const tracks: Track[] = sectionContents
            .map(itemToTrack)
            .filter((t): t is Track => t !== null);

        console.log("[MusicTab] Converted tracks:", tracks.length, "items");

        if (tracks.length === 0) {
            console.log("[MusicTab] No playable tracks found");
            return;
        }

        // Find the actual index in the filtered array
        const clickedItem = sectionContents[clickedIndex];
        const trackIndex = tracks.findIndex(t => t.videoId === clickedItem?.videoId);

        console.log("[MusicTab] Setting playlist, starting at index:", trackIndex);

        // Set playlist starting from clicked track
        setPlaylist(tracks, trackIndex >= 0 ? trackIndex : 0);

        // Open queue sidebar
        if (!isQueueOpen) {
            toggleQueue();
        }
    };

    // 케이스 2: browseId 있음 (앨범/싱글) → album API 호출
    const handleAlbumClick = async (browseId: string) => {
        console.log("[MusicTab] Album clicked, browseId:", browseId);
        setLoadingId(browseId);

        try {
            const albumData = await api.music.album(browseId);
            console.log("[MusicTab] Album data:", albumData);

            if (!albumData?.tracks || albumData.tracks.length === 0) {
                console.log("[MusicTab] No tracks in album");
                return;
            }

            // Convert album tracks to Track format
            const tracks: Track[] = albumData.tracks
                .map((t: AlbumTrack) => albumTrackToTrack(t, albumData))
                .filter((t: Track | null): t is Track => t !== null);

            console.log("[MusicTab] Album tracks:", tracks.length, "items");

            if (tracks.length === 0) {
                console.log("[MusicTab] No playable tracks in album");
                return;
            }

            // Set playlist starting from first track
            setPlaylist(tracks, 0);

            // Open queue sidebar
            if (!isQueueOpen) {
                toggleQueue();
            }
        } catch (e) {
            console.error("[MusicTab] Error loading album:", e);
        } finally {
            setLoadingId(null);
        }
    };

    // 케이스 3: playlistId 있음 → watch API 호출
    const handlePlaylistClick = async (playlistId: string) => {
        console.log("[MusicTab] Playlist clicked, playlistId:", playlistId);
        setLoadingId(playlistId);

        try {
            const playlistData = await api.music.watch(undefined, playlistId);
            console.log("[MusicTab] Playlist data:", playlistData);

            if (!playlistData?.tracks || playlistData.tracks.length === 0) {
                console.log("[MusicTab] No tracks in playlist");
                return;
            }

            // Convert playlist tracks to Track format
            const tracks: Track[] = playlistData.tracks
                .map((t: WatchTrack) => playlistTrackToTrack(t))
                .filter((t: Track | null): t is Track => t !== null);

            console.log("[MusicTab] Playlist tracks:", tracks.length, "items");

            if (tracks.length === 0) {
                console.log("[MusicTab] No playable tracks in playlist");
                return;
            }

            // Set playlist starting from first track
            setPlaylist(tracks, 0);

            // Open queue sidebar
            if (!isQueueOpen) {
                toggleQueue();
            }
        } catch (e) {
            console.error("[MusicTab] Error loading playlist:", e);
        } finally {
            setLoadingId(null);
        }
    };

    // 클릭 핸들러 - 자동 감지: videoId, browseId, playlistId
    const handleItemClick = (item: HomeSectionContent, sectionContents: HomeSectionContent[], index: number) => {
        if (item.videoId) {
            // 케이스 1: videoId 있음 → 섹션 전체가 플레이리스트
            handleTrackClick(sectionContents, index);
        } else if (item.browseId) {
            // 케이스 2: browseId 있음 (앨범/싱글) → album API
            handleAlbumClick(item.browseId);
        } else if (item.playlistId) {
            // 케이스 3: playlistId 있음 → watch API
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
                // 데이터 절대 자르지 않음 - 빈 shelf만 건너뜀
                if (!shelf || !shelf.contents || !Array.isArray(shelf.contents) || shelf.contents.length === 0) return null;

                return (
                    <div key={`${shelf.title || 'shelf'}-${sIndex}`} className="mb-8 pl-1">
                        {/* Section Title */}
                        {shelf.title && (
                            <h2 className="mb-3 text-lg font-bold text-zinc-100">{shelf.title}</h2>
                        )}

                        {/* Horizontal Scroll Container */}
                        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 pr-4">
                            {shelf.contents.map((item: HomeSectionContent, i: number) => {
                                if (!item) return null;

                                const title = item.title || "No Title";
                                const subtitle = item.artists
                                    ? item.artists.map((a: Artist) => a.name).join(", ")
                                    : item.subscribers || "";
                                const image = item.thumbnails
                                    ? item.thumbnails[item.thumbnails.length - 1].url
                                    : "/images/default-album.svg";

                                // videoId, browseId, playlistId 중 하나라도 있으면 재생 가능
                                const isPlayable = !!(item.videoId || item.browseId || item.playlistId);
                                // loadingId가 있을 때만 비교 (null === null 버그 방지)
                                const isItemLoading = !!(loadingId && (loadingId === item.browseId || loadingId === item.playlistId));

                                return (
                                    <button
                                        key={item.videoId || item.browseId || item.playlistId || `item-${sIndex}-${i}`}
                                        type="button"
                                        className="flex-none w-[140px] group cursor-pointer text-left bg-transparent border-none p-0"
                                        onClick={() => isPlayable && !isItemLoading && handleItemClick(item, shelf.contents, i)}
                                    >
                                        {/* Image with play overlay */}
                                        <div className="relative aspect-square w-full mb-2 bg-zinc-900 rounded-md overflow-hidden border border-zinc-800">
                                            <img
                                                src={image}
                                                alt={title}
                                                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                                            />
                                            {/* Play overlay on hover */}
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
                                            {/* Loading state overlay */}
                                            {isItemLoading && (
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                    <div className="w-10 h-10 rounded-full bg-[#667eea] flex items-center justify-center shadow-lg">
                                                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Text Info */}
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
