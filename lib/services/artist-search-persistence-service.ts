/**
 * Artist Search Persistence Service
 *
 * Stale-While-Revalidate 패턴을 사용한 아티스트 검색 영구 저장 서비스
 *
 * 동작 방식:
 * 1. DB에서 즉시 검색 결과 반환 (빠른 응답)
 * 2. 백그라운드에서 YouTube Music API 호출
 * 3. 새 데이터를 DB에 영구 저장
 * 4. 다음 검색자는 갱신된 데이터 수신
 *
 * @module artist-search-persistence-service
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import crypto from "crypto";

// ============================================
// Constants
// ============================================

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://sori-music-backend-322455104824.us-central1.run.app";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

/** 동일 검색어 재갱신 방지 시간 (분) */
const REFRESH_THROTTLE_MINUTES = 10;

/** DB 검색 결과 최소 개수 (이하면 API 호출) */
const MIN_DB_RESULTS_THRESHOLD = 5;

/** 검색 결과 최대 개수 */
const MAX_SEARCH_RESULTS = 50;

/** API 호출 타임아웃 (밀리초) */
const API_TIMEOUT_MS = 10000;

// ============================================
// Types
// ============================================

/** YouTube Music API 검색 결과 아티스트 타입 */
interface YouTubeArtistResult {
  browseId: string;
  artist: string;
  thumbnails?: Array<{ url: string; width?: number; height?: number }>;
  subscribers?: string;
  resultType: string;
}

/** DB 아티스트 검색 결과 타입 */
export interface ArtistSearchResult {
  id: string;
  channelId: string;
  name: string;
  thumbnailUrl: string | null;
  subscribers: string | null;
  lastSearchRefreshedAt: string | null;
  similarityScore?: number;
}

/** 검색 옵션 타입 */
interface SearchOptions {
  /** 최대 결과 수 */
  limit?: number;
  /** 백그라운드 갱신 스킵 여부 */
  skipBackgroundRefresh?: boolean;
  /** API 결과와 병합 여부 (첫 검색자용) */
  mergeWithApi?: boolean;
}

/** 검색 응답 타입 */
export interface SearchResponse {
  results: ArtistSearchResult[];
  source: "db" | "api" | "merged";
  refreshTriggered: boolean;
  totalCount: number;
}

// ============================================
// Supabase Client (Server-side with service role)
// ============================================

let supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error("Supabase credentials not configured");
    }
    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    });
  }
  return supabaseAdmin;
}

// ============================================
// Utility Functions
// ============================================

/**
 * 검색어를 정규화하고 해시 생성
 */
function normalizeAndHashQuery(query: string): { normalized: string; hash: string } {
  const normalized = query.toLowerCase().trim();
  const hash = crypto.createHash("md5").update(normalized).digest("hex");
  return { normalized, hash };
}

/**
 * YouTube API 아티스트 결과를 통합 형식으로 변환
 */
function transformApiResult(apiArtist: YouTubeArtistResult): ArtistSearchResult {
  return {
    id: "", // DB 저장 후 채워짐
    channelId: apiArtist.browseId,
    name: apiArtist.artist,
    thumbnailUrl: apiArtist.thumbnails?.[0]?.url ?? null,
    subscribers: apiArtist.subscribers ?? null,
    lastSearchRefreshedAt: new Date().toISOString(),
  };
}

/**
 * DB 결과를 통합 형식으로 변환 (snake_case → camelCase)
 */
function transformDbResult(dbArtist: Record<string, unknown>): ArtistSearchResult {
  return {
    id: String(dbArtist.id ?? ""),
    channelId: String(dbArtist.channel_id ?? ""),
    name: String(dbArtist.name ?? ""),
    thumbnailUrl: dbArtist.thumbnail_url ? String(dbArtist.thumbnail_url) : null,
    subscribers: dbArtist.subscribers ? String(dbArtist.subscribers) : null,
    lastSearchRefreshedAt: dbArtist.last_search_refreshed_at
      ? String(dbArtist.last_search_refreshed_at)
      : null,
    similarityScore: typeof dbArtist.similarity_score === "number"
      ? dbArtist.similarity_score
      : undefined,
  };
}

