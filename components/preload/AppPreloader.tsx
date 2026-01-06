"use client";

import { useEffect, useRef } from "react";
import { preload } from "swr";
import { getHome, getMoods } from "@/lib/data";
import { DEFAULT_COUNTRY } from "@/lib/constants";
import { getChartConfig } from "@/lib/charts-constants";
import { usePlayer } from "@/contexts/PlayerContext";

/**
 * 🔥 단순화된 AppPreloader
 * 
 * 역할:
 * 1. SWR 캐시 워밍 (페이지 전환 시 즉시 로딩)
 * 2. Chart 플레이리스트 준비 (하드코딩된 ID 사용)
 * 
 * 복잡한 프리페치 로직은 제거됨.
 * 모든 데이터는 클릭 시 lib/data.ts를 통해 가져옴.
 */
export function AppPreloader() {
    const hasPreloaded = useRef(false);
    const hasPreloadedCharts = useRef(false);
    const { preloadYouTubePlaylist, preparedPlaylistCount } = usePlayer();

    // SWR 캐시 워밍 (한 번만 실행)
    useEffect(() => {
        if (hasPreloaded.current) return;
        hasPreloaded.current = true;

        const countryCode = localStorage.getItem("user_country_code") || DEFAULT_COUNTRY.code;
        const countryLang = localStorage.getItem("user_country_lang") || DEFAULT_COUNTRY.lang;

        console.log("[Preloader] 🚀 Warming SWR cache...");

        // Home 데이터 프리로드 (SWR 캐시)
        preload(
            ["/music/home", countryCode, countryLang],
            () => getHome(100, countryCode, countryLang)
        );

        // Moods 데이터 프리로드 (SWR 캐시)
        preload(
            ["/moods", countryCode, countryLang],
            () => getMoods(countryCode, countryLang)
        );

        console.log("[Preloader] ✅ SWR cache warming started");
    }, []);

    // Chart 플레이리스트 준비 (하드코딩된 ID)
    useEffect(() => {
        if (hasPreloadedCharts.current) return;
        hasPreloadedCharts.current = true;

        const countryCode = localStorage.getItem("user_country_code") || DEFAULT_COUNTRY.code;
        const chartConfig = getChartConfig(countryCode);
        const chartPlaylists = [chartConfig.topSongs, chartConfig.topVideos, chartConfig.trending].filter((id): id is string => !!id);

        console.log("[Preloader] ⚡ Preparing chart playlists...");

        // 병렬로 즉시 처리
        Promise.all(chartPlaylists.map(id => preloadYouTubePlaylist(id)))
            .then(() => console.log("[Preloader] ✅ Charts ready!"));
    }, [preloadYouTubePlaylist]);

    // 상태 로깅
    useEffect(() => {
        if (preparedPlaylistCount > 0) {
            console.log(`[Preloader] 📊 Charts parked: ${preparedPlaylistCount}/3`);
        }
    }, [preparedPlaylistCount]);

    return null;
}
