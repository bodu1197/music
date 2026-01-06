"use client";

/**
 * 🔥 통합 데이터 모듈 (2중 캐싱 적용)
 * 
 * 흐름: 
 * 1️⃣ Vercel CDN (Edge) - 가장 빠름 (~10ms)
 * 2️⃣ Next.js API Route → Supabase 캐시 (~50ms)
 * 3️⃣ Cloud Run Backend → ytmusicapi (느림)
 */

// ============================================
// API Endpoints (CDN 캐싱 적용)
// ============================================

/**
 * 홈 데이터 가져오기 (2중 캐싱)
 */
export async function getHome(limit: number = 100, country: string = 'US', language: string = 'en'): Promise<any | null> {
    try {
        const params = new URLSearchParams({ limit: String(limit), country, language });
        const res = await fetch(`/api/music/home?${params}`);
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.error('[Data] Home fetch error:', e);
        return null;
    }
}

/**
 * 무드 카테고리 가져오기 (2중 캐싱)
 */
export async function getMoods(country: string = 'US', language: string = 'en'): Promise<any | null> {
    try {
        const params = new URLSearchParams({ country, language });
        const res = await fetch(`/api/music/moods?${params}`);
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.error('[Data] Moods fetch error:', e);
        return null;
    }
}

/**
 * 무드 플레이리스트 목록 가져오기 (2중 캐싱)
 */
export async function getMoodPlaylists(moodParams: string, country: string = 'US', language: string = 'en'): Promise<any | null> {
    try {
        const params = new URLSearchParams({ params: moodParams, country, language });
        const res = await fetch(`/api/music/moods/playlists?${params}`);
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.error('[Data] Mood Playlists fetch error:', e);
        return null;
    }
}

/**
 * 앨범 데이터 가져오기 (2중 캐싱)
 */
export async function getAlbum(browseId: string): Promise<any | null> {
    try {
        const res = await fetch(`/api/music/album/${browseId}`);
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.error('[Data] Album fetch error:', e);
        return null;
    }
}

/**
 * 플레이리스트/Watch 데이터 가져오기 (Cloud Run 직접 호출 - 동적 데이터)
 */
export async function getPlaylist(playlistId: string): Promise<any | null> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sori-music-backend-322455104824.us-central1.run.app';

    try {
        const params = new URLSearchParams({ playlistId, limit: '200' });
        const res = await fetch(`${API_URL}/watch?${params}`);
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.warn('[Data] Playlist fetch error:', e);
        return null;
    }
}

// ============================================
// Track Extraction Helpers
// ============================================

export interface SimpleTrack {
    videoId: string;
    title: string;
    artist: string;
    thumbnail: string;
    duration?: string;
}

/**
 * 앨범 데이터에서 트랙 추출
 */
export function extractTracksFromAlbum(albumData: any): SimpleTrack[] {
    if (!albumData?.tracks) return [];

    return albumData.tracks.map((track: any) => ({
        videoId: track.videoId,
        title: track.title || 'Unknown',
        artist: track.artists?.[0]?.name || albumData.artists?.[0]?.name || 'Unknown Artist',
        thumbnail: albumData.thumbnails?.[0]?.url || '',
        duration: track.duration || undefined
    })).filter((t: SimpleTrack) => t.videoId);
}

/**
 * 플레이리스트/Watch 데이터에서 트랙 추출
 */
export function extractTracksFromPlaylist(playlistData: any): SimpleTrack[] {
    if (!playlistData?.tracks) return [];

    return playlistData.tracks.map((track: any) => ({
        videoId: track.videoId,
        title: track.title || 'Unknown',
        artist: track.artists?.[0]?.name || 'Unknown Artist',
        thumbnail: track.thumbnail?.thumbnails?.[0]?.url || track.thumbnails?.[0]?.url || '',
        duration: track.duration || undefined
    })).filter((t: SimpleTrack) => t.videoId);
}
