"use client";

import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function HomePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const homeData = await api.music.home();
        setData(homeData);
      } catch (e: any) {
        console.error(e);
        setError(e.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div className="flex justify-center pt-20 text-zinc-500">Loading your vibe...</div>;
  if (error) return <div className="flex justify-center pt-20 text-red-500">Error: {error}</div>;

  // Render raw sections to prove we are getting real data
  const sections = Array.isArray(data?.home) ? data.home : [];

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center pt-20 px-4 text-center">
        <p className="text-zinc-400 mb-2">No data received from YouTube Music.</p>
        <p className="text-xs text-zinc-600">The server might be blocked or returning empty content for this region.</p>
      </div>
    );
  }

  // Flatten logic with Section Headers
  return (
    <div className="max-w-[470px] mx-auto pt-8 pb-20 md:pb-8">
      {/* Stories */}
      <div className="flex gap-4 mb-8 overflow-x-auto no-scrollbar px-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1 min-w-[66px]">
            <div className="w-[66px] h-[66px] rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-[2px]">
              <div className="w-full h-full rounded-full bg-black border-2 border-black" />
            </div>
            <span className="text-xs truncate w-full text-center">story_{i}</span>
          </div>
        ))}
      </div>

      {/* Feed by Sections */}
      <div className="space-y-8">
        {sections.map((shelf: any, sIndex: number) => {
          if (!shelf.contents || !Array.isArray(shelf.contents)) return null;

          return (
            <div key={sIndex} className="border-b-4 border-zinc-900 pb-4">
              {/* Section Title */}
              {shelf.title && <h2 className="px-1 mb-4 text-sm font-bold text-zinc-400 uppercase tracking-wider">{shelf.title}</h2>}

              {shelf.contents.map((item: any, i: number) => {
                // Robust check for data existence
                const title = item.title || "No Title";
                const subtitle = item.artists ? item.artists.map((a: any) => a.name).join(", ") : "Unknown";
                const image = item.thumbnails ? item.thumbnails[item.thumbnails.length - 1].url : null;
                const key = item.videoId || item.browseId || `item-${sIndex}-${i}`;

                if (!image) return null; // Skip items without images

                return (
                  <article key={key} className="mb-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-800" />
                        <span className="text-sm font-bold hover:text-zinc-300 cursor-pointer">
                          {subtitle}
                        </span>
                      </div>
                      <MoreHorizontal className="w-5 h-5 cursor-pointer" />
                    </div>

                    {/* Image */}
                    <div className="relative aspect-square w-full bg-zinc-900 rounded-sm mb-3 border border-zinc-800 flex items-center justify-center overflow-hidden">
                      <img src={image} alt={title} className="object-cover w-full h-full" />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex items-center gap-4">
                        <Heart className="w-6 h-6 cursor-pointer hover:text-zinc-400" />
                        <MessageCircle className="w-6 h-6 cursor-pointer hover:text-zinc-400" />
                        <Send className="w-6 h-6 cursor-pointer hover:text-zinc-400" />
                      </div>
                      <Bookmark className="w-6 h-6 cursor-pointer hover:text-zinc-400" />
                    </div>

                    {/* Caption */}
                    <div className="px-1 mb-2">
                      <span className="text-sm">
                        <span className="font-bold mr-2">{subtitle}</span>
                        {title}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
