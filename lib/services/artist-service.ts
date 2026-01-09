"use client";

import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";

// ============================================
// Artist Service - Supabase Direct Operations
// Cache-First + Background Refresh 전략
// ============================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://sori-music-backend-322455104824.us-central1.run.app";

// 서버사이드에서도 동작하는 앨범 데이터 가져오기
async function fetchArtistAlbums(channelId: string, type: "albums" | "singles" = "albums") {
  try {
    const res = await fetch(`${API_URL}/artist/${channelId}/albums?type=${type}`);
    if (!res.ok) return { results: [] };
    return res.json();
  } catch {
    return { results: [] };
  }
}

export interface Artist {
  id: string;
  channel_id: string;
  name: string;
  thumbnail_url?: string;
  banner_url?: string;
  description?: string;
  subscribers?: string;
  slug?: string;
  is_virtual?: boolean;
}

export interface ArtistData {
  id: string;
  artist_id: string;
  thumbnail_url?: string;
  banner_url?: string;
  description?: string;
  subscribers?: string;
  albums: Album[];
  singles: Album[];
  top_songs: Song[];
  related_artists: RelatedArtist[];
  view_count: number;
  follower_count: number;
  post_count: number;
  cached_at: string;
  last_checked_at: string;
  is_prefarmed: boolean;
}

export interface Album {
  browseId: string;
  title: string;
  year?: string;
  thumbnail?: string;
  type?: string;
}

export interface Song {
  videoId: string;
  title: string;
  plays?: string;
  thumbnail?: string;
  artists?: { name: string; id?: string }[];
}

export interface RelatedArtist {
  browseId: string;
  name: string;
  thumbnail?: string;
}

export interface ArtistWithData extends Artist {
  artist_data?: ArtistData;
}

// ============================================
// Core Functions
// ============================================

/**
 * 채널 ID로 아티스트 조회 (DB 우선)
 * Cache-First: DB에서 먼저 조회, 없으면 API 호출 후 저장
 */
export async function getArtistByChannelId(
  channelId: string,
  options?: { skipBackgroundCheck?: boolean }
): Promise<ArtistWithData | null> {
  try {
    // 1️⃣ DB에서 즉시 조회
    const { data: artist, error } = await supabase
      .from("artists")
      .select(`
        *,
        artist_data (*)
      `)
      .eq("channel_id", channelId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("[ArtistService] DB query error:", error);
    }

    // 2️⃣ DB에 있으면 즉시 반환 + 백그라운드 체크
    if (artist) {
      // 조회수 증가 (비동기, 대기 안함)
      incrementViewCount(artist.id);

      // 백그라운드에서 신선 데이터 체크
      if (!options?.skipBackgroundCheck) {
        checkFreshDataInBackground(channelId, artist);
      }

      return artist as ArtistWithData;
    }

    // 3️⃣ DB에 없으면 API 호출 후 저장 (가상회원 생성)
    return await registerArtistFromAPI(channelId);
  } catch (e) {
    console.error("[ArtistService] Error:", e);
    return null;
  }
}

/**
 * YouTube Music API에서 아티스트 정보 가져와서 DB에 등록
 * (가상회원 생성)
 */
export async function registerArtistFromAPI(
  channelId: string,
  sourceCountry?: string
): Promise<ArtistWithData | null> {
  try {
    console.log(`[ArtistService] Registering new artist: ${channelId}`);

    // 1. YouTube Music API 호출 (서버사이드에서도 동작하도록 직접 호출)
    const [artistInfo, albumsData, singlesData] = await Promise.all([
      api.music.artist(channelId),
      fetchArtistAlbums(channelId, "albums"),
      fetchArtistAlbums(channelId, "singles"),
    ]);

    if (!artistInfo || !artistInfo.name) {
      console.error("[ArtistService] Failed to fetch artist info from API");
      return null;
    }

    // 2. 썸네일 URL 추출
    const thumbnail = artistInfo.thumbnails?.[artistInfo.thumbnails.length - 1]?.url;
    const banner = artistInfo.header?.musicVisualHeaderRenderer?.foregroundThumbnail?.thumbnails?.[0]?.url;

    // 3. artists 테이블에 기본 정보 저장
    const { data: newArtist, error: artistError } = await supabase
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
      // 중복 등록 시도인 경우 기존 데이터 반환
      if (artistError.code === "23505") {
        return getArtistByChannelId(channelId, { skipBackgroundCheck: true });
      }
      console.error("[ArtistService] Failed to insert artist:", artistError);
      return null;
    }

    // 4. artist_data 테이블에 상세 정보 저장
    const albums = (albumsData?.results || []).map((a: Record<string, unknown>) => ({
      browseId: a.browseId,
      title: a.title,
      year: a.year,
      thumbnail: (a.thumbnails as { url: string }[])?.[0]?.url,
      type: a.type,
    }));

    const singles = (singlesData?.results || []).map((s: Record<string, unknown>) => ({
      browseId: s.browseId,
      title: s.title,
      year: s.year,
      thumbnail: (s.thumbnails as { url: string }[])?.[0]?.url,
    }));

    const topSongs = (artistInfo.songs?.results || []).slice(0, 20).map((s: Record<string, unknown>) => ({
      videoId: s.videoId,
      title: s.title,
      plays: s.plays,
      thumbnail: (s.thumbnails as { url: string }[])?.[0]?.url,
      artists: s.artists,
    }));

    const relatedArtists = (artistInfo.related?.results || []).slice(0, 10).map((r: Record<string, unknown>) => ({
      browseId: r.browseId,
      name: r.title,
      thumbnail: (r.thumbnails as { url: string }[])?.[0]?.url,
    }));

    const { data: artistData, error: dataError } = await supabase
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
      console.error("[ArtistService] Failed to insert artist_data:", dataError);
    }

    console.log(`[ArtistService] ✅ Registered artist: ${artistInfo.name}`);

    return {
      ...newArtist,
      artist_data: artistData,
    } as ArtistWithData;
  } catch (e) {
    console.error("[ArtistService] Registration error:", e);
    return null;
  }
}

