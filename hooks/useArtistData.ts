"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import {
  getArtistByChannelId,
  joinCafe,
  leaveCafe,
  isJoinedCafe,
  ArtistWithData,
} from "@/lib/services/artist-service";

// ============================================
// useArtistData Hook
// Cache-First + Background Refresh 전략
// ============================================

interface UseArtistDataReturn {
  artist: ArtistWithData | null;
  isLoading: boolean;
  error: string | null;
  isJoined: boolean;
  isJoinLoading: boolean;
  handleJoin: () => Promise<void>;
  handleLeave: () => Promise<void>;
  toggleJoin: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useArtistData(channelId: string | null): UseArtistDataReturn {
  const { user } = useAuth();
  const [artist, setArtist] = useState<ArtistWithData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isJoinLoading, setIsJoinLoading] = useState(false);

  // 아티스트 데이터 로드
  const loadArtist = useCallback(async () => {
    if (!channelId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Cache-First: DB에서 즉시 로드 (백그라운드 체크는 서비스에서 자동 처리)
      const data = await getArtistByChannelId(channelId);

      if (data) {
        setArtist(data);
      } else {
        setError("아티스트를 찾을 수 없습니다");
      }
    } catch (e) {
      console.error("[useArtistData] Error:", e);
      setError("데이터를 불러오는 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  }, [channelId]);

  // 카페 가입 여부 확인
  const checkJoinStatus = useCallback(async () => {
    if (!user || !artist?.id) {
      console.log("[useArtistData] Skip checkJoinStatus: user=", !!user, "artistId=", artist?.id);
      setIsJoined(false);
      return;
    }

    console.log("[useArtistData] Checking join status for user:", user.id, "artist:", artist.id);
    const joined = await isJoinedCafe(user.id, artist.id);
    console.log("[useArtistData] Join status result:", joined);
    setIsJoined(joined);
  }, [user, artist?.id]);

  // 초기 로드
  useEffect(() => {
    loadArtist();
  }, [loadArtist]);

  // 가입 여부 확인 - artist 로드 후에만 실행
  useEffect(() => {
    if (artist?.id) {
      checkJoinStatus();
    }
  }, [artist?.id, checkJoinStatus]);

  // 카페 가입
  const handleJoin = useCallback(async () => {
    if (!user || !artist?.id) {
      console.error("[useArtistData] User not logged in or artist not loaded");
      return;
    }

    console.log("[useArtistData] Attempting to join cafe:", artist.id, "user:", user.id);

    try {
      setIsJoinLoading(true);
      const success = await joinCafe(user.id, artist.id);
      console.log("[useArtistData] Join result:", success);

      if (success) {
        setIsJoined(true);
        // 확인을 위해 다시 체크
        const verified = await isJoinedCafe(user.id, artist.id);
        console.log("[useArtistData] Join verified:", verified);
      } else {
        console.error("[useArtistData] Join failed - joinCafe returned false");
      }
    } catch (e) {
      console.error("[useArtistData] Join error:", e);
    } finally {
      setIsJoinLoading(false);
    }
  }, [user, artist?.id]);

  // 카페 탈퇴
  const handleLeave = useCallback(async () => {
    if (!user || !artist?.id) return;

    console.log("[useArtistData] Attempting to leave cafe:", artist.id, "user:", user.id);

    try {
      setIsJoinLoading(true);
      const success = await leaveCafe(user.id, artist.id);
      console.log("[useArtistData] Leave result:", success);

      if (success) {
        setIsJoined(false);
      } else {
        console.error("[useArtistData] Leave failed - leaveCafe returned false");
      }
    } catch (e) {
      console.error("[useArtistData] Leave error:", e);
    } finally {
      setIsJoinLoading(false);
    }
  }, [user, artist?.id]);

  // 토글 (가입/탈퇴)
  const toggleJoin = useCallback(async () => {
    if (isJoined) {
      await handleLeave();
    } else {
      await handleJoin();
    }
  }, [isJoined, handleJoin, handleLeave]);

  // 새로고침
  const refetch = useCallback(async () => {
    await loadArtist();
    await checkJoinStatus();
  }, [loadArtist, checkJoinStatus]);

  return {
    artist,
    isLoading,
    error,
    isJoined,
    isJoinLoading,
    handleJoin,
    handleLeave,
    toggleJoin,
    refetch,
  };
}

// ============================================
// useJoinedCafes Hook
// 가입한 카페 목록 조회
// ============================================

import { getJoinedCafes } from "@/lib/services/artist-service";

interface UseJoinedCafesReturn {
  cafes: ArtistWithData[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useJoinedCafes(): UseJoinedCafesReturn {
  const { user, loading: authLoading } = useAuth();
  const [cafes, setCafes] = useState<ArtistWithData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCafes = useCallback(async () => {
    if (authLoading) return;

    if (!user) {
      setCafes([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const data = await getJoinedCafes(user.id);
      setCafes(data);
    } catch (e) {
      console.error("[useJoinedCafes] Error:", e);
      setError("카페 목록을 불러오는 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    loadCafes();
  }, [loadCafes]);

  return {
    cafes,
    isLoading,
    error,
    refetch: loadCafes,
  };
}

// ============================================
// usePopularArtists Hook
// 인기 아티스트 목록
// ============================================

import { getPopularArtists, getPrefarmedArtists } from "@/lib/services/artist-service";

interface UsePopularArtistsReturn {
  artists: ArtistWithData[];
  isLoading: boolean;
  error: string | null;
}

export function usePopularArtists(limit: number = 20): UsePopularArtistsReturn {
  const [artists, setArtists] = useState<ArtistWithData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        const data = await getPopularArtists(limit);
        setArtists(data);
      } catch (e) {
        console.error("[usePopularArtists] Error:", e);
        setError("인기 아티스트를 불러오는 중 오류가 발생했습니다");
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [limit]);

  return { artists, isLoading, error };
}

export function usePrefarmedArtists(
  country?: string,
  limit: number = 40
): UsePopularArtistsReturn {
  const [artists, setArtists] = useState<ArtistWithData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        const data = await getPrefarmedArtists(country, limit);
        setArtists(data);
      } catch (e) {
        console.error("[usePrefarmedArtists] Error:", e);
        setError("아티스트를 불러오는 중 오류가 발생했습니다");
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [country, limit]);

  return { artists, isLoading, error };
}
