"use client";

import { useEffect, useState } from "react";
import { Play, MoreHorizontal, Heart, MessageCircle, Send, Bookmark } from "lucide-react";
import { api } from "@/lib/api";

export default function MusicPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                // Now fetching plain get_home() structure from the charts endpoint
                const res = await fetch('/api/music/charts');
                if (res.ok) {
                    const json = await res.json();
                    setData(json.charts); // charts key now holds get_home list
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    if (loading) return <div className="flex justify-center pt-20 text-zinc-500">Loading Music Dashboard...</div>;

    // Data is now a list of shelves (like Home)
    const sections = Array.isArray(data) ? data : [];

    if (sections.length === 0) {
        return (
            <div className="flex justify-center pt-20 text-zinc-500">
                No music data available. Please try again later.
            </div>
        );
    }

    return (
        <div className="max-w-[936px] mx-auto py-8 px-4 pb-20 md:pb-8">
            <h1 className="text-2xl font-bold mb-8">Music Exploration</h1>

            <div className="space-y-12">
                {sections.map((shelf: any, sIndex: number) => {
                    const title = shelf.title || "Recommended";
                    const contents = shelf.contents || [];

                    if (!Array.isArray(contents) || contents.length === 0) return null;

                    // Grid layout for items
                    return (
                        <div key={sIndex}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold">{title}</h2>
                                <button className="text-xs font-bold text-zinc-400 hover:text-white uppercase">See All</button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {contents.slice(0, 10).map((item: any, i: number) => {
                                    // Extract props safely
                                    const itemTitle = item.title || "Unknown";
                                    const itemArtist = item.artists ? item.artists.map((a: any) => a.name).join(", ") : "";
                                    const itemImg = item.thumbnails ? item.thumbnails[Math.max(0, item.thumbnails.length - 1)].url : null;

                                    if (!itemImg) return null;

                                    return (
                                        <div key={i} className="group cursor-pointer">
                                            <div className="aspect-square bg-zinc-800 rounded-md mb-2 relative overflow-hidden">
                                                <img src={itemImg} alt={itemTitle} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Play className="w-10 h-10 text-white fill-current" />
                                                </div>
                                            </div>
                                            <h3 className="text-sm font-bold truncate">{itemTitle}</h3>
                                            <p className="text-xs text-zinc-400 truncate">{itemArtist}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
