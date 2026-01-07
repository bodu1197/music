import { NextRequest, NextResponse } from 'next/server';
import { fetchWithRetry } from '@/lib/fetch-utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sori-music-backend-322455104824.us-central1.run.app';

// Cache for 24 hours
export const revalidate = 86400;

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    let country = searchParams.get('country') || 'US';
    let language = searchParams.get('language') || 'en';
    const limit = searchParams.get('limit') || '100';

    // Global(ZZ) not supported by YouTube Music API - fallback to US
    if (country === 'ZZ') {
        country = 'US';
        language = 'en';
    }

    try {
        const params = new URLSearchParams({ limit, country, language });
        const res = await fetchWithRetry(`${API_URL}/home?${params}`);
        const data = await res.json();

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            },
        });

    } catch (error) {
        console.error('[API /home] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch home' },
            {
                status: 500,
                headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
            }
        );
    }
}
