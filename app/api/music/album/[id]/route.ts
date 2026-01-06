import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { md5 } from 'js-md5';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sori-music-backend-322455104824.us-central1.run.app';
const CDN_CACHE_TTL = 3600;

function makeCacheKey(...args: (string | number)[]): string {
    const keyStr = args.map(arg => String(arg)).join(':');
    return md5(keyStr);
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: browseId } = await params;

    if (!browseId) {
        return NextResponse.json({ error: 'Missing album ID' }, { status: 400 });
    }

    try {
        // 1️⃣ Supabase 캐시 확인
        const cacheKey = makeCacheKey('album', browseId);
        const { data: cached, error } = await supabase
            .from('api_cache')
            .select('data, expires_at')
            .eq('key', cacheKey)
            .maybeSingle();

        if (!error && cached && new Date(cached.expires_at) >= new Date()) {
            console.log(`[API/album] ⚡ Supabase HIT: ${browseId}`);
            return NextResponse.json(cached.data, {
                headers: {
                    'Cache-Control': `public, s-maxage=${CDN_CACHE_TTL}, stale-while-revalidate=86400`,
                },
            });
        }

        // 2️⃣ Cloud Run API 호출
        console.log(`[API/album] 📡 Calling Cloud Run: ${browseId}`);
        const res = await fetch(`${API_URL}/album/${browseId}`);

        if (!res.ok) {
            return NextResponse.json({ error: 'Album not found' }, { status: 404 });
        }

        const data = await res.json();

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': `public, s-maxage=${CDN_CACHE_TTL}, stale-while-revalidate=86400`,
            },
        });
    } catch (e) {
        console.error('[API/album] Error:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
