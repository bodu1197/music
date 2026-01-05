"use client";

import React, { createContext, useContext, useCallback, useRef, useState } from "react";
import { api } from "@/lib/api";
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

    // 앨범 프리페치
    const prefetchAlbum = useCallback(async (browseId: string): Promise<AlbumData | null> => {
        if (cacheRef.current.albums.has(browseId)) {
            return cacheRef.current.albums.get(browseId)!;
        }

        const key = `album:${browseId}`;
        if (pendingRef.current.has(key)) return null;

        pendingRef.current.add(key);

        try {
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

    // 플레이리스트 프리페치
    const prefetchPlaylist = useCallback(async (playlistId: string): Promise<WatchPlaylist | null> => {
        if (cacheRef.current.playlists.has(playlistId)) {
            return cacheRef.current.playlists.get(playlistId)!;
        }

        const key = `playlist:${playlistId}`;
        if (pendingRef.current.has(key)) return null;

        pendingRef.current.add(key);

        try {
            const data = await api.music.watch(undefined, playlistId);
            if (data) {
                cacheRef.current.playlists.set(playlistId, data);
                setPrefetchedCount(prev => prev + 1);
            }
            return data;
        } catch (e) {
            console.error(`[Prefetch] Playlist error: ${playlistId}`, e);
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

    // 홈 데이터에서 모든 앨범/플레이리스트 프리페치 (완료까지 대기)
    const prefetchFromHomeData = useCallback(async (homeData: HomeSection[]): Promise<void> => {
        if (!homeData || !Array.isArray(homeData)) return;

        console.log("[Prefetch] 🔥 Starting aggressive prefetch from home data...");
        const promises: Promise<unknown>[] = [];

        for (const section of homeData) {
            if (section?.contents) {
                for (const item of section.contents) {
                    processItem(item, promises);
                }
            }
        }

        console.log(`[Prefetch] ⏳ Waiting for ${promises.length} items to load...`);

        // 모든 프리페치 완료 대기
        await Promise.allSettled(promises);

        console.log(`[Prefetch] ✅ All ${promises.length} items loaded! Ready for instant clicks.`);
        setIsReady(true);
    }, [processItem]);

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
