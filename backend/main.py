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
