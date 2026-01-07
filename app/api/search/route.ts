import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sori-music-backend-322455104824.us-central1.run.app';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const filter = searchParams.get('filter');

    if (!q) {
        return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    try {
        const params = new URLSearchParams({ q });
        if (filter) params.append('filter', filter);

        const res = await fetch(`${API_URL}/search?${params}`);

        if (!res.ok) {
            console.error('[API /search] Backend error:', res.status, res.statusText);
            return NextResponse.json({ error: `Backend error: ${res.status}` }, { status: res.status });
        }

        const data = await res.json();

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
            },
        });
    } catch (error) {
        console.error('[API /search] Error:', error);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}
