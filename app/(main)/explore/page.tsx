"use client";

import { Search } from "lucide-react";

export default function ExplorePage() {
    return (
        <div className="max-w-[936px] mx-auto py-8 pb-20 md:pb-8 px-4">
            {/* Search Bar (Mobile only usually, but let's put it for now) */}
            <div className="md:hidden relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 w-4 h-4" />
                <input
                    type="text"
                    placeholder="Search"
                    className="w-full bg-zinc-800 rounded-md py-2 pl-10 pr-4 text-sm text-white focus:outline-none"
                />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-3 gap-1">
                {[...Array(20)].map((_, i) => (
                    <div key={i} className={`relative bg-zinc-800 aspect-square group cursor-pointer ${i % 3 === 0 && i % 2 === 0 ? "row-span-2 col-span-2" : ""}`}>
                        {/* Placeholder Image */}
                        <div className="w-full h-full bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-zinc-800 transition-colors">
                            <span className="opacity-0 group-hover:opacity-100 font-bold text-white flex gap-4">
                                <span>❤️ 1.2k</span>
                                <span>💬 30</span>
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
