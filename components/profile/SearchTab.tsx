"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, Music, Video, Disc, User, ListMusic } from "lucide-react";
import { usePlayer, Track } from "@/contexts/PlayerContext";
import { api } from "@/lib/api";
import type { SearchResult, Artist, AlbumTrack, WatchTrack } from "@/types/music";

const FILTERS = [
    { id: null, label: "All", icon: Search },
    { id: "songs", label: "Songs", icon: Music },
    { id: "videos", label: "Videos", icon: Video },
    { id: "albums", label: "Albums", icon: Disc },
    { id: "artists", label: "Artists", icon: User },
    { id: "playlists", label: "Playlists", icon: ListMusic },
];

export function SearchTab() {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [filter, setFilter] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const { setPlaylist, toggleQueue, isQueueOpen } = usePlayer();

    // Fetch suggestions as user types
    useEffect(() => {
        if (query.length < 2) {
            setSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSuggestionsLoading(true);
            try {
                const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                setSuggestions(data || []);
            } catch (e) {
                console.error("Suggestions error:", e);
            } finally {
                setIsSuggestionsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Perform search
    const handleSearch = async (searchQuery?: string) => {
        const q = searchQuery || query;
        if (!q.trim()) return;

        setShowSuggestions(false);
        setIsLoading(true);
        setError(null);
        setResults([]);

        try {
            const filterParam = filter ? `&filter=${filter}` : "";
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=100${filterParam}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setResults(data || []);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Search failed");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle suggestion click
    const handleSuggestionClick = (suggestion: string) => {
        setQuery(suggestion);
        setShowSuggestions(false);
        handleSearch(suggestion);
    };

    // Handle item click
    const handleItemClick = async (item: SearchResult) => {
        const artistId = item.browseId || item.artists?.[0]?.id;
        console.log("[Search] Item clicked:", item.resultType, artistId, item);

        // Case 1: Artist -> Navigation
        if (item.resultType === "artist" && artistId) {
            console.log("[Search] Navigating to artist:", artistId);
            router.push(`/artist/${artistId}`);
            return;
        }

        // Case 2: Playable Items -> Build Track List
        let tracks: Track[] = [];

        try {
            if (item.videoId) {
                // Single Video
                tracks = [{
                    videoId: item.videoId,
                    title: item.title || "Unknown",
                    artist: item.artists?.map((a: Artist) => a.name).join(", ") || "Unknown Artist",
                    thumbnail: item.thumbnails?.[item.thumbnails.length - 1]?.url || "/images/default-album.svg",
                }];
            } else if (item.resultType === "album" && item.browseId) {
                // Album
                const albumData = await api.music.album(item.browseId);
                if (albumData?.tracks) {
                    tracks = albumData.tracks
                        .map((t: AlbumTrack) => t.videoId ? {
                            videoId: t.videoId,
                            title: t.title || "Unknown",
                            artist: t.artists?.map((a: Artist) => a.name).join(", ") || "Unknown Artist",
                            thumbnail: albumData.thumbnails?.[albumData.thumbnails.length - 1]?.url || "/images/default-album.svg",
                            album: albumData.title
                        } : null)
                        .filter((t: Track | null): t is Track => t !== null);
                }
            } else if (item.resultType === "playlist" && item.browseId) {
                // Playlist
                const playlistData = await api.music.watch(undefined, item.browseId);
                if (playlistData?.tracks) {
                    tracks = playlistData.tracks
                        .map((t: WatchTrack) => t.videoId ? {
                            videoId: t.videoId,
                            title: t.title || "Unknown",
                            artist: t.artists?.map((a: Artist) => a.name).join(", ") || "Unknown Artist",
                            thumbnail: Array.isArray(t.thumbnail) ? t.thumbnail.at(-1)?.url : "/images/default-album.svg"
                        } : null)
                        .filter((t: Track | null): t is Track => t !== null);
                }
            }
        } catch (e) {
            console.error("[Search] Error loading tracks:", e);
            return;
        }

        // Case 3: Play
        if (tracks.length > 0) {
            console.log("[Search] Playing tracks:", tracks.length);
            setPlaylist(tracks, 0);
            if (!isQueueOpen) toggleQueue();
        }
    };
    // Get icon for result type
    const getResultIcon = (resultType: string) => {
        switch (resultType) {
            case "song": return <Music className="w-4 h-4" />;
            case "video": return <Video className="w-4 h-4" />;
            case "album": return <Disc className="w-4 h-4" />;
            case "artist": return <User className="w-4 h-4" />;
            case "playlist": return <ListMusic className="w-4 h-4" />;
            default: return <Search className="w-4 h-4" />;
        }
    };

    return (
        <div className="py-4">
            {/* Search Input */}
            <div className="relative mb-6" ref={suggestionsRef}>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setShowSuggestions(true)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        placeholder="Search for songs, videos, artists, albums..."
                        className="w-full h-12 pl-12 pr-12 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                    />
                    {query && (
                        <button
                            onClick={() => { setQuery(""); setResults([]); setSuggestions([]); }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden z-50">
                        {isSuggestionsLoading && (
                            <div className="px-4 py-2 text-zinc-500 flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading...
                            </div>
                        )}
                        {suggestions.map((suggestion, i) => (
                            <button
                                key={`${suggestion}-${i}`}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="w-full px-4 py-3 text-left text-white hover:bg-zinc-800 flex items-center gap-3"
                            >
                                <Search className="w-4 h-4 text-zinc-500" />
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {FILTERS.map((f) => {
                    const Icon = f.icon;
                    const isActive = filter === f.id;
                    return (
                        <button
                            key={f.id || "all"}
                            onClick={() => { setFilter(f.id); if (query) handleSearch(); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${isActive
                                ? "bg-white text-black"
                                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {f.label}
                        </button>
                    );
                })}
            </div>

            {/* Search Button */}
            <button
                onClick={() => handleSearch()}
                disabled={!query.trim() || isLoading}
                className="w-full h-12 bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-semibold rounded-lg mb-6 flex items-center justify-center gap-2"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Searching...
                    </>
                ) : (
                    <>
                        <Search className="w-5 h-5" />
                        Search
                    </>
                )}
            </button>

            {/* Error */}
            {error && (
                <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
                    Error: {error}
                </div>
            )}

            {/* Results Count */}
            {results.length > 0 && (
                <div className="mb-4 text-zinc-400 text-sm">
                    Found {results.length} results
                </div>
            )}

            {/* Results */}
            <div className="space-y-2">
                {results.map((item, i) => (
                    <button
                        key={item.videoId || item.browseId || `result-${i}`}
                        type="button"
                        onClick={() => handleItemClick(item)}
                        className="w-full flex items-center gap-4 p-3 bg-zinc-900 hover:bg-zinc-800 rounded-lg cursor-pointer group text-left"
                    >
                        {/* Thumbnail */}
                        <div className="w-14 h-14 flex-shrink-0 bg-zinc-800 rounded overflow-hidden relative">
                            {item.thumbnails?.[0]?.url ? (
                                <Image
                                    src={item.thumbnails[0].url || ""}
                                    alt={item.title || "Thumbnail"}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                    {getResultIcon(item.resultType)}
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-zinc-500">{getResultIcon(item.resultType)}</span>
                                <span className="text-xs text-zinc-500 uppercase">{item.resultType}</span>
                            </div>
                            <h3 className="text-white font-medium truncate">{item.title || item.artist}</h3>
                            <p className="text-sm text-zinc-400 truncate">
                                {item.artists?.map((a: Artist) => a.name).join(", ") || item.author || item.artist || ""}
                                {item.album?.name && ` • ${item.album.name}`}
                                {item.year && ` • ${item.year}`}
                                {item.duration && ` • ${item.duration}`}
                                {item.subscribers && ` • ${item.subscribers} subscribers`}
                                {item.itemCount && ` • ${item.itemCount} items`}
                            </p>
                        </div>

                        {/* Category Badge */}
                        {item.category && (
                            <span className="px-2 py-1 text-xs bg-zinc-700 text-zinc-300 rounded">
                                {item.category}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Empty State */}
            {!isLoading && results.length === 0 && query && !error && (
                <div className="py-20 text-center text-zinc-500">
                    No results found for &quot;{query}&quot;
                </div>
            )}
        </div>
    );
}
