"use client";

import { Coffee, Search, Users, Loader2, Music, MessageSquare } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { useJoinedCafes, usePopularArtists } from "@/hooks/useArtistData";
import type { ArtistWithData } from "@/lib/services/artist-service";

// ============================================
// Artist Card Component
// ============================================

function ArtistCard({ artist }: Readonly<{ artist: ArtistWithData }>) {
    const artistData = artist.artist_data;

    return (
        <Link
            href={`/cafe/${artist.channel_id}`}
            className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#667eea]/50 rounded-2xl p-4 transition-all"
        >
            <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 relative border-2 border-[#667eea]/30 group-hover:border-[#667eea] transition-colors">
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
                            <Music className="w-6 h-6 text-zinc-600" />
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate group-hover:text-[#667eea] transition-colors">
                        {artist.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-zinc-400">
                        <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {(artistData?.follower_count || 0).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {artistData?.post_count || 0}
                        </span>
                    </div>
                    {artistData?.subscribers && (
                        <p className="text-xs text-zinc-500 mt-1">{artistData.subscribers}</p>
                    )}
                </div>
            </div>
        </Link>
    );
}

// ============================================
// My Cafe Page Component
// ============================================

export default function MyCafePage() {
    const { user, loading: authLoading } = useAuth();
    const { cafes, isLoading: cafesLoading } = useJoinedCafes();
    const { artists: popularArtists, isLoading: popularLoading } = usePopularArtists(12);

    // 로그인 체크 중
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#667eea]" />
            </div>
        );
    }

    // 비로그인 상태
    if (!user) {
        return (
            <div className="min-h-screen p-6 md:p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">My Cafe</h1>
                    <p className="text-white/60">가입한 아티스트 팬카페를 모아보세요</p>
                </div>

                {/* Login Required */}
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20 rounded-full flex items-center justify-center mb-6">
                        <Coffee className="w-12 h-12 text-[#667eea]" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">로그인이 필요합니다</h2>
                    <p className="text-white/50 max-w-sm mb-8">
                        로그인하고 좋아하는 아티스트의 팬카페에 가입해보세요!
                    </p>
                    <Link
                        href="/login"
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full text-white font-medium hover:opacity-90 transition-opacity"
                    >
                        로그인하기
                    </Link>
                </div>

                {/* Popular Artists */}
                {!popularLoading && popularArtists.length > 0 && (
                    <div className="mt-12">
                        <h2 className="text-xl font-bold text-white mb-4">인기 아티스트 카페</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {popularArtists.map((artist) => (
                                <ArtistCard key={artist.id} artist={artist} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // 로그인 상태
    return (
        <div className="min-h-screen p-6 md:p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">My Cafe</h1>
                <p className="text-white/60">가입한 아티스트 팬카페를 모아보세요</p>
            </div>

            {/* Loading */}
            {cafesLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-[#667eea]" />
                </div>
            ) : cafes.length > 0 ? (
                /* Joined Cafes */
                <div>
                    <h2 className="text-xl font-bold text-white mb-4">
                        가입한 카페 ({cafes.length})
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {cafes.map((artist) => (
                            <ArtistCard key={artist.id} artist={artist} />
                        ))}
                    </div>
                </div>
            ) : (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20 rounded-full flex items-center justify-center mb-6">
                        <Coffee className="w-12 h-12 text-[#667eea]" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">아직 가입한 카페가 없어요</h2>
                    <p className="text-white/50 max-w-sm mb-8">
                        좋아하는 아티스트를 검색하고 팬카페에 가입해보세요!
                        <br />
                        아티스트의 최신 소식과 팬들과 소통할 수 있어요.
                    </p>
                    <Link
                        href="/search?tab=search"
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full text-white font-medium hover:opacity-90 transition-opacity"
                    >
                        <Search className="w-5 h-5" />
                        아티스트 검색하기
                    </Link>
                </div>
            )}

            {/* Popular Artists Section */}
            {!popularLoading && popularArtists.length > 0 && (
                <div className="mt-12">
                    <h2 className="text-xl font-bold text-white mb-4">인기 아티스트 카페</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {popularArtists
                            .filter((a) => !cafes.some((c) => c.id === a.id))
                            .slice(0, 6)
                            .map((artist) => (
                                <ArtistCard key={artist.id} artist={artist} />
                            ))}
                    </div>
                </div>
            )}

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                        <Search className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">1. 아티스트 검색</h3>
                    <p className="text-white/50 text-sm">좋아하는 아티스트를 검색해보세요</p>
                </div>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                    <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center mb-4">
                        <Coffee className="w-6 h-6 text-pink-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">2. 카페 가입</h3>
                    <p className="text-white/50 text-sm">아티스트 페이지에서 카페 가입 버튼을 누르세요</p>
                </div>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                        <Users className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">3. 팬들과 소통</h3>
                    <p className="text-white/50 text-sm">팬카페에서 다른 팬들과 소통하세요</p>
                </div>
            </div>
        </div>
    );
}
