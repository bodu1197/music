"use client";

import { useEffect, useRef } from "react";
import { preload } from "swr";
import { api } from "@/lib/api";
import { SUPPORTED_COUNTRIES, DEFAULT_COUNTRY } from "@/lib/constants";

export function MoodsPreloader() {
    const hasPreloaded = useRef(false);

    useEffect(() => {
        if (hasPreloaded.current) return;
        hasPreloaded.current = true;

        async function preloadAllData() {
            // Get user's country preference or detect
            let countryCode = localStorage.getItem("user_country_code");
            let country = SUPPORTED_COUNTRIES.find(c => c.code === countryCode) || DEFAULT_COUNTRY;

            // Preload all data in parallel (single requests each, server-cached)
            // These are fast because they hit Vercel's edge cache after first request
            preload(
                ["/moods/all", country.code, country.lang],
                () => api.music.moodsAll(country.code, country.lang)
            );

            preload(
                ["/music/home/cached", country.code, country.lang],
                () => api.music.homeCached(100, country.code, country.lang)
            );

            preload(
                ["/charts/cached", country.code, country.lang],
                () => api.music.chartsCached(country.code)
            );
        }

        // Start preloading after a short delay to not block initial page render
        const timer = setTimeout(preloadAllData, 500);
        return () => clearTimeout(timer);
    }, []);

    // This component renders nothing
    return null;
}