/**
 * 백그라운드에서 신선 데이터 체크 (사용자 대기 없음)
 */
async function checkFreshDataInBackground(
  channelId: string,
  cachedArtist: ArtistWithData
): Promise<void> {
  try {
    const artistData = cachedArtist.artist_data;
    if (!artistData) return;

    // 마지막 체크가 1시간 이내면 스킵
    const hourAgo = Date.now() - 60 * 60 * 1000;
    if (artistData.last_checked_at && new Date(artistData.last_checked_at).getTime() > hourAgo) {
      return;
    }

    console.log(`[ArtistService] 🔄 Background check for: ${cachedArtist.name}`);

    // API 호출 (백그라운드) - 직접 호출로 서버사이드에서도 동작
    const [freshAlbums, freshSingles] = await Promise.all([
      fetchArtistAlbums(channelId, "albums"),
      fetchArtistAlbums(channelId, "singles"),
    ]);

    const cachedAlbumIds = new Set((artistData.albums || []).map((a: Album) => a.browseId));
    const cachedSingleIds = new Set((artistData.singles || []).map((s: Album) => s.browseId));

    // 새 앨범 감지
    const newAlbums = (freshAlbums?.results || []).filter(
      (a: { browseId: string }) => !cachedAlbumIds.has(a.browseId)
    );
    const newSingles = (freshSingles?.results || []).filter(
      (s: { browseId: string }) => !cachedSingleIds.has(s.browseId)
    );

    if (newAlbums.length > 0 || newSingles.length > 0) {
      console.log(`[ArtistService] 🎉 New releases detected! Albums: ${newAlbums.length}, Singles: ${newSingles.length}`);

      // DB 업데이트
      const allAlbums = [
        ...newAlbums.map((a: Record<string, unknown>) => ({
          browseId: a.browseId,
          title: a.title,
          year: a.year,
          thumbnail: (a.thumbnails as { url: string }[])?.[0]?.url,
          type: a.type,
        })),
        ...artistData.albums,
      ];

      const allSingles = [
        ...newSingles.map((s: Record<string, unknown>) => ({
          browseId: s.browseId,
          title: s.title,
          year: s.year,
          thumbnail: (s.thumbnails as { url: string }[])?.[0]?.url,
        })),
        ...artistData.singles,
      ];

      await supabase
        .from("artist_data")
        .update({
          albums: allAlbums,
          singles: allSingles,
          last_checked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("artist_id", cachedArtist.id);

      // 새 릴리즈 공지 생성 (선택적)
      if (newAlbums.length > 0) {
        await createNewReleasePost(cachedArtist, newAlbums[0]);
      }
    } else {
      // 체크 시간만 업데이트
      await supabase
        .from("artist_data")
        .update({ last_checked_at: new Date().toISOString() })
        .eq("artist_id", cachedArtist.id);
    }
  } catch (e) {
    console.error("[ArtistService] Background check error:", e);
  }
}

/**
 * 새 앨범 발매 자동 공지 생성
 */
async function createNewReleasePost(
  artist: ArtistWithData,
  newAlbum: Record<string, unknown>
): Promise<void> {
  try {
    // AI 아티스트로서 자동 게시물 생성
    await supabase.from("posts").insert({
      user_id: null, // AI 생성 게시물
      artist_id: artist.id,
      type: "release_announcement",
      content: `🎉 새로운 앨범이 발매되었습니다!\n\n"${newAlbum.title}" - ${newAlbum.year || "2024"}\n\n지금 바로 들어보세요! 🎵`,
      visibility: "public",
    });

    console.log(`[ArtistService] 📝 Created release announcement for: ${newAlbum.title}`);
  } catch (e) {
    console.error("[ArtistService] Failed to create release post:", e);
  }
}

/**
 * 조회수 증가 (비동기)
 */
function incrementViewCount(artistId: string): void {
  supabase.rpc("increment_artist_view", { p_artist_id: artistId }).then(({ error }) => {
    if (error) {
      console.error("[ArtistService] View increment error:", error);
    }
  });
}

/**
 * 카페 가입 (팔로우)
 */
export async function joinCafe(userId: string, artistId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("follows").insert({
      follower_id: userId,
      following_type: "artist",
      following_id: artistId,
      notifications: true,
    });

    if (error) {
      if (error.code === "23505") {
        // 이미 가입됨
        return true;
      }
      console.error("[ArtistService] Join cafe error:", error);
      return false;
    }

    return true;
  } catch (e) {
    console.error("[ArtistService] Join cafe error:", e);
    return false;
  }
}

/**
 * 카페 탈퇴 (언팔로우)
 */
export async function leaveCafe(userId: string, artistId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", userId)
      .eq("following_type", "artist")
      .eq("following_id", artistId);

    if (error) {
      console.error("[ArtistService] Leave cafe error:", error);
      return false;
    }

    return true;
  } catch (e) {
    console.error("[ArtistService] Leave cafe error:", e);
    return false;
  }
}

