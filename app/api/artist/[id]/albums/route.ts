import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sori-music-backend-322455104824.us-central1.run.app';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'albums';

    try {
        const res = await fetch(`${API_URL}/artist/${id}/albums?type=${type}`);
        if (!res.ok) {
            return NextResponse.json({ error: 'Failed to fetch artist albums' }, { status: res.status });
        }
        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Artist albums fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
