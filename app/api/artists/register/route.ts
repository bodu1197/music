import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ============================================
// Artist Registration API
// 클라이언트에서 직접 DB에 쓰지 않고 서버를 통해 등록
// ============================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://sori-music-backend-322455104824.us-central1.run.app";

// Supabase Admin Client (service_role로 RLS 우회)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AlbumResult {
  browseId: string;
  title: string;
  year?: string;
  thumbnails?: { url: string }[];
  type?: string;
}

interface ArtistInfo {
  name: string;
  description?: string;
  subscribers?: string;
  thumbnails?: { url: string; width: number; height: number }[];
  header?: {
    musicVisualHeaderRenderer?: {
      foregroundThumbnail?: {
        thumbnails?: { url: string }[];
      };
    };
  };
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

// 앨범 데이터 가져오기
async function fetchArtistAlbums(channelId: string, type: "albums" | "singles" = "albums") {
  try {
    const res = await fetch(`${API_URL}/artist/${channelId}/albums?type=${type}`);
    if (!res.ok) return { results: [] };
    return res.json();
  } catch {
    return { results: [] };
  }
}

/**
 * POST /api/artists/register
 * 아티스트 등록 (가상회원 생성)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelId, sourceCountry } = body;

    if (!channelId) {
      return NextResponse.json({ error: "channelId is required" }, { status: 400 });
    }

    // 이미 존재하는지 확인
    const { data: existing } = await supabaseAdmin
      .from("artists")
      .select(`*, artist_data (*)`)
      .eq("channel_id", channelId)
      .single();

    if (existing) {
      return NextResponse.json({ artist: existing, isNew: false });
    }

    console.log(`[API] Registering new artist: ${channelId}`);

    // YouTube Music API 호출
    const [artistInfoRes, albumsData, singlesData] = await Promise.all([
      fetch(`${API_URL}/artist/${channelId}`),
      fetchArtistAlbums(channelId, "albums"),
      fetchArtistAlbums(channelId, "singles"),
    ]);

    if (!artistInfoRes.ok) {
      return NextResponse.json({ error: "Failed to fetch artist info" }, { status: 500 });
    }

    const artistInfo: ArtistInfo = await artistInfoRes.json();

    if (!artistInfo?.name) {
      return NextResponse.json({ error: "Invalid artist data" }, { status: 400 });
    }

    // 썸네일 URL 추출
    const thumbnail = artistInfo.thumbnails?.at(-1)?.url;
    const banner = artistInfo.header?.musicVisualHeaderRenderer?.foregroundThumbnail?.thumbnails?.at(0)?.url;

    // artists 테이블에 저장
    const { data: newArtist, error: artistError } = await supabaseAdmin
      .from("artists")
      .insert({
        channel_id: channelId,
        name: artistInfo.name,
        thumbnail_url: thumbnail,
        banner_url: banner,
        description: artistInfo.description,
        subscribers: artistInfo.subscribers,
        slug: generateSlug(artistInfo.name),
        is_virtual: true,
      })
      .select()
      .single();

    if (artistError) {
      // 중복 등록 시도
      if (artistError.code === "23505") {
        const { data: existingArtist } = await supabaseAdmin
          .from("artists")
          .select(`*, artist_data (*)`)
          .eq("channel_id", channelId)
          .single();
        return NextResponse.json({ artist: existingArtist, isNew: false });
      }
      console.error("[API] Failed to insert artist:", artistError);
      return NextResponse.json({ error: "Failed to create artist" }, { status: 500 });
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

    const topSongs = (artistInfo.songs?.results || []).slice(0, 20).map((s) => ({
      videoId: s.videoId,
      title: s.title,
      plays: s.plays,
      thumbnail: s.thumbnails?.[0]?.url,
      artists: s.artists,
    }));

    const relatedArtists = (artistInfo.related?.results || []).slice(0, 10).map((r) => ({
      browseId: r.browseId,
      name: r.title,
      thumbnail: r.thumbnails?.[0]?.url,
    }));

    const { data: artistData, error: dataError } = await supabaseAdmin
      .from("artist_data")
      .insert({
        artist_id: newArtist.id,
        thumbnail_url: thumbnail,
        banner_url: banner,
        description: artistInfo.description,
        subscribers: artistInfo.subscribers,
        albums,
        singles,
        top_songs: topSongs,
        related_artists: relatedArtists,
        source_country: sourceCountry,
        is_prefarmed: !!sourceCountry,
      })
      .select()
      .single();

    if (dataError) {
      console.error("[API] Failed to insert artist_data:", dataError);
    }

    console.log(`[API] ✅ Registered artist: ${artistInfo.name}`);

    return NextResponse.json({
      artist: { ...newArtist, artist_data: artistData },
      isNew: true,
    });
  } catch (e) {
    console.error("[API] Registration error:", e);
    return NextResponse.json(
      { error: "Registration failed", details: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/artists/register
 * 아티스트 데이터 업데이트 (백그라운드 체크용)
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { artistId, albums, singles, lastCheckedAt } = body;

    if (!artistId) {
      return NextResponse.json({ error: "artistId is required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      last_checked_at: lastCheckedAt || new Date().toISOString(),
    };

    if (albums) updateData.albums = albums;
    if (singles) updateData.singles = singles;
    if (albums || singles) updateData.updated_at = new Date().toISOString();

    const { error } = await supabaseAdmin
      .from("artist_data")
      .update(updateData)
      .eq("artist_id", artistId);

    if (error) {
      console.error("[API] Update error:", error);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[API] Update error:", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

/**
 * PATCH /api/artists/register
 * 기존 아티스트에 artist_data 생성 (검색으로만 등록된 아티스트용)
 *
 * 검색으로 등록된 아티스트가 팬카페 방문 시 호출됨
 * - artists 테이블에는 있지만 artist_data가 없는 경우
 * - YouTube Music API에서 상세 정보 가져와서 artist_data 생성
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { channelId } = body;

    if (!channelId) {
      return NextResponse.json({ error: "channelId is required" }, { status: 400 });
    }

    // 1. 기존 아티스트 확인
    const { data: existingArtist, error: fetchError } = await supabaseAdmin
      .from("artists")
      .select(`*, artist_data (*)`)
      .eq("channel_id", channelId)
      .single();

    if (fetchError || !existingArtist) {
      console.error("[API] Artist not found:", fetchError);
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    // 2. 이미 artist_data가 있으면 그대로 반환
    const existingArtistData = Array.isArray(existingArtist.artist_data)
      ? existingArtist.artist_data[0]
      : existingArtist.artist_data;

    if (existingArtistData) {
      console.log(`[API] artist_data already exists for: ${existingArtist.name}`);
      return NextResponse.json({ artist: existingArtist, isNew: false });
    }

    console.log(`[API] Creating artist_data for existing artist: ${existingArtist.name}`);

    // 3. YouTube Music API에서 상세 정보 가져오기
    const [artistInfoRes, albumsData, singlesData] = await Promise.all([
      fetch(`${API_URL}/artist/${channelId}`),
      fetchArtistAlbums(channelId, "albums"),
      fetchArtistAlbums(channelId, "singles"),
    ]);

    if (!artistInfoRes.ok) {
      console.error("[API] Failed to fetch artist info from YouTube");
      return NextResponse.json({ error: "Failed to fetch artist info" }, { status: 500 });
    }

    const artistInfo: ArtistInfo = await artistInfoRes.json();

    // 4. 썸네일/배너 URL 추출
    const thumbnail = artistInfo.thumbnails?.at(-1)?.url;
    const banner = artistInfo.header?.musicVisualHeaderRenderer?.foregroundThumbnail?.thumbnails?.at(0)?.url;

    // 5. 앨범/싱글/곡 데이터 정리
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

    const topSongs = (artistInfo.songs?.results || []).slice(0, 20).map((s) => ({
      videoId: s.videoId,
      title: s.title,
      plays: s.plays,
      thumbnail: s.thumbnails?.[0]?.url,
      artists: s.artists,
    }));

    const relatedArtists = (artistInfo.related?.results || []).slice(0, 10).map((r) => ({
      browseId: r.browseId,
      name: r.title,
      thumbnail: r.thumbnails?.[0]?.url,
    }));

    // 6. artist_data 생성
    const { data: artistData, error: dataError } = await supabaseAdmin
      .from("artist_data")
      .insert({
        artist_id: existingArtist.id,
        thumbnail_url: thumbnail,
        banner_url: banner,
        description: artistInfo.description,
        subscribers: artistInfo.subscribers,
        albums,
        singles,
        top_songs: topSongs,
        related_artists: relatedArtists,
        source_country: null,
        is_prefarmed: false,
      })
      .select()
      .single();

    if (dataError) {
      console.error("[API] Failed to insert artist_data:", dataError);
      return NextResponse.json({ error: "Failed to create artist_data" }, { status: 500 });
    }

    // 7. artists 테이블 업데이트 (썸네일, 배너, 구독자 등 최신화)
    await supabaseAdmin
      .from("artists")
      .update({
        thumbnail_url: thumbnail ?? existingArtist.thumbnail_url,
        banner_url: banner ?? existingArtist.banner_url,
        description: artistInfo.description ?? existingArtist.description,
        subscribers: artistInfo.subscribers ?? existingArtist.subscribers,
        is_search_indexed: false, // 이제 완전한 데이터가 있음
      })
      .eq("id", existingArtist.id);

    console.log(`[API] ✅ Created artist_data for: ${existingArtist.name}`);

    return NextResponse.json({
      artist: { ...existingArtist, artist_data: artistData },
      isNew: true,
    });
  } catch (e) {
    console.error("[API] PATCH error:", e);
    return NextResponse.json(
      { error: "Failed to ensure artist_data", details: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
