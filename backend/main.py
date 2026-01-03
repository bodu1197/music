from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from ytmusicapi import YTMusic
import os
from cachetools import TTLCache
import threading
import hashlib

app = FastAPI(title="Sori Music API")

# ============================================
# In-Memory Cache Configuration
# ============================================
# TTL = Time To Live (seconds)
# maxsize = Maximum number of entries

# Cache for home feed (1 hour, per country/language combo)
home_cache = TTLCache(maxsize=50, ttl=3600)
home_cache_lock = threading.Lock()

# Cache for charts (1 hour, per country)
charts_cache = TTLCache(maxsize=50, ttl=3600)
charts_cache_lock = threading.Lock()

# Cache for mood categories (1 hour, per country/language)
moods_cache = TTLCache(maxsize=50, ttl=3600)
moods_cache_lock = threading.Lock()

# Cache for mood playlists (1 hour, per params/country/language)
mood_playlists_cache = TTLCache(maxsize=200, ttl=3600)
mood_playlists_cache_lock = threading.Lock()

def make_cache_key(*args) -> str:
    """Create a hash key from arguments"""
    key_str = ":".join(str(arg) for arg in args)
    return hashlib.md5(key_str.encode()).hexdigest()

# CORS middleware to allow requests from any origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize YTMusic
# yt = YTMusic() # Removed global instance

# Proxy Configuration
PROXY_URL_TEMPLATE = os.getenv("PROXY_URL_TEMPLATE") # e.g. "http://user-country-{country}:pass@gate.smartproxy.com:7000"

def get_ytmusic(country: str = "US", language: str = "en"):
    # Global (ZZ/WW) - no proxy, no location restriction
    if country in ("ZZ", "WW"):
        return YTMusic(language="en")

    proxies = None
    if PROXY_URL_TEMPLATE:
        try:
            # Replace {country} with the requested country code (e.g., US, JP, KR)
            proxy_url = PROXY_URL_TEMPLATE.format(country=country)
            proxies = {"http": proxy_url, "https": proxy_url}
            # print(f"Using proxy for {country}") # Debug only
        except Exception as e:
            print(f"Error formatting proxy URL: {e}")

    # Supported languages by ytmusicapi (based on recent error message)
    # ko, hi, it, de, tr, en, pt, cs, zh_CN, ja, es, ru, fr, nl, ar, ur, zh_TW
    SUPPORTED_LANGUAGES = [
        "ko", "hi", "it", "de", "tr", "en", "pt", "cs", "zh_CN", "ja",
        "es", "ru", "fr", "nl", "ar", "ur", "zh_TW"
    ]

    # Fallback to English if language is not supported (e.g. 'id', 'th', 'vi')
    if language not in SUPPORTED_LANGUAGES:
        # print(f"Language '{language}' not supported by ytmusicapi, falling back to 'en'")
        language = "en"

    # Initialize YTMusic with proxies and language
    return YTMusic(proxies=proxies, language=language, location=country)

# Retry Decorator/Helper
import time
import random

def run_with_retry(func, *args, **kwargs):
    max_retries = 3
    for attempt in range(max_retries):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            # Check for 403 or specific errors if possible, otherwise retry all exceptions for now
            if attempt == max_retries - 1:
                raise e
            sleep_time = (2 ** attempt) + random.uniform(0, 1)  # Exponential backoff
            print(f"Retrying... Attempt {attempt + 1}, Error: {e}")
            time.sleep(sleep_time)

@app.get("/")
def health_check():
    return {"status": "ok", "service": "sori-music-api"}

@app.get("/cache/status")
def cache_status():
    """Get current cache statistics"""
    return {
        "home_cache": {
            "size": len(home_cache),
            "maxsize": home_cache.maxsize,
            "ttl": home_cache.ttl
        },
        "charts_cache": {
            "size": len(charts_cache),
            "maxsize": charts_cache.maxsize,
            "ttl": charts_cache.ttl
        },
        "moods_cache": {
            "size": len(moods_cache),
            "maxsize": moods_cache.maxsize,
            "ttl": moods_cache.ttl
        },
        "mood_playlists_cache": {
            "size": len(mood_playlists_cache),
            "maxsize": mood_playlists_cache.maxsize,
            "ttl": mood_playlists_cache.ttl
        }
    }

