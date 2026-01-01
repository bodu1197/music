"use client";

import { useEffect, useState } from "react";
import { Play } from "lucide-react";

export default function MusicPage() {
    return (
        <div className="max-w-[936px] mx-auto py-8 px-4 pb-20 md:pb-8">
            <h1 className="text-2xl font-bold mb-6">Music Charts & Trending</h1>

            {/* Quick Picks / Charts Placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Chart 1 */}
                <div className="bg-zinc-800 rounded-md p-6 flex flex-col items-start gap-4">
                    <h2 className="text-xl font-bold">Top 100: Global</h2>
                    <p className="text-zinc-400 text-sm">The most played tracks in the world.</p>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform">
                        <Play className="w-4 h-4 fill-current" />
                        Play All
                    </button>
                </div>

                {/* Chart 2 */}
                <div className="bg-zinc-800 rounded-md p-6 flex flex-col items-start gap-4">
                    <h2 className="text-xl font-bold">Top 100: Korea</h2>
                    <p className="text-zinc-400 text-sm">The most played tracks in Korea.</p>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform">
                        <Play className="w-4 h-4 fill-current" />
                        Play All
                    </button>
                </div>
            </div>

            {/* New Releases */}
            <h2 className="text-xl font-bold mt-12 mb-4">New Releases</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="group cursor-pointer">
                        <div className="aspect-square bg-zinc-800 rounded-md mb-2 relative overflow-hidden">
                            <div className="w-full h-full bg-zinc-700 flex items-center justify-center text-zinc-500">
                                Cover
                            </div>
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Play className="w-12 h-12 text-white fill-current" />
                            </div>
                        </div>
                        <h3 className="text-sm font-bold truncate">Song Title {i + 1}</h3>
                        <p className="text-xs text-zinc-400 truncate">Artist Name</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
