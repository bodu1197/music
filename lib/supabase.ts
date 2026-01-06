"use client";

import { createBrowserClient } from '@supabase/ssr'
import { md5 } from 'js-md5'; // MD5 해시 라이브러리 임포트

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'example-key';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase environment variables - functionality may be limited');
}

// This client triggers cookie storage in the browser, essential for middleware to see the session
export const supabase = createBrowserClient(supabaseUrl || '', supabaseAnonKey || '');

// ============================================
// 🔥 Backend-Compatible Cache Key Generation
// ============================================
// 백엔드와 동일한 MD5 해시 키 생성

function makeCacheKey(...args: (string | number | undefined | null)[]): string {
    const keyStr = args.map(arg => String(arg ?? '')).join(':');
    return md5(keyStr);
}

// ============================================
// 🔥 Direct Cache Reading (bypasses Cloud Run!)
// ============================================
// 테이블: api_cache (백엔드와 동일)
// 키: MD5 해시 (백엔드와 동일)

/**
 * Supabase에서 캐시된 앨범 데이터 직접 읽기
 * Cloud Run을 거치지 않아 매우 빠름 (~50ms)
 */
export async function getCachedAlbum(browseId: string): Promise<unknown | null> {
    try {
        const cacheKey = makeCacheKey('album', browseId);
        const { data, error } = await supabase
            .from('api_cache')
            .select('data, expires_at')
            .eq('key', cacheKey)
            .maybeSingle();

        if (error || !data) return null;

        // TTL 체크
        if (new Date(data.expires_at) < new Date()) {
            return null; // 만료됨
        }

        console.log(`[Supabase] ⚡ Album cache HIT: ${browseId}`);
        return data.data;
    } catch {
        return null;
    }
}

/**
 * 여러 앨범 캐시 한번에 읽기 (배치)
 */
export async function getCachedAlbums(browseIds: string[]): Promise<Map<string, unknown>> {
    const result = new Map<string, unknown>();
    if (browseIds.length === 0) return result;

    try {
        // 각 ID에 대한 캐시 키 생성
        const keyToId = new Map<string, string>();
        const cacheKeys: string[] = [];

        for (const id of browseIds) {
            const key = makeCacheKey('album', id);
            keyToId.set(key, id);
            cacheKeys.push(key);
        }

        const { data, error } = await supabase
            .from('api_cache')
            .select('key, data, expires_at')
            .in('key', cacheKeys);

        if (error || !data) return result;

        const now = new Date();
        for (const row of data) {
            // TTL 체크
            if (new Date(row.expires_at) >= now) {
                const originalId = keyToId.get(row.key);
                if (originalId) {
                    result.set(originalId, row.data);
                }
            }
        }

        if (result.size > 0) {
            console.log(`[Supabase] ⚡ Batch album cache HIT: ${result.size}/${browseIds.length}`);
        }
    } catch {
        // Ignore errors, return empty map
    }

    return result;
}

/**
 * 캐시된 플레이리스트 데이터 직접 읽기
 * 백엔드 키: make_cache_key("watch", videoId, playlistId)
 */
export async function getCachedPlaylist(playlistId: string): Promise<unknown | null> {
    try {
        // 백엔드에서는 watch 엔드포인트로 저장: make_cache_key("watch", videoId, playlistId)
        // videoId가 없으면 None으로 저장됨
        const cacheKey = makeCacheKey('watch', 'None', playlistId);
        const { data, error } = await supabase
            .from('api_cache')
            .select('data, expires_at')
            .eq('key', cacheKey)
            .maybeSingle();

        if (error || !data) return null;

        if (new Date(data.expires_at) < new Date()) {
            return null;
        }

        console.log(`[Supabase] ⚡ Playlist cache HIT: ${playlistId}`);
        return data.data;
    } catch {
        return null;
    }
}

/**
 * 캐시된 홈 데이터 직접 읽기
 * 백엔드 키: make_cache_key("home", limit, country, language)
 */
export async function getCachedHome(limit: number = 100, country: string = 'US', language: string = 'en'): Promise<unknown | null> {
    try {
        const cacheKey = makeCacheKey('home', limit, country, language);
        const { data, error } = await supabase
            .from('api_cache')
            .select('data, expires_at')
            .eq('key', cacheKey)
            .maybeSingle();

        if (error || !data) return null;

        if (new Date(data.expires_at) < new Date()) {
            return null;
        }

        console.log(`[Supabase] ⚡ Home cache HIT: ${country}/${language}`);
        return data.data;
    } catch {
        return null;
    }
}

/**
 * 캐시된 차트 데이터 직접 읽기
 * 백엔드 키: make_cache_key("charts", country, language)
 */
export async function getCachedCharts(country: string = 'US', language: string = 'en'): Promise<unknown | null> {
    try {
        const cacheKey = makeCacheKey('charts', country, language);
        const { data, error } = await supabase
            .from('api_cache')
            .select('data, expires_at')
            .eq('key', cacheKey)
            .maybeSingle();

        if (error || !data) return null;

        if (new Date(data.expires_at) < new Date()) {
            return null;
        }

        console.log(`[Supabase] ⚡ Charts cache HIT: ${country}`);
        return data.data;
    } catch {
        return null;
    }
}

/**
 * 캐시된 무드 카테고리 데이터 직접 읽기
 * 백엔드 키: make_cache_key("moods", country, language)
 */
export async function getCachedMoods(country: string = 'US', language: string = 'en'): Promise<unknown | null> {
    try {
        const cacheKey = makeCacheKey('moods', country, language);
        const { data, error } = await supabase
            .from('api_cache')
            .select('data, expires_at')
            .eq('key', cacheKey)
            .maybeSingle();

        if (error || !data) return null;

        if (new Date(data.expires_at) < new Date()) {
            return null;
        }

        console.log(`[Supabase] ⚡ Moods cache HIT: ${country}`);
        return data.data;
    } catch {
        return null;
    }
}

/**
 * 캐시된 무드 플레이리스트 데이터 직접 읽기
 * 백엔드 키: make_cache_key("mood_playlists", params, country, language)
 */
export async function getCachedMoodPlaylists(params: string, country: string = 'US', language: string = 'en'): Promise<unknown | null> {
    try {
        const cacheKey = makeCacheKey('mood_playlists', params, country, language);
        const { data, error } = await supabase
            .from('api_cache')
            .select('data, expires_at')
            .eq('key', cacheKey)
            .maybeSingle();

        if (error || !data) return null;

        if (new Date(data.expires_at) < new Date()) {
            return null;
        }

        console.log(`[Supabase] ⚡ Mood playlists cache HIT`);
        return data.data;
    } catch {
        return null;
    }
}

/**
 * 캐시된 watch playlist 직접 읽기
 * 백엔드 키: make_cache_key("watch", videoId, playlistId)
 */
export async function getCachedWatch(videoId?: string, playlistId?: string): Promise<unknown | null> {
    try {
        const cacheKey = makeCacheKey('watch', videoId || 'None', playlistId || 'None');
        const { data, error } = await supabase
            .from('api_cache')
            .select('data, expires_at')
            .eq('key', cacheKey)
            .maybeSingle();

        if (error || !data) return null;

        if (new Date(data.expires_at) < new Date()) {
            return null;
        }

        console.log(`[Supabase] ⚡ Watch cache HIT`);
        return data.data;
    } catch {
        return null;
    }
}
