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
        // Step 1: Fetch mood categories (with retry)
        const moodsRes = await fetchWithRetry(
            `${API_URL}/moods?country=${country}&language=${language}`
        );
        const moodsData = await moodsRes.json();

        // Step 2: Collect all category params
        const categoryParams: { section: string; title: string; params: string }[] = [];

        Object.entries(moodsData).forEach(([sectionTitle, categories]: [string, any]) => {
            categories.forEach((cat: any) => {
                if (cat.params) {
                    categoryParams.push({
                        section: sectionTitle,
                        title: cat.title,
                        params: cat.params
                    });
                }
            });
        });

        // Step 3: Fetch all playlists in parallel (server-side, no browser limit)
        let hasFailure = false;

        const playlistPromises = categoryParams.map(async (cat) => {
            try {
                // Use retry logic for each playlist fetch
                const res = await fetchWithRetry(
                    `${API_URL}/moods/playlists?params=${cat.params}&country=${country}&language=${language}`
                );
                const playlists = await res.json();
                return { ...cat, playlists };
            } catch {
                // Only fails after 3 retries
                hasFailure = true;
                return { ...cat, playlists: [] };
            }
        });

        const allCategories = await Promise.all(playlistPromises);

        // Step 4: Group by section
        const result: Record<string, any[]> = {};

        allCategories.forEach((cat) => {
            if (!result[cat.section]) {
                result[cat.section] = [];
            }
            result[cat.section].push({
                title: cat.title,
                params: cat.params,
                playlists: cat.playlists
            });
        });

        // If any category failed, use short cache (60s) to allow quick retry
        // If all succeeded, use long cache (1 hour)
        const cacheControl = hasFailure
            ? 'public, s-maxage=60, stale-while-revalidate=120'
            : 'public, s-maxage=3600, stale-while-revalidate=86400';

        return NextResponse.json(result, {
            headers: {
                'Cache-Control': cacheControl,
                'X-Partial-Failure': hasFailure ? 'true' : 'false',
            },
        });

    } catch (error) {
        console.error('[API /moods/all] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch moods data' },
            {
                status: 500,
                headers: {
                    // Don't cache errors - let next request try again
                    'Cache-Control': 'no-store, no-cache, must-revalidate',
                },
            }
        );
    }
}
