/**
 * Search API Route
 *
 * 음악 검색 API 엔드포인트
 * - 아티스트 검색: DB 영구 저장 + Stale-While-Revalidate
 * - 기타 검색 (songs, albums, etc.): 백엔드 프록시
 *
 * @module api/search
 */

import { NextRequest, NextResponse } from "next/server";
import {
  searchArtistsWithPersistence,
  type ArtistSearchResult,
} from "@/lib/services/artist-search-persistence-service";

// ============================================
// Constants
// ============================================

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://sori-music-backend-322455104824.us-central1.run.app";

/** 일반 검색 결과 캐시 TTL (초) */
const CACHE_MAX_AGE_SECONDS = 300;

/** Stale-while-revalidate 시간 (초) */
const STALE_WHILE_REVALIDATE_SECONDS = 600;

/** API 호출 타임아웃 (밀리초) */
const API_TIMEOUT_MS = 15000;

// ============================================
// Types
// ============================================

interface YouTubeSearchResult {
  resultType: string;
  browseId?: string;
  videoId?: string;
  playlistId?: string;
  title?: string;
  artist?: string;
  artists?: Array<{ name: string; id?: string }>;
  album?: { name: string; id?: string };
  thumbnails?: Array<{ url: string; width?: number; height?: number }>;
  duration?: string;
  subscribers?: string;
  itemCount?: number;
  year?: string;
}

// ============================================
// Helper Functions
// ============================================

/**
 * 아티스트 검색 결과를 YouTube 형식으로 변환
 */
function transformArtistToYouTubeFormat(artist: ArtistSearchResult): YouTubeSearchResult {
  return {
    resultType: "artist",
    browseId: artist.channelId,
    artist: artist.name,
    thumbnails: artist.thumbnailUrl
      ? [{ url: artist.thumbnailUrl }]
      : undefined,
    subscribers: artist.subscribers ?? undefined,
  };
}

/**
 * 백엔드 API에서 검색 수행 (아티스트 외)
 */
async function searchFromBackend(
  query: string,
  filter?: string | null,
  limit?: string | null
): Promise<YouTubeSearchResult[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const params = new URLSearchParams({ q: query });
    if (filter) params.append("filter", filter);
    if (limit) params.append("limit", limit);

    const response = await fetch(`${API_URL}/search?${params}`, {
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error("[API /search] Backend error:", response.status, response.statusText);
      throw new Error(`Backend error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      console.error("[API /search] Backend timeout");
      throw new Error("Search timeout");
    }

    throw error;
  }
}

// ============================================
// GET Handler
// ============================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const filter = searchParams.get("filter");
  const limit = searchParams.get("limit");

  // 검색어 필수
  if (!query?.trim()) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 }
    );
  }

  try {
    // ============================================
    // 아티스트 검색: DB 영구 저장 + Stale-While-Revalidate
    // ============================================
    if (filter === "artists") {
      const searchResponse = await searchArtistsWithPersistence(query, {
        limit: limit ? Number.parseInt(limit, 10) : 50,
        skipBackgroundRefresh: false,
        mergeWithApi: true,
      });

      // YouTube API 형식으로 변환하여 반환
      const formattedResults = searchResponse.results.map(transformArtistToYouTubeFormat);

      return NextResponse.json(formattedResults, {
        headers: {
          "Cache-Control": `public, s-maxage=${CACHE_MAX_AGE_SECONDS}, stale-while-revalidate=${STALE_WHILE_REVALIDATE_SECONDS}`,
          "X-Search-Source": searchResponse.source,
          "X-Search-Count": String(searchResponse.totalCount),
          "X-Refresh-Triggered": String(searchResponse.refreshTriggered),
        },
      });
    }

    // ============================================
    // 기타 검색 (songs, albums, videos, playlists): 백엔드 프록시
    // ============================================
    const data = await searchFromBackend(query, filter, limit);

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": `public, s-maxage=${CACHE_MAX_AGE_SECONDS}, stale-while-revalidate=${STALE_WHILE_REVALIDATE_SECONDS}`,
      },
    });
  } catch (error) {
    console.error("[API /search] Error:", error);

    const errorMessage = error instanceof Error ? error.message : "Search failed";
    const statusCode = errorMessage.includes("timeout") ? 504 : 500;

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}
