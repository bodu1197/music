import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sori-music-backend-322455104824.us-central1.run.app';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const dataType = searchParams.get('dataType'); // 'songs' or 'albums'
    const type = searchParams.get('type') || 'albums'; // for albums: 'albums' or 'singles'

    if (!id || !dataType) {
        return NextResponse.json({ error: 'Missing id or dataType parameter' }, { status: 400 });
    }

    try {
        let url: string;
        if (dataType === 'songs') {
            url = `${API_URL}/artist/${id}/songs`;
        } else if (dataType === 'albums') {
            url = `${API_URL}/artist/${id}/albums?type=${type}`;
        } else {
            return NextResponse.json({ error: 'Invalid dataType' }, { status: 400 });
        }

        const res = await fetch(url);
        if (!res.ok) {
            return NextResponse.json({ error: 'Failed to fetch data' }, { status: res.status });
        }
        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Artist data fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
