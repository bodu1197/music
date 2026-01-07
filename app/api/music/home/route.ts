import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase-server';
import { md5 } from 'js-md5';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sori-music-backend-322455104824.us-central1.run.app';

// CDN 캐시 TTL (1시간)
const CDN_CACHE_TTL = 3600;

function makeCacheKey(...args: (string | number)[]): string {
    const keyStr = args.map(String).join(':');
    return md5(keyStr);
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const limit = Number.parseInt(searchParams.get('limit') || '100', 10);
    const country = searchParams.get('country') || 'US';
    const language = searchParams.get('language') || 'en';

    try {
        // 1️⃣ Supabase 캐시 확인
        const cacheKey = makeCacheKey('home', limit, country, language);
        const { data: cached, error } = await supabase
            .from('api_cache')
            .select('data, expires_at')
            .eq('key', cacheKey)
            .maybeSingle();

        if (!error && cached && new Date(cached.expires_at) >= new Date()) {
            console.log(`[API/home] ⚡ Supabase HIT: ${country}`);
            return NextResponse.json(cached.data, {
                headers: {
                    'Cache-Control': `public, s-maxage=${CDN_CACHE_TTL}, stale-while-revalidate=86400`,
                },
            });
        }

        // 2️⃣ Cloud Run API 호출
        console.log(`[API/home] 📡 Calling Cloud Run: ${country}`);
        const params = new URLSearchParams({ limit: String(limit), country, language });
        const res = await fetch(`${API_URL}/home?${params}`);

        if (!res.ok) {
            return NextResponse.json({ error: 'Failed to fetch home data' }, { status: 500 });
        }

        const data = await res.json();

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': `public, s-maxage=${CDN_CACHE_TTL}, stale-while-revalidate=86400`,
            },
        });
    } catch (e) {
        console.error('[API/home] Error:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
