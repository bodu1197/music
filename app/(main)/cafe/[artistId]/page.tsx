/* eslint-disable @typescript-eslint/no-explicit-any */
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
    Video,
    ChevronDown,
    Shuffle,
    Radio,
    ThumbsDown,
    Flag,
    MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useArtistData } from "@/hooks/useArtistData";
import { useAuth } from "@/components/auth/auth-provider";
import { supabase } from "@/lib/supabase";
import { usePlayer, Track } from "@/contexts/PlayerContext";
import { api } from "@/lib/api";
import {
    toggleReaction,
    reportPost,
    ReactionType,
    ReportReason,
} from "@/lib/services/notification-service";

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
    dislikes_count?: number;
    user?: {
        display_name: string;
        avatar_url?: string;
    };
    isAI?: boolean;
    myReaction?: ReactionType | null;
}

interface ArtistAPIData {
    name: string;
    description?: string;
    subscribers?: string;
    views?: string;
    thumbnails?: { url: string; width: number; height: number }[];
    shuffleId?: string;
    radioId?: string;
    songs?: {
        browseId?: string;
        results?: any[];
    };
    albums?: {
        browseId?: string;
        params?: string;
        results?: any[];
    };
    singles?: {
        browseId?: string;
        params?: string;
        results?: any[];
    };
    videos?: {
        browseId?: string;
        results?: any[];
    };
    related?: {
        results?: any[];
    };
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

    // 실시간 API 데이터
    const [apiData, setApiData] = useState<ArtistAPIData | null>(null);
    const [apiLoading, setApiLoading] = useState(false);

    // 확장 데이터 상태 (Show All 버튼용)
    const [allSongs, setAllSongs] = useState<any[] | null>(null);
    const [allAlbums, setAllAlbums] = useState<any[] | null>(null);
    const [allSingles, setAllSingles] = useState<any[] | null>(null);
    const [loadingSongs, setLoadingSongs] = useState(false);
    const [loadingAlbums, setLoadingAlbums] = useState(false);
    const [loadingSingles, setLoadingSingles] = useState(false);

    // 게시물 상태
    const [posts, setPosts] = useState<CafePost[]>([]);
    const [postsLoading, setPostsLoading] = useState(true);
    const [newPost, setNewPost] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [postError, setPostError] = useState<string | null>(null);

    // 플레이어
    const { setPlaylist, toggleQueue, isQueueOpen } = usePlayer();

    // 활성 탭
    const [activeTab, setActiveTab] = useState<"feed" | "music" | "albums" | "videos" | "related">("feed");

    // 앨범 재생 로딩
    const [playingId, setPlayingId] = useState<string | null>(null);

    // 반응 상태
    const [reactingPostId, setReactingPostId] = useState<string | null>(null);

    // 신고 모달
    const [reportingPost, setReportingPost] = useState<CafePost | null>(null);
    const [reportReason, setReportReason] = useState<ReportReason>("spam");
    const [reportDescription, setReportDescription] = useState("");
    const [isReporting, setIsReporting] = useState(false);

    // ============================================
    // 실시간 API 데이터 로드
    // ============================================
    useEffect(() => {
        async function fetchAPIData() {
            if (!artistId) return;

            try {
                setApiLoading(true);
                const data = await api.music.artist(artistId);
                setApiData(data);
            } catch (e) {
                console.error("[CafePage] API fetch error:", e);
            } finally {
                setApiLoading(false);
            }
        }

        fetchAPIData();
    }, [artistId]);

    // ============================================
    // 전체 노래 로드
    // ============================================
    const handleLoadAllSongs = async () => {
        if (loadingSongs || allSongs) return;
        setLoadingSongs(true);
        try {
            const data = await api.music.artistSongs(artistId);
            setAllSongs(data.tracks || []);
        } catch (e) {
            console.error("Failed to load all songs:", e);
        } finally {
            setLoadingSongs(false);
        }
    };

    // ============================================
    // 전체 앨범 로드
    // ============================================
    const handleLoadAllAlbums = async () => {
        if (loadingAlbums || allAlbums) return;
        setLoadingAlbums(true);
        try {
            const data = await api.music.artistAlbums(artistId, "albums");
            setAllAlbums(data.items || []);
        } catch (e) {
            console.error("Failed to load all albums:", e);
        } finally {
            setLoadingAlbums(false);
        }
    };

