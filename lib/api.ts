// ============================================
// VibeStation API Client
// ============================================
// Clean API client for Cloud Run backend

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://music-370951447146.us-central1.run.app';

export const api = {
    music: {
        // Search for songs, albums, artists
        search: async (query: string, filter?: string, limit: number = 20) => {
            const params = new URLSearchParams({ query, limit: String(limit) });
            if (filter) params.append('filter', filter);

            const res = await fetch(`${API_URL}/api/music/search?${params}`);
            if (!res.ok) throw new Error('Search failed');
            return res.json();
        },

        // Get rich home feed (combines multiple sources)
        home: async (country: string = 'US') => {
            const res = await fetch(`${API_URL}/api/music/home?country=${country}`);
            if (!res.ok) throw new Error('Failed to fetch home');
            return res.json();
        },

        // Get charts for a country
        charts: async (country: string = 'US') => {
            const res = await fetch(`${API_URL}/api/music/charts?country=${country}`);
            if (!res.ok) throw new Error('Failed to fetch charts');
            return res.json();
        },

        // Get explore page (moods, new releases)
        explore: async () => {
            const res = await fetch(`${API_URL}/api/music/explore`);
            if (!res.ok) throw new Error('Failed to fetch explore');
            return res.json();
        },

        // Get artist details
        artist: async (artistId: string) => {
            const res = await fetch(`${API_URL}/api/music/artist/${artistId}`);
            if (!res.ok) throw new Error('Failed to fetch artist');
            return res.json();
        },

        // Get album details
        album: async (albumId: string) => {
            const res = await fetch(`${API_URL}/api/music/album/${albumId}`);
            if (!res.ok) throw new Error('Failed to fetch album');
            return res.json();
        }
    }
};