/**
 * 두 결과 배열을 병합 (중복 제거, channelId 기준)
 */
function mergeResults(
  dbResults: ArtistSearchResult[],
  apiResults: ArtistSearchResult[]
): ArtistSearchResult[] {
  const seen = new Set<string>();
  const merged: ArtistSearchResult[] = [];

  // DB 결과 우선 (이미 저장된 데이터)
  for (const result of dbResults) {
    if (!seen.has(result.channelId)) {
      seen.add(result.channelId);
      merged.push(result);
    }
  }

  // API 결과 추가 (새로운 아티스트)
  for (const result of apiResults) {
    if (!seen.has(result.channelId)) {
      seen.add(result.channelId);
      merged.push(result);
    }
  }

  return merged.slice(0, MAX_SEARCH_RESULTS);
}

// ============================================
// Core Functions
// ============================================

/**
 * DB에서 아티스트 검색
 *
 * Trigram 유사도 + ILIKE 검색 조합
 */
export async function searchArtistsFromDb(
  query: string,
  limit: number = MAX_SEARCH_RESULTS
): Promise<ArtistSearchResult[]> {
  const supabase = getSupabaseAdmin();

  try {
    // RPC 함수 사용 (Trigram + ILIKE)
    const { data, error } = await supabase.rpc("search_artists_by_name", {
      p_query: query,
      p_limit: limit,
    });

    if (error) {
      console.error("[ArtistSearchService] DB search RPC error:", error);

      // Fallback: 단순 ILIKE 검색
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("artists")
        .select("id, channel_id, name, thumbnail_url, subscribers, last_search_refreshed_at")
        .ilike("name", `%${query}%`)
        .limit(limit);

      if (fallbackError) {
        console.error("[ArtistSearchService] DB fallback search error:", fallbackError);
        return [];
      }

      return (fallbackData ?? []).map(transformDbResult);
    }

    return (data ?? []).map(transformDbResult);
  } catch (error) {
    console.error("[ArtistSearchService] DB search exception:", error);
    return [];
  }
}

/**
 * YouTube Music API에서 아티스트 검색
 */
export async function searchArtistsFromApi(
  query: string,
  limit: number = MAX_SEARCH_RESULTS
): Promise<ArtistSearchResult[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const params = new URLSearchParams({
      q: query,
      filter: "artists",
      limit: String(limit),
    });

    const response = await fetch(`${API_URL}/search?${params}`, {
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error("[ArtistSearchService] API search error:", response.status);
      return [];
    }

    const data = await response.json();
    const results = Array.isArray(data) ? data : [];

    return results
      .filter((item: YouTubeArtistResult) => item.resultType === "artist")
      .map(transformApiResult);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[ArtistSearchService] API search timeout");
    } else {
      console.error("[ArtistSearchService] API search exception:", error);
    }
    return [];
  }
}

/**
 * 검색 갱신 필요 여부 확인
 */
export async function shouldRefreshSearch(queryHash: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  try {
    const { data, error } = await supabase.rpc("should_refresh_search", {
      p_query_hash: queryHash,
      p_throttle_minutes: REFRESH_THROTTLE_MINUTES,
    });

    if (error) {
      console.error("[ArtistSearchService] shouldRefresh RPC error:", error);
      return true; // 에러 시 갱신 시도
    }

    return Boolean(data);
  } catch (error) {
    console.error("[ArtistSearchService] shouldRefresh exception:", error);
    return true;
  }
}

/**
 * 검색 결과를 DB에 영구 저장
 */
export async function persistSearchResults(
  results: ArtistSearchResult[],
  query: string,
  queryHash: string
): Promise<void> {
  const supabase = getSupabaseAdmin();

  try {
    // 1. 각 아티스트 upsert
    const upsertPromises = results.map((artist) =>
      supabase.rpc("upsert_artist_from_search", {
        p_channel_id: artist.channelId,
        p_name: artist.name,
        p_thumbnail_url: artist.thumbnailUrl,
        p_subscribers: artist.subscribers,
      })
    );

    await Promise.allSettled(upsertPromises);

    // 2. 검색 로그 업데이트
    const { error } = await supabase.rpc("update_search_refresh_log", {
      p_query_hash: queryHash,
      p_query: query,
      p_result_count: results.length,
    });

    if (error) {
      console.error("[ArtistSearchService] Update search log error:", error);
    }

    console.log(
      `[ArtistSearchService] Persisted ${results.length} artists for query: "${query}"`
    );
  } catch (error) {
    console.error("[ArtistSearchService] Persist exception:", error);
  }
}

