"use client";

import { useEffect, useRef } from "react";
import { preload } from "swr";
import { api } from "@/lib/api";
import { DEFAULT_COUNTRY } from "@/lib/constants";
import { getChartConfig } from "@/lib/charts-constants";
import { usePlayer } from "@/contexts/PlayerContext";
import type { MoodCategory, HomeSection } from "@/types/music";

export function AppPreloader() {
    const hasPreloaded = useRef(false);
    const hasPreloadedPlaylists = useRef(false);
    const { preloadYouTubePlaylist, preparedPlaylistCount } = usePlayer();

    // 1. 일반 데이터 프리로드 (즉시)
    useEffect(() => {
        if (hasPreloaded.current) return;
        hasPreloaded.current = true;

        const countryCode = localStorage.getItem("user_country_code") || DEFAULT_COUNTRY.code;
        const countryLang = localStorage.getItem("user_country_lang") || DEFAULT_COUNTRY.lang;

        console.log("[Preloader] 🚀 Starting full preload on page access...");

        preloadMusicData(countryCode, countryLang);
        preloadChartsData(countryCode);
        preloadMoodsData(countryCode, countryLang);

        console.log("[Preloader] ✅ All tabs data preloaded!");
    }, []);

    // 2. 🔥 모든 탭 플레이리스트 미리 로드 (백엔드 API 사용으로 즉시 시작)
    useEffect(() => {
        if (hasPreloadedPlaylists.current) return;
        hasPreloadedPlaylists.current = true;

        const countryCode = localStorage.getItem("user_country_code") || DEFAULT_COUNTRY.code;
        const countryLang = localStorage.getItem("user_country_lang") || DEFAULT_COUNTRY.lang;

        console.log(`[Preloader] ⚡ Preloading ALL playlists for instant playback...`);

        // 백엔드 API 우선 사용으로 플레이어 준비 불필요
        preloadAllPlaylists(countryCode, countryLang, preloadYouTubePlaylist);
    }, [preloadYouTubePlaylist]);

    // 3. 프리로드 완료 상태 로깅
    useEffect(() => {
        if (preparedPlaylistCount > 0) {
            console.log(`[Preloader] 📊 Prepared playlists: ${preparedPlaylistCount}`);
        }
    }, [preparedPlaylistCount]);

    // This component renders nothing
    return null;
}

// 🔥 모든 탭의 플레이리스트 미리 로드 (병렬 처리로 최적화)
async function preloadAllPlaylists(
    countryCode: string,
    countryLang: string,
    preloadYouTubePlaylist: (playlistId: string) => Promise<void>
) {
    const allPlaylistIds: string[] = [];

    // 1. Chart 탭: 하드코딩된 플레이리스트 ID (우선순위 높음)
    const chartConfig = getChartConfig(countryCode);
    const chartPlaylists = [chartConfig.topSongs, chartConfig.topVideos, chartConfig.trending];
    allPlaylistIds.push(...chartPlaylists);
    console.log(`[Preloader] 📋 Chart playlists: 3`);

    // 2. Music 탭: Home 데이터에서 playlistId 추출
    try {
        const homeData = await api.music.homeCached(100, countryCode, countryLang);
        if (homeData && Array.isArray(homeData)) {
            (homeData as HomeSection[]).forEach(section => {
                section.contents?.forEach(item => {
                    if (item.playlistId && !allPlaylistIds.includes(item.playlistId)) {
                        allPlaylistIds.push(item.playlistId);
                    }
                });
            });
        }
        console.log(`[Preloader] 📋 Music tab playlists: ${allPlaylistIds.length - 3}`);
    } catch (e) {
        console.error("[Preloader] Music home data error:", e);
    }

    // 3. Moods 탭: Mood 플레이리스트에서 playlistId 추출
    try {
        const moodsData = await api.music.moodsAll(countryCode, countryLang);
        if (moodsData && typeof moodsData === 'object') {
            for (const categories of Object.values(moodsData)) {
                if (Array.isArray(categories)) {
                    for (const cat of categories as MoodCategory[]) {
                        if (cat.params) {
                            const playlists = await api.music.moodPlaylists(cat.params, countryCode, countryLang);
                            if (playlists && Array.isArray(playlists)) {
                                playlists.forEach((pl: { playlistId?: string }) => {
                                    if (pl.playlistId && !allPlaylistIds.includes(pl.playlistId)) {
                                        allPlaylistIds.push(pl.playlistId);
                                    }
                                });
                            }
                        }
                    }
                }
            }
        }
        console.log(`[Preloader] 📋 Total playlists to preload: ${allPlaylistIds.length}`);
    } catch (e) {
        console.error("[Preloader] Moods data error:", e);
    }

    // 4. 🚀 병렬 처리: 10개씩 동시 프리로드 (백엔드 API 사용으로 YouTube 의존성 없음)
    console.log(`[Preloader] 🔄 Starting PARALLEL playlist preload (${allPlaylistIds.length} playlists, 10 concurrent)...`);
    const startTime = Date.now();

    const BATCH_SIZE = 10;
    for (let i = 0; i < allPlaylistIds.length; i += BATCH_SIZE) {
        const batch = allPlaylistIds.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(playlistId => preloadYouTubePlaylist(playlistId)));
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Preloader] ✅ ALL ${allPlaylistIds.length} playlists preloaded in ${elapsed}s! Instant playback ready.`);
}

// 1. Preload Music Tab
function preloadMusicData(countryCode: string, countryLang: string) {
    preload(
        ["/music/home/cached", countryCode, countryLang],
        () => api.music.homeCached(100, countryCode, countryLang)
    );
}

// 2. Preload Charts Tab (artists only - playlists are loaded directly via YouTube iFrame API)
function preloadChartsData(countryCode: string) {
    // Charts playlists are played directly via YouTube iFrame API (playYouTubePlaylist)
    // so we only need to preload the artists data
    preload(
        ["/api/charts", countryCode],
        () => api.music.chartsCached(countryCode)
    );
}

// 3. Preload Moods Tab
async function preloadMoodsData(countryCode: string, countryLang: string) {
    try {
        const moodsData = await api.music.moodsAll(countryCode, countryLang);

        if (moodsData && typeof moodsData === 'object') {
            Object.values(moodsData).forEach((categories) => {
                if (Array.isArray(categories)) {
                    (categories as MoodCategory[]).forEach((cat) => {
                        if (cat.params) {
                            preload(
                                ["/moods/playlists", cat.params, countryCode, countryLang],
                                () => api.music.moodPlaylists(cat.params, countryCode, countryLang)
                            );
                        }
                    });
                }
            });
        }
    } catch (e) {
        console.error("[Preloader] Moods preload error:", e);
    }
}


