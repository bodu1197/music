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

        console.log("[Preloader] 🚀 Starting aggressive data preload...");

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

        // 🔥 2) Moods의 모든 플레이리스트 프리페치 (Supabase 캐시 사용)
        console.log("[Preloader] ⚡ Fetching moods data for playlist prefetch...");
        fetchMoodsAndPrefetchPlaylists(countryCode, countryLang, prefetchPlaylist);

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

// 🔥 Moods 탭의 모든 플레이리스트 데이터 미리 다운로드
async function fetchMoodsAndPrefetchPlaylists(
    countryCode: string,
    countryLang: string,
    prefetchPlaylist: (id: string) => Promise<any>
) {
    try {
        // Mood Categories 호출 (Supabase 캐시 사용)
        const moodsData = await api.music.moods(countryCode, countryLang);

        if (!moodsData || typeof moodsData !== 'object') return;

        const playlistIds = new Set<string>();

        // 모든 카테고리 순회하며 playlistId 수집
        // 현재 moodsData 구조: { "Moods & Moments": [...], "Genres": [...] }
        Object.values(moodsData).forEach((categories) => {
            if (Array.isArray(categories)) {
                (categories as MoodCategory[]).forEach((cat) => {
                    // 각 카테고리의 플레이리스트 목록을 가져오기엔 너무 많으므로(API 호출 필요),
                    // 여기서는 '목록' API 호출은 SWR preload로 하고 (위에서 함),
                    // 만약 카테고리 안에 이미 플레이리스트 정보가 있다면 수집.
                    // *API 구조상 moods()는 카테고리만 줌. moodPlaylists()를 호출해야 함.*

                    if (cat.params) {
                        // 각 카테고리의 플레이리스트 목록을 비동기로 가져와서 내부 트랙까지 프리페치
                        api.music.moodPlaylists(cat.params, countryCode, countryLang)
                            .then((playlists) => {
                                if (Array.isArray(playlists)) {
                                    console.log(`[Preloader] Found ${playlists.length} playlists in mood category: ${cat.title}`);
                                    playlists.forEach((pl: MoodPlaylist) => {
                                        if (pl.playlistId) {
                                            // 🔥 각 플레이리스트의 상세 정보(트랙 포함) 프리페치
                                            prefetchPlaylist(pl.playlistId);
                                        }
                                    });
                                }
                            })
                            .catch(e => console.warn(`Failed to load mood playlists for ${cat.title}`));
                    }
                });
            }
        });
    } catch (e) {
        console.error("[Preloader] Moods prefetch error:", e);
    }
}

// ... (나머지 함수들은 그대로)

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

// ... (하단 헬퍼 함수들은 그대로 유지)
function preloadMusicData(countryCode: string, countryLang: string) {
    preload(
        ["/music/home/cached", countryCode, countryLang],
        () => api.music.homeCached(100, countryCode, countryLang)
    );
}

function preloadChartsData(countryCode: string) {
    preload(
        ["/api/charts", countryCode],
        () => api.music.chartsCached(countryCode)
    );
}

async function preloadMoodsData(countryCode: string, countryLang: string) {
    try {
        const moodsData = await api.music.moods(countryCode, countryLang);
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


