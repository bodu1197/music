// ============================================
// VibeStation API Client
// ============================================
// Clean API client for Cloud Run backend

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

        // Get rich home feed (Pure get_home)
        home: async (limit: number = 100, country: string = 'US', language: string = 'en') => {
            const params = new URLSearchParams({
                limit: String(limit),
                country: country,
                language: language
            });
            const res = await fetch(`${API_URL}/home?${params}`);
            if (!res.ok) throw new Error('Failed to fetch home');
            return res.json();
        },

        // Get charts for a country
        charts: async (country: string = 'US') => {
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

        // Get album details
        album: async (albumId: string) => {
            const res = await fetch(`${API_URL}/album/${albumId}`);
            if (!res.ok) throw new Error('Failed to fetch album');
            return res.json();
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

        // Get watch playlist
        watch: async (videoId?: string, playlistId?: string) => {
            const params = new URLSearchParams();
            if (videoId) params.append('videoId', videoId);
            if (playlistId) params.append('playlistId', playlistId);

            const res = await fetch(`${API_URL}/watch?${params}`);
            if (!res.ok) throw new Error('Failed to fetch watch playlist');
            return res.json();
        },

        // Get mood/genre categories
        moods: async (country: string = 'US', language: string = 'en') => {
            const params = new URLSearchParams({ country, language });
            const res = await fetch(`${API_URL}/moods?${params}`);
            if (!res.ok) throw new Error('Failed to fetch moods');
            return res.json();
        },

        // Get playlists for a mood/genre
        moodPlaylists: async (params: string, country: string = 'US', language: string = 'en') => {
            const urlParams = new URLSearchParams({
                params,
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

        // Get FULL moods with playlists AND tracks (instant response)
        moodsFull: async (country: string = 'US', language: string = 'en') => {
            const params = new URLSearchParams({ country, language });
            const res = await fetch(`${API_URL}/moods/full?${params}`);
            if (!res.ok) throw new Error('Failed to fetch full moods');
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
        }
    }
};
