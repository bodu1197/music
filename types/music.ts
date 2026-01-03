// ============================================
// YouTube Music API Types
// ============================================
// Types for ytmusicapi responses and related data structures

// Base types
export interface Thumbnail {
    url: string;
    width?: number;
    height?: number;
}

export interface Artist {
    name: string;
    id?: string;
}

export interface Album {
    name: string;
    id?: string;
}

// Search Result Types
export type SearchResultType = 'song' | 'video' | 'album' | 'artist' | 'playlist' | 'community_playlist' | 'featured_playlist';

export interface SearchResult {
    resultType: SearchResultType;
    title?: string;
    artist?: string;
    videoId?: string;
    browseId?: string;
    playlistId?: string;
    category?: string;
    duration?: string;
    year?: string;
    subscribers?: string;
    itemCount?: number;
    thumbnails?: Thumbnail[];
    artists?: Artist[];
    album?: Album;
    author?: string;
}

// Home Section Types
export interface HomeSectionContent {
    title: string;
    videoId?: string;
    browseId?: string;
    playlistId?: string;
    thumbnails?: Thumbnail[];
    artists?: Artist[];
    subscribers?: string;
    description?: string;
}

export interface HomeSection {
    title: string;
    contents: HomeSectionContent[];
}

// Chart Types
export interface ChartArtist {
    title: string;
    browseId: string;
    subscribers?: string;
    thumbnails?: Thumbnail[];
    trend?: 'up' | 'down' | 'neutral';
    rank?: string;
}

export interface ChartVideo {
    title: string;
    videoId: string;
    playlistId?: string;
    artists?: Artist[];
    thumbnails?: Thumbnail[];
    views?: string;
}

export interface ChartTrendingVideo {
    title: string;
    videoId: string;
    playlistId?: string;
    artists?: Artist[];
    thumbnails?: Thumbnail[];
    views?: string;
}

export interface Charts {
    artists?: { items: ChartArtist[] };
    videos?: { items: ChartVideo[]; playlist?: string };
    trending?: { items: ChartTrendingVideo[] };
    countries?: { selected: string; options: string[] };
}

// Album Types
export interface AlbumTrack {
    title: string;
    videoId: string;
    artists?: Artist[];
    duration?: string;
    duration_seconds?: number;
    thumbnails?: Thumbnail[];
    isExplicit?: boolean;
    trackNumber?: number;
}

export interface AlbumData {
    title: string;
    type: string;
    thumbnails?: Thumbnail[];
    description?: string;
    artists?: Artist[];
    year?: string;
    trackCount?: number;
    duration?: string;
    audioPlaylistId?: string;
    tracks?: AlbumTrack[];
}

// Playlist Types
export interface PlaylistTrack {
    title: string;
    videoId: string;
    artists?: Artist[];
    album?: Album;
    duration?: string;
    duration_seconds?: number;
    thumbnails?: Thumbnail[];
    isAvailable?: boolean;
    isExplicit?: boolean;
    setVideoId?: string;
}

export interface PlaylistData {
    id: string;
    title: string;
    thumbnails?: Thumbnail[];
    description?: string;
    author?: {
        name?: string;
        id?: string;
    };
    year?: string;
    duration?: string;
    trackCount?: number;
    tracks?: PlaylistTrack[];
}

// Watch Playlist Types (from watch API)
export interface WatchTrack {
    title: string;
    videoId: string;
    length?: string;
    lengthSeconds?: number;
    thumbnail?: Thumbnail[];
    artists?: Artist[];
    album?: Album;
    videoType?: string;
}

export interface WatchPlaylist {
    tracks: WatchTrack[];
    playlistId?: string;
    lyrics?: string;
    related?: unknown;
}

// Mood/Genre Types
export interface MoodCategory {
    title: string;
    params: string;
}

export interface MoodSection {
    [sectionName: string]: MoodCategory[];
}

export interface MoodPlaylist {
    title: string;
    playlistId: string;
    thumbnails?: Thumbnail[];
}

// Artist Types
export interface ArtistSong {
    title: string;
    videoId: string;
    artists?: Artist[];
    album?: Album;
    thumbnails?: Thumbnail[];
    duration?: string;
}

export interface ArtistAlbum {
    title: string;
    browseId: string;
    thumbnails?: Thumbnail[];
    year?: string;
    type?: 'Album' | 'Single' | 'EP';
}

export interface ArtistData {
    name: string;
    channelId?: string;
    subscribers?: string;
    views?: string;
    description?: string;
    thumbnails?: Thumbnail[];
    songs?: {
        browseId?: string;
        results?: ArtistSong[];
    };
    albums?: {
        browseId?: string;
        params?: string;
        results?: ArtistAlbum[];
    };
    singles?: {
        browseId?: string;
        params?: string;
        results?: ArtistAlbum[];
    };
    videos?: {
        browseId?: string;
        results?: ChartVideo[];
    };
}

// Country type (re-export for convenience)
export interface Country {
    code: string;
    name: string;
    lang: string;
}
