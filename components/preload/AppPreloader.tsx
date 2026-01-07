"use client";

import { useEffect, useRef } from "react";
import { preload } from "swr";
import { getHome, getMoods } from "@/lib/data";
import { DEFAULT_COUNTRY } from "@/lib/constants";

/**
 * 🔥 단순화된 AppPreloader
 * 
 * 역할:
 * 1. SWR 캐시 워밍 (페이지 전환 시 즉시 로딩)
 * 
 * 차트는 하드코딩된 ID로 YouTube iFrame API가 직접 처리함.
 */
export function AppPreloader() {
    const hasPreloaded = useRef(false);

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

    return null;
}
