"use client";

import { useState, useEffect } from "react";
import { Search, Music2, TrendingUp, Sparkles } from "lucide-react";
import { SearchTab } from "@/components/profile/SearchTab";
import { MusicTab } from "@/components/profile/MusicTab";
import { ChartsTab } from "@/components/profile/ChartsTab";
import { MoodsTab } from "@/components/profile/MoodsTab";
import { CountrySelector } from "@/components/profile/CountrySelector";
import { DEFAULT_COUNTRY, SUPPORTED_COUNTRIES, YTMUSICAPI_SUPPORTED_LOCATIONS, getCountryInfo, Country } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function MusicPage() {
    const [activeTab, setActiveTab] = useState("music");
    const [currentCountry, setCurrentCountry] = useState<Country | null>(null);
    const [chartsCountry, setChartsCountry] = useState<Country | null>(null);

    // Initial Country Detection
    useEffect(() => {
        async function detect() {
            const savedCode = localStorage.getItem("user_country_code");
            const savedLang = localStorage.getItem("user_country_lang");
            const savedName = localStorage.getItem("user_country_name");

            const VALID_LANGS = ["ko", "hi", "it", "de", "tr", "en", "pt", "cs", "zh_CN", "ja", "es", "ru", "fr", "nl", "ar", "ur", "zh_TW"];
            const isValidLang = savedLang && VALID_LANGS.includes(savedLang);

            if (savedCode && isValidLang) {
                // Use getCountryInfo to support all 109 ytmusicapi countries
                const countryInfo = getCountryInfo(savedCode);
                setCurrentCountry(countryInfo || { code: savedCode, lang: savedLang, name: savedName || savedCode });
                return;
            }

            if (savedCode && !isValidLang) {
                localStorage.removeItem("user_country_code");
                localStorage.removeItem("user_country_lang");
                localStorage.removeItem("user_country_name");
            }

            try {
                const res = await fetch("https://ipapi.co/json/");
                const data = await res.json();
                if (data.country_code) {
                    // Check if country is supported by ytmusicapi (109 countries)
                    if (YTMUSICAPI_SUPPORTED_LOCATIONS.has(data.country_code)) {
                        const countryInfo = getCountryInfo(data.country_code);
                        if (countryInfo) {
                            setCurrentCountry(countryInfo);
                            localStorage.setItem("user_country_code", countryInfo.code);
                            localStorage.setItem("user_country_lang", countryInfo.lang);
                            localStorage.setItem("user_country_name", countryInfo.name);
                            return;
                        }
                    }
                    // Fallback to Global only if country not in ytmusicapi supported locations
                    const global = SUPPORTED_COUNTRIES.find(c => c.code === "ZZ")!;
                    setCurrentCountry(global);
                    localStorage.setItem("user_country_code", global.code);
                    localStorage.setItem("user_country_lang", global.lang);
                    localStorage.setItem("user_country_name", global.name);
                    return;
                }
            } catch (e) {
                console.error("IP Detect failed:", e);
            }

            setCurrentCountry(DEFAULT_COUNTRY);
        }

        detect();
    }, []);

    const handleChartsCountryChange = (c: Country) => {
        setChartsCountry(c);
    };

    // Get Charts-compatible country (62 countries only)
    // If currentCountry is not in SUPPORTED_COUNTRIES, fallback to Global
    const getChartsCompatibleCountry = (country: Country): Country => {
        const isChartsSupported = SUPPORTED_COUNTRIES.some(c => c.code === country.code);
        if (isChartsSupported) return country;
        // Fallback to Global for countries not supported by Charts
        return SUPPORTED_COUNTRIES.find(c => c.code === "ZZ")!;
    };

    const tabs = [
        { id: "search", icon: Search, label: "SEARCH" },
        { id: "music", icon: Music2, label: "MUSIC" },
        { id: "charts", icon: TrendingUp, label: "CHARTS" },
        { id: "moods", icon: Sparkles, label: "MOODS" },
    ];

    return (
        <div className="max-w-5xl mx-auto py-8 px-4">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text">
                    Music
                </h1>
                <p className="text-zinc-400 mt-2">Discover trending music, charts, and moods</p>
            </div>

            {/* Tabs */}
            <div className="border-b border-zinc-800 mb-6">
                <div className="flex gap-8">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    if (tab.id === "charts" && currentCountry) {
                                        // Use Charts-compatible country (62 countries only)
                                        setChartsCountry(getChartsCompatibleCountry(currentCountry));
                                    }
                                }}
                                className={cn(
                                    "flex items-center gap-2 py-4 text-sm font-semibold tracking-wide border-b-2 transition-colors",
                                    isActive
                                        ? "border-purple-500 text-white"
                                        : "border-transparent text-zinc-500 hover:text-zinc-300"
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content Area */}
            <div className="mt-4">
                {activeTab === "search" && <SearchTab />}

                {activeTab === "music" && (
                    <div className="flex flex-col">
                        {currentCountry ? (
                            <MusicTab country={currentCountry} />
                        ) : (
                            <div className="py-20 text-center text-zinc-500 animate-pulse">
                                Detecting your location...
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "charts" && (
                    <div className="flex flex-col">
                        {chartsCountry || currentCountry ? (
                            <>
                                <div className="flex justify-end mb-4">
                                    <CountrySelector
                                        value={chartsCountry || getChartsCompatibleCountry(currentCountry!)}
                                        onChange={handleChartsCountryChange}
                                    />
                                </div>
                                <ChartsTab country={chartsCountry || getChartsCompatibleCountry(currentCountry!)} />
                            </>
                        ) : (
                            <div className="py-20 text-center text-zinc-500 animate-pulse">
                                Detecting your location...
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "moods" && (
                    <div className="flex flex-col">
                        {currentCountry ? (
                            <MoodsTab country={currentCountry} />
                        ) : (
                            <div className="py-20 text-center text-zinc-500 animate-pulse">
                                Detecting your location...
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
