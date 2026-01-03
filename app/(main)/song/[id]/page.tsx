"use client";

import { Play, Heart, Share2 } from "lucide-react";

export default function SongPage() {
    return (
        <div className="max-w-[936px] mx-auto py-8 px-4 pb-20 md:pb-8 flex flex-col md:flex-row gap-12">
            {/* Left: Cover & Info */}
            <div className="w-full md:w-1/3 flex flex-col items-center text-center">
                <div className="w-64 h-64 bg-zinc-800 shadow-2xl mb-8">
                    {/* Cover */}
                </div>
                <h1 className="text-3xl font-bold mb-2">Song Title</h1>
                <h2 className="text-zinc-400 font-bold mb-8">Artist Name</h2>

                <div className="flex gap-6 mb-8">
                    <button className="w-14 h-14 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform text-black">
                        <Play className="w-7 h-7 fill-current ml-1" />
                    </button>
                    <button className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors">
                        <Heart className="w-6 h-6" />
                    </button>
                    <button className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors">
                        <Share2 className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Right: Lyrics / Recommendations */}
            <div className="flex-1">
                <h3 className="text-xl font-bold mb-4">Lyrics</h3>
                <div className="text-zinc-300 text-lg leading-relaxed whitespace-pre-wrap">
                    {`Lyrics placeholder...\n\nLa la la...\n\n(Verse 1)\n...`}
                </div>
            </div>
        </div>
    );
}
