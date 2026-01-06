"use client";

/**
 * 🔥 통합 데이터 모듈
 * 
 * 모든 데이터 요청은 이 모듈을 통해 처리됩니다.
 * 흐름: Supabase 캐시 확인 → 캐시 미스 시 API 호출
 */

import { supabase } from './supabase';
import { md5 } from 'js-md5';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sori-music-backend-322455104824.us-central1.run.app';

// ============================================
// Cache Key Generation (백엔드와 동일)
// ============================================

function makeCacheKey(...args: (string | number | undefined | null)[]): string {
    const keyStr = args.map(arg => String(arg ?? '')).join(':');
    return md5(keyStr);
}

// ============================================
// Unified Data Fetching Functions
// ============================================

/**
 * 앨범 데이터 가져오기
 * 1. Supabase 캐시 확인
 * 2. 없으면 API 호출
 */
export async function getAlbum(browseId: string): Promise<any | null> {
    // 1. Supabase 캐시 확인
    try {
        const cacheKey = makeCacheKey('album', browseId);
        const { data, error } = await supabase
            .from('api_cache')
            .select('data, expires_at')
            .eq('key', cacheKey)
            .maybeSingle();

        if (!error && data && new Date(data.expires_at) >= new Date()) {
            console.log(`[Data] ⚡ Album CACHE HIT: ${browseId}`);
            return data.data;
        }
    } catch (e) {
        // 캐시 읽기 실패 시 무시하고 API 호출로 진행
    }

    // 2. API 호출
    try {
        console.log(`[Data] 📡 Album API call: ${browseId}`);
        const res = await fetch(`${API_URL}/album/${browseId}`);
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.error(`[Data] Album fetch error: ${browseId}`, e);
        return null;
    }
}

/**
 * 플레이리스트/Watch 데이터 가져오기
 * 1. Supabase 캐시 확인
 * 2. 없으면 API 호출
 */
export async function getPlaylist(playlistId: string): Promise<any | null> {
    // 1. Supabase 캐시 확인
    try {
        const cacheKey = makeCacheKey('watch', 'None', playlistId);
        const { data, error } = await supabase
            .from('api_cache')
            .select('data, expires_at')
            .eq('key', cacheKey)
            .maybeSingle();

        if (!error && data && new Date(data.expires_at) >= new Date()) {
            console.log(`[Data] ⚡ Playlist CACHE HIT: ${playlistId}`);
            return data.data;
        }
    } catch (e) {
        // 캐시 읽기 실패 시 무시
    }

    // 2. API 호출
    try {
        console.log(`[Data] 📡 Playlist API call: ${playlistId}`);
        const params = new URLSearchParams({ playlistId, limit: '200' });
        const res = await fetch(`${API_URL}/watch?${params}`);
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.warn(`[Data] Playlist fetch error: ${playlistId}`);
        return null;
    }
}

/**
 * 홈 데이터 가져오기
 */
export async function getHome(limit: number = 100, country: string = 'US', language: string = 'en'): Promise<any | null> {
    // 1. Supabase 캐시 확인
    try {
        const cacheKey = makeCacheKey('home', limit, country, language);
        const { data, error } = await supabase
            .from('api_cache')
            .select('data, expires_at')
            .eq('key', cacheKey)
            .maybeSingle();

        if (!error && data && new Date(data.expires_at) >= new Date()) {
            console.log(`[Data] ⚡ Home CACHE HIT: ${country}`);
            return data.data;
        }
    } catch (e) {
        // 캐시 읽기 실패 시 무시
    }

    // 2. API 호출
    try {
        console.log(`[Data] 📡 Home API call: ${country}`);
        const params = new URLSearchParams({ limit: String(limit), country, language });
        const res = await fetch(`${API_URL}/home?${params}`);
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.error(`[Data] Home fetch error`, e);
        return null;
    }
}

/**
 * 무드 카테고리 가져오기
 */
export async function getMoods(country: string = 'US', language: string = 'en'): Promise<any | null> {
    // 1. Supabase 캐시 확인
    try {
        const cacheKey = makeCacheKey('moods', country, language);
        const { data, error } = await supabase
            .from('api_cache')
            .select('data, expires_at')
            .eq('key', cacheKey)
            .maybeSingle();

        if (!error && data && new Date(data.expires_at) >= new Date()) {
            console.log(`[Data] ⚡ Moods CACHE HIT: ${country}`);
            return data.data;
        }
    } catch (e) {
        // 캐시 읽기 실패 시 무시
    }

    // 2. API 호출
    try {
        console.log(`[Data] 📡 Moods API call: ${country}`);
        const params = new URLSearchParams({ country, language });
        const res = await fetch(`${API_URL}/moods?${params}`);
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.error(`[Data] Moods fetch error`, e);
        return null;
    }
}

/**
 * 무드 플레이리스트 목록 가져오기
 */
export async function getMoodPlaylists(moodParams: string, country: string = 'US', language: string = 'en'): Promise<any | null> {
    // 1. Supabase 캐시 확인
    try {
        const cacheKey = makeCacheKey('mood_playlists', moodParams, country, language);
        const { data, error } = await supabase
            .from('api_cache')
            .select('data, expires_at')
            .eq('key', cacheKey)
            .maybeSingle();

        if (!error && data && new Date(data.expires_at) >= new Date()) {
            console.log(`[Data] ⚡ Mood Playlists CACHE HIT`);
            return data.data;
        }
    } catch (e) {
        // 캐시 읽기 실패 시 무시
    }

    // 2. API 호출
    try {
        console.log(`[Data] 📡 Mood Playlists API call`);
        const params = new URLSearchParams({ params: moodParams, country, language });
        const res = await fetch(`${API_URL}/moods/playlists?${params}`);
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.error(`[Data] Mood Playlists fetch error`, e);
        return null;
    }
}

// ============================================
// Track Extraction Helpers
// ============================================

export interface SimpleTrack {
    videoId: string;
    title: string;
    artist: string;
    thumbnail: string;
    duration?: string;
}

/**
 * 앨범 데이터에서 트랙 추출
 */
export function extractTracksFromAlbum(albumData: any): SimpleTrack[] {
    if (!albumData?.tracks) return [];

    return albumData.tracks.map((track: any) => ({
        videoId: track.videoId,
        title: track.title || 'Unknown',
        artist: track.artists?.[0]?.name || albumData.artists?.[0]?.name || 'Unknown Artist',
        thumbnail: albumData.thumbnails?.[0]?.url || '',
        duration: track.duration || undefined
    })).filter((t: SimpleTrack) => t.videoId);
}

/**
 * 플레이리스트/Watch 데이터에서 트랙 추출
 */
export function extractTracksFromPlaylist(playlistData: any): SimpleTrack[] {
    if (!playlistData?.tracks) return [];

    return playlistData.tracks.map((track: any) => ({
        videoId: track.videoId,
        title: track.title || 'Unknown',
        artist: track.artists?.[0]?.name || 'Unknown Artist',
        thumbnail: track.thumbnail?.thumbnails?.[0]?.url || track.thumbnails?.[0]?.url || '',
        duration: track.duration || undefined
    })).filter((t: SimpleTrack) => t.videoId);
}
