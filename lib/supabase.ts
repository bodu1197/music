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
            .single();

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
            .single();

        if (error || !data) return null;
        return data.data;
    } catch {
        return null;
    }
}
