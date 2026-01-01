"use client";

import Image from "next/image";
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

  const posts = [
    {
      id: 1,
      user: {
        username: "VibeStation Bot",
        avatar: "/avatars/bot.jpg",
      },
      image: "https://music.youtube.com/img/onboarding/onboarding_welcome_v3.png",
      likes: 1234,
      caption: "Welcome to VibeStation! We are fetching real data from YouTube Music...",
      comments: 56,
      time: "JUST NOW",
    },
  ];

  if (loading) return <div className="flex justify-center pt-20 text-zinc-500">Loading your vibe...</div>;

  return (
    <div className="max-w-[470px] mx-auto pt-8 pb-20 md:pb-8">
      {/* Stories */}
      <div className="flex gap-4 mb-8 overflow-x-auto no-scrollbar px-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1 min-w-[66px]">
            <div className="w-[66px] h-[66px] rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-[2px]">
              <div className="w-full h-full rounded-full bg-black border-2 border-black" />
            </div>
            <span className="text-xs truncate w-full text-center">user_{i}</span>
          </div>
        ))}
      </div>

      {/* Feed */}
      <div className="space-y-6">
        {posts.map((post) => (
          <article key={post.id} className="border-b border-zinc-900 pb-6 mb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-800" />
                <span className="text-sm font-bold hover:text-zinc-300 cursor-pointer">
                  {post.user.username}
                </span>
                <span className="text-zinc-500 text-sm">• {post.time}</span>
              </div>
              <MoreHorizontal className="w-5 h-5 cursor-pointer" />
            </div>

            {/* Image */}
            <div className="relative aspect-square w-full bg-zinc-900 rounded-sm mb-3 border border-zinc-800 flex items-center justify-center overflow-hidden">
              {/* Show API Data if available, otherwise static */}
              {data && data.home ? (
                <div className="text-xs text-white p-4 whitespace-pre-wrap overflow-auto h-full w-full">
                  {/* Temporarily dump JSON to prove connection */}
                  API Connected! Data received length: {JSON.stringify(data).length} chars.
                  (Real feed implementation needed next)
                </div>
              ) : (
                <img src={post.image} alt="Welcome" className="object-cover w-full h-full" />
              )}
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
              <span className="text-sm font-bold">{post.likes.toLocaleString()} likes</span>
            </div>

            {/* Caption */}
            <div className="px-1 mb-2">
              <span className="text-sm">
                <span className="font-bold mr-2">{post.user.username}</span>
                {post.caption}
              </span>
            </div>

            {/* Comments */}
            <div className="px-1">
              <span className="text-sm text-zinc-500 cursor-pointer">
                View all {post.comments} comments
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
