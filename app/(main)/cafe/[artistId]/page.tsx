"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
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
    Music,
    Disc,
    Play,
    Check,
    LogIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useArtistData } from "@/hooks/useArtistData";
import { useAuth } from "@/components/auth/auth-provider";
import { supabase } from "@/lib/supabase";
import { usePlayer, Track } from "@/contexts/PlayerContext";
import { api } from "@/lib/api";
import type { Album, Song } from "@/lib/services/artist-service";

// ============================================
// Types
// ============================================

interface CafePost {
    id: string;
    user_id: string | null;
    content: string;
    type: string;
    created_at: string;
    likes_count: number;
    user?: {
        display_name: string;
        avatar_url?: string;
    };
    isAI?: boolean;
}

// ============================================
// Cafe Page Component
// ============================================

export default function CafePage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const artistId = params.artistId as string;

    // 아티스트 데이터 (Cache-First + Background Refresh)
    const {
        artist,
        isLoading,
        error,
        isJoined,
        isJoinLoading,
        toggleJoin,
    } = useArtistData(artistId);

    // 게시물 상태
    const [posts, setPosts] = useState<CafePost[]>([]);
    const [postsLoading, setPostsLoading] = useState(true);
    const [newPost, setNewPost] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 플레이어
    const { setPlaylist, toggleQueue, isQueueOpen } = usePlayer();

    // 활성 탭
    const [activeTab, setActiveTab] = useState<"feed" | "music" | "albums">("feed");

    // ============================================
    // 게시물 로드
    // ============================================
    const loadPosts = useCallback(async () => {
        if (!artist?.id) return;

        try {
            setPostsLoading(true);

            const { data, error } = await supabase
                .from("posts")
                .select(`
                    id,
                    user_id,
                    content,
                    type,
                    created_at,
                    likes_count,
                    users:user_id (
                        display_name,
                        avatar_url
                    )
                `)
                .eq("artist_id", artist.id)
                .eq("visibility", "public")
                .order("created_at", { ascending: false })
                .limit(50);

            if (error) {
                console.error("[CafePage] Posts load error:", error);
                return;
            }

            const formattedPosts: CafePost[] = (data || []).map((p) => ({
                id: p.id,
                user_id: p.user_id,
                content: p.content,
                type: p.type,
                created_at: p.created_at,
                likes_count: p.likes_count,
                user: Array.isArray(p.users) ? p.users[0] : p.users,
                isAI: p.user_id === null,
            }));

            setPosts(formattedPosts);
        } catch (e) {
            console.error("[CafePage] Posts load error:", e);
        } finally {
            setPostsLoading(false);
        }
    }, [artist?.id]);

    useEffect(() => {
        if (artist?.id) {
            loadPosts();
        }
    }, [artist?.id, loadPosts]);

    // ============================================
    // AI 환영 메시지 생성
    // ============================================
    useEffect(() => {
        async function generateWelcomePost() {
            if (!artist || posts.some((p) => p.isAI)) return;

            try {
                const aiResult = await api.ai.getWelcomePost(artistId);
                if (aiResult?.post?.content) {
                    const aiPost: CafePost = {
                        id: "ai-welcome",
                        user_id: null,
                        content: aiResult.post.content,
                        type: "ai_greeting",
                        created_at: new Date().toISOString(),
                        likes_count: Math.floor(Math.random() * 50) + 10,
                        isAI: true,
                    };
                    setPosts((prev) => [aiPost, ...prev]);
                }
            } catch (e) {
                console.error("[CafePage] AI welcome error:", e);
            }
        }

        if (artist && !postsLoading) {
            generateWelcomePost();
        }
    }, [artist, artistId, postsLoading, posts]);

    // ============================================
    // 게시물 작성
    // ============================================
    const handlePostSubmit = async () => {
        if (!newPost.trim() || !user || !artist?.id) return;

        try {
            setIsSubmitting(true);

            const { data, error } = await supabase
                .from("posts")
                .insert({
                    user_id: user.id,
                    artist_id: artist.id,
                    type: "text",
                    content: newPost.trim(),
                    visibility: "public",
                })
                .select(`
                    id,
                    user_id,
                    content,
                    type,
                    created_at,
                    likes_count
                `)
                .single();

            if (error) {
                console.error("[CafePage] Post submit error:", error);
                return;
            }

            // 새 게시물 추가
            const newPostData: CafePost = {
                ...data,
                user: {
                    display_name: user.email?.split("@")[0] || "User",
                },
                isAI: false,
            };

            setPosts((prev) => [newPostData, ...prev]);
            setNewPost("");
        } catch (e) {
            console.error("[CafePage] Post submit error:", e);
        } finally {
            setIsSubmitting(false);
        }
    };

    // ============================================
    // 음악 재생
    // ============================================
    const playTopSongs = () => {
        const songs = artist?.artist_data?.top_songs || [];
        if (songs.length === 0) return;

        const tracks: Track[] = songs.map((s: Song) => ({
            videoId: s.videoId,
            title: s.title,
            artist: s.artists?.map((a) => a.name).join(", ") || artist?.name || "",
            thumbnail: s.thumbnail || artist?.artist_data?.thumbnail_url || "",
        }));

        setPlaylist(tracks, 0);
        if (!isQueueOpen) toggleQueue();
    };

    const playAlbum = async (album: Album) => {
        try {
            const albumData = await api.music.album(album.browseId);
            if (albumData?.tracks) {
                const tracks: Track[] = albumData.tracks
                    .filter((t: { videoId?: string }) => t.videoId)
                    .map((t: { videoId: string; title?: string; artists?: { name: string }[] }) => ({
                        videoId: t.videoId,
                        title: t.title || "Unknown",
                        artist: t.artists?.map((a) => a.name).join(", ") || artist?.name || "",
                        thumbnail: album.thumbnail || "",
                    }));

                if (tracks.length > 0) {
                    setPlaylist(tracks, 0);
                    if (!isQueueOpen) toggleQueue();
                }
            }
        } catch (e) {
            console.error("[CafePage] Album play error:", e);
        }
    };

    // ============================================
    // 시간 포맷
    // ============================================
    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return "방금 전";
        if (minutes < 60) return `${minutes}분 전`;
        if (hours < 24) return `${hours}시간 전`;
        if (days < 7) return `${days}일 전`;
        return date.toLocaleDateString("ko-KR");
    };

    // ============================================
    // 로딩 상태
    // ============================================
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#667eea] mx-auto mb-4" />
                    <p className="text-zinc-400">아티스트 정보를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    // ============================================
    // 에러 상태
    // ============================================
    if (error || !artist) {
        return (
            <div className="max-w-4xl mx-auto py-8 px-4">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-zinc-400 hover:text-white mb-4">
                    <ArrowLeft className="w-5 h-5" />
                    뒤로
                </button>
                <div className="text-center py-20">
                    <Music className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">아티스트를 찾을 수 없습니다</h2>
                    <p className="text-zinc-400">{error || "잠시 후 다시 시도해주세요"}</p>
                </div>
            </div>
        );
    }

    const artistData = artist.artist_data;

    // ============================================
    // 렌더링
    // ============================================
    return (
        <div className="min-h-screen bg-[linear-gradient(135deg,#0f0f23_0%,#1a1a2e_100%)] pb-20">
            {/* Hero Banner */}
            <div className="relative w-full h-48 md:h-64 bg-gradient-to-r from-[#667eea] to-[#764ba2]">
                {artistData?.banner_url && (
                    <Image
                        src={artistData.banner_url}
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
                    <span className="text-sm">뒤로</span>
                </button>
            </div>

            {/* Artist Info Card */}
            <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-10">
                <div className="bg-[#1a1a2e]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        {/* Avatar */}
                        <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-[#667eea] shadow-lg shadow-[#667eea]/30 flex-shrink-0 relative">
                            {artistData?.thumbnail_url || artist.thumbnail_url ? (
                                <Image
                                    src={artistData?.thumbnail_url || artist.thumbnail_url || ""}
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
                            {artistData?.subscribers && (
                                <p className="text-zinc-400 text-sm mb-4">{artistData.subscribers} subscribers</p>
                            )}

                            {/* Stats */}
                            <div className="flex items-center justify-center md:justify-start gap-6 text-sm">
                                <div className="flex items-center gap-2 text-zinc-400">
                                    <Users className="w-4 h-4" />
                                    <span>{(artistData?.follower_count || 0).toLocaleString()} members</span>
                                </div>
                                <div className="flex items-center gap-2 text-zinc-400">
                                    <MessageSquare className="w-4 h-4" />
                                    <span>{(artistData?.post_count || posts.length)} posts</span>
                                </div>
                            </div>
                        </div>

                        {/* Join Button */}
                        {user ? (
                            <button
                                onClick={toggleJoin}
                                disabled={isJoinLoading}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all",
                                    isJoined
                                        ? "bg-white/10 text-white border border-white/20"
                                        : "bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white hover:shadow-lg hover:shadow-[#667eea]/30"
                                )}
                            >
                                {isJoinLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : isJoined ? (
                                    <Check className="w-5 h-5" />
                                ) : (
                                    <UserPlus className="w-5 h-5" />
                                )}
                                {isJoined ? "가입됨" : "카페 가입"}
                            </button>
                        ) : (
                            <button
                                onClick={() => router.push("/login")}
                                className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white hover:shadow-lg hover:shadow-[#667eea]/30 transition-all"
                            >
                                <LogIn className="w-5 h-5" />
                                로그인하고 가입
                            </button>
                        )}
                    </div>

                    {/* Description */}
                    {artistData?.description && (
                        <p className="mt-4 text-zinc-400 text-sm leading-relaxed border-t border-white/10 pt-4">
                            {artistData.description.slice(0, 300)}
                            {artistData.description.length > 300 && "..."}
                        </p>
                    )}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="max-w-4xl mx-auto px-4 mt-6">
                <div className="flex gap-2 border-b border-white/10 pb-2">
                    {[
                        { id: "feed", label: "피드", icon: MessageSquare },
                        { id: "music", label: "인기곡", icon: Music },
                        { id: "albums", label: "앨범", icon: Disc },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as typeof activeTab)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
                                activeTab === tab.id
                                    ? "bg-[#667eea]/20 text-[#667eea]"
                                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
                {/* Feed Tab */}
                {activeTab === "feed" && (
                    <>
                        {/* Post Input */}
                        {user ? (
                            <div className="bg-[#1a1a2e]/80 border border-white/10 rounded-xl p-4">
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#667eea] to-[#764ba2] flex items-center justify-center text-white font-bold flex-shrink-0">
                                        {user.email?.[0].toUpperCase() || "U"}
                                    </div>
                                    <div className="flex-1">
                                        <textarea
                                            value={newPost}
                                            onChange={(e) => setNewPost(e.target.value)}
                                            placeholder="팬들과 함께 이야기를 나눠보세요..."
                                            className="w-full bg-transparent text-white placeholder:text-zinc-500 resize-none focus:outline-none min-h-[60px]"
                                            rows={2}
                                        />
                                        <div className="flex justify-end">
                                            <button
                                                onClick={handlePostSubmit}
                                                disabled={!newPost.trim() || isSubmitting}
                                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[#667eea]/30 transition-all"
                                            >
                                                {isSubmitting ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Send className="w-4 h-4" />
                                                )}
                                                게시
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-[#1a1a2e]/80 border border-white/10 rounded-xl p-6 text-center">
                                <p className="text-zinc-400 mb-4">로그인하고 팬들과 함께 이야기를 나눠보세요!</p>
                                <button
                                    onClick={() => router.push("/login")}
                                    className="px-6 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full text-white font-medium"
                                >
                                    로그인
                                </button>
                            </div>
                        )}

                        {/* Posts Feed */}
                        <div className="space-y-4">
                            {postsLoading ? (
                                <div className="text-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-zinc-400 mx-auto" />
                                </div>
                            ) : posts.length === 0 ? (
                                <div className="text-center py-12 text-zinc-500">
                                    아직 게시물이 없습니다. 첫 번째 게시물을 작성해보세요!
                                </div>
                            ) : (
                                posts.map((post) => (
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
                                            <div
                                                className={cn(
                                                    "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0",
                                                    post.isAI
                                                        ? "bg-gradient-to-r from-[#667eea] to-[#764ba2]"
                                                        : "bg-zinc-700"
                                                )}
                                            >
                                                {post.isAI ? (
                                                    <Sparkles className="w-5 h-5" />
                                                ) : (
                                                    (post.user?.display_name?.[0] || "U").toUpperCase()
                                                )}
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span
                                                        className={cn(
                                                            "font-semibold",
                                                            post.isAI ? "text-[#667eea]" : "text-white"
                                                        )}
                                                    >
                                                        {post.isAI ? artist.name : post.user?.display_name || "User"}
                                                    </span>
                                                    {post.isAI && (
                                                        <span className="px-2 py-0.5 bg-[#667eea]/20 text-[#667eea] text-xs rounded-full font-medium">
                                                            AI
                                                        </span>
                                                    )}
                                                    <span className="text-zinc-500 text-sm">
                                                        {formatTime(post.created_at)}
                                                    </span>
                                                </div>
                                                <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
                                                    {post.content}
                                                </p>

                                                <div className="flex items-center gap-4 mt-3">
                                                    <button className="flex items-center gap-1 text-zinc-500 hover:text-rose-400 transition-colors text-sm">
                                                        <Heart className="w-4 h-4" />
                                                        <span>{post.likes_count || 0}</span>
                                                    </button>
                                                    <button className="flex items-center gap-1 text-zinc-500 hover:text-[#667eea] transition-colors text-sm">
                                                        <MessageSquare className="w-4 h-4" />
                                                        <span>Reply</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}

                {/* Music Tab */}
                {activeTab === "music" && (
                    <div className="space-y-4">
                        {/* Play All Button */}
                        {artistData?.top_songs && artistData.top_songs.length > 0 && (
                            <button
                                onClick={playTopSongs}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full text-white font-medium hover:shadow-lg hover:shadow-[#667eea]/30 transition-all"
                            >
                                <Play className="w-5 h-5" />
                                전체 재생
                            </button>
                        )}

                        {/* Song List */}
                        <div className="space-y-2">
                            {(artistData?.top_songs || []).map((song: Song, index: number) => (
                                <button
                                    key={song.videoId}
                                    onClick={() => {
                                        setPlaylist(
                                            [
                                                {
                                                    videoId: song.videoId,
                                                    title: song.title,
                                                    artist: song.artists?.map((a) => a.name).join(", ") || artist.name,
                                                    thumbnail: song.thumbnail || artistData?.thumbnail_url || "",
                                                },
                                            ],
                                            0
                                        );
                                        if (!isQueueOpen) toggleQueue();
                                    }}
                                    className="w-full flex items-center gap-4 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all group"
                                >
                                    <span className="w-8 text-zinc-500 text-sm">{index + 1}</span>
                                    <div className="w-12 h-12 rounded-lg overflow-hidden relative flex-shrink-0">
                                        {song.thumbnail ? (
                                            <Image
                                                src={song.thumbnail}
                                                alt={song.title}
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                                                <Music className="w-5 h-5 text-zinc-600" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <Play className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="text-white font-medium truncate">{song.title}</p>
                                        <p className="text-zinc-400 text-sm truncate">
                                            {song.artists?.map((a) => a.name).join(", ") || artist.name}
                                        </p>
                                    </div>
                                    {song.plays && <span className="text-zinc-500 text-sm">{song.plays}</span>}
                                </button>
                            ))}
                        </div>

                        {(!artistData?.top_songs || artistData.top_songs.length === 0) && (
                            <div className="text-center py-12 text-zinc-500">인기곡 정보가 없습니다</div>
                        )}
                    </div>
                )}

                {/* Albums Tab */}
                {activeTab === "albums" && (
                    <div className="space-y-6">
                        {/* Albums */}
                        {artistData?.albums && artistData.albums.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-4">앨범</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {artistData.albums.map((album: Album) => (
                                        <button
                                            key={album.browseId}
                                            onClick={() => playAlbum(album)}
                                            className="group text-left"
                                        >
                                            <div className="aspect-square rounded-xl overflow-hidden relative mb-2">
                                                {album.thumbnail ? (
                                                    <Image
                                                        src={album.thumbnail}
                                                        alt={album.title}
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition-transform"
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                                                        <Disc className="w-12 h-12 text-zinc-600" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <Play className="w-12 h-12 text-white" />
                                                </div>
                                            </div>
                                            <p className="text-white font-medium truncate">{album.title}</p>
                                            <p className="text-zinc-400 text-sm">{album.year || ""}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Singles */}
                        {artistData?.singles && artistData.singles.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-4">싱글 & EP</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {artistData.singles.map((single: Album) => (
                                        <button
                                            key={single.browseId}
                                            onClick={() => playAlbum(single)}
                                            className="group text-left"
                                        >
                                            <div className="aspect-square rounded-xl overflow-hidden relative mb-2">
                                                {single.thumbnail ? (
                                                    <Image
                                                        src={single.thumbnail}
                                                        alt={single.title}
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition-transform"
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                                                        <Disc className="w-12 h-12 text-zinc-600" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <Play className="w-12 h-12 text-white" />
                                                </div>
                                            </div>
                                            <p className="text-white font-medium truncate">{single.title}</p>
                                            <p className="text-zinc-400 text-sm">{single.year || ""}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(!artistData?.albums || artistData.albums.length === 0) &&
                            (!artistData?.singles || artistData.singles.length === 0) && (
                                <div className="text-center py-12 text-zinc-500">앨범 정보가 없습니다</div>
                            )}
                    </div>
                )}
            </div>
        </div>
    );
}
