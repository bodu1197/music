"use client";


import { Settings, Grid, Bookmark, UserSquare2, Music2, TrendingUp, Sparkles, Search } from "lucide-react";
import { SearchTab } from "@/components/profile/SearchTab";
import { MusicTab } from "@/components/profile/MusicTab";
import { ChartsTab } from "@/components/profile/ChartsTab";
import { MoodsTab } from "@/components/profile/MoodsTab";
import { CountrySelector } from "@/components/profile/CountrySelector";
import { DEFAULT_COUNTRY, SUPPORTED_COUNTRIES, Country } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

export default function ProfilePage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("posts");
    const [currentCountry, setCurrentCountry] = useState<Country | null>(null);
    // Charts tab temporary country (resets when leaving tab)
    const [chartsCountry, setChartsCountry] = useState<Country | null>(null);

    // Initial Country Detection - supports ALL countries
    useEffect(() => {
        async function detect() {
            // 1. Check localStorage
            const savedCode = localStorage.getItem("user_country_code");
            const savedLang = localStorage.getItem("user_country_lang");
            const savedName = localStorage.getItem("user_country_name");

            // Validate saved language is supported by ytmusicapi
            const VALID_LANGS = ["ko", "hi", "it", "de", "tr", "en", "pt", "cs", "zh_CN", "ja", "es", "ru", "fr", "nl", "ar", "ur", "zh_TW"];
            const isValidLang = savedLang && VALID_LANGS.includes(savedLang);

            if (savedCode && isValidLang) {
                // Try to find in popular list first, otherwise use saved values
                const found = SUPPORTED_COUNTRIES.find(c => c.code === savedCode);
                setCurrentCountry(found || {
                    code: savedCode,
                    lang: savedLang,
                    name: savedName || savedCode
                });
                return;
            }

            // Clear invalid saved data
            if (savedCode && !isValidLang) {
                localStorage.removeItem("user_country_code");
                localStorage.removeItem("user_country_lang");
                localStorage.removeItem("user_country_name");
            }

            // 2. IP Detection - only use countries with chart support
            try {
                const res = await fetch("https://ipapi.co/json/");
                const data = await res.json();
                if (data.country_code) {
                    // Check if country has chart support
                    const found = SUPPORTED_COUNTRIES.find(c => c.code === data.country_code);
                    if (found) {
                        setCurrentCountry(found);
                        localStorage.setItem("user_country_code", found.code);
                        localStorage.setItem("user_country_lang", found.lang);
                        localStorage.setItem("user_country_name", found.name);
                        return;
                    }
                    // Unsupported countries → Global charts
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

            // 3. Fallback
            setCurrentCountry(DEFAULT_COUNTRY);
        }

        detect();
    }, []);

    // Preloading is now handled by AppPreloader in the layout
    // (runs on homepage access, server-cached, single request each)



    // Charts tab country change (temporary, not saved to localStorage)
    const handleChartsCountryChange = (c: Country) => {
        setChartsCountry(c);
    };

    const tabs = [
        { id: "posts", icon: Grid, label: "POSTS" },
        { id: "search", icon: Search, label: "SEARCH" },
        { id: "music", icon: Music2, label: "MUSIC" },
        { id: "charts", icon: TrendingUp, label: "CHARTS" },
        { id: "moods", icon: Sparkles, label: "MOODS" },
        { id: "saved", icon: Bookmark, label: "SAVED" },
        { id: "tagged", icon: UserSquare2, label: "TAGGED" },
    ];

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-16 mb-12">
                <div className="w-24 h-24 md:w-36 md:h-36 rounded-full bg-zinc-800 flex-shrink-0 relative overflow-hidden">
                    {/* Placeholder for avatar */}
                    <div className="w-full h-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-[2px]">
                        <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                            <span className="text-4xl">👤</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                        <h1 className="text-xl font-normal">{user?.user_metadata?.username || "username"}</h1>
                        <div className="flex gap-2">
                            <Button variant="secondary" className="h-8 text-sm font-semibold bg-zinc-800 hover:bg-zinc-700 text-white">
                                Edit profile
                            </Button>
                            <Button variant="secondary" className="h-8 text-sm font-semibold bg-zinc-800 hover:bg-zinc-700 text-white">
                                View archive
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 text-white p-0">
                                <Settings className="w-6 h-6" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex justify-center md:justify-start gap-8 mb-4 text-sm">
                        <div className="text-center md:text-left">
                            <span className="font-bold">0</span> posts
                        </div>
                        <div className="text-center md:text-left">
                            <span className="font-bold">0</span> followers
                        </div>
                        <div className="text-center md:text-left">
                            <span className="font-bold">0</span> following
                        </div>
                    </div>

                    <div className="text-center md:text-left text-sm">
                        <div className="font-bold">{user?.user_metadata?.full_name || "Full Name"}</div>
                        <div className="text-zinc-300 whitespace-pre-wrap">
                            Music Lover 🎵
                            Global Vibe 🌍
                        </div>
                    </div>
                </div>
            </div>

            {/* Highlights (Placeholder) */}
            <div className="flex gap-4 mb-12 overflow-x-auto pb-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex flex-col items-center gap-1 min-w-[70px]">
                        <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700" />
                        <span className="text-xs">Highlight</span>
                    </div>
                ))}
                <div className="flex flex-col items-center gap-1 min-w-[70px]">
                    <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                        <span className="text-2xl">+</span>
                    </div>
                    <span className="text-xs">New</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-t border-zinc-800">
                <div className="flex justify-center gap-12">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    if (tab.id === "charts" && currentCountry) {
                                        setChartsCountry(currentCountry);
                                    }
                                }}
                                className={cn(
                                    "flex items-center gap-2 h-12 text-xs font-semibold tracking-widest border-t transition-colors",
                                    isActive ? "border-white text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
                                )}
                            >
                                <Icon className="w-3 h-3" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content Area */}
            <div className="mt-4">
                {activeTab === "posts" && (
                    <div className="grid grid-cols-3 gap-1">
                        <div className="col-span-3 py-20 flex flex-col items-center justify-center text-zinc-500">
                            <div className="w-16 h-16 border-2 border-zinc-800 rounded-full flex items-center justify-center mb-4">
                                <Grid className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Share Photos</h2>
                            <p className="mb-4">When you share photos, they will appear on your profile.</p>
                            <Button variant="ghost" className="text-blue-400 font-bold p-0 hover:bg-transparent hover:text-blue-300">Share your first photo</Button>
                        </div>
                    </div>
                )}

                {activeTab === "search" && (
                    <SearchTab />
                )}

                {activeTab === "music" && (
                    <div className="flex flex-col">
                        {currentCountry ? (
                            <MusicTab country={currentCountry} />
                        ) : (
                            <div className="py-20 text-center text-zinc-500 animate-pulse">Detecting your location...</div>
                        )}
                    </div>
                )}

                {activeTab === "charts" && (
                    <div className="flex flex-col">
                        {chartsCountry ? (
                            <>
                                <div className="flex justify-end px-4 mb-2">
                                    <CountrySelector value={chartsCountry} onChange={handleChartsCountryChange} />
                                </div>
                                <ChartsTab country={chartsCountry} />
                            </>
                        ) : (
                            <div className="py-20 text-center text-zinc-500 animate-pulse">Detecting your location...</div>
                        )}
                    </div>
                )}

                {activeTab === "moods" && (
                    <div className="flex flex-col">
                        {currentCountry ? (
                            <MoodsTab country={currentCountry} />
                        ) : (
                            <div className="py-20 text-center text-zinc-500 animate-pulse">Detecting your location...</div>
                        )}
                    </div>
                )}

                {(activeTab === "saved" || activeTab === "tagged") && (
                    <div className="py-20 text-center text-zinc-500">
                        <p>No content yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
