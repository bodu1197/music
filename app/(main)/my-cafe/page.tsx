"use client";

import { Coffee, Search, Users } from "lucide-react";

export default function MyCafePage() {
    return (
        <div className="min-h-screen p-6 md:p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">My Cafe</h1>
                <p className="text-white/60">가입한 아티스트 팬카페를 모아보세요</p>
            </div>

            {/* Empty State */}
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
                <a
                    href="/search?tab=search"
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full text-white font-medium hover:opacity-90 transition-opacity"
                >
                    <Search className="w-5 h-5" />
                    아티스트 검색하기
                </a>
            </div>

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
