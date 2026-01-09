/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import {
    ArrowLeft,
    Users,
    MessageSquare,
    Heart,
    Send,
    Loader2,
    Sparkles,
    UserPlus,
    Crown,
    Music
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface CafeArtist {
    id: string;
    channel_id: string;
    name: string;
    thumbnail_url?: string;
    banner_url?: string;
    description?: string;
    subscribers?: string;
    slug?: string;
    platform_followers?: number;
    total_posts?: number;
}

interface CafePost {
    id: string;
    author: string;
    avatar?: string;
    content: string;
    timestamp: string;
    likes: number;
    isAI?: boolean;
}

// Mock data for demo
const MOCK_POSTS: CafePost[] = [
    {
        id: "1",
        author: "AI Artist",
        content: "안녕하세요 팬 여러분! 오늘도 카페에 와주셔서 감사합니다 💜",
        timestamp: "방금 전",
        likes: 24,
        isAI: true
    },
    {
        id: "2",
        author: "Fan123",
        avatar: "",
        content: "새 앨범 너무 기대돼요! 🎵",
        timestamp: "5분 전",
        likes: 12
    },
    {
        id: "3",
        author: "MusicLover",
        avatar: "",
        content: "콘서트 때 만나요~!! ✨",
        timestamp: "10분 전",
        likes: 8
    }
];

export default function CafePage() {
    const params = useParams();
    const router = useRouter();
    const artistId = params.artistId as string;

    const [artist, setArtist] = useState<CafeArtist | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [posts, setPosts] = useState<CafePost[]>(MOCK_POSTS);
    const [newPost, setNewPost] = useState("");
    const [isJoined, setIsJoined] = useState(false);
    const [memberCount] = useState(1247);

    useEffect(() => {
        async function fetchArtist() {
            try {
                setIsLoading(true);
                // Try to get registered artist first
                let data = await api.artists.get(artistId);

                if (!data) {
                    // If not registered, fetch from music API and register
                    const musicData = await api.music.artist(artistId);
                    if (musicData) {
                        const thumbnail = musicData.thumbnails?.[musicData.thumbnails.length - 1]?.url;
                        await api.artists.register({
                            channel_id: artistId,
                            name: musicData.name,
                            thumbnail_url: thumbnail,
                            description: musicData.description,
                            subscribers: musicData.subscribers
                        });
                        data = {
                            id: artistId,
                            channel_id: artistId,
                            name: musicData.name,
                            thumbnail_url: thumbnail,
                            description: musicData.description,
                            subscribers: musicData.subscribers
                        };
                    }
                }

                setArtist(data);
            } catch (e: any) {
                setError(e.message || "Failed to load cafe");
            } finally {
                setIsLoading(false);
            }
        }

        if (artistId) {
            fetchArtist();
        }
    }, [artistId]);

    const handlePostSubmit = () => {
        if (!newPost.trim()) return;

        const post: CafePost = {
            id: Date.now().toString(),
            author: "You",
            content: newPost,
            timestamp: "방금 전",
            likes: 0
        };

        setPosts([post, ...posts]);
        setNewPost("");
    };

    const handleJoin = () => {
        setIsJoined(!isJoined);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            </div>
        );
    }

    if (error || !artist) {
        return (
            <div className="max-w-4xl mx-auto py-8 px-4">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-zinc-400 hover:text-white mb-4">
                    <ArrowLeft className="w-5 h-5" />
                    Back
                </button>
                <div className="text-red-500">Error: {error || "Cafe not found"}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[linear-gradient(135deg,#0f0f23_0%,#1a1a2e_100%)] pb-20">
            {/* Hero Banner */}
            <div className="relative w-full h-48 md:h-64 bg-gradient-to-r from-[#667eea] to-[#764ba2]">
                {artist.banner_url && (
                    <Image
                        src={artist.banner_url}
                        alt={artist.name}
                        fill
                        className="object-cover opacity-50"
                        unoptimized
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f23] to-transparent" />

                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 bg-black/30 backdrop-blur-sm rounded-full text-white/80 hover:text-white transition-colors z-10"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">Back</span>
                </button>
            </div>

            {/* Artist Info Card */}
            <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-10">
                <div className="bg-[#1a1a2e]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        {/* Avatar */}
                        <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-[#667eea] shadow-lg shadow-[#667eea]/30 flex-shrink-0 relative">
                            {artist.thumbnail_url ? (
                                <Image
                                    src={artist.thumbnail_url}
                                    alt={artist.name}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            ) : (
                                <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                                    <Music className="w-12 h-12 text-zinc-600" />
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                <h1 className="text-2xl md:text-3xl font-bold text-white">{artist.name}</h1>
                                <Crown className="w-5 h-5 text-yellow-400" />
                            </div>
                            <p className="text-[#667eea] text-sm font-medium mb-2">Official Fan Cafe</p>
                            {artist.subscribers && (
                                <p className="text-zinc-400 text-sm mb-4">{artist.subscribers} subscribers</p>
                            )}

                            {/* Stats */}
                            <div className="flex items-center justify-center md:justify-start gap-6 text-sm">
                                <div className="flex items-center gap-2 text-zinc-400">
                                    <Users className="w-4 h-4" />
                                    <span>{memberCount.toLocaleString()} members</span>
                                </div>
                                <div className="flex items-center gap-2 text-zinc-400">
                                    <MessageSquare className="w-4 h-4" />
                                    <span>{posts.length} posts</span>
                                </div>
                            </div>
                        </div>

                        {/* Join Button */}
                        <button
                            onClick={handleJoin}
                            className={cn(
                                "flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all",
                                isJoined
                                    ? "bg-white/10 text-white border border-white/20"
                                    : "bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white hover:shadow-lg hover:shadow-[#667eea]/30"
                            )}
                        >
                            <UserPlus className="w-5 h-5" />
                            {isJoined ? "Joined ✓" : "Join Cafe"}
                        </button>
                    </div>

                    {/* Description */}
                    {artist.description && (
                        <p className="mt-4 text-zinc-400 text-sm leading-relaxed border-t border-white/10 pt-4">
                            {artist.description.slice(0, 200)}...
                        </p>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
                {/* Post Input */}
                <div className="bg-[#1a1a2e]/80 border border-white/10 rounded-xl p-4">
                    <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#667eea] to-[#764ba2] flex items-center justify-center text-white font-bold flex-shrink-0">
                            U
                        </div>
                        <div className="flex-1">
                            <textarea
                                value={newPost}
                                onChange={(e) => setNewPost(e.target.value)}
                                placeholder="Write something for the community..."
                                className="w-full bg-transparent text-white placeholder:text-zinc-500 resize-none focus:outline-none min-h-[60px]"
                                rows={2}
                            />
                            <div className="flex justify-end">
                                <button
                                    onClick={handlePostSubmit}
                                    disabled={!newPost.trim()}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[#667eea]/30 transition-all"
                                >
                                    <Send className="w-4 h-4" />
                                    Post
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Posts Feed */}
                <div className="space-y-4">
                    {posts.map((post) => (
                        <div
                            key={post.id}
                            className={cn(
                                "bg-[#1a1a2e]/80 border rounded-xl p-4",
                                post.isAI
                                    ? "border-[#667eea]/30 bg-gradient-to-r from-[#667eea]/5 to-[#764ba2]/5"
                                    : "border-white/10"
                            )}
                        >
                            <div className="flex gap-3">
                                {/* Avatar */}
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0",
                                    post.isAI
                                        ? "bg-gradient-to-r from-[#667eea] to-[#764ba2]"
                                        : "bg-zinc-700"
                                )}>
                                    {post.isAI ? (
                                        <Sparkles className="w-5 h-5" />
                                    ) : (
                                        post.author[0].toUpperCase()
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={cn(
                                            "font-semibold",
                                            post.isAI ? "text-[#667eea]" : "text-white"
                                        )}>
                                            {post.isAI ? artist.name : post.author}
                                        </span>
                                        {post.isAI && (
                                            <span className="px-2 py-0.5 bg-[#667eea]/20 text-[#667eea] text-xs rounded-full font-medium">
                                                AI
                                            </span>
                                        )}
                                        <span className="text-zinc-500 text-sm">{post.timestamp}</span>
                                    </div>
                                    <p className="text-white/80 text-sm leading-relaxed">{post.content}</p>

                                    {/* Actions */}
                                    <div className="flex items-center gap-4 mt-3">
                                        <button className="flex items-center gap-1 text-zinc-500 hover:text-rose-400 transition-colors text-sm">
                                            <Heart className="w-4 h-4" />
                                            <span>{post.likes}</span>
                                        </button>
                                        <button className="flex items-center gap-1 text-zinc-500 hover:text-[#667eea] transition-colors text-sm">
                                            <MessageSquare className="w-4 h-4" />
                                            <span>Reply</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
