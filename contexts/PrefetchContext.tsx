"use client";

import React, { createContext, useContext, useCallback, useRef, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AlbumData, WatchPlaylistData, HomeSectionContent, HomeSection } from "@/types/music";

// 프리페치된 데이터 캐시
interface PrefetchCache {
    albums: Map<string, AlbumData>;
    playlists: Map<string, WatchPlaylistData>;
}

interface PrefetchContextType {
    // 캐시된 데이터 가져오기 (즉시 반환)
    getAlbum: (browseId: string) => AlbumData | undefined;
    getPlaylist: (playlistId: string) => WatchPlaylistData | undefined;

    // 데이터 프리페치 (백그라운드)
    prefetchAlbum: (browseId: string) => Promise<AlbumData | null>;
    prefetchPlaylist: (playlistId: string) => Promise<WatchPlaylistData | null>;
    prefetchFromHomeData: (homeData: HomeSection[]) => void;

    // 상태
    isReady: boolean;
    prefetchedCount: number;
}

const PrefetchContext = createContext<PrefetchContextType | null>(null);

export function PrefetchProvider({ children }: { children: React.ReactNode }) {
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
    const getPlaylist = useCallback((playlistId: string): WatchPlaylistData | undefined => {
        return cacheRef.current.playlists.get(playlistId);
    }, []);

    // 앨범 프리페치
    const prefetchAlbum = useCallback(async (browseId: string): Promise<AlbumData | null> => {
        // 이미 캐시에 있으면 반환
        if (cacheRef.current.albums.has(browseId)) {
            return cacheRef.current.albums.get(browseId)!;
        }

        // 이미 요청 중이면 스킵
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
    const prefetchPlaylist = useCallback(async (playlistId: string): Promise<WatchPlaylistData | null> => {
        // 이미 캐시에 있으면 반환
        if (cacheRef.current.playlists.has(playlistId)) {
            return cacheRef.current.playlists.get(playlistId)!;
        }

        // 이미 요청 중이면 스킵
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

    // 홈 데이터에서 모든 앨범/플레이리스트 프리페치
    const prefetchFromHomeData = useCallback((homeData: HomeSection[]) => {
        if (!homeData || !Array.isArray(homeData)) return;

        console.log("[Prefetch] Starting prefetch from home data...");
        let count = 0;

        for (const section of homeData) {
            if (!section?.contents) continue;

            for (const item of section.contents as HomeSectionContent[]) {
                if (!item) continue;

                // 앨범 프리페치
                if (item.browseId && item.browseId.startsWith("MPREb")) {
                    prefetchAlbum(item.browseId);
                    count++;
                }

                // 플레이리스트 프리페치
                if (item.playlistId) {
                    prefetchPlaylist(item.playlistId);
                    count++;
                }
            }
        }

        console.log(`[Prefetch] Queued ${count} items for prefetching`);
        setIsReady(true);
    }, [prefetchAlbum, prefetchPlaylist]);

    return (
        <PrefetchContext.Provider
            value={{
                getAlbum,
                getPlaylist,
                prefetchAlbum,
                prefetchPlaylist,
                prefetchFromHomeData,
                isReady,
                prefetchedCount,
            }}
        >
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
