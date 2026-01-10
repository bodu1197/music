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
    Pin,
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

export interface CafePost {
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

export interface ArtistAPIData {
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
// Hook: Cafe Page Logic
// ============================================
function useCafePageLogic(artistId: string) {
    const { user } = useAuth();
    const router = useRouter();

    // Artist Data
    const {
        artist,
        isLoading,
        error,
        isJoined,
        isJoinLoading,
        toggleJoin,
    } = useArtistData(artistId);

    // API Data
    const [apiData, setApiData] = useState<ArtistAPIData | null>(null);
    const [apiLoading, setApiLoading] = useState(false);

    // Expanded Data
    const [allSongs, setAllSongs] = useState<any[] | null>(null);
    const [allAlbums, setAllAlbums] = useState<any[] | null>(null);
    const [allSingles, setAllSingles] = useState<any[] | null>(null);
    const [loadingSongs, setLoadingSongs] = useState(false);
    const [loadingAlbums, setLoadingAlbums] = useState(false);
    const [loadingSingles, setLoadingSingles] = useState(false);

    // Posts State
    const [posts, setPosts] = useState<CafePost[]>([]);
    const [postsLoading, setPostsLoading] = useState(true);
    const [newPost, setNewPost] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [postError, setPostError] = useState<string | null>(null);
    const [reactingPostId, setReactingPostId] = useState<string | null>(null);

    // Announcement State (공지사항 - 한 번만 로드)
    const [announcement, setAnnouncement] = useState<{ content: string; artistName: string } | null>(null);

    // UI State
    const [activeTab, setActiveTab] = useState<"feed" | "music" | "albums" | "videos" | "related">("feed");
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [reportingPost, setReportingPost] = useState<CafePost | null>(null);

    // Fetch API Data
    useEffect(() => {
        async function fetchAPIData() {
            if (!artistId) return;
            try {
                setApiLoading(true);
                setApiData(await api.music.artist(artistId));
            } catch (e) {
                console.error("[CafePage] API fetch error:", e);
            } finally {
                setApiLoading(false);
            }
        }
        fetchAPIData();
    }, [artistId]);

    // Fetch Posts
    useEffect(() => {
        if (!artist?.id) return;
        async function loadPosts() {
            try {
                setPostsLoading(true);
                const { data, error } = await supabase
                    .from("posts")
                    .select(`id, user_id, content, type, created_at, likes_count, users:user_id(display_name, avatar_url)`)
                    .eq("artist_id", artist!.id)
                    .eq("visibility", "public")
                    .order("created_at", { ascending: false })
                    .limit(50);

                if (error) throw error;
                setPosts((data || []).map((p: any) => ({
                    id: p.id,
                    user_id: p.user_id,
                    content: p.content,
                    type: p.type,
                    created_at: p.created_at,
                    likes_count: p.likes_count,
                    user: Array.isArray(p.users) ? p.users[0] : p.users,
                    isAI: p.user_id === null,
                })));
            } catch (e) {
                console.error("[CafePage] Posts load error:", e);
            } finally {
                setPostsLoading(false);
            }
        }
        loadPosts();
    }, [artist?.id]);

    // Fetch Announcement (공지사항 - 한 번만 로드, DB에서 가져오거나 생성)
    useEffect(() => {
        async function fetchAnnouncement() {
            if (!artist || announcement) return;
            try {
                const aiResult = await api.ai.getWelcomePost(artistId);
                if (aiResult?.post?.content) {
                    setAnnouncement({
                        content: aiResult.post.content,
                        artistName: artist.name
                    });
                }
            } catch { /* ignore */ }
        }
        if (artist && !postsLoading) fetchAnnouncement();
    }, [artist, artistId, postsLoading, announcement]);

    // Handlers
    const handlePostSubmit = async () => {
        if (!newPost.trim() || !user || !artist?.id) return;
        if (!isJoined) {
            setPostError("카페에 가입한 회원만 글을 작성할 수 있습니다.");
            return;
        }

        try {
            setIsSubmitting(true);
            setPostError(null);
            const { data, error } = await supabase.from("posts").insert({
                user_id: user.id,
                artist_id: artist.id,
                type: "text",
                content: newPost.trim(),
                visibility: "public",
            }).select(`id, user_id, content, type, created_at, likes_count`).single();

            if (error) throw error;
            setPosts((prev) => [{
                ...data,
                user: { display_name: user.email?.split("@")[0] || "User" },
                isAI: false
            }, ...prev]);
            setNewPost("");
        } catch (e) {
            console.error("[CafePage] Post error:", e);
            setPostError("글 등록 실패");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReaction = async (postId: string, type: ReactionType) => {
        if (!user) {
            router.push("/login");
            return;
        }
        setReactingPostId(postId);
        try {
            const result = await toggleReaction(user.id, postId, type);
            setPosts((prev) => prev.map((p) => {
                if (p.id !== postId) return p;
                const old = p.myReaction;
                let { likes_count: likes, dislikes_count: dislikes = 0 } = p;
                if (old === "like") likes--;
                if (old === "dislike") dislikes--;
                if (result.newType === "like") likes++;
                if (result.newType === "dislike") dislikes++;
                return { ...p, myReaction: result.newType, likes_count: likes, dislikes_count: dislikes };
            }));
        } catch (e) {
            console.error("Reaction error:", e);
        } finally {
            setReactingPostId(null);
        }
    };

    const loadMoreData = async (type: "songs" | "albums" | "singles") => {
        if (type === "songs") {
            if (loadingSongs || allSongs) return;
            setLoadingSongs(true);
            try {
                setAllSongs((await api.music.artistSongs(artistId)).tracks || []);
            } catch (e) { console.error(e); } finally { setLoadingSongs(false); }
        } else if (type === "albums") {
            if (loadingAlbums || allAlbums) return;
            setLoadingAlbums(true);
            try {
                setAllAlbums((await api.music.artistAlbums(artistId, "albums")).items || []);
            } catch (e) { console.error(e); } finally { setLoadingAlbums(false); }
        } else if (type === "singles") {
            if (loadingSingles || allSingles) return;
            setLoadingSingles(true);
            try {
                setAllSingles((await api.music.artistAlbums(artistId, "singles")).items || []);
            } catch (e) { console.error(e); } finally { setLoadingSingles(false); }
        }
    };

    return {
        user, artist, isLoading, error, isJoined, isJoinLoading, toggleJoin,
        apiData, apiLoading,
        allSongs, allAlbums, allSingles,
        loadingSongs, loadingAlbums, loadingSingles,
        posts, postsLoading, newPost, setNewPost, isSubmitting, postError, setPostError,
        activeTab, setActiveTab, playingId, setPlayingId,
        reportingPost, setReportingPost,
        handlePostSubmit, handleReaction, loadMoreData,
        reactingPostId,
        announcement
    };
}

// ============================================
// Hook: Cafe Player Logic
// ============================================
function useCafePlay(
    apiData: ArtistAPIData | null,
    artist: any,
    allSongs: any[] | null,
    setPlayingId: (id: string | null) => void
) {
    const { setPlaylist, toggleQueue, isQueueOpen } = usePlayer();

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

    return { handlePlaySong, handlePlayAll, handlePlayAlbum };
}

// ============================================
// Hook: Cafe Report Logic
// ============================================
function useCafeReport(
    user: any,
    reportingPost: CafePost | null,
    setReportingPost: (post: CafePost | null) => void
) {
    const [reportReason, setReportReason] = useState<ReportReason>("spam");
    const [reportDescription, setReportDescription] = useState("");
    const [isReporting, setIsReporting] = useState(false);

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

    return {
        reportReason, setReportReason,
        reportDescription, setReportDescription,
        isReporting, handleReport
    };
}


// ============================================
// Component: Cafe Post Input
// ============================================
interface CafePostInputProps {
    readonly user: any;
    readonly isJoined: boolean;
    readonly isJoinLoading: boolean;
    readonly toggleJoin: () => void;
    readonly newPost: string;
    readonly setNewPost: (val: string) => void;
    readonly handlePostSubmit: () => void;
    readonly isSubmitting: boolean;
    readonly postError: string | null;
    readonly setPostError: (val: string | null) => void;
    readonly router: any;
}

function CafePostInput({
    user, isJoined, isJoinLoading, toggleJoin,
    newPost, setNewPost, handlePostSubmit, isSubmitting,
    postError, setPostError, router
}: CafePostInputProps) {
    if (user && isJoined) {
        return (
            <div className="bg-[#1a1a2e]/80 border border-white/10 rounded-xl p-4">
                <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#667eea] to-[#764ba2] flex items-center justify-center text-white font-bold flex-shrink-0">
                        {user.email?.[0].toUpperCase() || "U"}
                    </div>
                    <div className="flex-1">
                        <textarea
                            value={newPost}
                            onChange={(e) => { setNewPost(e.target.value); if (postError) setPostError(null); }}
                            placeholder="팬들과 함께 이야기를 나눠보세요..."
                            className="w-full bg-transparent text-white placeholder:text-zinc-500 resize-none focus:outline-none min-h-[60px]"
                            rows={2}
                        />
                        {postError && <div className="text-rose-400 text-sm mb-2">{postError}</div>}
                        <div className="flex justify-end">
                            <button
                                onClick={handlePostSubmit}
                                disabled={!newPost.trim() || isSubmitting}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[#667eea]/30 transition-all"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                게시
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    if (user && !isJoined) {
        return (
            <div className="bg-[#1a1a2e]/80 border border-[#667eea]/30 rounded-xl p-6 text-center">
                <UserPlus className="w-8 h-8 text-[#667eea] mx-auto mb-3" />
                <p className="text-zinc-400 mb-4">카페에 가입한 회원만 글을 작성할 수 있습니다.</p>
                <button onClick={toggleJoin} disabled={isJoinLoading} className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full text-white font-medium mx-auto disabled:opacity-50">
                    {isJoinLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    카페 가입하기
                </button>
            </div>
        );
    }
    return (
        <div className="bg-[#1a1a2e]/80 border border-white/10 rounded-xl p-6 text-center">
            <p className="text-zinc-400 mb-4">로그인하고 팬들과 함께 이야기를 나눠보세요!</p>
            <button onClick={() => router.push("/login")} className="px-6 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full text-white font-medium">로그인</button>
        </div>
    );
}

// ============================================
// Component: Cafe Post Feed
// ============================================
interface CafePostFeedProps {
    readonly posts: CafePost[];
    readonly postsLoading: boolean;
    readonly handleReaction: (id: string, type: ReactionType) => void;
    readonly reactingPostId: string | null;
    readonly setReportingPost: (post: CafePost) => void;
    readonly artistThumbnail?: string | null;
    readonly artistName?: string;
}

function CafePostFeed({
    posts, postsLoading, handleReaction, reactingPostId, setReportingPost,
    artistThumbnail, artistName
}: CafePostFeedProps) {
    if (postsLoading) return <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin text-zinc-400 mx-auto" /></div>;
    if (posts.length === 0) return <div className="text-center py-12 text-zinc-500">아직 게시물이 없습니다. 첫 번째 게시물을 작성해보세요!</div>;

    return (
        <div className="space-y-4">
            {posts.map((post) => (
                <div key={post.id} className={cn("bg-[#1a1a2e]/80 border rounded-xl p-4", post.isAI ? "border-[#667eea]/30 bg-gradient-to-r from-[#667eea]/5 to-[#764ba2]/5" : "border-white/10")}>
                    <div className="flex gap-3">
                        {/* Avatar - Show artist thumbnail for AI posts */}
                        {post.isAI && artistThumbnail ? (
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#667eea] flex-shrink-0 relative">
                                <Image src={artistThumbnail} alt={artistName || "Artist"} fill className="object-cover" unoptimized />
                            </div>
                        ) : (
                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0", post.isAI ? "bg-gradient-to-r from-[#667eea] to-[#764ba2]" : "bg-zinc-700")}>
                                {post.user?.display_name?.[0].toUpperCase() || "U"}
                            </div>
                        )}
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-white">{post.user?.display_name || "Unknown User"}</span>
                                {post.isAI && <span className="px-1.5 py-0.5 rounded-md bg-[#667eea]/20 text-[#667eea] text-xs font-medium border border-[#667eea]/30">카페지기</span>}
                                <span className="text-zinc-500 text-sm">• {new Date(post.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-zinc-300 whitespace-pre-wrap mb-3">{post.content}</p>
                            <div className="flex items-center gap-4">
                                <button onClick={() => handleReaction(post.id, "like")} disabled={reactingPostId === post.id} className={cn("flex items-center gap-1 transition-colors text-sm", post.myReaction === "like" ? "text-pink-500" : "text-zinc-500 hover:text-pink-500")}>
                                    <Heart className={cn("w-4 h-4", post.myReaction === "like" && "fill-current")} /><span>{post.likes_count || 0}</span>
                                </button>
                                <button onClick={() => handleReaction(post.id, "dislike")} disabled={reactingPostId === post.id} className={cn("flex items-center gap-1 transition-colors text-sm", post.myReaction === "dislike" ? "text-blue-400" : "text-zinc-500 hover:text-blue-400")}>
                                    <ThumbsDown className={cn("w-4 h-4", post.myReaction === "dislike" && "fill-current")} /><span>{post.dislikes_count || 0}</span>
                                </button>
                                <button className="flex items-center gap-1 text-zinc-500 hover:text-[#667eea] transition-colors text-sm"><MessageSquare className="w-4 h-4" /><span>Reply</span></button>
                                <button onClick={() => setReportingPost(post)} className="flex items-center gap-1 text-zinc-500 hover:text-orange-400 transition-colors text-sm ml-auto" title="신고하기"><Flag className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ============================================
// Helper: Get Join Button Icon
// ============================================
function getJoinButtonIcon(isJoinLoading: boolean, isJoined: boolean): React.ReactNode {
    if (isJoinLoading) return <Loader2 className="w-5 h-5 animate-spin" />;
    if (isJoined) return <Check className="w-5 h-5" />;
    return <UserPlus className="w-5 h-5" />;
}

// ============================================
// Helper: Get Tab Label
// ============================================
function getTabLabel(baseLabel: string, count: number, hasMore: boolean): string {
    if (count === 0) return baseLabel;
    return `${baseLabel} (${count}${hasMore ? '+' : ''})`;
}

// ============================================
// Component: Cafe Artist Card
// ============================================
interface CafeArtistCardProps {
    readonly artist: any;
    readonly artistData: any;
    readonly apiData: ArtistAPIData | null;
    readonly thumbnail: string | null;
    readonly displaySongs: any[];
    readonly posts: CafePost[];
    readonly user: any;
    readonly isJoined: boolean;
    readonly isJoinLoading: boolean;
    readonly toggleJoin: () => void;
    readonly handlePlayAll: () => void;
    readonly router: any;
}

function CafeArtistCard({
    artist, artistData, apiData, thumbnail, displaySongs, posts,
    user, isJoined, isJoinLoading, toggleJoin, handlePlayAll, router
}: CafeArtistCardProps) {
    const subscribers = apiData?.subscribers || artistData?.subscribers;
    const description = apiData?.description || artistData?.description;

    return (
        <div className="max-w-5xl mx-auto px-3 md:px-4 -mt-10 relative z-10">
            <div className="bg-[#1a1a2e]/90 backdrop-blur-xl border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-2xl">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6">
                    {/* Avatar */}
                    <div className="w-20 h-20 md:w-32 md:h-32 rounded-full overflow-hidden border-3 md:border-4 border-[#667eea] shadow-lg shadow-[#667eea]/30 flex-shrink-0 relative">
                        {thumbnail ? (
                            <Image src={thumbnail} alt={artist.name} fill className="object-cover" unoptimized />
                        ) : (
                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                                <Music className="w-8 h-8 md:w-12 md:h-12 text-zinc-600" />
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
                        {subscribers && <p className="text-zinc-400 text-sm mb-2">{subscribers}</p>}
                        {apiData?.views && <p className="text-zinc-500 text-xs mb-4">{apiData.views}</p>}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2 md:gap-3 justify-center md:justify-start mb-3 md:mb-4">
                            <button
                                onClick={handlePlayAll}
                                disabled={displaySongs.length === 0}
                                className="flex items-center gap-1.5 md:gap-2 px-4 py-2 md:px-6 md:py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:shadow-lg hover:shadow-[#667eea]/25 text-white text-sm md:text-base font-bold rounded-full transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Play className="w-4 h-4 md:w-5 md:h-5 fill-current" />
                                Play
                            </button>
                            {apiData?.shuffleId && (
                                <button className="flex items-center gap-1.5 md:gap-2 px-4 py-2 md:px-6 md:py-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm md:text-base font-semibold rounded-full transition-all hover:scale-105 backdrop-blur-sm">
                                    <Shuffle className="w-4 h-4 md:w-5 md:h-5" />
                                    Shuffle
                                </button>
                            )}
                            {apiData?.radioId && (
                                <button className="flex items-center gap-1.5 md:gap-2 px-4 py-2 md:px-6 md:py-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm md:text-base font-semibold rounded-full transition-all hover:scale-105 backdrop-blur-sm">
                                    <Radio className="w-4 h-4 md:w-5 md:h-5" />
                                    Radio
                                </button>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center justify-center md:justify-start gap-4 md:gap-6 text-xs md:text-sm">
                            <div className="flex items-center gap-1.5 md:gap-2 text-zinc-400">
                                <Users className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                <span>{(artistData?.follower_count || 0).toLocaleString()} members</span>
                            </div>
                            <div className="flex items-center gap-1.5 md:gap-2 text-zinc-400">
                                <MessageSquare className="w-3.5 h-3.5 md:w-4 md:h-4" />
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
                                "flex items-center gap-1.5 md:gap-2 px-4 py-2 md:px-6 md:py-3 rounded-full text-sm md:text-base font-semibold transition-all",
                                isJoined
                                    ? "bg-white/10 text-white border border-white/20"
                                    : "bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white hover:shadow-lg hover:shadow-[#667eea]/30"
                            )}
                        >
                            {getJoinButtonIcon(isJoinLoading, isJoined)}
                            {isJoined ? "가입됨" : "카페 가입"}
                        </button>
                    ) : (
                        <button
                            onClick={() => router.push("/login")}
                            className="flex items-center gap-1.5 md:gap-2 px-4 py-2 md:px-6 md:py-3 rounded-full text-sm md:text-base font-semibold bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white hover:shadow-lg hover:shadow-[#667eea]/30 transition-all"
                        >
                            <LogIn className="w-4 h-4 md:w-5 md:h-5" />
                            로그인하고 가입
                        </button>
                    )}
                </div>

                {/* Description */}
                {description && (
                    <p className="mt-4 text-zinc-400 text-sm leading-relaxed border-t border-white/10 pt-4">
                        {description.slice(0, 300)}
                        {description.length > 300 && "..."}
                    </p>
                )}
            </div>
        </div>
    );
}

// ============================================
// Component: Cafe Report Modal
// ============================================
interface CafeReportModalProps {
    readonly reportingPost: CafePost;
    readonly reportReason: ReportReason;
    readonly setReportReason: (reason: ReportReason) => void;
    readonly reportDescription: string;
    readonly setReportDescription: (desc: string) => void;
    readonly isReporting: boolean;
    readonly handleReport: () => void;
    readonly onClose: () => void;
}

function CafeReportModal({
    reportingPost, reportReason, setReportReason,
    reportDescription, setReportDescription,
    isReporting, handleReport, onClose
}: CafeReportModalProps) {
    return (
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

                <fieldset className="mb-4">
                    <legend className="block text-sm font-medium text-white mb-2">신고 사유</legend>
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
                </fieldset>

                <div className="mb-6">
                    <label htmlFor="report-description" className="block text-sm font-medium text-white mb-2">상세 설명 (선택)</label>
                    <textarea
                        id="report-description"
                        value={reportDescription}
                        onChange={(e) => setReportDescription(e.target.value)}
                        placeholder="추가적인 설명이 있다면 입력해주세요..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-500 resize-none focus:outline-none focus:border-[#667eea] transition-colors"
                        rows={3}
                    />
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-lg font-medium transition-colors"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleReport}
                        disabled={isReporting}
                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-lg font-medium disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                        {isReporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
                        신고하기
                    </button>
                </div>
            </div>
        </div>
    );
}


// ============================================
// Cafe Page Component
// ============================================

export default function CafePage() {
    const params = useParams();
    const artistId = params.artistId as string;
    const router = useRouter();

    const {
        user, artist, isLoading, error, isJoined, isJoinLoading, toggleJoin,
        apiData, apiLoading,
        allSongs, allAlbums, allSingles,
        loadingSongs, loadingAlbums, loadingSingles,
        posts, postsLoading, newPost, setNewPost, isSubmitting, postError, setPostError,
        activeTab, setActiveTab, playingId, setPlayingId,
        reportingPost, setReportingPost,
        handlePostSubmit, handleReaction, loadMoreData,
        reactingPostId,
        announcement
    } = useCafePageLogic(artistId);

    const { handlePlaySong, handlePlayAll, handlePlayAlbum } = useCafePlay(apiData, artist, allSongs, setPlayingId);
    const {
        reportReason, setReportReason,
        reportDescription, setReportDescription,
        isReporting, handleReport
    } = useCafeReport(user, reportingPost, setReportingPost);

    // Loading & Error States
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

    // Derived Data
    const artistData = artist.artist_data;
    const thumbnail = apiData?.thumbnails?.[apiData.thumbnails.length - 1]?.url || artistData?.thumbnail_url || artist.thumbnail_url;

    const displaySongs = allSongs || apiData?.songs?.results || [];
    const displayAlbums = allAlbums || apiData?.albums?.results || [];
    const displaySingles = allSingles || apiData?.singles?.results || [];
    const displayVideos = apiData?.videos?.results || [];
    const displayRelated = apiData?.related?.results || [];

    const hasSongsBrowseId = !!apiData?.songs?.browseId;
    const hasAlbumsBrowseId = !!apiData?.albums?.browseId;
    const hasSinglesBrowseId = !!apiData?.singles?.browseId;

    // Close report modal handler
    const closeReportModal = () => {
        setReportingPost(null);
        setReportReason("spam");
        setReportDescription("");
    };

    return (
        <div className="min-h-screen bg-[linear-gradient(135deg,#0f0f23_0%,#1a1a2e_100%)] pb-20 pt-[20px]">
            {/* 뒤로 가기 버튼 (Absolute에서 Relative/Fixed 로 변경하거나 상단 배치) */}
            <div className="max-w-5xl mx-auto px-3 md:px-4 mb-4">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white/80 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">뒤로</span>
                </button>
            </div>

            {/* Artist Info Card - Hero Banner 없이 바로 시작 */}
            <div className="max-w-5xl mx-auto px-3 md:px-4 relative z-10">
                <CafeArtistCard
                    artist={artist}
                    artistData={artistData}
                    apiData={apiData}
                    thumbnail={thumbnail ?? null}
                    displaySongs={displaySongs}
                    posts={posts}
                    user={user}
                    isJoined={isJoined}
                    isJoinLoading={isJoinLoading}
                    toggleJoin={toggleJoin}
                    handlePlayAll={handlePlayAll}
                    router={router}
                />
            </div>

            {/* Tab Navigation */}
            <div className="max-w-5xl mx-auto px-3 md:px-4 mt-4 md:mt-6">
                <div className="flex gap-0.5 md:gap-1 overflow-x-auto pb-2 scrollbar-hide">
                    {[
                        { id: "feed", label: "피드", icon: MessageSquare },
                        { id: "music", label: getTabLabel("노래", displaySongs.length, !allSongs && hasSongsBrowseId), icon: Music },
                        { id: "albums", label: getTabLabel("앨범", displayAlbums.length, !allAlbums && hasAlbumsBrowseId), icon: Disc },
                        { id: "videos", label: getTabLabel("뮤비", displayVideos.length, false), icon: Video },
                        { id: "related", label: "비슷한 아티스트", icon: Users },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as typeof activeTab)}
                            className={cn(
                                "flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-medium transition-all whitespace-nowrap text-xs md:text-sm",
                                activeTab === tab.id
                                    ? "bg-[#667eea]/20 text-[#667eea]"
                                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <tab.icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-5xl mx-auto px-3 md:px-4 mt-4 md:mt-6 space-y-4 md:space-y-6">
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
                        <CafePostInput
                            user={user}
                            isJoined={isJoined}
                            isJoinLoading={isJoinLoading}
                            toggleJoin={toggleJoin}
                            newPost={newPost}
                            setNewPost={setNewPost}
                            handlePostSubmit={handlePostSubmit}
                            isSubmitting={isSubmitting}
                            postError={postError}
                            setPostError={setPostError}
                            router={router}
                        />

                        {/* Pinned Announcement (공지사항) */}
                        {announcement && (
                            <div className="bg-gradient-to-r from-[#667eea]/10 to-[#764ba2]/10 border border-[#667eea]/30 rounded-xl p-4 relative">
                                <div className="absolute -top-2 left-4 px-2 py-0.5 bg-[#667eea] text-white text-xs font-bold rounded-md flex items-center gap-1">
                                    <Pin className="w-3 h-3" />
                                    공지
                                </div>
                                <div className="flex gap-3 mt-2">
                                    {thumbnail ? (
                                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#667eea] flex-shrink-0 relative">
                                            <Image src={thumbnail} alt={artist.name} fill className="object-cover" unoptimized />
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#667eea] to-[#764ba2] flex items-center justify-center text-white font-bold flex-shrink-0">
                                            {artist.name[0]}
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-white">{announcement.artistName} 팬카페 지기</span>
                                            <span className="px-1.5 py-0.5 rounded-md bg-[#667eea]/20 text-[#667eea] text-xs font-medium border border-[#667eea]/30">카페지기</span>
                                        </div>
                                        <p className="text-zinc-300 whitespace-pre-wrap">{announcement.content}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Posts Feed */}
                        <CafePostFeed
                            posts={posts}
                            postsLoading={postsLoading}
                            handleReaction={handleReaction}
                            reactingPostId={reactingPostId}
                            setReportingPost={setReportingPost}
                            artistThumbnail={thumbnail}
                            artistName={artist.name}
                        />
                    </>
                )}

                {/* Music Tab */}
                {activeTab === "music" && !apiLoading && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Music className="w-5 h-5" />
                                Songs
                            </h2>
                            {hasSongsBrowseId && !allSongs && (
                                <button
                                    onClick={() => loadMoreData("songs")}
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

                {/* Albums Tab */}
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
                                            onClick={() => loadMoreData("albums")}
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
                                            onClick={() => loadMoreData("singles")}
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
                <CafeReportModal
                    reportingPost={reportingPost}
                    reportReason={reportReason}
                    setReportReason={setReportReason}
                    reportDescription={reportDescription}
                    setReportDescription={setReportDescription}
                    isReporting={isReporting}
                    handleReport={handleReport}
                    onClose={closeReportModal}
                />
            )}
        </div>
    );
}
