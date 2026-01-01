"use client";

import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function HomePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const homeData = await api.music.home();
        setData(homeData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div className="flex justify-center pt-20 text-zinc-500">Loading your vibe...</div>;

  // Transform API data into feed posts
  // YouTube Music 'home' data usually contains sections like 'New Releases', 'Charts', etc.
  // We will map these items to 'Posts' to mimic Instagram.

  let feedItems: any[] = [];

  if (data && data.home) {
    // Flatten sections to get items
    // Warning: The structure depends on ytmusicapi response. 
    // Typically it returns a list of shelves (dictionaries).

    // Safety check if data.home is array
    if (Array.isArray(data.home)) {
      data.home.forEach((shelf: any) => {
        if (shelf.contents && Array.isArray(shelf.contents)) {
          shelf.contents.forEach((item: any) => {
            // Only take items that have thumbnails and titles
            if (item.thumbnails && item.title) {
              feedItems.push({
                id: item.videoId || item.browseId || Math.random(),
                title: item.title,
                subtitle: item.artists ? item.artists.map((a: any) => a.name).join(", ") : "Unknown Artist",
                image: item.thumbnails[item.thumbnails.length - 1].url, // Best quality
                section: shelf.title || "Recommended"
              });
            }
          });
        }
      });
    }
  }

  // Fallback if no data or parsing failed
  if (feedItems.length === 0) {
    feedItems = [
      { id: 'mock1', title: 'Welcome to VibeStation', subtitle: 'Global Music Community', image: 'https://music.youtube.com/img/onboarding/onboarding_welcome_v3.png', section: 'Admin' }
    ];
  }

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

      {/* Feed */}
      <div className="space-y-6">
        {feedItems.map((post: any, index: number) => (
          <article key={`${post.id}-${index}`} className="border-b border-zinc-900 pb-6 mb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-800" />
                <span className="text-sm font-bold hover:text-zinc-300 cursor-pointer">
                  {post.subtitle}
                </span>
                <span className="text-zinc-500 text-sm">• {post.section}</span>
              </div>
              <MoreHorizontal className="w-5 h-5 cursor-pointer" />
            </div>

            {/* Image */}
            <div className="relative aspect-square w-full bg-zinc-900 rounded-sm mb-3 border border-zinc-800 flex items-center justify-center overflow-hidden">
              <img src={post.image} alt={post.title} className="object-cover w-full h-full" />
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

            {/* Likes */}
            <div className="px-1 mb-2">
              <span className="text-sm font-bold">{Math.floor(Math.random() * 10000).toLocaleString()} likes</span>
            </div>

            {/* Caption */}
            <div className="px-1 mb-2">
              <span className="text-sm">
                <span className="font-bold mr-2">{post.subtitle}</span>
                {post.title} - Listen now on VibeStation! 🎵
              </span>
            </div>

            {/* Comments */}
            <div className="px-1">
              <span className="text-sm text-zinc-500 cursor-pointer">
                View all {Math.floor(Math.random() * 50)} comments
              </span>
            </div>

            <div className="px-1 mt-2">
              <input type="text" placeholder="Add a comment..." className="bg-transparent text-sm w-full focus:outline-none" />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
