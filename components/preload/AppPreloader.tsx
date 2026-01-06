"use client";

import { useEffect, useRef } from "react";
import { preload } from "swr";
import { api } from "@/lib/api";
import { DEFAULT_COUNTRY } from "@/lib/constants";
import type { MoodCategory } from "@/types/music";

export function AppPreloader() {
    const hasPreloaded = useRef(false);

    useEffect(() => {
        if (hasPreloaded.current) return;
        hasPreloaded.current = true;

        const countryCode = localStorage.getItem("user_country_code") || DEFAULT_COUNTRY.code;
        const countryLang = localStorage.getItem("user_country_lang") || DEFAULT_COUNTRY.lang;

        console.log("[Preloader] 🚀 Starting full preload on page access...");

        preloadMusicData(countryCode, countryLang);
        preloadChartsData(countryCode);
        preloadMoodsData(countryCode, countryLang);

        console.log("[Preloader] ✅ All tabs preloaded!");
    }, []);

    // This component renders nothing
    return null;
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


