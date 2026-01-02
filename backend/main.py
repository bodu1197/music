from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from ytmusicapi import YTMusic
import os

app = FastAPI(title="Sori Music API")

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

@app.get("/search")
def search(q: str, filter: str = None):
    """
    Search YouTube Music.
    Filter options: songs, videos, albums, artists, playlists, community_playlists, featured_playlists, uploads
    """
    try:
        yt = get_ytmusic() # Default to US or global (FIXME: Search should arguably take params too, but kept simple for now)
        results = run_with_retry(yt.search, q, filter=filter)
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

@app.get("/home")
def get_home(limit: int = 100, country: str = "US", language: str = "en"):
    try:
        # Pass country to get_ytmusic if you want the home content to match a specific country
        # Ensure your custom get_ytmusic handles the 'language' param as well if you added it
        # Pass country and language to get_ytmusic
        yt = get_ytmusic(country=country, language=language) 
        # Note: YTMusic(language=...) needs to be set in get_ytmusic or here.
        # Let's update get_ytmusic to accept language too.
        
        # PURE MODE: Just return the raw get_home result
        return run_with_retry(yt.get_home, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/charts")
def get_charts(country: str = "US", language: str = "en"):
    try:
        # Pass country and language to get_ytmusic
        yt = get_ytmusic(country=country, language=language)
        return run_with_retry(yt.get_charts, country=country)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/moods")
def get_mood_categories(country: str = "US", language: str = "en"):
    """
    Get Moods & Genres categories.
    Returns sections like "For you", "Genres", "Moods & moments"
    """
    try:
        yt = get_ytmusic(country=country, language=language)
        return run_with_retry(yt.get_mood_categories)
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
    try:
        yt = get_ytmusic(country=country, language=language)

        # Try ytmusicapi's built-in parser first (works for Moods)
        try:
            result = run_with_retry(yt.get_mood_playlists, params)
            if result:
                return result
        except KeyError:
            pass  # Fall through to custom parser

        # Use custom parser for Genres (handles musicResponsiveListItemRenderer)
        result = parse_genre_playlists(yt, params)
        return result if result else []

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
