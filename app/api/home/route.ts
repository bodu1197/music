import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sori-music-backend-322455104824.us-central1.run.app';

// Cache for 24 hours
export const revalidate = 86400;

// Fetch with retry logic
async function fetchWithRetry(url: string, maxRetries: number = 3): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const res = await fetch(url, { next: { revalidate: 3600 } });
            if (res.ok) return res;

            if (attempt < maxRetries) {
                await new Promise(r => setTimeout(r, 500 * attempt));
            }
        } catch (error) {
            lastError = error as Error;
            if (attempt < maxRetries) {
                await new Promise(r => setTimeout(r, 500 * attempt));
            }
        }
    }

    throw lastError || new Error('Failed after retries');
}

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
