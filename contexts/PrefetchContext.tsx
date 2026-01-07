"use client";

/**
 * 🔥 단순화된 PrefetchContext
 * 
 * 이 컨텍스트는 더 이상 적극적인 프리페치를 수행하지 않습니다.
 * 모든 데이터 요청은 lib/data.ts를 통해 처리됩니다.
 * 
 * 역할: 호환성 유지용 (기존 코드에서 import 에러 방지)
 */

import React, { createContext, useContext, useCallback, useMemo, ReactNode } from "react";

interface PrefetchContextType {
    // 호환성 유지용 빈 함수들
    getAlbum: (browseId: string) => undefined;
    getPlaylist: (playlistId: string) => undefined;
    prefetchAlbum: (browseId: string) => Promise<null>;
    prefetchPlaylist: (playlistId: string) => Promise<null>;
    prefetchFromHomeData: (homeData: unknown[]) => Promise<void>;
    isReady: boolean;
    prefetchedCount: number;
}

const PrefetchContext = createContext<PrefetchContextType | null>(null);

export function PrefetchProvider({ children }: Readonly<{ children: ReactNode }>) {
    // 모든 함수는 no-op (lib/data.ts 사용 권장)
    const getAlbum = useCallback(() => undefined, []);
    const getPlaylist = useCallback(() => undefined, []);
    const prefetchAlbum = useCallback(async () => null, []);
    const prefetchPlaylist = useCallback(async () => null, []);
    const prefetchFromHomeData = useCallback(async () => { }, []);

    const value = useMemo<PrefetchContextType>(() => ({
        getAlbum,
        getPlaylist,
        prefetchAlbum,
        prefetchPlaylist,
        prefetchFromHomeData,
        isReady: true,
        prefetchedCount: 0,
    }), [getAlbum, getPlaylist, prefetchAlbum, prefetchPlaylist, prefetchFromHomeData]);

    return (
        <PrefetchContext.Provider value={value}>
            {children}
        </PrefetchContext.Provider>
    );
}

export function usePrefetch() {
    const context = useContext(PrefetchContext);
    if (!context) {
        throw new Error("usePrefetch must be used within a PrefetchProvider");
    }
    return context;
}
