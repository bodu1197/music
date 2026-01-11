import { SUPPORTED_COUNTRIES, YTMUSICAPI_SUPPORTED_LOCATIONS, DEFAULT_COUNTRY, getCountryInfo, Country } from "@/lib/constants";

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function saveCountryToStorage(country: Country): void {
    localStorage.setItem("user_country_code", country.code);
    localStorage.setItem("user_country_lang", country.lang);
    localStorage.setItem("user_country_name", country.name);
    localStorage.setItem("user_country_detected_at", Date.now().toString());
}

function getCachedCountry(): Country | null {
    const savedCode = localStorage.getItem("user_country_code");
    const savedLang = localStorage.getItem("user_country_lang");
    const savedTime = localStorage.getItem("user_country_detected_at");

    if (!savedCode || !savedLang) return null;

    const isCacheValid = savedTime && (Date.now() - Number.parseInt(savedTime, 10)) < CACHE_DURATION;
    if (!isCacheValid) return null;

    return getCountryInfo(savedCode);
}

function getGlobalCountry(): Country {
    return SUPPORTED_COUNTRIES.find(c => c.code === "ZZ")!;
}

async function detectCountryFromIP(): Promise<Country | null> {
    try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();

        if (!data.country_code) return null;

        if (YTMUSICAPI_SUPPORTED_LOCATIONS.has(data.country_code)) {
            return getCountryInfo(data.country_code);
        }

        return getGlobalCountry();
    } catch (e) {
        console.error("IP Detect failed:", e);
        return null;
    }
}

export async function detectAndSetCountry(): Promise<Country> {
    // Try cached value first
    const cached = getCachedCountry();
    if (cached) return cached;

    // Detect from IP
    const detected = await detectCountryFromIP();
    if (detected) {
        saveCountryToStorage(detected);
        return detected;
    }

    // Fallback to cached without time check
    const savedCode = localStorage.getItem("user_country_code");
    if (savedCode) {
        const countryInfo = getCountryInfo(savedCode);
        if (countryInfo) return countryInfo;
    }

    return DEFAULT_COUNTRY;
}

