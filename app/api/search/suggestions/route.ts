import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sori-music-backend-322455104824.us-central1.run.app';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q) {
        return NextResponse.json([], { status: 200 });
    }

    try {
        const res = await fetch(`${API_URL}/search/suggestions?q=${encodeURIComponent(q)}`);
        const data = await res.json();

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
            },
        });
    } catch (error) {
        console.error('[API /search/suggestions] Error:', error);
        return NextResponse.json([], { status: 200 });
    }
}
