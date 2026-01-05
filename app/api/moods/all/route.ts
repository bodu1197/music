import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sori-music-backend-322455104824.us-central1.run.app';

// Cache for 1 hour, stale-while-revalidate for 24 hours
export const revalidate = 3600;

// Fetch with retry logic
async function fetchWithRetry(url: string, maxRetries: number = 3): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const res = await fetch(url, {
                next: { revalidate: 3600 },
            });
            if (res.ok) return res;

            // If not ok, wait and retry
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
