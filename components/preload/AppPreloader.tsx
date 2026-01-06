"use client";

import { useEffect, useRef } from "react";
import { preload } from "swr";
import { api } from "@/lib/api";
import { DEFAULT_COUNTRY } from "@/lib/constants";
import { getChartConfig } from "@/lib/charts-constants";
import { usePlayer } from "@/contexts/PlayerContext";
import { usePrefetch } from "@/contexts/PrefetchContext";
import type { MoodCategory, MoodPlaylist } from "@/types/music";

export function AppPreloader() {
    const hasPreloaded = useRef(false);
    const hasPreloadedPlaylists = useRef(false);
    const { preloadYouTubePlaylist, preparedPlaylistCount } = usePlayer();
    const { prefetchFromHomeData, prefetchPlaylist } = usePrefetch();

    // 1. 일반 데이터 프리로드 (SWR 캐시) + 홈 앨범 & 무드 플레이리스트 프리로드
    useEffect(() => {
        if (hasPreloaded.current) return;
        hasPreloaded.current = true;

        const countryCode = localStorage.getItem("user_country_code") || DEFAULT_COUNTRY.code;
        const countryLang = localStorage.getItem("user_country_lang") || DEFAULT_COUNTRY.lang;

        console.log("[Preloader] 🚀 Starting fast data preload...");

        // SWR 캐시 채우기
        preloadMusicData(countryCode, countryLang);
        preloadChartsData(countryCode);
        preloadMoodsData(countryCode, countryLang);

        // 🔥 1) 홈 데이터의 모든 앨범 프리로드 (Supabase 배치)
        console.log("[Preloader] ⚡ Fetching home data for album prefetch...");
        api.music.home(100, countryCode, countryLang)
            .then(data => {
                if (data && Array.isArray(data)) {
                    console.log(`[Preloader] 📦 Got home data, starting album prefetch...`);
                    prefetchFromHomeData(data);
                }
            })
            .catch(err => console.error("[Preloader] Home prefetch error:", err));

        // 🔥 2) Moods의 모든 플레이리스트 프리페치 (고속 처리)
        console.log("[Preloader] ⚡ Fetching moods data for playlist prefetch...");
        safeFetchMoodsAndPrefetchPlaylists(countryCode, countryLang, prefetchPlaylist);

    }, [prefetchFromHomeData, prefetchPlaylist]);

    // 2. 🔥 Chart 플레이리스트 "미리 박아두기"
    useEffect(() => {
        if (hasPreloadedPlaylists.current) return;
        hasPreloadedPlaylists.current = true;

        const countryCode = localStorage.getItem("user_country_code") || DEFAULT_COUNTRY.code;

        console.log(`[Preloader] ⚡ Parking Chart playlists into player memory...`);
        preloadChartPlaylists(countryCode, preloadYouTubePlaylist);
    }, [preloadYouTubePlaylist]);

    // 3. 상태 로깅
    useEffect(() => {
        if (preparedPlaylistCount > 0) {
            console.log(`[Preloader] 📊 Charts parked: ${preparedPlaylistCount}/3`);
        }
    }, [preparedPlaylistCount]);

    return null;
}

// 🔥 Moods 탭의 모든 플레이리스트 데이터 미리 다운로드 (Optimized Concurrency)
async function safeFetchMoodsAndPrefetchPlaylists(
    countryCode: string,
    countryLang: string,
    prefetchPlaylist: (id: string) => Promise<any>
) {
    try {
        const moodsData = await api.music.moods(countryCode, countryLang);
        if (!moodsData || typeof moodsData !== 'object') return;

        // 1. 모든 카테고리 파라미터 수집
        const categoriesToFetch: { title: string, params: string }[] = [];
        Object.values(moodsData).forEach((categories) => {
            if (Array.isArray(categories)) {
                (categories as MoodCategory[]).forEach((cat) => {
                    if (cat.params) {
                        categoriesToFetch.push({ title: cat.title, params: cat.params });
                    }
                });
            }
        });

        console.log(`[Preloader] Found ${categoriesToFetch.length} mood categories. Fetching playlists...`);

        // 2. 카테고리별로 플레이리스트 목록 가져오기 (동시성 제한: 6개씩)
        const CONCURRENCY_LIMIT = 6;

        for (let i = 0; i < categoriesToFetch.length; i += CONCURRENCY_LIMIT) {
            const batch = categoriesToFetch.slice(i, i + CONCURRENCY_LIMIT);

            await Promise.allSettled(batch.map(async (cat) => {
                try {
                    const playlists = await api.music.moodPlaylists(cat.params, countryCode, countryLang);
                    if (Array.isArray(playlists)) {
                        // 3. 플레이리스트 상세 프리페치 (내부 아이템 순차 처리로 안전 확보)
                        for (const pl of playlists) {
                            if (pl?.playlistId) {
                                await prefetchPlaylist(pl.playlistId);
                                // 딜레이 제거
                            }
                        }
                    }
                } catch (e) {
                    console.warn(`[Preloader] Failed to load playlists for ${cat.title}`);
                }
            }));

            // 딜레이 제거
        }

        console.log(`[Preloader] ✅ All mood playlists prefetch queue finished.`);

    } catch (e) {
        console.error("[Preloader] Moods prefetch error:", e);
    }
}

// 1. Preload Music Tab
function preloadMusicData(countryCode: string, countryLang: string) {
    preload(
        ["/music/home/cached", countryCode, countryLang],
        () => api.music.homeCached(100, countryCode, countryLang)
    );
}

// 2. Preload Charts Tab
function preloadChartsData(countryCode: string) {
    // 차트는 ID가 하드코딩되어 있어 별도 프리로드 불필요하지만,
    // 아티스트 데이터를 위해 미리 호출해둠 (SWR 캐시)
    preload(
        ["/api/charts", countryCode],
        () => api.music.chartsCached(countryCode)
    );
}

// 3. Preload Moods Tab
async function preloadMoodsData(countryCode: string, countryLang: string) {
    try {
        // Mood Categories 호출 (Supabase 캐시 사용)
        const moodsData = await api.music.moods(countryCode, countryLang);

        if (moodsData && typeof moodsData === 'object') {
            Object.values(moodsData).forEach((categories) => {
                if (Array.isArray(categories)) {
                    (categories as MoodCategory[]).forEach((cat) => {
                        if (cat.params) {
                            // 각 무드별 플레이리스트 미리 로드 (SWR 캐시)
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

// 🔥 Chart 플레이리스트만 미리 로드 (3개)
async function preloadChartPlaylists(
    countryCode: string,
    preloadYouTubePlaylist: (playlistId: string) => Promise<void>
) {
    const chartConfig = getChartConfig(countryCode);
    const chartPlaylists = [chartConfig.topSongs, chartConfig.topVideos, chartConfig.trending].filter((id): id is string => !!id);

    const startTime = Date.now();

    // 병렬로 즉시 처리 - 플레이어 메모리에 "박아둠"
    await Promise.all(chartPlaylists.map(playlistId => preloadYouTubePlaylist(playlistId)));

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Preloader] ✅ Charts ready in ${elapsed}s!`);
}
