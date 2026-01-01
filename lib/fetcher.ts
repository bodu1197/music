export const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error('An error occurred while fetching the data.');
    }
    return res.json();
};

export const api = {
    music: {
        search: (query: string) => `/api/music/search?query=${encodeURIComponent(query)}`,
        home: () => `/api/music/home`,
    }
};
