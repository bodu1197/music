"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, Loader2, Music, Video, Disc, User, ListMusic, Brain, ArrowRight } from "lucide-react";
import { usePlayer, Track } from "@/contexts/PlayerContext";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { SearchResult, Artist, AlbumTrack, WatchTrack } from "@/types/music";

const FILTERS = [
    { id: null, label: "All", icon: Search },
    { id: "songs", label: "Songs", icon: Music },
    { id: "videos", label: "Videos", icon: Video },
    { id: "albums", label: "Albums", icon: Disc },
    { id: "artists", label: "Artists", icon: User },
    { id: "playlists", label: "Playlists", icon: ListMusic },
];



export default function SearchPage() {
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
        const filters = ['songs', 'videos', 'albums', 'artists', 'playlists'];
        filters.forEach(async (f) => {
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&filter=${f}`);
                if (res.ok) {
                    const data = await res.json();
                    setFilterCache(prev => ({ ...prev, [f]: data || [] }));
                }
            } catch { /* ignore */ }
        });
    };

    // Perform search
    const handleSearch = async (searchQuery?: string, searchFilter?: string | null) => {
        const q = searchQuery || query;
        if (!q.trim()) return;
        setShowSuggestions(false);
        setIsLoading(true);
        setError(null);
        setHasSearched(true);

        // 캐시에서 먼저 확인
        if (searchFilter && filterCache[searchFilter]) {
            setAllResults(filterCache[searchFilter]);
            setIsLoading(false);
            return;
        }

        try {
            const filterParam = searchFilter ? `&filter=${searchFilter}` : '';
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}${filterParam}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = (await res.json()) || [];
            setAllResults(data);

            // All 검색 시 캐시 초기화 및 백그라운드 프리페치
            if (searchFilter) {
                setFilterCache(prev => ({ ...prev, [searchFilter]: data }));
            } else {
                setFilterCache({ all: data });
                prefetchFilters(q);
            }
        } catch (e: unknown) { setError(e instanceof Error ? e.message : "Search failed"); }
        finally { setIsLoading(false); }
    };

    const handleSuggestionClick = (s: string) => { setQuery(s); setShowSuggestions(false); handleSearch(s); };


    // Handle item click
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
            {/* Hero Section */}
            <section className="px-4 py-12 md:py-24 text-center">
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-purple-400 via-pink-500 to-purple-500 text-transparent bg-clip-text whitespace-nowrap">
                    Discover Music with AI
                </h1>
                <p className="text-zinc-400 text-sm sm:text-base md:text-lg mb-6 md:mb-8 whitespace-nowrap">Global music big data - explore without limits</p>

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
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            placeholder="Search for songs, artists, albums..."
                            className="w-full h-14 pl-12 pr-14 bg-zinc-900/80 backdrop-blur-sm border border-zinc-700 rounded-full text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        />
                        <button onClick={() => handleSearch()} disabled={!query.trim() || isLoading} className="absolute right-2 w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white hover:opacity-90 disabled:opacity-50">
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                        </button>
                    </div>

                    {/* Suggestions */}
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute w-full mt-2 bg-zinc-900/95 backdrop-blur-sm border border-zinc-700 rounded-2xl overflow-hidden z-50 shadow-2xl">
                            {isSuggestionsLoading && <div className="px-4 py-2 text-zinc-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Loading...</div>}
                            {suggestions.map((s, i) => (
                                <button key={`${s}-${i}`} onClick={() => handleSuggestionClick(s)} className="w-full px-4 py-3 text-left text-white hover:bg-purple-500/20 flex items-center gap-3">
                                    <Search className="w-4 h-4 text-zinc-500" />{s}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Filters */}
            {hasSearched && (
                <div className="px-4 pb-4">
                    <div className="max-w-4xl mx-auto flex gap-2 overflow-x-auto pb-2">
                        {FILTERS.map((f) => {
                            const Icon = f.icon;
                            const isActive = filter === f.id;
                            return (
                                <button key={f.id || "all"} onClick={() => { setFilter(f.id); handleSearch(undefined, f.id); }} className={cn("flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all", isActive ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" : "bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700 border border-zinc-700")}>
                                    <Icon className="w-4 h-4" />{f.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Error */}
            {error && <div className="max-w-4xl mx-auto px-4 mb-6"><div className="p-4 bg-red-900/50 border border-red-700 rounded-xl text-red-300">Error: {error}</div></div>}

            {/* Results Count */}
            {allResults.length > 0 && <div className="max-w-4xl mx-auto px-4 mb-4 text-zinc-400 text-sm">Found {allResults.length} results</div>}

            {/* Results - Slide up animation */}
            <div className="max-w-4xl mx-auto px-4 pb-32">
                <div className="space-y-2">
                    {allResults.map((item, i) => (
                        <button key={item.videoId || item.browseId || `result-${i}`} type="button" onClick={() => handleItemClick(item)} className="w-full flex items-center gap-4 p-4 bg-zinc-900/50 hover:bg-zinc-800/80 border border-zinc-800 hover:border-purple-500/30 rounded-xl cursor-pointer group text-left transition-all animate-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: `${i * 30}ms` }}>
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
        </div>
    );
}