@app.post("/cache/warm")
async def warm_cache(country: str = "KR", language: str = "ko"):
    """
    Warm up all caches for a specific country/language.
    This pre-populates the cache so users get fast responses.
    """
    results = {
        "country": country,
        "language": language,
        "home": "pending",
        "charts": "pending",
        "moods": "pending",
        "mood_playlists": []
    }

    try:
        # Warm home cache
        get_home(limit=100, country=country, language=language)
        results["home"] = "success"
    except Exception as e:
        results["home"] = f"error: {str(e)}"

    try:
        # Warm charts cache
        get_charts(country=country, language=language)
        results["charts"] = "success"
    except Exception as e:
        results["charts"] = f"error: {str(e)}"

    try:
        # Warm moods cache and get categories
        moods = get_mood_categories(country=country, language=language)
        results["moods"] = "success"

        # Warm each mood playlist
        # moods is a dict like {"분위기 및 상황": [...], "장르": [...]}
        for section_name, categories in moods.items():
            for category in categories:
                params = category.get("params")
                title = category.get("title", "Unknown")
                if params:
                    try:
                        get_mood_playlists(params=params, country=country, language=language)
                        results["mood_playlists"].append({"title": title, "status": "success"})
                    except Exception as e:
                        results["mood_playlists"].append({"title": title, "status": f"error: {str(e)}"})

    except Exception as e:
        results["moods"] = f"error: {str(e)}"

    return results

@app.get("/search")
def search(q: str, filter: str = None, limit: int = 20):
    """
    Search YouTube Music.
    Filter options: songs, videos, albums, artists, playlists, community_playlists, featured_playlists, uploads
    """
    try:
        yt = get_ytmusic()
        results = run_with_retry(yt.search, q, filter=filter, limit=limit)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/search/suggestions")
def get_search_suggestions(q: str):
    """
    Get search autocomplete suggestions.
    Returns a list of suggested search queries.
    """
    try:
        yt = get_ytmusic()
        results = run_with_retry(yt.get_search_suggestions, q)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/artist/{artist_id}")
