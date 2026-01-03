"use client";

import Image from "next/image";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";


interface PostProps {
    username: string;
    avatarUrl: string;
    imageUrl: string;
    caption: string;
    timestamp: string;
    likes: number;
}

export default function Post({ username, imageUrl, caption, timestamp, likes }: Readonly<PostProps>) {
    return (
        <article className="border-b border-zinc-800 pb-6 mb-6">
            {/* Header */}
            <div className="flex items-center justify-between py-3 px-1">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[2px]">
                        <div className="w-full h-full rounded-full bg-black border-2 border-black overflow-hidden relative">
                            {/* Fallback avatar */}
                            <div className="w-full h-full bg-zinc-700" />
                        </div>
                    </div>
                    <span className="font-semibold text-sm">{username}</span>
                    <span className="text-zinc-500 text-xs">• {timestamp}</span>
                </div>
                <button className="text-white hover:opacity-50">
                    <MoreHorizontal className="w-5 h-5" />
                </button>
            </div>

            {/* Media */}
            <div className="relative aspect-square w-full rounded-md overflow-hidden bg-zinc-900 border border-zinc-800">
                <Image
                    src={imageUrl}
                    alt={`Post by ${username}`}
                    fill
                    className="object-cover"
                />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-4">
                    <button className="hover:opacity-50">
                        <Heart className="w-6 h-6" />
                    </button>
                    <button className="hover:opacity-50">
                        <MessageCircle className="w-6 h-6" />
                    </button>
                    <button className="hover:opacity-50">
                        <Send className="w-6 h-6" />
                    </button>
                </div>
                <button className="hover:opacity-50">
                    <Bookmark className="w-6 h-6" />
                </button>
            </div>

            {/* Likes & Caption */}
            <div className="px-1 space-y-2">
                <p className="font-semibold text-sm">{likes.toLocaleString()} likes</p>
                <div className="text-sm">
                    <span className="font-semibold mr-2">{username}</span>
                    <span className="text-zinc-200">{caption}</span>
                </div>
                <button className="text-zinc-500 text-sm">View all comments</button>
            </div>
        </article>
    );
}
