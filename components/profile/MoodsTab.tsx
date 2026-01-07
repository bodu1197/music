"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import useSWR from "swr";
import { usePlayer } from "@/contexts/PlayerContext";
import { Play, Loader2, ChevronRight, Music, ChevronLeft, AlertCircle } from "lucide-react";
import { getMoods, getMoodPlaylists } from "@/lib/data";
import { Country } from "@/lib/constants";
import type { MoodCategory, MoodPlaylist } from "@/types/music";

interface MoodsTabProps {
    country: Country;
}

export function MoodsTab({ country }: Readonly<MoodsTabProps>) {
    const [selectedCategory, setSelectedCategory] = useState<{ title: string; params: string } | null>(null);
    const { toggleQueue, isQueueOpen, playYouTubePlaylist } = usePlayer();

    // 🔥 lib/data.ts 통합 함수 사용 (Supabase 캐시 → API fallback)
    const { data: moodsAllData, error: moodsError, isLoading: moodsLoading } = useSWR<Record<string, MoodCategory[]> | null>(
        ["/moods", country.code, country.lang],
        () => getMoods(country.code, country.lang) as Promise<Record<string, MoodCategory[]> | null>,
        { revalidateOnFocus: false }
    );

    // 선택된 카테고리의 플레이리스트
    const { data: playlistsData, error: playlistsError, isLoading: playlistsLoading } = useSWR<MoodPlaylist[] | null>(
        selectedCategory ? ["/moods/playlists", selectedCategory.params, country.code, country.lang] : null,
        () => getMoodPlaylists(selectedCategory!.params, country.code, country.lang) as Promise<MoodPlaylist[] | null>,
        { revalidateOnFocus: false }
    );

    // 국가 변경 시 선택 초기화
    useEffect(() => {
        setSelectedCategory(null);
    }, [country.code]);

    // 플레이리스트 클릭 → YouTube iFrame API 직접 재생
    const handlePlaylistClick = (playlistId: string) => {
        console.log("[MoodsTab] 🎵 Playing playlist:", playlistId);

        if (playYouTubePlaylist) {
            playYouTubePlaylist(playlistId);
        }

        if (!isQueueOpen) toggleQueue();
    };

    // 플레이리스트 목록 렌더링
    const renderPlaylistsContent = () => {
        if (playlistsLoading) {
            return (
                <div className="text-center text-zinc-500 py-10 flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p>Loading playlists...</p>
                </div>
            );
        }

        if (playlistsError) {
            return (
                <div className="text-center text-red-500 py-10 flex flex-col items-center gap-2">
                    <AlertCircle className="w-8 h-8" />
                    <p>Error: {playlistsError.message}</p>
                </div>
            );
        }

        if (!playlistsData || playlistsData.length === 0) {
            return (
                <div className="text-center text-zinc-500 py-10 flex flex-col items-center gap-2">
                    <AlertCircle className="w-8 h-8" />
                    <p>No playlists available for this category.</p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {playlistsData.map((playlist: MoodPlaylist, i: number) => (
                    <button
                        key={playlist.playlistId || i}
                        type="button"
                        className="bg-zinc-900 rounded-lg overflow-hidden cursor-pointer hover:bg-zinc-800 transition-colors group text-left w-full border-none p-0 block"
                        onClick={() => playlist.playlistId && handlePlaylistClick(playlist.playlistId)}
                    >
                        <div className="relative aspect-square">
                            {playlist.thumbnails && playlist.thumbnails.length > 0 && (
                                <Image
                                    src={playlist.thumbnails.at(-1)?.url || "/images/default-album.svg"}
                                    alt={playlist.title}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Play className="w-8 h-8 text-white fill-current" />
                            </div>
                        </div>
                        <div className="p-2">
                            <h3 className="font-medium text-white text-xs truncate">{playlist.title}</h3>
                        </div>
                    </button>
                ))}
            </div>
        );
    };

    if (moodsLoading) {
        return (
            <div className="py-20 text-center text-zinc-500 animate-pulse">
                Loading Moods & Genres...
            </div>
        );
    }

    if (moodsError) {
        return (
            <div className="py-20 text-center text-red-500">
                Error: {moodsError.message}
            </div>
        );
    }

    return (
        <div className="space-y-6 px-4">
            {selectedCategory ? (
                <div className="space-y-4">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className="text-zinc-400 hover:text-white flex items-center gap-1 transition-colors text-sm"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                    </button>

                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Music className="w-5 h-5" />
                        {selectedCategory.title}
                    </h2>

                    {renderPlaylistsContent()}
                </div>
            ) : (
                <div className="space-y-6">
                    {moodsAllData && Object.entries(moodsAllData).map(([sectionTitle, categories]) => (
                        <section key={sectionTitle}>
                            <h2 className="text-sm font-bold text-white mb-3">{sectionTitle}</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                                {categories.map((cat, i) => (
                                    <button
                                        key={cat.params || i}
                                        onClick={() => setSelectedCategory({ title: cat.title, params: cat.params })}
                                        className="bg-gradient-to-br from-zinc-800 to-zinc-900 hover:from-zinc-700 hover:to-zinc-800 rounded-lg p-3 text-left transition-all group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-white text-sm">{cat.title}</span>
                                            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
}
