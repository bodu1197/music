const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const api = {
    music: {
        search: async (query: string) => {
            const res = await fetch(`${API_URL}/api/music/search?query=${encodeURIComponent(query)}`);
            if (!res.ok) throw new Error('Search failed');
            return res.json();
        },
        home: async () => {
            const res = await fetch(`${API_URL}/api/music/home`);
            if (!res.ok) throw new Error('Failed to fetch home');
            return res.json();
        },
        charts: async (country: string = 'US') => {
            const res = await fetch(`${API_URL}/api/music/charts?country=${country}`);
            if (!res.ok) throw new Error('Failed to fetch charts');
            return res.json();
        }
    }
};