/**
 * 백그라운드에서 검색 결과 갱신
 *
 * 사용자 응답을 블로킹하지 않고 비동기로 실행
 */
export async function refreshSearchInBackground(
  query: string,
  queryHash: string
): Promise<void> {
  try {
    // 갱신 필요 여부 재확인 (race condition 방지)
    const shouldRefresh = await shouldRefreshSearch(queryHash);

    if (!shouldRefresh) {
      console.log(`[ArtistSearchService] Skipping refresh for "${query}" (throttled)`);
      return;
    }

    console.log(`[ArtistSearchService] Background refresh started for: "${query}"`);

    // API에서 최신 데이터 가져오기
    const apiResults = await searchArtistsFromApi(query);

    if (apiResults.length > 0) {
      // DB에 저장
      await persistSearchResults(apiResults, query, queryHash);
    }

    console.log(`[ArtistSearchService] Background refresh completed for: "${query}"`);
  } catch (error) {
    console.error("[ArtistSearchService] Background refresh error:", error);
  }
}

// ============================================
// Main Entry Point
// ============================================

/**
 * 아티스트 검색 (Stale-While-Revalidate)
 *
 * 1. DB에서 즉시 검색 → 빠른 응답
 * 2. 결과 부족 시 API와 병합
 * 3. 백그라운드에서 API 호출 → DB 갱신
 *
 * @param query - 검색어
 * @param options - 검색 옵션
 * @returns 검색 결과
 */
export async function searchArtistsWithPersistence(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResponse> {
  const {
    limit = MAX_SEARCH_RESULTS,
    skipBackgroundRefresh = false,
    mergeWithApi = true,
  } = options;

  const { normalized, hash } = normalizeAndHashQuery(query);

  if (!normalized) {
    return {
      results: [],
      source: "db",
      refreshTriggered: false,
      totalCount: 0,
    };
  }

  // 1. DB에서 즉시 검색
  const dbResults = await searchArtistsFromDb(normalized, limit);

  // 2. 백그라운드 갱신 트리거 (비동기, 블로킹 없음)
  let refreshTriggered = false;
  if (!skipBackgroundRefresh) {
    const shouldRefresh = await shouldRefreshSearch(hash);
    if (shouldRefresh) {
      // Fire-and-forget: 응답 기다리지 않음
      refreshSearchInBackground(normalized, hash).catch((error) => {
        console.error("[ArtistSearchService] Background refresh failed:", error);
      });
      refreshTriggered = true;
    }
  }

  // 3. DB 결과가 충분하면 즉시 반환
  if (dbResults.length >= MIN_DB_RESULTS_THRESHOLD) {
    return {
      results: dbResults,
      source: "db",
      refreshTriggered,
      totalCount: dbResults.length,
    };
  }

  // 4. DB 결과 부족 시 API와 병합 (첫 검색자 또는 데이터 부족)
  if (mergeWithApi) {
    const apiResults = await searchArtistsFromApi(normalized, limit);

    if (apiResults.length > 0) {
      // 새 결과 저장 (비동기)
      persistSearchResults(apiResults, normalized, hash).catch((error) => {
        console.error("[ArtistSearchService] Persist failed:", error);
      });

      const merged = mergeResults(dbResults, apiResults);

      return {
        results: merged,
        source: "merged",
        refreshTriggered,
        totalCount: merged.length,
      };
    }
  }

  // 5. API 실패 시 DB 결과라도 반환
  return {
    results: dbResults,
    source: dbResults.length > 0 ? "db" : "api",
    refreshTriggered,
    totalCount: dbResults.length,
  };
}

// ============================================
// Utility Exports
// ============================================

export {
  normalizeAndHashQuery,
  transformApiResult,
  transformDbResult,
  mergeResults,
  REFRESH_THROTTLE_MINUTES,
  MIN_DB_RESULTS_THRESHOLD,
  MAX_SEARCH_RESULTS,
};
