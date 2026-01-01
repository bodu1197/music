"use client";

import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { api } from "@/lib/api";

export default function MusicPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                // We'll assume api.music.charts() calls the endpoint we just updated
                // Since I haven't added api.music.charts to lib/api.ts yet, I should use fetch directly or add it.
                // For safety in this step, let's use fetch directly or update lib/api.ts in parallel.
                // Assuming lib/api.ts will be updated or we use the path directly.
                const res = await fetch('/api/music/charts');
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    if (loading) return <div className="flex justify-center pt-20 text-zinc-500">Loading charts...</div>;

    const charts = data?.charts || {};
    const newReleases = data?.new_releases || [];

    // Helper to extract chart items
    const topSongs = charts.videos?.items || []; // 'videos' often has the music videos chart
    const topArtists = charts.artists?.items || [];
    const trending = charts.trending?.items || [];

    return (
        <div className="max-w-[936px] mx-auto py-8 px-4 pb-20 md:pb-8">
            <h1 className="text-2xl font-bold mb-6">Music Charts & Trending</h1>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {/* Global Top Videos */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-md p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Top Music Videos</h2>
                        <button className="text-xs font-bold text-zinc-400 hover:text-white">See All</button>
                    </div>
                    <div className="space-y-3">
                        {topSongs.slice(0, 5).map((item: any, i: number) => (
                            <div key={i} className="flex items-center gap-3 group cursor-pointer">
                                <span className="font-bold text-lg text-zinc-600 w-4 text-center">{i + 1}</span>
                                <div className="w-12 h-12 relative overflow-hidden rounded-md">
                                    <img src={item.thumbnails[0]?.url} alt={item.title} className="object-cover w-full h-full" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold truncate">{item.title}</p>
                                    <p className="text-xs text-zinc-400 truncate">{item.artists[0]?.name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Trending */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-md p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Trending Now</h2>
                        <button className="text-xs font-bold text-zinc-400 hover:text-white">See All</button>
                    </div>
                    <div className="space-y-3">
                        {trending.slice(0, 5).map((item: any, i: number) => (
                            <div key={i} className="flex items-center gap-3 group cursor-pointer">
                                <span className="font-bold text-lg text-zinc-600 w-4 text-center">{i + 1}</span>
                                <div className="w-12 h-12 relative overflow-hidden rounded-md">
                                    <img src={item.thumbnails[0]?.url} alt={item.title} className="object-cover w-full h-full" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold truncate">{item.title}</p>
                                    <p className="text-xs text-zinc-400 truncate">{item.artists[0]?.name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* New Releases Grid */}
            <h2 className="text-xl font-bold mb-4">New Releases</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {newReleases.map((album: any, i: number) => (
                    <div key={i} className="group cursor-pointer">
                        <div className="aspect-square bg-zinc-800 rounded-md mb-2 relative overflow-hidden">
                            <img src={album.thumbnails[album.thumbnails.length - 1]?.url} alt={album.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Play className="w-12 h-12 text-white fill-current" />
                            </div>
                        </div>
                        <h3 className="text-sm font-bold truncate">{album.title}</h3>
                        <p className="text-xs text-zinc-400 truncate">{album.artists[0]?.name}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
