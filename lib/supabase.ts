import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'example-key';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase environment variables - functionality may be limited');
}

// This client triggers cookie storage in the browser, essential for middleware to see the session
export const supabase = createBrowserClient(supabaseUrl || '', supabaseAnonKey || '');

// ============================================
// 🔥 Direct Cache Reading (bypasses Cloud Run!)
// ============================================

/**
 * Supabase에서 캐시된 앨범 데이터 직접 읽기
 * Cloud Run을 거치지 않아 매우 빠름 (~50ms)
 */
export async function getCachedAlbum(browseId: string): Promise<unknown | null> {
    try {
        const { data, error } = await supabase
            .from('cache')
            .select('data')
            .eq('type', 'album')
            .eq('key', browseId)
            .gt('expires_at', new Date().toISOString())
            .maybeSingle(); // 🔥 single() 대신 maybeSingle() 사용 (406 에러 방지)

        if (error || !data) return null;
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

    try {
        const { data, error } = await supabase
            .from('cache')
            .select('key, data')
            .eq('type', 'album')
            .in('key', browseIds)
            .gt('expires_at', new Date().toISOString());

        if (error || !data) return result;

        for (const row of data) {
            result.set(row.key, row.data);
        }
    } catch {
        // Ignore errors, return empty map
    }

    return result;
}

/**
 * 캐시된 플레이리스트 데이터 직접 읽기
 */
export async function getCachedPlaylist(playlistId: string): Promise<unknown | null> {
    try {
        const { data, error } = await supabase
            .from('cache')
            .select('data')
            .eq('type', 'playlist')
            .eq('key', playlistId)
            .gt('expires_at', new Date().toISOString())
            .maybeSingle();

        if (error || !data) return null;
        return data.data;
    } catch {
        return null;
    }
}

/**
 * 캐시된 홈 데이터 직접 읽기
 * key = "100_US_en" (limit_country_language)
 */
export async function getCachedHome(limit: number = 100, country: string = 'US', language: string = 'en'): Promise<unknown | null> {
    try {
        const key = `${limit}_${country}_${language}`;
        const { data, error } = await supabase
            .from('cache')
            .select('data')
            .eq('type', 'home')
            .eq('key', key)
            .gt('expires_at', new Date().toISOString())
            .maybeSingle();

        if (error || !data) return null;
        console.log(`[Supabase] ⚡ Home cache HIT: ${key}`);
        return data.data;
    } catch {
        return null;
    }
}

/**
 * 캐시된 차트 데이터 직접 읽기
 * key = "US_en" (country_language)
 */
export async function getCachedCharts(country: string = 'US', language: string = 'en'): Promise<unknown | null> {
    try {
        const key = `${country}_${language}`;
        const { data, error } = await supabase
            .from('cache')
            .select('data')
            .eq('type', 'charts')
            .eq('key', key)
            .gt('expires_at', new Date().toISOString())
            .maybeSingle();

        if (error || !data) return null;
        console.log(`[Supabase] ⚡ Charts cache HIT: ${key}`);
        return data.data;
    } catch {
        return null;
    }
}

/**
 * 캐시된 무드 카테고리 데이터 직접 읽기
 * key = "US_en" (country_language)
 */
export async function getCachedMoods(country: string = 'US', language: string = 'en'): Promise<unknown | null> {
    try {
        const key = `${country}_${language}`;
        const { data, error } = await supabase
            .from('cache')
            .select('data')
            .eq('type', 'moods')
            .eq('key', key)
            .gt('expires_at', new Date().toISOString())
            .maybeSingle();

        if (error || !data) return null;
        console.log(`[Supabase] ⚡ Moods cache HIT: ${key}`);
        return data.data;
    } catch {
        return null;
    }
}

/**
 * 캐시된 무드 플레이리스트 데이터 직접 읽기
 * key = "params_country_language"
 */
export async function getCachedMoodPlaylists(params: string, country: string = 'US', language: string = 'en'): Promise<unknown | null> {
    try {
        const key = `${params}_${country}_${language}`;
        const { data, error } = await supabase
            .from('cache')
            .select('data')
            .eq('type', 'mood_playlists')
            .eq('key', key)
            .gt('expires_at', new Date().toISOString())
            .maybeSingle();

        if (error || !data) return null;
        console.log(`[Supabase] ⚡ Mood playlists cache HIT`);
        return data.data;
    } catch {
        return null;
    }
}

/**
 * 캐시된 watch playlist 직접 읽기
 * key = "None_playlistId" 또는 "videoId_None"
 */
export async function getCachedWatch(videoId?: string, playlistId?: string): Promise<unknown | null> {
    try {
        const key = `${videoId || 'None'}_${playlistId || 'None'}`;
        const { data, error } = await supabase
            .from('cache')
            .select('data')
            .eq('type', 'watch')
            .eq('key', key)
            .gt('expires_at', new Date().toISOString())
            .maybeSingle();

        if (error || !data) return null;
        console.log(`[Supabase] ⚡ Watch cache HIT: ${key}`);
        return data.data;
    } catch {
        return null;
    }
}
