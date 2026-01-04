from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from ytmusicapi import YTMusic
import os
import json
import hashlib

app = FastAPI(title="Sori Music API")

# ============================================
# Redis Cache Configuration
# ============================================
# Uses Upstash Redis for persistent, shared caching
# Falls back to in-memory cache if Redis is unavailable

REDIS_URL = os.getenv("REDIS_URL")  # e.g. "rediss://default:xxx@xxx.upstash.io:6379"

# Endpoint-specific TTL (Time To Live) in seconds
TTL_HOME = 24 * 3600           # 24시간 - 홈 피드
TTL_CHARTS = 24 * 3600         # 24시간 - 차트 순위
TTL_MOODS = 72 * 3600          # 72시간 (3일) - 무드 카테고리
TTL_MOOD_PLAYLISTS = 48 * 3600 # 48시간 - 무드 플레이리스트
TTL_ARTIST = 24 * 3600         # 24시간 - 아티스트 정보
TTL_ALBUM = 72 * 3600          # 72시간 - 앨범 정보 (잘 안 변함)
TTL_SONG = 72 * 3600           # 72시간 - 곡 정보 (잘 안 변함)
CACHE_TTL = 24 * 3600          # 24시간 - 기본값


# ============================================
# All Supported Countries (73 countries)
# ============================================
ALL_COUNTRIES = [
    "ZZ",  # Global
    "AR", "AU", "AT", "BE", "BO", "BR", "CA", "CL", "CO", "CR",
    "CZ", "DK", "DO", "EC", "EG", "SV", "EE", "FI", "FR", "DE",
    "GT", "HN", "HU", "IS", "IN", "ID", "IE", "IL", "IT", "JP",
    "KE", "KR", "LU", "MX", "NL", "NZ", "NI", "NG", "NO", "PA",
    "PY", "PE", "PL", "PT", "RO", "RU", "RS", "SA", "ZA", "ES",
    "SE", "CH", "TZ", "TR", "UG", "UA", "AE", "GB", "US", "UY", "ZW",
    # Smart Mapping Countries
    "HK", "CN", "TW", "VN", "TH", "MY", "SG", "PH"
]

# Cache Warming: 24시간마다 모든 국가 데이터 미리 캐싱
CACHE_WARMING_ENABLED = os.getenv("CACHE_WARMING_ENABLED", "true").lower() == "true"
CACHE_WARMING_INTERVAL_HOURS = 24



# Redis client (initialized lazily)
redis_client = None

def get_redis():
    """Get Redis client, initialize if needed"""
    global redis_client
    if redis_client is None and REDIS_URL:
        try:
            import redis
            redis_client = redis.from_url(REDIS_URL, decode_responses=True)
            # Test connection
            redis_client.ping()
            print("Redis connected successfully!")
        except Exception as e:
            print(f"Redis connection failed: {e}")
            redis_client = None
    return redis_client

def cache_get(key: str):
    """Get value from cache (Redis or fallback)"""
    r = get_redis()
    if r:
        try:
            data = r.get(key)
            if data:
                return json.loads(data)
        except Exception as e:
            print(f"Redis get error: {e}")
    return None

