"use client";

import React, { createContext, useContext, useCallback, useRef, useState } from "react";
import { api } from "@/lib/api";
import { getCachedAlbum, getCachedAlbums, getCachedPlaylist } from "@/lib/supabase"; // getCachedPlaylist 추가
import type { AlbumData, WatchPlaylist, HomeSectionContent, HomeSection } from "@/types/music";

// 프리페치된 데이터 캐시
interface PrefetchCache {
    albums: Map<string, AlbumData>;
    playlists: Map<string, WatchPlaylist>;
}

interface PrefetchContextType {
    // 캐시된 데이터 가져오기 (즉시 반환)
    getAlbum: (browseId: string) => AlbumData | undefined;
    getPlaylist: (playlistId: string) => WatchPlaylist | undefined;

    // 데이터 프리페치 (백그라운드)
    prefetchAlbum: (browseId: string) => Promise<AlbumData | null>;
    prefetchPlaylist: (playlistId: string) => Promise<WatchPlaylist | null>;
    prefetchFromHomeData: (homeData: HomeSection[]) => Promise<void>;

    // 상태
    isReady: boolean;
    prefetchedCount: number;
}

const PrefetchContext = createContext<PrefetchContextType | null>(null);

export function PrefetchProvider({ children }: Readonly<{ children: React.ReactNode }>) {
    const cacheRef = useRef<PrefetchCache>({
        albums: new Map(),
        playlists: new Map(),
    });

    const [isReady, setIsReady] = useState(false);
    const [prefetchedCount, setPrefetchedCount] = useState(0);
    const pendingRef = useRef<Set<string>>(new Set());

    // 앨범 데이터 가져오기 (캐시에서 즉시)
    const getAlbum = useCallback((browseId: string): AlbumData | undefined => {
        return cacheRef.current.albums.get(browseId);
    }, []);

    // 플레이리스트 데이터 가져오기 (캐시에서 즉시)
    const getPlaylist = useCallback((playlistId: string): WatchPlaylist | undefined => {
        return cacheRef.current.playlists.get(playlistId);
    }, []);

    // 앨범 프리페치 (🔥 Supabase 직접 읽기 우선!)
    const prefetchAlbum = useCallback(async (browseId: string): Promise<AlbumData | null> => {
        // 1. 메모리 캐시 확인
        if (cacheRef.current.albums.has(browseId)) {
            return cacheRef.current.albums.get(browseId)!;
        }

        const key = `album:${browseId}`;
        if (pendingRef.current.has(key)) return null;

        pendingRef.current.add(key);

        try {
            // 🚀 2. Supabase 캐시 직접 읽기 (Cloud Run 거치지 않음!)
            const cached = await getCachedAlbum(browseId);
            if (cached) {
                console.log(`[Prefetch] ⚡ SUPABASE HIT: ${browseId}`);
                const albumData = cached as AlbumData;
                cacheRef.current.albums.set(browseId, albumData);
                setPrefetchedCount(prev => prev + 1);
                return albumData;
            }

            // 3. 캐시 미스 시에만 Cloud Run API 호출
            console.log(`[Prefetch] 📡 Cache miss, calling API: ${browseId}`);
            const data = await api.music.album(browseId);
            if (data) {
                cacheRef.current.albums.set(browseId, data);
                setPrefetchedCount(prev => prev + 1);
            }
            return data;
        } catch (e) {
            console.error(`[Prefetch] Album error: ${browseId}`, e);
            return null;
        } finally {
            pendingRef.current.delete(key);
        }
    }, []);

    // 플레이리스트 프리페치 (🔥 Supabase 직접 읽기 우선!)
    const prefetchPlaylist = useCallback(async (playlistId: string): Promise<WatchPlaylist | null> => {
        // 1. 메모리 캐시 확인
        if (cacheRef.current.playlists.has(playlistId)) {
            return cacheRef.current.playlists.get(playlistId)!;
        }

        const key = `playlist:${playlistId}`;
        if (pendingRef.current.has(key)) return null;

        pendingRef.current.add(key);

        try {
            // 🚀 2. Supabase 캐시 직접 읽기
            const cached = await getCachedPlaylist(playlistId);
            if (cached) {
                console.log(`[Prefetch] ⚡ SUPABASE HIT: playlist ${playlistId}`);
                const playlistData = cached as WatchPlaylist;
                cacheRef.current.playlists.set(playlistId, playlistData);
                setPrefetchedCount(prev => prev + 1);
                return playlistData;
            }

            // 3. 캐시 미스 시 API 호출
            console.log(`[Prefetch] 📡 Cache miss, calling API: playlist ${playlistId}`);
            const data = await api.music.watch(undefined, playlistId);
            if (data) {
                cacheRef.current.playlists.set(playlistId, data);
                setPrefetchedCount(prev => prev + 1);
            }
            return data;
        } catch (e) {
            // 일부 플레이리스트(RDCLAK...)는 YouTube 측에서 만료되거나 접근이 안 될 수 있음.
            // 이는 자연스러운 현상이므로 Error 대신 Warn으로 로그를 남김.
            console.warn(`[Prefetch] Skipping unavailable playlist: ${playlistId} (API Error)`);
            return null;
        } finally {
            pendingRef.current.delete(key);
        }
    }, []);

    // Helper to process items
    const processItem = useCallback((item: HomeSectionContent, promises: Promise<unknown>[]) => {
        if (!item) return;

        // 앨범 프리페치
        if (item.browseId?.startsWith("MPREb")) {
            promises.push(prefetchAlbum(item.browseId));
        }

        // 플레이리스트 프리페치
        if (item.playlistId) {
            promises.push(prefetchPlaylist(item.playlistId));
        }
    }, [prefetchAlbum, prefetchPlaylist]);

    // 홈 데이터에서 앨범 프리페치
    // 🔥 새로운 흐름: Supabase 배치 읽기 → 캐시 미스만 Cloud Run API 호출
    const prefetchFromHomeData = useCallback(async (homeData: HomeSection[]): Promise<void> => {
        if (!homeData || !Array.isArray(homeData)) return;

        console.log("[Prefetch] 🔥 Starting optimized prefetch (Supabase first!)...");

        // 앨범 ID만 수집
        const albumIds: string[] = [];
        for (const section of homeData) {
            if (section?.contents) {
                for (const item of section.contents) {
                    if (item?.browseId?.startsWith("MPREb") && !cacheRef.current.albums.has(item.browseId)) {
                        albumIds.push(item.browseId);
                    }
                }
            }
        }

        if (albumIds.length === 0) {
            console.log("[Prefetch] ✅ All albums already cached!");
            setIsReady(true);
            return;
        }

        console.log(`[Prefetch] ⏳ Checking ${albumIds.length} albums in Supabase...`);

        // 🚀 1단계: Supabase에서 모든 앨범 캐시 한 번에 읽기
        const cachedAlbums = await getCachedAlbums(albumIds);

        // 캐시된 앨범 메모리에 저장
        let hitCount = 0;
        for (const [browseId, data] of cachedAlbums) {
            cacheRef.current.albums.set(browseId, data as AlbumData);
            hitCount++;
        }
        setPrefetchedCount(prev => prev + hitCount);
        console.log(`[Prefetch] ⚡ SUPABASE HIT: ${hitCount}/${albumIds.length} albums`);

        // 캐시 미스된 앨범 ID 찾기
        const missedIds = albumIds.filter(id => !cachedAlbums.has(id));

        if (missedIds.length === 0) {
            console.log("[Prefetch] ✅ All albums loaded from Supabase!");
            setIsReady(true);
            return;
        }

        console.log(`[Prefetch] 📡 ${missedIds.length} cache misses, calling Cloud Run API...`);

        // 🔒 2단계: 캐시 미스만 Cloud Run API 호출 (8개씩 병렬 처리 - 속도 향상)
        const BATCH_SIZE = 8;
        for (let i = 0; i < missedIds.length; i += BATCH_SIZE) {
            const batch = missedIds.slice(i, i + BATCH_SIZE);
            await Promise.allSettled(batch.map(id => prefetchAlbum(id)));
        }

        console.log(`[Prefetch] ✅ All ${albumIds.length} albums loaded! Ready for instant clicks.`);
        setIsReady(true);
    }, [prefetchAlbum]);

    const value = React.useMemo(() => ({
        getAlbum,
        getPlaylist,
        prefetchAlbum,
        prefetchPlaylist,
        prefetchFromHomeData,
        isReady,
        prefetchedCount,
    }), [getAlbum, getPlaylist, prefetchAlbum, prefetchPlaylist, prefetchFromHomeData, isReady, prefetchedCount]);

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
