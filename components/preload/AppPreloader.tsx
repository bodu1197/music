"use client";

import { useEffect, useRef } from "react";
import { preload } from "swr";
import { api } from "@/lib/api";
import { DEFAULT_COUNTRY } from "@/lib/constants";
import { getChartConfig } from "@/lib/charts-constants";
import { usePlayer } from "@/contexts/PlayerContext";
import type { MoodCategory } from "@/types/music";

export function AppPreloader() {
    const hasPreloaded = useRef(false);
    const hasPreloadedPlaylists = useRef(false);
    const { preloadYouTubePlaylist, preparedPlaylistCount } = usePlayer();

    // 1. 일반 데이터 프리로드 (즉시) - SWR 캐시용
    useEffect(() => {
        if (hasPreloaded.current) return;
        hasPreloaded.current = true;

        const countryCode = localStorage.getItem("user_country_code") || DEFAULT_COUNTRY.code;
        const countryLang = localStorage.getItem("user_country_lang") || DEFAULT_COUNTRY.lang;

        console.log("[Preloader] 🚀 Starting data preload...");

        // SWR 캐시만 미리 채움 (빠름)
        preloadMusicData(countryCode, countryLang);
        preloadChartsData(countryCode);
        preloadMoodsData(countryCode, countryLang);

        console.log("[Preloader] ✅ SWR data preloaded!");
    }, []);

    // 2. 🔥 Chart 플레이리스트만 미리 로드 (3개뿐 - 즉시 완료)
    useEffect(() => {
        if (hasPreloadedPlaylists.current) return;
        hasPreloadedPlaylists.current = true;

        const countryCode = localStorage.getItem("user_country_code") || DEFAULT_COUNTRY.code;

        console.log(`[Preloader] ⚡ Preloading Chart playlists only (fast)...`);

        // Chart 탭만 preload (3개 - 빠름)
        preloadChartPlaylists(countryCode, preloadYouTubePlaylist);
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

// 🔥 Chart 플레이리스트만 미리 로드 (3개뿐 - 즉시 완료)
async function preloadChartPlaylists(
    countryCode: string,
    preloadYouTubePlaylist: (playlistId: string) => Promise<void>
) {
    const chartConfig = getChartConfig(countryCode);
    // Filter out undefined (trending is optional for Global)
    const chartPlaylists = [chartConfig.topSongs, chartConfig.topVideos, chartConfig.trending].filter((id): id is string => !!id);

    console.log(`[Preloader] 📋 Preloading ${chartPlaylists.length} chart playlists...`);
    const startTime = Date.now();

    // 병렬로 즉시 처리
    await Promise.all(chartPlaylists.map(playlistId => preloadYouTubePlaylist(playlistId)));

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Preloader] ✅ Chart playlists preloaded in ${elapsed}s!`);
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