/**
 * 카페 가입 여부 확인
 */
export async function isJoinedCafe(userId: string, artistId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", userId)
      .eq("following_type", "artist")
      .eq("following_id", artistId)
      .single();

    return !error && !!data;
  } catch {
    return false;
  }
}

/**
 * 사용자가 가입한 카페 목록 조회
 */
export async function getJoinedCafes(userId: string): Promise<ArtistWithData[]> {
  try {
    const { data, error } = await supabase
      .from("follows")
      .select(`
        following_id,
        created_at
      `)
      .eq("follower_id", userId)
      .eq("following_type", "artist")
      .order("created_at", { ascending: false });

    if (error || !data) {
      console.error("[ArtistService] Get joined cafes error:", error);
      return [];
    }

    // 각 아티스트 정보 조회
    const artistIds = data.map((f) => f.following_id);
    const { data: artists, error: artistError } = await supabase
      .from("artists")
      .select(`
        *,
        artist_data (*)
      `)
      .in("id", artistIds);

    if (artistError) {
      console.error("[ArtistService] Get artists error:", artistError);
      return [];
    }

    return (artists || []) as ArtistWithData[];
  } catch (e) {
    console.error("[ArtistService] Get joined cafes error:", e);
    return [];
  }
}

/**
 * 아티스트 검색 (DB 우선)
 */
export async function searchArtists(query: string, limit: number = 20): Promise<Artist[]> {
  try {
    const { data, error } = await supabase
      .from("artists")
      .select("*")
      .ilike("name", `%${query}%`)
      .limit(limit);

    if (error) {
      console.error("[ArtistService] Search error:", error);
      return [];
    }

    return (data || []) as Artist[];
  } catch (e) {
    console.error("[ArtistService] Search error:", e);
    return [];
  }
}

/**
 * 인기 아티스트 목록 (조회수 기준)
 */
export async function getPopularArtists(limit: number = 20): Promise<ArtistWithData[]> {
  try {
    const { data, error } = await supabase
      .from("artist_data")
      .select(`
        *,
        artists (*)
      `)
      .order("view_count", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[ArtistService] Get popular error:", error);
      return [];
    }

    // 데이터 구조 변환
    return (data || []).map((d) => ({
      ...d.artists,
      artist_data: d,
    })) as ArtistWithData[];
  } catch (e) {
    console.error("[ArtistService] Get popular error:", e);
    return [];
  }
}

/**
 * 사전 파밍된 아티스트 목록
 */
export async function getPrefarmedArtists(
  country?: string,
  limit: number = 40
): Promise<ArtistWithData[]> {
  try {
    let query = supabase
      .from("artist_data")
      .select(`
        *,
        artists (*)
      `)
      .eq("is_prefarmed", true)
      .order("view_count", { ascending: false })
      .limit(limit);

    if (country) {
      query = query.eq("source_country", country);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[ArtistService] Get prefarmed error:", error);
      return [];
    }

    return (data || []).map((d) => ({
      ...d.artists,
      artist_data: d,
    })) as ArtistWithData[];
  } catch (e) {
    console.error("[ArtistService] Get prefarmed error:", e);
    return [];
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * 아티스트 이름으로 slug 생성
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50) + "-" + Date.now().toString(36).slice(-4);
}

/**
 * 대량 아티스트 등록 (파밍용)
 */
export async function bulkRegisterArtists(
  artistInfos: Array<{
    channelId: string;
    name: string;
    thumbnail?: string;
    subscribers?: string;
  }>,
  sourceCountry: string
): Promise<number> {
  let registered = 0;

  for (const info of artistInfos) {
    try {
      // 이미 존재하는지 확인
      const { data: existing } = await supabase
        .from("artists")
        .select("id")
        .eq("channel_id", info.channelId)
        .single();

      if (existing) {
        continue; // 이미 등록됨
      }

      // 등록
      await registerArtistFromAPI(info.channelId, sourceCountry);
      registered++;

      // Rate limiting
      await new Promise((r) => setTimeout(r, 500));
    } catch (e) {
      console.error(`[ArtistService] Bulk register error for ${info.name}:`, e);
    }
  }

  return registered;
}
