import { NextRequest, NextResponse } from 'next/server';
import { fetchWithRetry } from '@/lib/fetch-utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sori-music-backend-322455104824.us-central1.run.app';

// Cache for 24 hours
export const revalidate = 86400;

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    let country = searchParams.get('country') || 'US';
    let language = searchParams.get('language') || 'en';

    // Global(ZZ) not supported by YouTube Music API - fallback to US
    if (country === 'ZZ') {
        country = 'US';
        language = 'en';
    }

    try {
        // Fetch mood categories only (fast, ~0.1s)
        const moodsRes = await fetchWithRetry(
            `${API_URL}/moods?country=${country}&language=${language}`
        );
        const moodsData = await moodsRes.json();

        return NextResponse.json(moodsData, {
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            },
        });

    } catch (error) {
        console.error('[API /moods/all] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch moods data' },
            {
                status: 500,
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate',
                },
            }
        );
    }
}
