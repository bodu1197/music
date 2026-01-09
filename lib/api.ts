// ============================================
// VibeStation API Client
// ============================================
// Clean API client with Supabase cache priority

import { getCachedHome, getCachedCharts, getCachedMoods, getCachedMoodPlaylists, getCachedWatch } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sori-music-backend-322455104824.us-central1.run.app';

export const api = {
    music: {
        // Search for songs, albums, artists
        search: async (query: string, filter?: string, limit: number = 20) => {
            const params = new URLSearchParams({ q: query, limit: String(limit) });
            if (filter) params.append('filter', filter);

            const res = await fetch(`${API_URL}/search?${params}`);
            if (!res.ok) throw new Error('Search failed');
            return res.json();
        },

        // Get rich home feed (🔥 Supabase cache priority)
        home: async (limit: number = 100, country: string = 'US', language: string = 'en') => {
            // 1. Supabase 캐시 확인 (Cloud Run 거치지 않음!)
            const cached = await getCachedHome(limit, country, language);
            if (cached) return cached;

            // 2. 캐시 미스 시 Cloud Run API 호출
            const params = new URLSearchParams({
                limit: String(limit),
                country: country,
                language: language
            });
            const res = await fetch(`${API_URL}/home?${params}`);
            if (!res.ok) throw new Error('Failed to fetch home');
            return res.json();
        },

        // Get charts for a country (🔥 Supabase cache priority)
        charts: async (country: string = 'US') => {
            // 1. Supabase 캐시 확인
            const cached = await getCachedCharts(country);
            if (cached) return cached;

            // 2. 캐시 미스 시 Cloud Run API 호출
            const res = await fetch(`${API_URL}/charts?country=${country}`);
            if (!res.ok) throw new Error('Failed to fetch charts');
            return res.json();
        },

        // Get artist details
        artist: async (artistId: string, country: string = 'US', language: string = 'en') => {
            const params = new URLSearchParams({ country, language });
            const res = await fetch(`${API_URL}/artist/${artistId}?${params}`);
            if (!res.ok) throw new Error('Failed to fetch artist');
            return res.json();
        },

        // Get all songs for an artist (via Next.js API route to avoid CORS)
        artistSongs: async (artistId: string) => {
            const res = await fetch(`/api/artist-data?id=${artistId}&dataType=songs`);
            if (!res.ok) throw new Error('Failed to fetch artist songs');
            return res.json();
        },

        // Get all albums/singles for an artist (via Next.js API route to avoid CORS)
        artistAlbums: async (artistId: string, type: 'albums' | 'singles' = 'albums') => {
            const res = await fetch(`/api/artist-data?id=${artistId}&dataType=albums&type=${type}`);
            if (!res.ok) throw new Error('Failed to fetch artist albums');
            return res.json();
        },

        // Get album details (with retry for cold start)
        album: async (albumId: string) => {
            const maxRetries = 3;
            let lastError: Error | null = null;

            for (let attempt = 0; attempt < maxRetries; attempt++) {
                try {
                    const res = await fetch(`${API_URL}/album/${albumId}`);
                    if (!res.ok) throw new Error('Failed to fetch album');
                    return res.json();
                } catch (e) {
                    lastError = e as Error;
                    console.log(`[API] Album fetch attempt ${attempt + 1} failed, retrying...`);
                    // Wait before retry (exponential backoff)
                    if (attempt < maxRetries - 1) {
                        await new Promise(r => setTimeout(r, (attempt + 1) * 500));
                    }
                }
            }
            throw lastError || new Error('Failed to fetch album after retries');
        },

        // Get song details
        song: async (videoId: string) => {
            const res = await fetch(`${API_URL}/song/${videoId}`);
            if (!res.ok) throw new Error('Failed to fetch song');
            return res.json();
        },

        // Get lyrics
        lyrics: async (browseId: string) => {
            const res = await fetch(`${API_URL}/lyrics/${browseId}`);
            if (!res.ok) throw new Error('Failed to fetch lyrics');
            return res.json();
        },

        // Get watch playlist (🔥 Supabase cache priority)
        watch: async (videoId?: string, playlistId?: string, limit: number = 200) => {
            // 1. Supabase 캐시 확인
            const cached = await getCachedWatch(videoId, playlistId);
            if (cached) return cached;

            // 2. 캐시 미스 시 Cloud Run API 호출
            const params = new URLSearchParams();
            if (videoId) params.append('videoId', videoId);
            if (playlistId) params.append('playlistId', playlistId);
            params.append('limit', String(limit));

            const res = await fetch(`${API_URL}/watch?${params}`);
            if (!res.ok) throw new Error('Failed to fetch watch playlist');
            return res.json();
        },

        // Get mood/genre categories (🔥 Supabase cache priority)
        moods: async (country: string = 'US', language: string = 'en') => {
            // 1. Supabase 캐시 확인
            const cached = await getCachedMoods(country, language);
            if (cached) return cached;

            // 2. 캐시 미스 시 Cloud Run API 호출
            const params = new URLSearchParams({ country, language });
            const res = await fetch(`${API_URL}/moods?${params}`);
            if (!res.ok) throw new Error('Failed to fetch moods');
            return res.json();
        },

        // Get playlists for a mood/genre (🔥 Supabase cache priority)
        moodPlaylists: async (moodParams: string, country: string = 'US', language: string = 'en') => {
            // 1. Supabase 캐시 확인
            const cached = await getCachedMoodPlaylists(moodParams, country, language);
            if (cached) return cached;

            // 2. 캐시 미스 시 Cloud Run API 호출
            const urlParams = new URLSearchParams({
                params: moodParams,
                country,
                language
            });
            const res = await fetch(`${API_URL}/moods/playlists?${urlParams}`);
            if (!res.ok) throw new Error('Failed to fetch mood playlists');
            return res.json();
        },

        // Get ALL moods with playlists (server-cached, single request)
        moodsAll: async (country: string = 'US', language: string = 'en') => {
            const params = new URLSearchParams({ country, language });
            const res = await fetch(`/api/moods/all?${params}`);
            if (!res.ok) throw new Error('Failed to fetch all moods');
            return res.json();
        },

        // Get home feed (server-cached)
        homeCached: async (limit: number = 100, country: string = 'US', language: string = 'en') => {
            const params = new URLSearchParams({
                limit: String(limit),
                country,
                language
            });
            const res = await fetch(`/api/home?${params}`);
            if (!res.ok) throw new Error('Failed to fetch home');
            return res.json();
        },

        // Get charts (server-cached)
        chartsCached: async (country: string = 'US') => {
            const res = await fetch(`/api/charts?country=${country}`);
            if (!res.ok) throw new Error('Failed to fetch charts');
            return res.json();
        },

        // Get full playlist
        playlist: async (playlistId: string, limit: number = 200) => {
            const res = await fetch(`${API_URL}/playlist/${playlistId}?limit=${limit}`);
            if (!res.ok) throw new Error('Failed to fetch playlist');
            return res.json();
        },

        // 🔥 Get YouTube playlist tracks (optimized for instant playback)
        // Uses backend to extract video IDs + metadata, cached for 24h
        playlistTracks: async (playlistId: string): Promise<{
            playlistId: string;
            tracks: Array<{
                videoId: string;
                title: string;
                artist: string;
                thumbnail: string;
            }>;
            count: number;
            error?: string;
        }> => {
            const res = await fetch(`${API_URL}/playlist/tracks?playlistId=${playlistId}`);
            if (!res.ok) throw new Error('Failed to fetch playlist tracks');
            return res.json();
        }
    },

    // ============================================
    // Artists API (Cafe Virtual Members)
    // ============================================
    artists: {
        // Register an artist as a virtual member (auto-called when visiting artist page)
        register: async (artistData: {
            channel_id: string;
            name: string;
            thumbnail_url?: string;
            banner_url?: string;
            description?: string;
            subscribers?: string;
        }) => {
            try {
                const res = await fetch(`${API_URL}/api/artists/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(artistData)
                });
                if (!res.ok) throw new Error('Failed to register artist');
                return res.json();
            } catch (e) {
                console.error('[API] Artist register error:', e);
                return null; // Fail silently - registration is not critical
            }
        },

        // Get a registered artist by channel_id
        get: async (channelId: string) => {
            const res = await fetch(`${API_URL}/api/artists/${channelId}`);
            if (!res.ok) return null;
            return res.json();
        }
    }
};