def cache_set(key: str, value, ttl: int = CACHE_TTL):
    """Set value in cache (Redis or fallback)"""
    r = get_redis()
    if r:
        try:
            r.setex(key, ttl, json.dumps(value))
        except Exception as e:
            print(f"Redis set error: {e}")

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
    """Get current cache statistics from Redis"""
    r = get_redis()
    if r:
        try:
            info = r.info("memory")
            dbsize = r.dbsize()
            return {
                "type": "redis",
                "connected": True,
                "keys": dbsize,
                "memory_used": info.get("used_memory_human", "unknown"),
                "ttl": CACHE_TTL
            }
        except Exception as e:
            return {"type": "redis", "connected": False, "error": str(e)}
    return {
        "type": "none",
        "connected": False,
        "message": "Redis not configured (REDIS_URL not set)"
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
def get_artist(artist_id: str, country: str = "US", language: str = "en"):
    cache_key = make_cache_key("artist", artist_id, country, language)
    
    # Check Redis cache first
    cached = cache_get(cache_key)
    if cached is not None:
        print(f"[REDIS HIT] /artist/{artist_id}")
        return cached
    
    try:
        print(f"[REDIS MISS] /artist/{artist_id}")
        yt = get_ytmusic(country=country, language=language)
        result = run_with_retry(yt.get_artist, artist_id)
        
        # Store in Redis cache (24시간 TTL)
        cache_set(cache_key, result, TTL_ARTIST)
        
        return result
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
    cache_key = make_cache_key("album", browse_id)
    
    # Check Redis cache first
    cached = cache_get(cache_key)
    if cached is not None:
        print(f"[REDIS HIT] /album/{browse_id}")
        return cached
    
    try:
        print(f"[REDIS MISS] /album/{browse_id}")
        yt = get_ytmusic()
        result = run_with_retry(yt.get_album, browse_id)
        
        # Store in Redis cache (72시간 TTL)
        cache_set(cache_key, result, TTL_ALBUM)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/song/{video_id}")
def get_song(video_id: str):
    cache_key = make_cache_key("song", video_id)
    
    # Check Redis cache first
    cached = cache_get(cache_key)
    if cached is not None:
        print(f"[REDIS HIT] /song/{video_id}")
        return cached
    
    try:
        print(f"[REDIS MISS] /song/{video_id}")
        yt = get_ytmusic()
        result = run_with_retry(yt.get_song, video_id)
        
        # Store in Redis cache (72시간 TTL)
        cache_set(cache_key, result, TTL_SONG)
        
        return result
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

    # Check Redis cache first
    cached = cache_get(cache_key)
    if cached is not None:
        print(f"[REDIS HIT] /home country={country} lang={language}")
        return cached

    try:
        print(f"[REDIS MISS] /home country={country} lang={language}")
        yt = get_ytmusic(country=country, language=language)
        result = run_with_retry(yt.get_home, limit=limit)

        # Store in Redis cache (24시간 TTL)
        cache_set(cache_key, result, TTL_HOME)

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/charts")
def get_charts(country: str = "US", language: str = "en"):
    cache_key = make_cache_key("charts", country, language)

    # Check Redis cache first
    cached = cache_get(cache_key)
    if cached is not None:
        print(f"[REDIS HIT] /charts country={country}")
        return cached

    try:
        print(f"[REDIS MISS] /charts country={country}")
        yt = get_ytmusic(country=country, language=language)
        result = run_with_retry(yt.get_charts, country=country)

        # Store in Redis cache (24시간 TTL)
        cache_set(cache_key, result, TTL_CHARTS)

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

    # Check Redis cache first
    cached = cache_get(cache_key)
    if cached is not None:
        print(f"[REDIS HIT] /moods country={country} lang={language}")
        return cached

    try:
        print(f"[REDIS MISS] /moods country={country} lang={language}")
        yt = get_ytmusic(country=country, language=language)
        result = run_with_retry(yt.get_mood_categories)

        # Store in Redis cache (72시간 TTL)
        cache_set(cache_key, result, TTL_MOODS)

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

    # Check Redis cache first
    cached = cache_get(cache_key)
    if cached is not None:
        print(f"[REDIS HIT] /moods/playlists params={params[:20]}... country={country}")
        return cached

    try:
        print(f"[REDIS MISS] /moods/playlists params={params[:20]}... country={country}")
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

        # Store in Redis cache (48시간 TTL)
        cache_set(cache_key, final_result, TTL_MOOD_PLAYLISTS)

        return final_result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# Cache Warming System
# ============================================
# Pre-caches all countries' data on startup and every 24 hours

import threading
from contextlib import asynccontextmanager

def warm_all_caches_sync():
    """
    Synchronously warm all caches for all countries.
    This runs in background thread to not block server startup.
    """
    if not CACHE_WARMING_ENABLED:
        print("[CACHE WARMING] Disabled via environment variable")
        return
    
    print(f"[CACHE WARMING] Starting cache warming for {len(ALL_COUNTRIES)} countries...")
    success_count = 0
    error_count = 0
    
    for country in ALL_COUNTRIES:
        try:
            # Warm charts cache
            cache_key = make_cache_key("charts", country, "en")
            if cache_get(cache_key) is None:
                yt = get_ytmusic(country=country, language="en")
                result = yt.get_charts(country=country)
                cache_set(cache_key, result, TTL_CHARTS)
                print(f"[CACHE WARMING] Charts cached for {country}")
            
            # Warm home cache  
            cache_key = make_cache_key("home", 100, country, "en")
            if cache_get(cache_key) is None:
                yt = get_ytmusic(country=country, language="en")
                result = yt.get_home(limit=100)
                cache_set(cache_key, result, TTL_HOME)
                print(f"[CACHE WARMING] Home cached for {country}")
            
            # Warm moods cache
            cache_key = make_cache_key("moods", country, "en")
            if cache_get(cache_key) is None:
                yt = get_ytmusic(country=country, language="en")
                result = yt.get_mood_categories()
                cache_set(cache_key, result, TTL_MOODS)
                print(f"[CACHE WARMING] Moods cached for {country}")
            
            success_count += 1
            
        except Exception as e:
            error_count += 1
            print(f"[CACHE WARMING] Error for {country}: {e}")
    
    print(f"[CACHE WARMING] Complete! Success: {success_count}, Errors: {error_count}")

def start_cache_warming_scheduler():
    """Start background scheduler for periodic cache warming"""
    import time
    
    def scheduler_loop():
        while True:
            # Wait 24 hours before next warming
            time.sleep(CACHE_WARMING_INTERVAL_HOURS * 3600)
            print("[CACHE WARMING] Starting scheduled cache refresh...")
            warm_all_caches_sync()
    
    thread = threading.Thread(target=scheduler_loop, daemon=True)
    thread.start()
    print("[CACHE WARMING] Scheduler started (every 24 hours)")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown events"""
    # Startup: warm caches in background thread
    if CACHE_WARMING_ENABLED and REDIS_URL:
        print("[STARTUP] Starting cache warming in background...")
        warming_thread = threading.Thread(target=warm_all_caches_sync, daemon=True)
        warming_thread.start()
        start_cache_warming_scheduler()
    yield
    # Shutdown: cleanup if needed
    print("[SHUTDOWN] Server shutting down...")

# Apply lifespan to app
app.router.lifespan_context = lifespan

@app.get("/cache/warm-all")
async def warm_all_caches_endpoint():
    """
    Manually trigger cache warming for all countries.
    This runs in background and returns immediately.
    """
    if not CACHE_WARMING_ENABLED:
        return {"status": "disabled", "message": "Cache warming is disabled"}
    
    # Start warming in background thread
    thread = threading.Thread(target=warm_all_caches_sync, daemon=True)
    thread.start()
    
    return {
        "status": "started",
        "message": f"Cache warming started for {len(ALL_COUNTRIES)} countries",
        "countries": len(ALL_COUNTRIES)
    }

@app.get("/cache/countries")
def get_cached_countries():
    """Get list of all countries and their cache status"""
    r = get_redis()
    if not r:
        return {"error": "Redis not connected"}
    
    status = {}
    for country in ALL_COUNTRIES:
        charts_key = make_cache_key("charts", country, "en")
        home_key = make_cache_key("home", 100, country, "en")
        moods_key = make_cache_key("moods", country, "en")
        
        status[country] = {
            "charts": r.exists(charts_key) == 1,
            "home": r.exists(home_key) == 1,
            "moods": r.exists(moods_key) == 1
        }
    
    cached_count = sum(1 for s in status.values() if all(s.values()))
    
    return {
        "total_countries": len(ALL_COUNTRIES),
        "fully_cached": cached_count,
        "countries": status
    }
