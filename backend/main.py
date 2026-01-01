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
def get_charts(country: str = "US"):
    try:
        # Pass country and language to get_ytmusic
        yt = get_ytmusic(country=country, language=language) # Use country-specific IP
        return run_with_retry(yt.get_charts, country=country)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
