"use client";

import { useEffect, useRef } from "react";
import { preload } from "swr";
import { api } from "@/lib/api";
import { DEFAULT_COUNTRY } from "@/lib/constants";
import { getChartConfig } from "@/lib/charts-constants";
import type { MoodCategory } from "@/types/music";

export function AppPreloader() {
    const hasPreloaded = useRef(false);

    useEffect(() => {
        if (hasPreloaded.current) return;
        hasPreloaded.current = true;

        async function preloadAllData() {
            // Get user's saved country
            const countryCode = localStorage.getItem("user_country_code") || DEFAULT_COUNTRY.code;
            const countryLang = localStorage.getItem("user_country_lang") || DEFAULT_COUNTRY.lang;

            console.log("[Preloader] 🚀 Starting full preload on page access...");

            // ============================================
            // 1. Music Tab - Home Feed
            // ============================================
            preload(
                ["/music/home/cached", countryCode, countryLang],
                () => api.music.homeCached(100, countryCode, countryLang)
            );

            // ============================================
            // 2. Charts Tab - All chart playlists
            // ============================================
            const chartConfig = getChartConfig(countryCode);
            const chartPlaylists = [chartConfig.topSongs, chartConfig.topVideos, chartConfig.trending].filter(Boolean);

            chartPlaylists.forEach(playlistId => {
                if (playlistId) {
                    preload(
                        ["/playlist", playlistId, 200],
                        () => api.music.playlist(playlistId, 200)
                    );
                }
            });

            // Charts artists data
            preload(
                ["/api/charts", countryCode],
                () => api.music.chartsCached(countryCode)
            );

            // ============================================
            // 3. Moods Tab - Categories + ALL playlists
            // ============================================
            try {
                // First, get moods categories
                const moodsData = await api.music.moodsAll(countryCode, countryLang);

                if (moodsData && typeof moodsData === 'object') {
                    // Preload ALL category playlists
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

            console.log("[Preloader] ✅ All tabs preloaded!");
        }

        // Start preloading immediately on page access
        preloadAllData();
    }, []);

    // This component renders nothing
    return null;
}
