import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ============================================
// Artist Farming API
// 62개국 인기 아티스트 자동 수집
// ============================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://sori-music-backend-322455104824.us-central1.run.app";

// Supabase Admin Client (서버 사이드)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 62개국 리스트 (YouTube Music Charts 지원 국가)
const SUPPORTED_COUNTRIES = [
  "AR", "AT", "AU", "AZ", "BE", "BG", "BO", "BR", "BY", "CA",
  "CH", "CL", "CO", "CR", "CY", "CZ", "DE", "DK", "DO", "EC",
  "EE", "EG", "ES", "FI", "FR", "GB", "GR", "GT", "HK", "HN",
  "HR", "HU", "ID", "IE", "IL", "IN", "IS", "IT", "JP", "KE",
  "KR", "LT", "LU", "LV", "MX", "MY", "NG", "NI", "NL", "NO",
  "NZ", "PA", "PE", "PH", "PL", "PT", "PY", "RO", "RS", "RU",
  "SA", "SE", "SG", "SK", "SV", "TH", "TR", "TW", "UA", "US",
  "UY", "VE", "VN", "ZA", "ZZ"
];

// Rate limiting을 위한 sleep 함수
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface ChartArtist {
  browseId?: string;
  name?: string;
  title?: string;
  thumbnails?: { url: string }[];
  subscribers?: string;
}

interface ArtistDetail {
  name?: string;
  description?: string;
  subscribers?: string;
  thumbnails?: { url: string }[];
  songs?: {
    results?: {
      videoId: string;
      title: string;
      plays?: string;
      thumbnails?: { url: string }[];
      artists?: { name: string; id?: string }[];
    }[];
  };
  related?: {
    results?: {
      browseId: string;
      title: string;
      thumbnails?: { url: string }[];
    }[];
  };
}

interface AlbumResult {
  browseId: string;
  title: string;
  year?: string;
  thumbnails?: { url: string }[];
  type?: string;
}