def get_artist(artist_id: str):
    try:
        yt = get_ytmusic()
        return run_with_retry(yt.get_artist, artist_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def parse_song_item(item):
    """Parse a song item from musicPlaylistShelfRenderer"""
    renderer = item.get('musicResponsiveListItemRenderer', {})
    if not renderer:
        return None

    # Get videoId
    overlay = renderer.get('overlay', {}).get('musicItemThumbnailOverlayRenderer', {})
    play_nav = overlay.get('content', {}).get('musicPlayButtonRenderer', {}).get('playNavigationEndpoint', {})
    video_id = play_nav.get('watchEndpoint', {}).get('videoId')

    if not video_id:
        return None

    # Get title and artists from flexColumns
    flex_columns = renderer.get('flexColumns', [])
    title = ""
    artists = []
    album = None

    if len(flex_columns) > 0:
        title_runs = flex_columns[0].get('musicResponsiveListItemFlexColumnRenderer', {}).get('text', {}).get('runs', [])
        if title_runs:
            title = title_runs[0].get('text', '')

    if len(flex_columns) > 1:
        artist_runs = flex_columns[1].get('musicResponsiveListItemFlexColumnRenderer', {}).get('text', {}).get('runs', [])
        for run in artist_runs:
            nav = run.get('navigationEndpoint', {})
            if nav.get('browseEndpoint', {}).get('browseEndpointContextSupportedConfigs', {}).get('browseEndpointContextMusicConfig', {}).get('pageType') == 'MUSIC_PAGE_TYPE_ARTIST':
                artists.append({'name': run.get('text', ''), 'id': nav.get('browseEndpoint', {}).get('browseId')})
            elif nav.get('browseEndpoint', {}).get('browseEndpointContextSupportedConfigs', {}).get('browseEndpointContextMusicConfig', {}).get('pageType') == 'MUSIC_PAGE_TYPE_ALBUM':
                album = {'name': run.get('text', ''), 'id': nav.get('browseEndpoint', {}).get('browseId')}

    # Get thumbnail
    thumbnails = renderer.get('thumbnail', {}).get('musicThumbnailRenderer', {}).get('thumbnail', {}).get('thumbnails', [])

    # Get duration
    duration = None
    fixed_columns = renderer.get('fixedColumns', [])
    if fixed_columns:
        duration_text = fixed_columns[0].get('musicResponsiveListItemFixedColumnRenderer', {}).get('text', {}).get('runs', [{}])[0].get('text')
        duration = duration_text

    return {
        'videoId': video_id,
        'title': title,
        'artists': artists,
        'album': album,
        'thumbnails': thumbnails,
        'duration': duration
    }

@app.get("/artist/{artist_id}/songs")
def get_artist_all_songs(artist_id: str):
    """Get all songs for an artist using direct browse (fast)"""
    try:
        yt = get_ytmusic()
        artist = run_with_retry(yt.get_artist, artist_id)

        songs_info = artist.get('songs', {})
        browse_id = songs_info.get('browseId')

        if not browse_id:
            return {"tracks": songs_info.get('results', []), "total": len(songs_info.get('results', []))}

        # Direct browse request (much faster than get_playlist)
        response = yt._send_request('browse', {'browseId': browse_id})

        tracks = []
        continuation = None

        try:
            two_col = response.get('contents', {}).get('twoColumnBrowseResultsRenderer', {})
            secondary = two_col.get('secondaryContents', {})
            section = secondary.get('sectionListRenderer', {}).get('contents', [{}])[0]
            shelf = section.get('musicPlaylistShelfRenderer', {})

            items = shelf.get('contents', [])
            for item in items:
                parsed = parse_song_item(item)
                if parsed:
                    tracks.append(parsed)

            # Check for continuation
            conts = shelf.get('continuations', [])
            if conts:
                continuation = conts[0].get('nextContinuationData', {}).get('continuation')

            # Follow all continuations
            while continuation:
                cont_resp = yt._send_request('browse', {'continuation': continuation})
                cont_contents = cont_resp.get('continuationContents', {})
                shelf_cont = cont_contents.get('musicPlaylistShelfContinuation', {})
                new_items = shelf_cont.get('contents', [])

                if not new_items:
                    break

                for item in new_items:
                    parsed = parse_song_item(item)
                    if parsed:
                        tracks.append(parsed)

                conts = shelf_cont.get('continuations', [])
                continuation = conts[0].get('nextContinuationData', {}).get('continuation') if conts else None

        except Exception as e:
            print(f"Error parsing songs: {e}")
            # Fallback to get_playlist if browse parsing fails
            playlist_id = browse_id[2:] if browse_id.startswith('VL') else browse_id
            playlist = run_with_retry(yt.get_playlist, playlist_id, limit=None)
            tracks = playlist.get('tracks', [])

        return {"tracks": tracks, "total": len(tracks)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def parse_album_items(grid_items):
    """Parse album items from grid"""
    items = []
    for item in grid_items:
        renderer = item.get('musicTwoRowItemRenderer', {})
        if renderer:
            title = renderer.get('title', {}).get('runs', [{}])[0].get('text', '')
            browse_id = renderer.get('navigationEndpoint', {}).get('browseEndpoint', {}).get('browseId', '')
            thumbnails = renderer.get('thumbnailRenderer', {}).get('musicThumbnailRenderer', {}).get('thumbnail', {}).get('thumbnails', [])
            subtitle = renderer.get('subtitle', {}).get('runs', [{}])[0].get('text', '')
            items.append({
                'title': title,
                'browseId': browse_id,
                'thumbnails': thumbnails,
                'year': subtitle if subtitle.isdigit() else None
            })
    return items

@app.get("/artist/{artist_id}/albums")
def get_artist_all_albums(artist_id: str, type: str = "albums"):
    """
    Get all albums/singles for an artist with pagination support.
    type: 'albums' or 'singles'
    """
    try:
        yt = get_ytmusic()
        artist = run_with_retry(yt.get_artist, artist_id)

        # Get the appropriate section
        section = artist.get(type, {})
        browse_id = section.get('browseId')
        params = section.get('params')

        if not browse_id:
            return {"items": section.get('results', []), "total": len(section.get('results', []))}

        # Use browse request to get all items
        body = {'browseId': browse_id}
        if params:
            body['params'] = params

        response = yt._send_request('browse', body)

        # Parse initial response
        items = []
        continuation = None

        try:
            contents = response.get('contents', {})
            tabs = contents.get('singleColumnBrowseResultsRenderer', {}).get('tabs', [])
            if tabs:
                tab_content = tabs[0].get('tabRenderer', {}).get('content', {})
                section_list = tab_content.get('sectionListRenderer', {}).get('contents', [])

                for sec in section_list:
                    grid = sec.get('gridRenderer', {})
                    grid_items = grid.get('items', [])
                    items.extend(parse_album_items(grid_items))

                    # Check for continuation
                    continuations = grid.get('continuations', [])
                    if continuations:
                        cont_data = continuations[0].get('nextContinuationData', {})
                        continuation = cont_data.get('continuation')

            # Follow continuations to get ALL items
            while continuation:
                cont_body = {'continuation': continuation}
                cont_response = yt._send_request('browse', cont_body)

                cont_contents = cont_response.get('continuationContents', {})
                grid_cont = cont_contents.get('gridContinuation', {})
                grid_items = grid_cont.get('items', [])

                if not grid_items:
                    break

                items.extend(parse_album_items(grid_items))

                # Check for next continuation
                continuations = grid_cont.get('continuations', [])
                if continuations:
                    cont_data = continuations[0].get('nextContinuationData', {})
                    continuation = cont_data.get('continuation')
                else:
                    continuation = None

        except Exception as e:
            print(f"Error parsing albums: {e}")
            return {"items": section.get('results', []), "total": len(section.get('results', []))}

        return {"items": items, "total": len(items)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/album/{browse_id}")
def get_album(browse_id: str):
    try:
        yt = get_ytmusic()
        return run_with_retry(yt.get_album, browse_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/song/{video_id}")
def get_song(video_id: str):
    try:
        yt = get_ytmusic()
        return run_with_retry(yt.get_song, video_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/lyrics/{browse_id}")
def get_lyrics(browse_id: str):
    try:
        yt = get_ytmusic()
        return run_with_retry(yt.get_lyrics, browse_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/watch")
def get_watch_playlist(videoId: str = None, playlistId: str = None):
    try:
        yt = get_ytmusic()
        return run_with_retry(yt.get_watch_playlist, videoId=videoId, playlistId=playlistId)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/playlist/{playlist_id}")
def get_playlist(playlist_id: str, limit: int = 100):
    """Get full playlist with all tracks (up to limit)"""
    try:
        yt = get_ytmusic()
        return run_with_retry(yt.get_playlist, playlist_id, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/home")
def get_home(limit: int = 100, country: str = "US", language: str = "en"):
    cache_key = make_cache_key("home", limit, country, language)

    # Check cache first
    with home_cache_lock:
        if cache_key in home_cache:
            print(f"[CACHE HIT] /home country={country} lang={language}")
            return home_cache[cache_key]

    try:
        print(f"[CACHE MISS] /home country={country} lang={language}")
        yt = get_ytmusic(country=country, language=language)
        result = run_with_retry(yt.get_home, limit=limit)

        # Store in cache
        with home_cache_lock:
            home_cache[cache_key] = result

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/charts")
def get_charts(country: str = "US", language: str = "en"):
    cache_key = make_cache_key("charts", country, language)

    # Check cache first
    with charts_cache_lock:
        if cache_key in charts_cache:
            print(f"[CACHE HIT] /charts country={country}")
            return charts_cache[cache_key]

    try:
        print(f"[CACHE MISS] /charts country={country}")
        yt = get_ytmusic(country=country, language=language)
        result = run_with_retry(yt.get_charts, country=country)

        # Store in cache
        with charts_cache_lock:
            charts_cache[cache_key] = result

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/moods")
def get_mood_categories(country: str = "US", language: str = "en"):
    """
    Get Moods & Genres categories.
    Returns sections like "For you", "Genres", "Moods & moments"
    """
    cache_key = make_cache_key("moods", country, language)

    # Check cache first
    with moods_cache_lock:
        if cache_key in moods_cache:
            print(f"[CACHE HIT] /moods country={country} lang={language}")
            return moods_cache[cache_key]

    try:
        print(f"[CACHE MISS] /moods country={country} lang={language}")
        yt = get_ytmusic(country=country, language=language)
        result = run_with_retry(yt.get_mood_categories)

        # Store in cache
        with moods_cache_lock:
            moods_cache[cache_key] = result

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

import re

def upscale_thumbnail(url: str, size: int = 544) -> str:
    """
    Upscale Google/YouTube thumbnail URL to higher resolution.
    Changes =w60-h60 or =w120-h120 to =w544-h544
    """
    if not url:
        return url
    # Match patterns like =w60-h60, =w120-h120, =s60, etc.
    url = re.sub(r'=w\d+-h\d+', f'=w{size}-h{size}', url)
    url = re.sub(r'=s\d+', f'=s{size}', url)
    return url


def parse_genre_playlists(yt, params: str):
    """
    Custom parser for genre playlists that uses musicResponsiveListItemRenderer.
    ytmusicapi's get_mood_playlists only handles musicTwoRowItemRenderer (moods).
    """
    body = {'browseId': 'FEmusic_moods_and_genres_category', 'params': params}
    response = yt._send_request('browse', body)

    playlists = []
    try:
        contents = response['contents']['singleColumnBrowseResultsRenderer']['tabs'][0]['tabRenderer']['content']['sectionListRenderer']['contents']

        for section in contents:
            if 'musicCarouselShelfRenderer' in section:
                renderer = section['musicCarouselShelfRenderer']
                items = renderer.get('contents', [])

                for item in items:
                    # Handle musicResponsiveListItemRenderer (genres)
                    if 'musicResponsiveListItemRenderer' in item:
                        data = item['musicResponsiveListItemRenderer']

                        # Extract title
                        title = 'Unknown'
                        flex_cols = data.get('flexColumns', [])
                        if flex_cols:
                            title = flex_cols[0].get('musicResponsiveListItemFlexColumnRenderer', {}).get('text', {}).get('runs', [{}])[0].get('text', 'Unknown')

                        # Get playlistId from overlay
                        overlay = data.get('overlay', {}).get('musicItemThumbnailOverlayRenderer', {})
                        play_btn = overlay.get('content', {}).get('musicPlayButtonRenderer', {})
                        playlist_id = play_btn.get('playNavigationEndpoint', {}).get('watchEndpoint', {}).get('playlistId')

                        # Get thumbnail and upscale
                        thumbnails = data.get('thumbnail', {}).get('musicThumbnailRenderer', {}).get('thumbnail', {}).get('thumbnails', [])
                        # Upscale thumbnails to 544x544
                        thumbnails = [{'url': upscale_thumbnail(t.get('url', '')), 'width': 544, 'height': 544} for t in thumbnails]

                        if playlist_id:
                            playlists.append({
                                'title': title,
                                'playlistId': playlist_id,
                                'thumbnails': thumbnails
                            })

                    # Handle musicTwoRowItemRenderer (moods) - fallback
                    elif 'musicTwoRowItemRenderer' in item:
                        data = item['musicTwoRowItemRenderer']
                        title = data.get('title', {}).get('runs', [{}])[0].get('text', 'Unknown')
                        playlist_id = data.get('navigationEndpoint', {}).get('watchEndpoint', {}).get('playlistId')
                        thumbnails = data.get('thumbnailRenderer', {}).get('musicThumbnailRenderer', {}).get('thumbnail', {}).get('thumbnails', [])

                        if playlist_id:
                            playlists.append({
                                'title': title,
                                'playlistId': playlist_id,
                                'thumbnails': thumbnails
                            })
    except Exception as e:
        print(f"Error parsing genre playlists: {e}")

    return playlists


@app.get("/moods/playlists")
def get_mood_playlists(params: str, country: str = "US", language: str = "en"):
    """
    Get playlists for a specific mood/genre category.
    params: obtained from get_mood_categories()
    """
    cache_key = make_cache_key("mood_playlists", params, country, language)

    # Check cache first
    with mood_playlists_cache_lock:
        if cache_key in mood_playlists_cache:
            print(f"[CACHE HIT] /moods/playlists params={params[:20]}... country={country}")
            return mood_playlists_cache[cache_key]

    try:
        print(f"[CACHE MISS] /moods/playlists params={params[:20]}... country={country}")
        yt = get_ytmusic(country=country, language=language)

        # Try ytmusicapi's built-in parser first (works for Moods)
        result = None
        try:
            result = run_with_retry(yt.get_mood_playlists, params)
        except KeyError:
            pass  # Fall through to custom parser

        # Use custom parser for Genres (handles musicResponsiveListItemRenderer)
        if not result:
            result = parse_genre_playlists(yt, params)

        final_result = result if result else []

        # Store in cache
        with mood_playlists_cache_lock:
            mood_playlists_cache[cache_key] = final_result

        return final_result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
