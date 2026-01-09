"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Loader2, Music, Video, Disc, User, ListMusic, Brain, ArrowRight } from "lucide-react";
import { usePlayer, Track } from "@/contexts/PlayerContext";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { SearchResult, Artist, AlbumTrack, WatchTrack } from "@/types/music";
import { ChartsTab } from "@/components/profile/ChartsTab";
import { MoodsTab } from "@/components/profile/MoodsTab";
import { MusicTab } from "@/components/profile/MusicTab";
import { CountrySelector } from "@/components/profile/CountrySelector";
import { SUPPORTED_COUNTRIES, YTMUSICAPI_SUPPORTED_LOCATIONS, DEFAULT_COUNTRY, getCountryInfo, Country } from "@/lib/constants";



const SEARCH_FILTERS = [
    { id: null, label: "All", icon: Search },
    { id: "songs", label: "Songs", icon: Music },
    { id: "videos", label: "Videos", icon: Video },
    { id: "albums", label: "Albums", icon: Disc },
    { id: "artists", label: "Artists", icon: User },
    { id: "playlists", label: "Playlists", icon: ListMusic },
];

interface FilterTabsProps {
    readonly filter: string | null;
    readonly onFilterChange: (id: string | null) => void;
}

function FilterTabs({ filter, onFilterChange }: FilterTabsProps) {
    return (
        <div className="w-full px-4 md:px-8 mb-6 overflow-x-auto">
            <div className="flex gap-2 pb-2">
                {SEARCH_FILTERS.map((f) => {
                    const Icon = f.icon;
                    const isActive = filter === f.id;
                    return (
                        <button
                            key={f.id || "all"}
                            type="button"
                            onClick={() => onFilterChange(f.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border border-[rgba(255,255,255,0.1)]",
                                isActive
                                    ? "bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white border-transparent"
                                    : "bg-[rgba(255,255,255,0.05)] text-white/80 hover:bg-[rgba(102,126,234,0.2)] hover:border-[#667eea] hover:text-white"
                            )}
                        >
                            <Icon className="w-4 h-4" />{f.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

interface SearchInputProps {
    readonly query: string;
    readonly setQuery: (val: string) => void;
    readonly onSearch: (q: string) => void;
    readonly isLoading: boolean;
    readonly suggestions: string[];
    readonly showSuggestions: boolean;
    readonly setShowSuggestions: (show: boolean) => void;
    readonly isSuggestionsLoading: boolean;
    readonly inputRef: React.RefObject<HTMLInputElement | null>;
    readonly suggestionsRef: React.RefObject<HTMLDivElement | null>;
}

function SearchInput({
    query,
    setQuery,
    onSearch,
    isLoading,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    isSuggestionsLoading,
    inputRef,
    suggestionsRef
}: SearchInputProps) {
    return (
        <div className="max-w-2xl mx-auto relative" ref={suggestionsRef}>
            <div className="relative flex items-center">
                <Brain className="absolute left-4 w-5 h-5 text-[#667eea] z-10" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={(e) => e.key === "Enter" && onSearch(query)}
                    placeholder="Search for songs, artists, albums..."
                    className="w-full py-4 pl-12 pr-14 bg-[rgba(255,255,255,0.08)] border-2 border-[rgba(255,255,255,0.1)] rounded-[24px] text-white placeholder:text-white/50 focus:outline-none focus:border-[#667eea] focus:bg-[rgba(255,255,255,0.12)] transition-all"
                />
                <button
                    type="button"
                    onClick={() => onSearch(query)}
                    disabled={isLoading || !query.trim()}
                    className="absolute right-2 w-10 h-10 flex items-center justify-center bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full transition-all hover:scale-105 hover:shadow-lg disabled:opacity-50 border-none cursor-pointer"
                >
                    {isLoading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <ArrowRight className="w-5 h-5 text-white" />}
                </button>
            </div>

            {/* Suggestions */}
            {showSuggestions && query.length >= 2 && (
                <div className="absolute w-full mt-2 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                    {isSuggestionsLoading && (
                        <div className="p-4 text-center text-muted-foreground">
                            <Loader2 className="w-5 h-5 animate-spin inline" />
                        </div>
                    )}
                    {!isSuggestionsLoading && suggestions.length > 0 && (
                        <ul>
                            {suggestions.slice(0, 8).map((s) => (
                                <li key={s}>
                                    <button
                                        type="button"
                                        className="w-full px-4 py-3 text-left text-foreground hover:bg-accent flex items-center gap-3"
                                        onClick={() => { setQuery(s); onSearch(s); }}
                                    >
                                        <Search className="w-4 h-4 text-muted-foreground" />{s}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                    {!isSuggestionsLoading && suggestions.length === 0 && (
                        <div className="p-4 text-center text-muted-foreground">No suggestions</div>
                    )}
                </div>
            )}
        </div>
    );
}

interface SearchResultsProps {
    readonly results: SearchResult[];
    readonly isLoading: boolean;
    readonly hasSearched: boolean;
    readonly error: string | null;
    readonly query: string;
    readonly onItemClick: (item: SearchResult) => void;
    readonly getResultIcon: (type: string) => React.ReactNode;
}

function SearchResults({
    results,
    isLoading,
    hasSearched,
    error,
    query,
    onItemClick,
    getResultIcon
}: SearchResultsProps) {
    if (error) {
        return <div className="w-full px-4 md:px-8 mb-6"><div className="p-4 bg-destructive/20 border border-destructive/50 rounded-xl text-destructive-foreground">Error: {error}</div></div>;
    }

    if (!isLoading && results.length === 0 && hasSearched) {
        return <div className="py-20 text-center text-muted-foreground">No results found for &quot;{query}&quot;</div>;
    }

    return (
        <div className="w-full px-4 md:px-8 pb-32">
            {results.length > 0 && <div className="mb-4 text-zinc-400 text-sm">Found {results.length} results</div>}
            <div className="space-y-2">
                {results.map((item, i) => (
                    <button key={item.videoId || item.browseId || `result-${i}`} type="button" onClick={() => onItemClick(item)} className="w-full flex items-center gap-4 p-4 bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.1)] rounded-xl cursor-pointer group text-left transition-all">
                        <div className="w-14 h-14 flex-shrink-0 bg-secondary rounded-lg overflow-hidden relative">
                            {item.thumbnails?.[0]?.url ? <Image src={item.thumbnails[0].url} alt={item.title || ""} fill className="object-cover" unoptimized /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground">{getResultIcon(item.resultType)}</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1"><span className="text-[#667eea]">{getResultIcon(item.resultType)}</span><span className="text-xs text-[#667eea] uppercase font-medium">{item.resultType}</span></div>
                            <h3 className="text-white font-medium truncate group-hover:text-[#667eea]">{item.title || item.artist}</h3>
                            <p className="text-sm text-white/60 truncate">{item.artists?.map((a: Artist) => a.name).join(", ") || ""}{item.duration && ` • ${item.duration}`}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

function SearchPageContent() {
    // URL Tab state
    const searchParams = useSearchParams();
    const tab = searchParams.get("tab") || "search";
    const [country, setCountry] = useState<Country | null>(null);
    const [chartsCountry, setChartsCountry] = useState<Country | null>(null); // Separate state for Charts tab

    // Search state
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [allResults, setAllResults] = useState<SearchResult[]>([]);
    const [filter, setFilter] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [filterCache, setFilterCache] = useState<Record<string, SearchResult[]>>({});
    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const { setPlaylist, toggleQueue, isQueueOpen } = usePlayer();

    // IP-based country detection (always fresh, cache for 24 hours)
    useEffect(() => {
        async function detectCountry() {
            const savedCode = localStorage.getItem("user_country_code");
            const savedLang = localStorage.getItem("user_country_lang");
            const savedTime = localStorage.getItem("user_country_detected_at");

            const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
            const isCacheValid = savedTime && (Date.now() - Number.parseInt(savedTime, 10)) < CACHE_DURATION;

            // Use cached value only if within 24 hours (supports all 109 ytmusicapi countries)
            if (savedCode && savedLang && isCacheValid) {
                const countryInfo = getCountryInfo(savedCode);
                if (countryInfo) {
                    setCountry(countryInfo);
                    return;
                }
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
                            setCountry(countryInfo);
                            localStorage.setItem("user_country_code", countryInfo.code);
                            localStorage.setItem("user_country_lang", countryInfo.lang);
                            localStorage.setItem("user_country_name", countryInfo.name);
                            localStorage.setItem("user_country_detected_at", Date.now().toString());
                            return;
                        }
                    }
                    // Country not in ytmusicapi supported list, use Global
                    const global = SUPPORTED_COUNTRIES.find(c => c.code === "ZZ")!;
                    setCountry(global);
                    localStorage.setItem("user_country_code", global.code);
                    localStorage.setItem("user_country_lang", global.lang);
                    localStorage.setItem("user_country_name", global.name);
                    localStorage.setItem("user_country_detected_at", Date.now().toString());
                    return;
                }
            } catch (e) {
                console.error("IP Detect failed:", e);
                // On error, use cached value if exists (supports all 109 countries)
                if (savedCode && savedLang) {
                    const countryInfo = getCountryInfo(savedCode);
                    if (countryInfo) {
                        setCountry(countryInfo);
                        return;
                    }
                }
            }

            setCountry(DEFAULT_COUNTRY);
        }

        detectCountry();
    }, []);

    // Handle country change (Charts only - does NOT persist to localStorage)
    const handleChartsCountryChange = (newCountry: Country) => {
        setChartsCountry(newCountry);
    };

    // Get Charts-compatible country (62 countries only)
    // If country is not in SUPPORTED_COUNTRIES, fallback to Global
    const getChartsCompatibleCountry = (c: Country): Country => {
        const isChartsSupported = SUPPORTED_COUNTRIES.some(sc => sc.code === c.code);
        if (isChartsSupported) return c;
        return SUPPORTED_COUNTRIES.find(sc => sc.code === "ZZ")!;
    };

    // Reset chartsCountry when leaving charts tab
    useEffect(() => {
        if (tab !== "charts") {
            setChartsCountry(null);
        }
    }, [tab]);

    // Fetch suggestions
    useEffect(() => {
        if (query.length < 2) { setSuggestions([]); return; }
        const timer = setTimeout(async () => {
            setIsSuggestionsLoading(true);
            try {
                const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                setSuggestions(data || []);
            } catch { setSuggestions([]); }
            finally { setIsSuggestionsLoading(false); }
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    // Close suggestions on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) setShowSuggestions(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Prefetch other filters in background
    const prefetchFilters = async (q: string) => {
        const filterTypes = ['songs', 'videos', 'albums', 'artists', 'playlists'];
        await Promise.all(filterTypes.map(async (f) => {
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&filter=${f}`);
                if (res.ok) {
                    const data = await res.json();
                    setFilterCache(prev => ({ ...prev, [f]: data || [] }));
                }
            } catch { /* ignore */ }
        }));
    };

    const handleSearch = async (searchQuery: string, searchFilter: string | null = null) => {
        const q = searchQuery.trim();
        if (!q) return;
        setError(null);
        setIsLoading(true);
        setHasSearched(true);
        setShowSuggestions(false);
        setFilter(searchFilter);

        const cacheKey = searchFilter || 'all';
        if (filterCache[cacheKey] && searchQuery === query) {
            setAllResults(filterCache[cacheKey]);
            setIsLoading(false);
            return;
        }

        try {
            const filterParam = searchFilter ? `&filter=${searchFilter}` : '';
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}${filterParam}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = (await res.json()) || [];
            setAllResults(data);

            if (searchFilter) {
                setFilterCache(prev => ({ ...prev, [searchFilter]: data }));
            } else {
                setFilterCache({ all: data });
                prefetchFilters(q);
            }
        } catch (e: unknown) { setError(e instanceof Error ? e.message : "Search failed"); }
        finally { setIsLoading(false); }
    };

    const handleItemClick = async (item: SearchResult) => {
        // 아티스트 클릭 시 → 카페 페이지로 이동 (가상회원 자동 생성됨)
        if (item.resultType === "artist" && (item.browseId || item.artists?.[0]?.id)) {
            const artistId = item.browseId || item.artists?.[0]?.id;
            router.push(`/cafe/${artistId}`);
            return;
        }
        let tracks: Track[] = [];
        try {
            if (item.videoId) {
                tracks = [{ videoId: item.videoId, title: item.title || "Unknown", artist: item.artists?.map((a: Artist) => a.name).join(", ") || "Unknown", thumbnail: item.thumbnails?.[item.thumbnails.length - 1]?.url || "" }];
            } else if (item.resultType === "album" && item.browseId) {
                const albumData = await api.music.album(item.browseId);
                if (albumData?.tracks) tracks = albumData.tracks.map((t: AlbumTrack) => t.videoId ? { videoId: t.videoId, title: t.title || "Unknown", artist: t.artists?.map((a: Artist) => a.name).join(", ") || "Unknown", thumbnail: albumData.thumbnails?.[albumData.thumbnails.length - 1]?.url || "" } : null).filter((t: Track | null): t is Track => t !== null);
            } else if (item.resultType === "playlist" && item.browseId) {
                const plData = await api.music.watch(undefined, item.browseId);
                if (plData?.tracks) tracks = plData.tracks.map((t: WatchTrack) => t.videoId ? { videoId: t.videoId, title: t.title || "Unknown", artist: t.artists?.map((a: Artist) => a.name).join(", ") || "Unknown", thumbnail: Array.isArray(t.thumbnail) ? t.thumbnail.at(-1)?.url : "" } : null).filter((t: Track | null): t is Track => t !== null);
            }
        } catch { return; }
        if (tracks.length > 0) { setPlaylist(tracks, 0); if (!isQueueOpen) toggleQueue(); }
    };

    const getResultIcon = (type: string) => {
        switch (type) {
            case "song": return <Music className="w-4 h-4" />;
            case "video": return <Video className="w-4 h-4" />;
            case "album": return <Disc className="w-4 h-4" />;
            case "artist": return <User className="w-4 h-4" />;
            case "playlist": return <ListMusic className="w-4 h-4" />;
            default: return <Search className="w-4 h-4" />;
        }
    };







    return (
        <div className="min-h-screen bg-[linear-gradient(135deg,#0f0f23_0%,#1a1a2e_100%)]">


            {/* Tab Content - 선택된 탭만 표시 */}
            <div className="animate-in fade-in duration-300">
                {/* SEARCH Tab */}
                {tab === "search" && (
                    <div className="min-h-screen">
                        {/* Hero */}
                        <div className="px-4 py-8 md:py-16 text-center">
                            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-transparent bg-clip-text">
                                Discover Music with AI
                            </h1>
                            <p className="text-muted-foreground text-sm sm:text-base md:text-lg mb-6 md:mb-8">Global music big data - explore without limits</p>

                            <SearchInput
                                query={query}
                                setQuery={setQuery}
                                onSearch={(q) => handleSearch(q, null)}
                                isLoading={isLoading}
                                suggestions={suggestions}
                                showSuggestions={showSuggestions}
                                setShowSuggestions={setShowSuggestions}
                                isSuggestionsLoading={isSuggestionsLoading}
                                inputRef={inputRef}
                                suggestionsRef={suggestionsRef}
                            />
                        </div>

                        {/* Filter Tabs */}
                        {hasSearched && (
                            <FilterTabs
                                filter={filter}
                                onFilterChange={(id) => handleSearch(query, id)}
                            />
                        )}

                        {/* Results */}
                        <SearchResults
                            results={allResults}
                            isLoading={isLoading}
                            hasSearched={hasSearched}
                            error={error}
                            query={query}
                            onItemClick={handleItemClick}
                            getResultIcon={getResultIcon}
                        />
                    </div>
                )}

                {/* MUSIC Tab */}
                {tab === "music" && (
                    <div className="w-full px-4 md:px-8 py-6">
                        {country ? (
                            <MusicTab country={country} />
                        ) : (
                            <div className="py-20 text-center text-zinc-500 animate-pulse">Detecting your location...</div>
                        )}
                    </div>
                )}

                {/* CHARTS Tab */}
                {tab === "charts" && (
                    <div className="w-full px-4 md:px-8 py-6">
                        {country ? (
                            <>
                                <div className="flex justify-end mb-4">
                                    <CountrySelector value={chartsCountry || getChartsCompatibleCountry(country)} onChange={handleChartsCountryChange} />
                                </div>
                                <ChartsTab country={chartsCountry || getChartsCompatibleCountry(country)} />
                            </>
                        ) : (
                            <div className="py-20 text-center text-zinc-500 animate-pulse">Detecting your location...</div>
                        )}
                    </div>
                )}

                {/* MOODS Tab */}
                {tab === "moods" && (
                    <div className="w-full px-4 md:px-8 py-6 pb-32">
                        {country ? (
                            <MoodsTab country={country} />
                        ) : (
                            <div className="py-20 text-center text-zinc-500 animate-pulse">Detecting your location...</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[linear-gradient(135deg,#0f0f23_0%,#1a1a2e_100%)] flex items-center justify-center">
                <div className="text-white/60">Loading...</div>
            </div>
        }>
            <SearchPageContent />
        </Suspense>
    );
}