/**
 * POST /api/farm/artists
 * 특정 국가들의 인기 아티스트를 파밍
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      countries = ["US", "KR", "JP", "GB"], // 기본값: 주요 4개국
      limit = 20, // 국가당 아티스트 수
      secret = "", // 보안용 시크릿
    } = body;

    // 간단한 보안 체크 (실제 운영시 더 강화 필요)
    if (secret !== process.env.FARM_SECRET && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`[Farm] Starting farming for ${countries.length} countries, ${limit} artists each`);

    const results = {
      total: 0,
      new: 0,
      skipped: 0,
      errors: 0,
      countries: {} as Record<string, { new: number; skipped: number }>,
    };

    const processedArtists = new Set<string>();

    for (const country of countries) {
      if (!SUPPORTED_COUNTRIES.includes(country)) {
        console.log(`[Farm] Skipping unsupported country: ${country}`);
        continue;
      }

      console.log(`[Farm] Processing ${country}...`);
      results.countries[country] = { new: 0, skipped: 0 };

      try {
        // 차트 데이터 가져오기
        const chartsRes = await fetch(`${API_URL}/charts?country=${country}`);
        if (!chartsRes.ok) {
          console.error(`[Farm] Failed to fetch charts for ${country}`);
          continue;
        }

        const charts = await chartsRes.json();
        const artists: ChartArtist[] = charts?.artists?.slice(0, limit) || [];

        for (const artist of artists) {
          const channelId = artist.browseId;
          if (!channelId || processedArtists.has(channelId)) {
            results.countries[country].skipped++;
            continue;
          }

          processedArtists.add(channelId);

          try {
            // 이미 등록된 아티스트인지 확인
            const { data: existing } = await supabaseAdmin
              .from("artists")
              .select("id")
              .eq("channel_id", channelId)
              .single();

            if (existing) {
              results.countries[country].skipped++;
              results.skipped++;
              continue;
            }

            // 아티스트 상세 정보 가져오기
            const [artistRes, albumsRes, singlesRes] = await Promise.all([
              fetch(`${API_URL}/artist/${channelId}?country=${country}`),
              fetch(`/api/artist-data?id=${channelId}&dataType=albums`).catch(() => null),
              fetch(`/api/artist-data?id=${channelId}&dataType=albums&type=singles`).catch(() => null),
            ]);

            if (!artistRes.ok) {
              console.error(`[Farm] Failed to fetch artist details: ${channelId}`);
              results.errors++;
              continue;
            }

            const artistDetail: ArtistDetail = await artistRes.json();
            const albumsData = albumsRes ? await albumsRes.json().catch(() => ({ results: [] })) : { results: [] };
            const singlesData = singlesRes ? await singlesRes.json().catch(() => ({ results: [] })) : { results: [] };

            const thumbnail = artistDetail.thumbnails?.[artistDetail.thumbnails.length - 1]?.url ||
              artist.thumbnails?.[0]?.url;

            // artists 테이블에 저장
            const { data: newArtist, error: insertError } = await supabaseAdmin
              .from("artists")
              .insert({
                channel_id: channelId,
                name: artistDetail.name || artist.name || artist.title || "Unknown",
                thumbnail_url: thumbnail,
                description: artistDetail.description,
                subscribers: artistDetail.subscribers || artist.subscribers,
                slug: generateSlug(artistDetail.name || artist.name || "unknown"),
                is_virtual: true,
              })
              .select()
              .single();

            if (insertError) {
              console.error(`[Farm] Insert artist error: ${insertError.message}`);
              results.errors++;
              continue;
            }

            // artist_data 테이블에 상세 정보 저장
            const albums = (albumsData?.results || []).map((a: AlbumResult) => ({
              browseId: a.browseId,
              title: a.title,
              year: a.year,
              thumbnail: a.thumbnails?.[0]?.url,
              type: a.type,
            }));

            const singles = (singlesData?.results || []).map((s: AlbumResult) => ({
              browseId: s.browseId,
              title: s.title,
              year: s.year,
              thumbnail: s.thumbnails?.[0]?.url,
            }));

            const topSongs = (artistDetail.songs?.results || []).slice(0, 20).map((s) => ({
              videoId: s.videoId,
              title: s.title,
              plays: s.plays,
              thumbnail: s.thumbnails?.[0]?.url,
              artists: s.artists,
            }));

            const relatedArtists = (artistDetail.related?.results || []).slice(0, 10).map((r) => ({
              browseId: r.browseId,
              name: r.title,
              thumbnail: r.thumbnails?.[0]?.url,
            }));

            await supabaseAdmin.from("artist_data").insert({
              artist_id: newArtist.id,
              thumbnail_url: thumbnail,
              description: artistDetail.description,
              subscribers: artistDetail.subscribers,
              albums,
              singles,
              top_songs: topSongs,
              related_artists: relatedArtists,
              source_country: country,
              is_prefarmed: true,
            });

            results.countries[country].new++;
            results.new++;
            results.total++;

            console.log(`[Farm] ✅ Registered: ${artistDetail.name || artist.name} (${country})`);

            // Rate limiting
            await sleep(300);
          } catch (e) {
            console.error(`[Farm] Error processing artist ${channelId}:`, e);
            results.errors++;
          }
        }

        // 국가간 대기
        await sleep(500);
      } catch (e) {
        console.error(`[Farm] Error processing country ${country}:`, e);
      }
    }

    console.log(`[Farm] Completed! New: ${results.new}, Skipped: ${results.skipped}, Errors: ${results.errors}`);

    return NextResponse.json({
      success: true,
      message: `Farming completed`,
      results,
    });
  } catch (e) {
    console.error("[Farm] Fatal error:", e);
    return NextResponse.json(
      { error: "Farming failed", details: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/farm/artists
 * 파밍 상태 조회
 */
export async function GET() {
  try {
    // 파밍된 아티스트 수 조회
    const { count: totalArtists } = await supabaseAdmin
      .from("artists")
      .select("*", { count: "exact", head: true });

    const { count: prefarmedArtists } = await supabaseAdmin
      .from("artist_data")
      .select("*", { count: "exact", head: true })
      .eq("is_prefarmed", true);

    // 국가별 통계
    const { data: countryStats } = await supabaseAdmin
      .from("artist_data")
      .select("source_country")
      .eq("is_prefarmed", true);

    const countryCounts: Record<string, number> = {};
    (countryStats || []).forEach((row) => {
      if (row.source_country) {
        countryCounts[row.source_country] = (countryCounts[row.source_country] || 0) + 1;
      }
    });

    return NextResponse.json({
      totalArtists,
      prefarmedArtists,
      supportedCountries: SUPPORTED_COUNTRIES.length,
      countryStats: countryCounts,
    });
  } catch (e) {
    console.error("[Farm] Status error:", e);
    return NextResponse.json(
      { error: "Failed to get status" },
      { status: 500 }
    );
  }
}

// Slug 생성 함수
function generateSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replaceAll(/[^a-z0-9가-힣]+/g, "-")
      .replace(/^-/, "")
      .replace(/-$/, "")
      .slice(0, 50) +
    "-" +
    Date.now().toString(36).slice(-4)
  );
}
