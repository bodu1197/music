"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, Loader2, Music, Video, Disc, User, ListMusic, Brain, ArrowRight, BarChart2, Sparkles } from "lucide-react";
import { usePlayer, Track } from "@/contexts/PlayerContext";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { SearchResult, Artist, AlbumTrack, WatchTrack } from "@/types/music";
import { ChartsTab } from "@/components/profile/ChartsTab";
import { MoodsTab } from "@/components/profile/MoodsTab";
import { SUPPORTED_COUNTRIES, DEFAULT_COUNTRY, Country } from "@/lib/constants";

// Main sections
const SECTIONS = [
    { id: "search", label: "SEARCH", icon: Search },
    { id: "charts", label: "CHARTS", icon: BarChart2 },
    { id: "moods", label: "MOODS", icon: Sparkles },
];

const SEARCH_FILTERS = [
    { id: null, label: "All", icon: Search },
    { id: "songs", label: "Songs", icon: Music },
    { id: "videos", label: "Videos", icon: Video },
    { id: "albums", label: "Albums", icon: Disc },
    { id: "artists", label: "Artists", icon: User },
    { id: "playlists", label: "Playlists", icon: ListMusic },
];

export default function SearchPage() {
    // Active section for navigation highlight
    const [activeSection, setActiveSection] = useState("search");
    const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);

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

    // Detect country on mount
    useEffect(() => {
        const savedCode = localStorage.getItem("user_country_code");
        const savedLang = localStorage.getItem("user_country_lang");
        const found = SUPPORTED_COUNTRIES.find(c => c.code === savedCode);
        if (found) {
            setCountry({ ...found, lang: savedLang || found.lang });
        }
    }, []);

    // Scroll spy - detect which section is visible
    useEffect(() => {
        const handleScroll = () => {
            const sections = SECTIONS.map(s => document.getElementById(s.id));
            const scrollPos = window.scrollY + 100; // Offset for header

            for (let i = sections.length - 1; i >= 0; i--) {
                const section = sections[i];
                if (section && section.offsetTop <= scrollPos) {
                    setActiveSection(SECTIONS[i].id);
                    break;
                }
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Smooth scroll to section
    const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId);
        if (element) {
            const offset = 60; // Header height
            const y = element.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top: y, behavior: "smooth" });
        }
    };

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
        if (item.resultType === "artist" && (item.browseId || item.artists?.[0]?.id)) {
            router.push(`/artist/${item.browseId || item.artists?.[0]?.id}`);
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
        <div className="min-h-screen bg-gradient-to-b from-[#0c0c1a] via-[#080812] to-black">
            {/* Fixed Navigation */}
            <nav className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-zinc-800">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="flex gap-1 py-2">
                        {SECTIONS.map((section) => {
                            const Icon = section.icon;
                            const isActive = activeSection === section.id;
                            return (
                                <button
                                    key={section.id}
                                    type="button"
                                    onClick={() => scrollToSection(section.id)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all",
                                        isActive
                                            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25"
                                            : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                                    )}
                                >
                                    <Icon className="w-4 h-4" />
                                    {section.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </nav>

            {/* ========== SEARCH SECTION ========== */}
            <section id="search" className="min-h-screen">
                {/* Hero */}
                <div className="px-4 py-8 md:py-16 text-center">
                    <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-purple-400 via-pink-500 to-purple-500 text-transparent bg-clip-text">
                        Discover Music with AI
                    </h1>
                    <p className="text-zinc-400 text-sm sm:text-base md:text-lg mb-6 md:mb-8">Global music big data - explore without limits</p>

                    {/* Search Form */}
                    <div className="max-w-2xl mx-auto relative" ref={suggestionsRef}>
                        <div className="relative flex items-center">
                            <Brain className="absolute left-4 w-5 h-5 text-white z-10" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onFocus={() => setShowSuggestions(true)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch(query, null)}
                                placeholder="Search for songs, artists, albums..."
                                className="w-full py-4 pl-12 pr-14 bg-zinc-900/80 border border-zinc-700 rounded-full text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <button type="button" onClick={() => handleSearch(query, null)} disabled={isLoading || !query.trim()} className="absolute right-2 p-2.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full transition-all hover:scale-105 disabled:opacity-50">
                                {isLoading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <ArrowRight className="w-5 h-5 text-white" />}
                            </button>
                        </div>

                        {/* Suggestions */}
                        {showSuggestions && query.length >= 2 && (
                            <div className="absolute w-full mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden">
                                {isSuggestionsLoading ? <div className="p-4 text-center text-zinc-500"><Loader2 className="w-5 h-5 animate-spin inline" /></div> : suggestions.length > 0 ? (
                                    <ul>{suggestions.slice(0, 8).map((s, i) => <li key={i}><button type="button" className="w-full px-4 py-3 text-left text-white hover:bg-zinc-800 flex items-center gap-3" onClick={() => { setQuery(s); handleSearch(s, null); }}><Search className="w-4 h-4 text-zinc-400" />{s}</button></li>)}</ul>
                                ) : <div className="p-4 text-center text-zinc-500">No suggestions</div>}
                            </div>
                        )}
                    </div>
                </div>

                {/* Filter Tabs */}
                {hasSearched && (
                    <div className="max-w-4xl mx-auto px-4 mb-6 overflow-x-auto">
                        <div className="flex gap-2 pb-2">
                            {SEARCH_FILTERS.map((f) => {
                                const Icon = f.icon;
                                const isActive = filter === f.id;
                                return (
                                    <button key={f.id || "all"} type="button" onClick={() => handleSearch(query, f.id)} className={cn("flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all", isActive ? "bg-purple-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white")}>
                                        <Icon className="w-4 h-4" />{f.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && <div className="max-w-4xl mx-auto px-4 mb-6"><div className="p-4 bg-red-900/50 border border-red-700 rounded-xl text-red-300">Error: {error}</div></div>}

                {/* Results */}
                {allResults.length > 0 && <div className="max-w-4xl mx-auto px-4 mb-4 text-zinc-400 text-sm">Found {allResults.length} results</div>}
                <div className="max-w-4xl mx-auto px-4 pb-8">
                    <div className="space-y-2">
                        {allResults.map((item, i) => (
                            <button key={item.videoId || item.browseId || `result-${i}`} type="button" onClick={() => handleItemClick(item)} className="w-full flex items-center gap-4 p-4 bg-zinc-900/50 hover:bg-zinc-800/80 border border-zinc-800 hover:border-purple-500/30 rounded-xl cursor-pointer group text-left transition-all" style={{ animationDelay: `${i * 30}ms` }}>
                                <div className="w-14 h-14 flex-shrink-0 bg-zinc-800 rounded-lg overflow-hidden relative">
                                    {item.thumbnails?.[0]?.url ? <Image src={item.thumbnails[0].url} alt={item.title || ""} fill className="object-cover" unoptimized /> : <div className="w-full h-full flex items-center justify-center text-zinc-600">{getResultIcon(item.resultType)}</div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1"><span className="text-purple-400">{getResultIcon(item.resultType)}</span><span className="text-xs text-purple-400 uppercase font-medium">{item.resultType}</span></div>
                                    <h3 className="text-white font-medium truncate group-hover:text-purple-300">{item.title || item.artist}</h3>
                                    <p className="text-sm text-zinc-400 truncate">{item.artists?.map((a: Artist) => a.name).join(", ") || ""}{item.duration && ` • ${item.duration}`}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                    {!isLoading && allResults.length === 0 && hasSearched && !error && <div className="py-20 text-center text-zinc-500">No results found for &quot;{query}&quot;</div>}
                </div>
            </section>

            {/* ========== CHARTS SECTION ========== */}
            <section id="charts" className="min-h-screen border-t border-zinc-800 pt-8">
                <div className="max-w-4xl mx-auto px-4">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <BarChart2 className="w-6 h-6 text-purple-400" />
                        Charts
                    </h2>
                    <ChartsTab country={country} />
                </div>
            </section>

            {/* ========== MOODS SECTION ========== */}
            <section id="moods" className="min-h-screen border-t border-zinc-800 pt-8 pb-32">
                <div className="max-w-4xl mx-auto px-4">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-pink-400" />
                        Moods & Genres
                    </h2>
                    <MoodsTab country={country} />
                </div>
            </section>
        </div>
    );
}
