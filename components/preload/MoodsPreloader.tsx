"use client";

import { useEffect, useRef } from "react";
import { preload } from "swr";
import { api } from "@/lib/api";
import { DEFAULT_COUNTRY } from "@/lib/constants";

export function MoodsPreloader() {
    const hasPreloaded = useRef(false);

    useEffect(() => {
        if (hasPreloaded.current) return;
        hasPreloaded.current = true;

        async function preloadAllData() {
            // Get user's saved country (supports ANY country)
            const countryCode = localStorage.getItem("user_country_code") || DEFAULT_COUNTRY.code;
            const countryLang = localStorage.getItem("user_country_lang") || DEFAULT_COUNTRY.lang;

            // Preload all data in parallel (single requests each, server-cached)
            // These are fast because they hit Vercel's edge cache after first request
            preload(
                ["/moods/all", countryCode, countryLang],
                () => api.music.moodsAll(countryCode, countryLang)
            );

            preload(
                ["/music/home/cached", countryCode, countryLang],
                () => api.music.homeCached(100, countryCode, countryLang)
            );

            preload(
                ["/charts/cached", countryCode, countryLang],
                () => api.music.chartsCached(countryCode)
            );
        }

        // Start preloading after a short delay to not block initial page render
        const timer = setTimeout(preloadAllData, 500);
        return () => clearTimeout(timer);
    }, []);

    // This component renders nothing
    return null;
}