    // ============================================
    // 전체 싱글 로드
    // ============================================
    const handleLoadAllSingles = async () => {
        if (loadingSingles || allSingles) return;
        setLoadingSingles(true);
        try {
            const data = await api.music.artistAlbums(artistId, "singles");
            setAllSingles(data.items || []);
        } catch (e) {
            console.error("Failed to load all singles:", e);
        } finally {
            setLoadingSingles(false);
        }
    };

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

        // 가입한 회원만 글 작성 가능
        if (!isJoined) {
            setPostError("카페에 가입한 회원만 글을 작성할 수 있습니다.");
            return;
        }

        try {
            setIsSubmitting(true);
            setPostError(null);

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
                setPostError("글 등록에 실패했습니다. 다시 시도해주세요.");
                return;
            }

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
            setPostError("글 등록 중 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ============================================
    // 반응 핸들러 (좋아요/싫어요)
    // ============================================
    const handleReaction = async (postId: string, type: ReactionType) => {
        if (!user) {
            router.push("/login");
            return;
        }

        setReactingPostId(postId);

        try {
            const result = await toggleReaction(user.id, postId, type);

            // 로컬 상태 업데이트
            setPosts((prev) =>
                prev.map((p) => {
                    if (p.id !== postId) return p;

                    const oldReaction = p.myReaction;
                    let newLikes = p.likes_count;
                    let newDislikes = p.dislikes_count || 0;

                    // 기존 반응 제거
                    if (oldReaction === "like") newLikes--;
                    if (oldReaction === "dislike") newDislikes--;

                    // 새 반응 추가
                    if (result.newType === "like") newLikes++;
                    if (result.newType === "dislike") newDislikes++;

                    return {
                        ...p,
                        likes_count: Math.max(0, newLikes),
                        dislikes_count: Math.max(0, newDislikes),
                        myReaction: result.newType,
                    };
                })
            );
        } catch (e) {
            console.error("[CafePage] Reaction error:", e);
        } finally {
            setReactingPostId(null);
        }
    };

    // ============================================
    // 신고 핸들러
    // ============================================
    const handleReport = async () => {
        if (!user || !reportingPost) return;

        setIsReporting(true);

        try {
            const success = await reportPost(
                user.id,
                reportingPost.id,
                reportReason,
                reportDescription || undefined
            );

            if (success) {
                alert("신고가 접수되었습니다.");
                setReportingPost(null);
                setReportReason("spam");
                setReportDescription("");
            } else {
                alert("신고 처리에 실패했습니다.");
            }
        } catch (e) {
            console.error("[CafePage] Report error:", e);
            alert("신고 처리 중 오류가 발생했습니다.");
        } finally {
            setIsReporting(false);
        }
    };

    // ============================================
    // 음악 재생 핸들러
    // ============================================
    const handlePlaySong = (item: any) => {
        if (!item.videoId) return;
        const track: Track = {
            videoId: item.videoId,
            title: item.title || "Unknown",
            artist: item.artists?.map((a: any) => a.name).join(", ") || apiData?.name || artist?.name || "Unknown",
            thumbnail: item.thumbnails?.[item.thumbnails.length - 1]?.url || "/images/default-album.svg",
        };
        setPlaylist([track], 0);
        if (!isQueueOpen) toggleQueue();
    };

    const handlePlayAll = () => {
        const songs = allSongs || apiData?.songs?.results || [];
        if (songs.length === 0) return;

        const tracks: Track[] = songs
            .filter((s: any) => s.videoId)
            .map((s: any) => ({
                videoId: s.videoId,
                title: s.title || "Unknown",
                artist: s.artists?.map((a: any) => a.name).join(", ") || apiData?.name || artist?.name || "Unknown",
                thumbnail: s.thumbnails?.[s.thumbnails.length - 1]?.url || "/images/default-album.svg",
            }));

        if (tracks.length > 0) {
            setPlaylist(tracks, 0);
            if (!isQueueOpen) toggleQueue();
        }
    };

    const handlePlayAlbum = async (albumId: string) => {
        setPlayingId(albumId);
        try {
            const albumData = await api.music.album(albumId);
            if (albumData?.tracks) {
                const tracks: Track[] = albumData.tracks
                    .filter((t: any) => t.videoId)
                    .map((t: any) => ({
                        videoId: t.videoId,
                        title: t.title || "Unknown",
                        artist: t.artists?.map((a: any) => a.name).join(", ") || apiData?.name || artist?.name || "Unknown",
                        thumbnail: albumData.thumbnails?.[albumData.thumbnails.length - 1]?.url || "/images/default-album.svg",
                    }));

                if (tracks.length > 0) {
                    setPlaylist(tracks, 0);
                    if (!isQueueOpen) toggleQueue();
                }
            }
        } catch (e) {
            console.error("Album fetch error:", e);
        } finally {
            setPlayingId(null);
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
    const thumbnail = apiData?.thumbnails?.[apiData.thumbnails.length - 1]?.url || artistData?.thumbnail_url || artist.thumbnail_url;

    // 실시간 데이터 (API에서 가져온 데이터 우선 사용)
    const displaySongs = allSongs || apiData?.songs?.results || [];
    const displayAlbums = allAlbums || apiData?.albums?.results || [];
    const displaySingles = allSingles || apiData?.singles?.results || [];
    const displayVideos = apiData?.videos?.results || [];
    const displayRelated = apiData?.related?.results || [];
    const hasSongsBrowseId = !!apiData?.songs?.browseId;
    const hasAlbumsBrowseId = !!apiData?.albums?.browseId;
    const hasSinglesBrowseId = !!apiData?.singles?.browseId;

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
            <div className="max-w-5xl mx-auto px-4 -mt-20 relative z-10">
                <div className="bg-[#1a1a2e]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        {/* Avatar */}
                        <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-[#667eea] shadow-lg shadow-[#667eea]/30 flex-shrink-0 relative">
                            {thumbnail ? (
                                <Image
                                    src={thumbnail}
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
                            {(apiData?.subscribers || artistData?.subscribers) && (
                                <p className="text-zinc-400 text-sm mb-2">{apiData?.subscribers || artistData?.subscribers}</p>
                            )}
                            {apiData?.views && (
                                <p className="text-zinc-500 text-xs mb-4">{apiData.views}</p>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-3 justify-center md:justify-start mb-4">
                                <button
                                    onClick={handlePlayAll}
                                    disabled={displaySongs.length === 0}
                                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:shadow-lg hover:shadow-[#667eea]/25 text-white font-bold rounded-full transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Play className="w-5 h-5 fill-current" />
                                    Play
                                </button>
                                {apiData?.shuffleId && (
                                    <button className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold rounded-full transition-all hover:scale-105 backdrop-blur-sm">
                                        <Shuffle className="w-5 h-5" />
                                        Shuffle
                                    </button>
                                )}
                                {apiData?.radioId && (
                                    <button className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold rounded-full transition-all hover:scale-105 backdrop-blur-sm">
                                        <Radio className="w-5 h-5" />
                                        Radio
                                    </button>
                                )}
                            </div>

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
                    {(apiData?.description || artistData?.description) && (
                        <p className="mt-4 text-zinc-400 text-sm leading-relaxed border-t border-white/10 pt-4">
                            {(apiData?.description || artistData?.description || "").slice(0, 300)}
                            {(apiData?.description || artistData?.description || "").length > 300 && "..."}
                        </p>
                    )}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="max-w-5xl mx-auto px-4 mt-6">
                <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
                    {[
                        { id: "feed", label: "피드", icon: MessageSquare },
                        { id: "music", label: `노래${displaySongs.length > 0 ? ` (${displaySongs.length}${!allSongs && hasSongsBrowseId ? '+' : ''})` : ''}`, icon: Music },
                        { id: "albums", label: `앨범${displayAlbums.length > 0 ? ` (${displayAlbums.length}${!allAlbums && hasAlbumsBrowseId ? '+' : ''})` : ''}`, icon: Disc },
                        { id: "videos", label: `뮤비${displayVideos.length > 0 ? ` (${displayVideos.length})` : ''}`, icon: Video },
                        { id: "related", label: "비슷한 아티스트", icon: Users },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as typeof activeTab)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap text-sm",
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
            <div className="max-w-5xl mx-auto px-4 mt-6 space-y-6">
                {/* API Loading Indicator */}
                {apiLoading && activeTab !== "feed" && (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-[#667eea]" />
                        <span className="ml-2 text-zinc-400">음악 데이터 로딩 중...</span>
                    </div>
                )}

                {/* Feed Tab */}
                {activeTab === "feed" && (
                    <>
                        {/* Post Input */}
                        {user && isJoined ? (
                            <div className="bg-[#1a1a2e]/80 border border-white/10 rounded-xl p-4">
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#667eea] to-[#764ba2] flex items-center justify-center text-white font-bold flex-shrink-0">
                                        {user.email?.[0].toUpperCase() || "U"}
                                    </div>
                                    <div className="flex-1">
                                        <textarea
                                            value={newPost}
                                            onChange={(e) => {
                                                setNewPost(e.target.value);
                                                if (postError) setPostError(null);
                                            }}
                                            placeholder="팬들과 함께 이야기를 나눠보세요..."
                                            className="w-full bg-transparent text-white placeholder:text-zinc-500 resize-none focus:outline-none min-h-[60px]"
                                            rows={2}
                                        />
                                        {/* Error Message */}
                                        {postError && (
                                            <div className="text-rose-400 text-sm mb-2">{postError}</div>
                                        )}
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
                        ) : user && !isJoined ? (
                            <div className="bg-[#1a1a2e]/80 border border-[#667eea]/30 rounded-xl p-6 text-center">
                                <UserPlus className="w-8 h-8 text-[#667eea] mx-auto mb-3" />
                                <p className="text-zinc-400 mb-4">카페에 가입한 회원만 글을 작성할 수 있습니다.</p>
                                <button
                                    onClick={toggleJoin}
                                    disabled={isJoinLoading}
                                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full text-white font-medium mx-auto disabled:opacity-50"
                                >
                                    {isJoinLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <UserPlus className="w-4 h-4" />
                                    )}
                                    카페 가입하기
                                </button>
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
                                                    {/* 좋아요 */}
                                                    <button
                                                        onClick={() => handleReaction(post.id, "like")}
                                                        disabled={reactingPostId === post.id}
                                                        className={cn(
                                                            "flex items-center gap-1 transition-colors text-sm",
                                                            post.myReaction === "like"
                                                                ? "text-rose-400"
                                                                : "text-zinc-500 hover:text-rose-400"
                                                        )}
                                                    >
                                                        <Heart className={cn("w-4 h-4", post.myReaction === "like" && "fill-current")} />
                                                        <span>{post.likes_count || 0}</span>
                                                    </button>

                                                    {/* 싫어요 */}
                                                    <button
                                                        onClick={() => handleReaction(post.id, "dislike")}
                                                        disabled={reactingPostId === post.id}
                                                        className={cn(
                                                            "flex items-center gap-1 transition-colors text-sm",
                                                            post.myReaction === "dislike"
                                                                ? "text-blue-400"
                                                                : "text-zinc-500 hover:text-blue-400"
                                                        )}
                                                    >
                                                        <ThumbsDown className={cn("w-4 h-4", post.myReaction === "dislike" && "fill-current")} />
                                                        <span>{post.dislikes_count || 0}</span>
                                                    </button>

                                                    {/* 댓글 */}
                                                    <button className="flex items-center gap-1 text-zinc-500 hover:text-[#667eea] transition-colors text-sm">
                                                        <MessageSquare className="w-4 h-4" />
                                                        <span>Reply</span>
                                                    </button>

                                                    {/* 신고 버튼 */}
                                                    <button
                                                        onClick={() => setReportingPost(post)}
                                                        className="flex items-center gap-1 text-zinc-500 hover:text-orange-400 transition-colors text-sm ml-auto"
                                                        title="신고하기"
                                                    >
                                                        <Flag className="w-4 h-4" />
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

                {/* Music Tab - 실시간 API 데이터 */}
                {activeTab === "music" && !apiLoading && (
                    <div className="space-y-4">
                        {/* Header with Show All */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Music className="w-5 h-5" />
                                Songs
                            </h2>
                            {hasSongsBrowseId && !allSongs && (
                                <button
                                    onClick={handleLoadAllSongs}
                                    disabled={loadingSongs}
                                    className="flex items-center gap-1 px-4 py-2 text-sm bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 rounded-full transition-all"
                                >
                                    {loadingSongs ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4" />
                                    )}
                                    Show All
                                </button>
                            )}
                        </div>

                        {/* Song List */}
                        <div className="space-y-1">
                            {displaySongs.map((song: any, i: number) => (
                                <button
                                    key={song.videoId || i}
                                    type="button"
                                    onClick={() => handlePlaySong(song)}
                                    className="w-full flex items-center gap-4 p-4 hover:bg-white/5 border border-transparent hover:border-white/10 rounded-xl cursor-pointer group text-left transition-all"
                                >
                                    <span className="w-6 text-center text-zinc-500 group-hover:hidden font-mono">{i + 1}</span>
                                    <Play className="w-4 h-4 text-[#667eea] hidden group-hover:block" />
                                    <div className="w-12 h-12 bg-white/5 rounded-lg overflow-hidden flex-shrink-0 relative">
                                        {song.thumbnails?.[0]?.url && (
                                            <Image src={song.thumbnails[0].url} alt={song.title} fill className="object-cover" unoptimized />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-medium truncate group-hover:text-[#667eea] transition-colors">{song.title}</h3>
                                        <p className="text-sm text-zinc-400 truncate">
                                            {song.album?.name || ""}
                                        </p>
                                    </div>
                                    <span className="text-zinc-500 text-sm font-mono">{song.duration}</span>
                                </button>
                            ))}
                        </div>

                        {displaySongs.length === 0 && (
                            <div className="text-center py-12 text-zinc-500">노래 정보가 없습니다</div>
                        )}
                    </div>
                )}

                {/* Albums Tab - 실시간 API 데이터 */}
                {activeTab === "albums" && !apiLoading && (
                    <div className="space-y-8">
                        {/* Albums Section */}
                        {displayAlbums.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Disc className="w-5 h-5" />
                                        Albums
                                    </h2>
                                    {hasAlbumsBrowseId && !allAlbums && (
                                        <button
                                            onClick={handleLoadAllAlbums}
                                            disabled={loadingAlbums}
                                            className="flex items-center gap-1 px-4 py-2 text-sm bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 rounded-full transition-all"
                                        >
                                            {loadingAlbums ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4" />
                                            )}
                                            Show All
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                    {displayAlbums.map((album: any, i: number) => (
                                        <button
                                            key={album.browseId || i}
                                            type="button"
                                            onClick={() => album.browseId && handlePlayAlbum(album.browseId)}
                                            className="group cursor-pointer text-left w-full"
                                        >
                                            <div className="relative aspect-square mb-3 bg-white/5 rounded-xl overflow-hidden shadow-lg border border-white/5 group-hover:border-white/10 transition-all">
                                                {album.thumbnails?.[0]?.url && (
                                                    <Image src={album.thumbnails[0].url} alt={album.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                                                )}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                    {playingId === album.browseId ? (
                                                        <Loader2 className="w-12 h-12 text-white animate-spin" />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-full bg-[#667eea] flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform">
                                                            <Play className="w-6 h-6 text-white fill-current ml-1" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <h3 className="text-white font-bold text-sm truncate group-hover:text-[#667eea] transition-colors">{album.title}</h3>
                                            <p className="text-zinc-500 text-xs mt-1">{album.year}</p>
                                        </button>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Singles Section */}
                        {displaySingles.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Disc className="w-5 h-5" />
                                        Singles & EP
                                    </h2>
                                    {hasSinglesBrowseId && !allSingles && (
                                        <button
                                            onClick={handleLoadAllSingles}
                                            disabled={loadingSingles}
                                            className="flex items-center gap-1 px-4 py-2 text-sm bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 rounded-full transition-all"
                                        >
                                            {loadingSingles ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4" />
                                            )}
                                            Show All
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                    {displaySingles.map((single: any, i: number) => (
                                        <button
                                            key={single.browseId || i}
                                            type="button"
                                            onClick={() => single.browseId && handlePlayAlbum(single.browseId)}
                                            className="group cursor-pointer text-left w-full"
                                        >
                                            <div className="relative aspect-square mb-3 bg-white/5 rounded-xl overflow-hidden shadow-lg border border-white/5 group-hover:border-white/10 transition-all">
                                                {single.thumbnails?.[0]?.url && (
                                                    <Image src={single.thumbnails[0].url} alt={single.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                                                )}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                    {playingId === single.browseId ? (
                                                        <Loader2 className="w-12 h-12 text-white animate-spin" />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-full bg-[#667eea] flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform">
                                                            <Play className="w-6 h-6 text-white fill-current ml-1" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <h3 className="text-white font-bold text-sm truncate group-hover:text-[#667eea] transition-colors">{single.title}</h3>
                                            <p className="text-zinc-500 text-xs mt-1">{single.year}</p>
                                        </button>
                                    ))}
                                </div>
                            </section>
                        )}

                        {displayAlbums.length === 0 && displaySingles.length === 0 && (
                            <div className="text-center py-12 text-zinc-500">앨범 정보가 없습니다</div>
                        )}
                    </div>
                )}

                {/* Videos Tab */}
                {activeTab === "videos" && !apiLoading && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Video className="w-5 h-5" />
                            Music Videos
                        </h2>
                        {displayVideos.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {displayVideos.map((video: any, i: number) => (
                                    <button
                                        key={video.videoId || i}
                                        type="button"
                                        onClick={() => handlePlaySong(video)}
                                        className="w-full group text-left"
                                    >
                                        <div className="relative aspect-video bg-white/5 rounded-xl overflow-hidden shadow-lg border border-white/5 group-hover:border-white/10 transition-all">
                                            {video.thumbnails?.[0]?.url && (
                                                <Image src={video.thumbnails[0].url} alt={video.title} fill className="object-cover" unoptimized />
                                            )}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                <div className="w-14 h-14 rounded-full bg-[#667eea] flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform">
                                                    <Play className="w-7 h-7 text-white fill-current ml-1" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-3">
                                            <h3 className="text-white font-bold line-clamp-2 leading-tight group-hover:text-[#667eea] transition-colors">{video.title}</h3>
                                            <p className="text-sm text-zinc-400 mt-1">{video.views}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-zinc-500">뮤직비디오가 없습니다</div>
                        )}
                    </div>
                )}

                {/* Related Artists Tab */}
                {activeTab === "related" && !apiLoading && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Related Artists
                        </h2>
                        {displayRelated.length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6">
                                {displayRelated.map((related: any, i: number) => (
                                    <button
                                        key={related.browseId || i}
                                        type="button"
                                        onClick={() => related.browseId && router.push(`/cafe/${related.browseId}`)}
                                        className="text-center cursor-pointer group"
                                    >
                                        <div className="w-full aspect-square rounded-full overflow-hidden bg-zinc-800 mb-2 relative">
                                            {related.thumbnails?.[0]?.url && (
                                                <Image src={related.thumbnails[0].url} alt={related.title} fill className="object-cover group-hover:scale-105 transition-transform" unoptimized />
                                            )}
                                        </div>
                                        <h3 className="text-white font-medium text-sm truncate group-hover:text-[#667eea] transition-colors">{related.title}</h3>
                                        <p className="text-zinc-500 text-xs">{related.subscribers}</p>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-zinc-500">비슷한 아티스트 정보가 없습니다</div>
                        )}
                    </div>
                )}
            </div>

            {/* Report Modal */}
            {reportingPost && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Flag className="w-5 h-5 text-orange-400" />
                            게시물 신고
                        </h2>

                        <div className="mb-4">
                            <p className="text-sm text-zinc-400 mb-2">신고할 게시물:</p>
                            <div className="bg-white/5 rounded-lg p-3 text-sm text-zinc-300 line-clamp-3">
                                {reportingPost.content}
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-white mb-2">신고 사유</label>
                            <div className="space-y-2">
                                {[
                                    { value: "spam", label: "스팸 / 광고" },
                                    { value: "harassment", label: "괴롭힘 / 혐오 발언" },
                                    { value: "inappropriate", label: "부적절한 콘텐츠" },
                                    { value: "other", label: "기타" },
                                ].map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setReportReason(option.value as ReportReason)}
                                        className={cn(
                                            "w-full text-left px-4 py-2 rounded-lg border transition-colors text-sm",
                                            reportReason === option.value
                                                ? "bg-[#667eea]/20 border-[#667eea] text-white"
                                                : "bg-white/5 border-white/10 text-zinc-400 hover:border-white/20"
                                        )}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-white mb-2">상세 설명 (선택)</label>
                            <textarea
                                value={reportDescription}
                                onChange={(e) => setReportDescription(e.target.value)}
                                placeholder="추가적인 설명이 있다면 입력해주세요..."
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-500 resize-none focus:outline-none focus:border-[#667eea] transition-colors"
                                rows={3}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setReportingPost(null);
                                    setReportReason("spam");
                                    setReportDescription("");
                                }}
                                className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-lg font-medium transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleReport}
                                disabled={isReporting}
                                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-lg font-medium disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            >
                                {isReporting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Flag className="w-4 h-4" />
                                )}
                                신고하기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
