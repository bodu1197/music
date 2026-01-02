import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sori-music-backend-322455104824.us-central1.run.app';

// Global (ZZ/WW) playlist IDs - hardcoded since YouTube Music API doesn't support ZZ
const GLOBAL_PLAYLISTS = {
    top_videos: 'PL4fGSI1pDJn5kI81J1fYWK5eZRl1zJ5kM',
    top_songs: 'PL4fGSI1pDJn6puJdseH2Rt9sMvt9E2M4i',
    // No trending for Global
};

// Cache for 1 hour
export const revalidate = 3600;

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
    const country = searchParams.get('country') || 'US';

    try {
        // Global (ZZ) - use hardcoded playlist IDs
        if (country === 'ZZ') {
            const [videosRes, songsRes] = await Promise.all([
                fetchWithRetry(`${API_URL}/watch?playlistId=${GLOBAL_PLAYLISTS.top_videos}`),
                fetchWithRetry(`${API_URL}/watch?playlistId=${GLOBAL_PLAYLISTS.top_songs}`),
            ]);

            const videosData = await videosRes.json();
            const songsData = await songsRes.json();

            // Format to match charts API response structure
            const globalCharts = {
                videos: videosData.tracks?.slice(0, 20).map((t: any) => ({
                    title: t.title,
                    videoId: t.videoId,
                    playlistId: GLOBAL_PLAYLISTS.top_videos,
                    thumbnails: t.thumbnail ? [{ url: t.thumbnail.url || t.thumbnail }] : [],
                    artists: t.artists,
                })) || [],
                artists: [], // No artists chart for global
                genres: [], // No genres for global
                songs: songsData.tracks?.slice(0, 20).map((t: any) => ({
                    title: t.title,
                    videoId: t.videoId,
                    playlistId: GLOBAL_PLAYLISTS.top_songs,
                    thumbnails: t.thumbnail ? [{ url: t.thumbnail.url || t.thumbnail }] : [],
                    artists: t.artists,
                })) || [],
            };

            return NextResponse.json(globalCharts, {
                headers: {
                    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
                },
            });
        }

        // Regular country - use charts API
        const res = await fetchWithRetry(`${API_URL}/charts?country=${country}`);
        const data = await res.json();

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            },
        });

    } catch (error) {
        console.error('[API /charts] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch charts' },
            {
                status: 500,
                headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
            }
        );
    }
}
