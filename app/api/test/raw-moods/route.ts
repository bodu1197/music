import { NextRequest, NextResponse } from "next/server";

const CLOUD_RUN_URL = process.env.NEXT_PUBLIC_API_URL || "https://sori-music-backend-322455104824.us-central1.run.app";

export const dynamic = "force-dynamic"; // No caching at all

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country") || "US";
    const language = searchParams.get("language") || "en";

    try {
        // Call Cloud Run raw endpoint to get pure ytmusicapi response
        const url = `${CLOUD_RUN_URL}/moods/raw?country=${country}&language=${language}`;

        const res = await fetch(url, {
            headers: {
                "Accept": "application/json",
            },
            cache: "no-store", // No fetch cache
        });

        if (!res.ok) {
            return NextResponse.json(
                { error: `Cloud Run error: ${res.status}` },
                { status: res.status }
            );
        }

        const data = await res.json();

        return NextResponse.json({
            country,
            language,
            timestamp: new Date().toISOString(),
            cloud_run_url: url,
            raw_response: data,
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
