import { SUPPORTED_COUNTRIES, YTMUSICAPI_SUPPORTED_LOCATIONS, DEFAULT_COUNTRY, getCountryInfo, Country } from "@/lib/constants";

export async function detectAndSetCountry(): Promise<Country> {
    const savedCode = localStorage.getItem("user_country_code");
    const savedLang = localStorage.getItem("user_country_lang");
    const savedTime = localStorage.getItem("user_country_detected_at");

    const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    const isCacheValid = savedTime && (Date.now() - Number.parseInt(savedTime, 10)) < CACHE_DURATION;

    // Use cached value only if within 24 hours (supports all 109 ytmusicapi countries)
    if (savedCode && savedLang && isCacheValid) {
        const countryInfo = getCountryInfo(savedCode);
        if (countryInfo) return countryInfo;
    }

    // Always detect fresh IP
    try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        if (data.country_code) {
            // Check if country is supported by ytmusicapi (109 countries)
            if (YTMUSICAPI_SUPPORTED_LOCATIONS.has(data.country_code)) {
                const countryInfo = getCountryInfo(data.country_code);
                if (countryInfo) {
                    localStorage.setItem("user_country_code", countryInfo.code);
                    localStorage.setItem("user_country_lang", countryInfo.lang);
                    localStorage.setItem("user_country_name", countryInfo.name);
                    localStorage.setItem("user_country_detected_at", Date.now().toString());
                    return countryInfo;
                }
            }
            // Country not in ytmusicapi supported list, use Global
            const global = SUPPORTED_COUNTRIES.find(c => c.code === "ZZ")!;
            localStorage.setItem("user_country_code", global.code);
            localStorage.setItem("user_country_lang", global.lang);
            localStorage.setItem("user_country_name", global.name);
            localStorage.setItem("user_country_detected_at", Date.now().toString());
            return global;
        }
    } catch (e) {
        console.error("IP Detect failed:", e);
        // On error, use cached value if exists
        if (savedCode && savedLang) {
            const countryInfo = getCountryInfo(savedCode);
            if (countryInfo) return countryInfo;
        }
    }

    return DEFAULT_COUNTRY;
}
