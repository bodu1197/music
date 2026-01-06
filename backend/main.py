from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from ytmusicapi import YTMusic
import os
import json
import hashlib
from datetime import datetime, timezone, timedelta

app = FastAPI(title="Sori Music API")

# ============================================
# Supabase Cache Configuration
# ============================================
# Uses Supabase PostgreSQL for persistent caching
# 24-hour TTL for home, charts, moods (excluding search)

SUPABASE_URL = os.getenv("SUPABASE_URL")  # e.g. "https://xxx.supabase.co"
SUPABASE_KEY = os.getenv("SUPABASE_KEY")  # service_role key for server-side

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

# ============================================
# Chart Playlist IDs (from charts-constants.ts) - ALL 73 Countries
# ============================================
CHART_CONFIGS = {
    # Global
    "ZZ": {"topSongs": "PL4fGSI1pDJn6puJdseH2Rt9sMvt9E2M4i", "topVideos": "PL4fGSI1pDJn5kI81J1fYWK5eZRl1zJ5kM"},
    # Official 61 Countries
    "AR": {"topSongs": "PL4fGSI1pDJn4Kd7YEG9LbUqvt64PLs9Fo", "topVideos": "PL4fGSI1pDJn403fWAsjzCMsLEgBTOa25K"},
    "AU": {"topSongs": "PL4fGSI1pDJn7xvYy-bP6UFeG5tITQgScd", "topVideos": "PL4fGSI1pDJn44PMHPLYatj8rta8WYtZ8_"},
    "AT": {"topSongs": "PL4fGSI1pDJn6fFTVP30alDfSDAkEtHaNr", "topVideos": "PL4fGSI1pDJn42I7USCyNUQSjm-OlttqQf"},
    "BE": {"topSongs": "PL4fGSI1pDJn64Up8Ds5BXizLBFZ922jHj", "topVideos": "PL4fGSI1pDJn47l8EXIwa8SCWWjh79rgMq"},
    "BO": {"topSongs": "PL4fGSI1pDJn5Vi4RJX33LnETbjMhmPc9V", "topVideos": "PL4fGSI1pDJn7ShAOJR2HPZrHb83DpSzV8"},
    "BR": {"topSongs": "PL4fGSI1pDJn7rGBE8kEC0CqTa1nMh9AKB", "topVideos": "PL4fGSI1pDJn4Gs2meaJRo9O8PNYvhjHIg"},
    "CA": {"topSongs": "PL4fGSI1pDJn57Q7WbODbmXjyjgXi0BTyD", "topVideos": "PL4fGSI1pDJn4IeWA7bBJYh__qgOCRMkIh"},
    "CL": {"topSongs": "PL4fGSI1pDJn777t00zYu_BKjXHUdhkXH9", "topVideos": "PL4fGSI1pDJn4M3llRxwSebRSrjFqeNN3x"},
    "CO": {"topSongs": "PL4fGSI1pDJn6CW97F1vSZOkoU7k7VsYk9", "topVideos": "PL4fGSI1pDJn4ObZYxzctc1AM45GSWm2DC"},
    "CR": {"topSongs": "PL4fGSI1pDJn6U9fUfBkfy3uyXE7Rtvo4b", "topVideos": "PL4fGSI1pDJn5DbEh-PXgn9ZInq-F3NSOZ"},
    "CZ": {"topSongs": "PL4fGSI1pDJn5wV1AgglmIN_8okwTkz9WT", "topVideos": "PL4fGSI1pDJn4PsD5Tua9nTgnPsP0o9_0k"},
    "DK": {"topSongs": "PL4fGSI1pDJn51jFsgXEIR7WdKBychJiMU", "topVideos": "PL4fGSI1pDJn4YoCXjBl6kg3DhYgUJTSfw"},
    "DO": {"topSongs": "PL4fGSI1pDJn4C36SQoHh9fII-EXde2i3k", "topVideos": "PL4fGSI1pDJn5yRDIISesmCXjor-3lw2ET"},
    "EC": {"topSongs": "PL4fGSI1pDJn7K4bdLZJ5GppzLDAihF58q", "topVideos": "PL4fGSI1pDJn4mwbdPq0EeOiD86MvMtkq0"},
    "EG": {"topSongs": "PL4fGSI1pDJn510j-1L8bMgKTyeRwPrXWY", "topVideos": "PL4fGSI1pDJn4EhpZkSSpdyWUet73FalVU"},
    "SV": {"topSongs": "PL4fGSI1pDJn6ALv-WRypOl0nGaLgtW6nC", "topVideos": "PL4fGSI1pDJn59f4Ef4W3OgMW7HivJCrCt"},
    "EE": {"topSongs": "PL4fGSI1pDJn7uCBUO9GemJda1xfqmvV7_", "topVideos": "PL4fGSI1pDJn4fpNbyI8YHStVF-wyzHJtd"},
    "FI": {"topSongs": "PL4fGSI1pDJn4T5TECl_90hfJsPUu1yi2y", "topVideos": "PL4fGSI1pDJn4ogogSnHUTIWMc_b7pHW9A"},
    "FR": {"topSongs": "PL4fGSI1pDJn7bK3y1Hx-qpHBqfr6cesNs", "topVideos": "PL4fGSI1pDJn50iCQRUVmgUjOrCggCQ9nR"},
    "DE": {"topSongs": "PL4fGSI1pDJn6KpOXlp0MH8qA9tngXaUJ-", "topVideos": "PL4fGSI1pDJn4X-OicSCOy-dChXWdTgziQ"},
    "GT": {"topSongs": "PL4fGSI1pDJn7NCQ_U0nwlhidgZ8E3uBQw", "topVideos": "PL4fGSI1pDJn4MxjoamEWxTh5J7lw1JZfA"},
    "HN": {"topSongs": "PL4fGSI1pDJn5ZVtAKP9-OKnn09CJ-Znpt", "topVideos": "PL4fGSI1pDJn5ESsEdE2R0v1nrLPIeM4Xx"},
    "HU": {"topSongs": "PL4fGSI1pDJn6K3QY1nHyhOGQqNCBGbMKi", "topVideos": "PL4fGSI1pDJn6-AkuEzkhgTBJq3Lm0Oolc"},
    "IS": {"topSongs": "PL4fGSI1pDJn6pwJw_mb31TUqc9C_gpskG", "topVideos": "PL4fGSI1pDJn5AT1xUL_xmiBWNqDv33giB"},
    "IN": {"topSongs": "PL4fGSI1pDJn4pTWyM3t61lOyZ6_4jcNOw", "topVideos": "PL4fGSI1pDJn40WjZ6utkIuj2rNg-7iGsq"},
    "ID": {"topSongs": "PL4fGSI1pDJn5ObxTlEPlkkornHXUiKX1z", "topVideos": "PL4fGSI1pDJn5QPpj0R4vVgRWk8sSq549G"},
    "IE": {"topSongs": "PL4fGSI1pDJn5S_UFt83P-RlBC4CR3JYuo", "topVideos": "PL4fGSI1pDJn574980IA4DVKDl8PDskrCj"},
    "IL": {"topSongs": "PL4fGSI1pDJn4ECcNLNscMAPND-Degbd5N", "topVideos": "PL4fGSI1pDJn5xFol0l4GwBnHHYtXXMaY82"},
    "IT": {"topSongs": "PL4fGSI1pDJn5JiDypHxveEplQrd7XQMlX", "topVideos": "PL4fGSI1pDJn5BPviUFX4a3IMnAgyknC68"},
    "JP": {"topSongs": "PL4fGSI1pDJn4-UIb6RKHdxam-oAUULIGB", "topVideos": "PL4fGSI1pDJn5FhDrWnRp2NLzJCoPliNgT"},
    "KE": {"topSongs": "PL4fGSI1pDJn7z-3xqv1Ujjobcy2pjpZAA", "topVideos": "PL4fGSI1pDJn5OYRHJhIu_bu7NRnkZ56ds"},
    "KR": {"topSongs": "PL4fGSI1pDJn6jXS_Tv_N9B8Z0HTRVJE0m", "topVideos": "PL4fGSI1pDJn5S09aId3dUGp40ygUqmPGc"},
    "LU": {"topSongs": "PL4fGSI1pDJn4ie_xg2ndQYSEeZrFYvkQf", "topVideos": "PL4fGSI1pDJn5Zla7aGxRJkvIbikXpf3VR"},
    "MX": {"topSongs": "PL4fGSI1pDJn6fko1AmNa_pdGPZr5ROFvd", "topVideos": "PL4fGSI1pDJn5cDciLg1q9tabl7gzBZWOp"},
    "NL": {"topSongs": "PL4fGSI1pDJn7CXu1B1U0lYQ0qfPB9TVfa", "topVideos": "PL4fGSI1pDJn5i2QIxSEhPqSzhqsWhhrBJ"},
    "NZ": {"topSongs": "PL4fGSI1pDJn6SZ8psSiS6j-QgUACJK4gC", "topVideos": "PL4fGSI1pDJn5yaX2-KEdvxQK0w938c-NX"},
    "NI": {"topSongs": "PL4fGSI1pDJn7eCAxG3AuCuottnW_D5C5w", "topVideos": "PL4fGSI1pDJn49ZZQP_cqjJ6NvkJ-qf9sn"},
    "NG": {"topSongs": "PL4fGSI1pDJn6Au0oeuQPsd1iFyiU8Br9I", "topVideos": "PL4fGSI1pDJn5dHScZlGIe6TEoGzFv_qZE"},
    "NO": {"topSongs": "PL4fGSI1pDJn7ywehQhyuuPWo3ayrdSOHn", "topVideos": "PL4fGSI1pDJn5qlG8HM7Iq54JE8SROhAvM"},
    "PA": {"topSongs": "PL4fGSI1pDJn4G4B-V4UTrxD7l5mE9cPS-", "topVideos": "PL4fGSI1pDJn5HtzpSBgS58MlBzOfKgqGw"},
    "PY": {"topSongs": "PL4fGSI1pDJn5G0B8V2PSgs7O9EA4gF5m_", "topVideos": "PL4fGSI1pDJn5rl3PizG5yhj1R97Jl4vBq"},
    "PE": {"topSongs": "PL4fGSI1pDJn4k5jOJjYpq8pluME-gNAnh", "topVideos": "PL4fGSI1pDJn61j743B9r2LNeLCUUZsRMV"},
    "PL": {"topSongs": "PL4fGSI1pDJn68fmsRw9f6g-NzU5UA45v1", "topVideos": "PL4fGSI1pDJn69d7Zwro65Q7ORLxFVqr_U"},
    "PT": {"topSongs": "PL4fGSI1pDJn7H0X0bZN4C-I6YeldOvPku", "topVideos": "PL4fGSI1pDJn6G_VdIB6wxGYzuai0iA1hC"},
    "RO": {"topSongs": "PL4fGSI1pDJn5G2T6hrqwSS7ajUA7y4S5l", "topVideos": "PL4fGSI1pDJn6L8lQpfbnXpXUR71uksmP2"},
    "RU": {"topSongs": "PL4fGSI1pDJn5C8dBiYt0BTREyCHbZ47qc", "topVideos": "PL4fGSI1pDJn6cLcPmcc9b_l8oM0aJtsqL"},
    "RS": {"topSongs": "PL4fGSI1pDJn79dpGvfySMY9w43BluD4lI", "topVideos": "PL4fGSI1pDJn6WdZq272-vbCc5SJ1zxzbC"},
    "SA": {"topSongs": "PL4fGSI1pDJn7xNK-XdqvCsqa7I8Nx3IyW", "topVideos": "PL4fGSI1pDJn7b8BNLVP8XUrJCQp_loKZT"},
    "ZA": {"topSongs": "PL4fGSI1pDJn7xvqMZR_9OgljLcMQpuKXN", "topVideos": "PL4fGSI1pDJn79YvDK-Dq95SAW1V28wnns"},
    "ES": {"topSongs": "PL4fGSI1pDJn6sMPCoD7PdSlEgyUylgxuT", "topVideos": "PL4fGSI1pDJn4jhQB4kb9M36dvVmJQPt4T"},
    "SE": {"topSongs": "PL4fGSI1pDJn7S_JFSuBHol2RH9WphaqzS", "topVideos": "PL4fGSI1pDJn6l_eirqF_T40p1B8eJg2Pz"},
    "CH": {"topSongs": "PL4fGSI1pDJn6Nhmcqn4xr769wwoMmS3DI", "topVideos": "PL4fGSI1pDJn4KBb656ZmzFTCGK0eAv5bu"},
    "TZ": {"topSongs": "PL4fGSI1pDJn4CI0qH2JZYs2qGXo1itpCG", "topVideos": "PL4fGSI1pDJn7-3qlPahSCN5PagP0L1p6r"},
    "TR": {"topSongs": "PL4fGSI1pDJn5tdVDtIAZArERm_vv4uFCR", "topVideos": "PL4fGSI1pDJn6rnJKpaAkK1XK8QUfa9KqP"},
    "UG": {"topSongs": "PL4fGSI1pDJn56127QXqxGADbedOpL5z5R", "topVideos": "PL4fGSI1pDJn75xappx8QlV4-0nuyXlDAr"},
    "UA": {"topSongs": "PL4fGSI1pDJn4E_HoW5HB-w5vFPkYfo3dB", "topVideos": "PL4fGSI1pDJn7524WZdmWAIRc6cQ3vUzZK"},
    "AE": {"topSongs": "PL4fGSI1pDJn71VxNxT-PpECxHCVv8T-oX", "topVideos": "PL4fGSI1pDJn4CDqdXJ4xP78Hh7X72vIXM"},
    "GB": {"topSongs": "PL4fGSI1pDJn6_f5P3MnzXg9l3GDfnSlXa", "topVideos": "PL4fGSI1pDJn688ebB8czINn0_nov50e3A"},
    "US": {"topSongs": "PL4fGSI1pDJn6O1LS0XSdF3RyO0Rq_LDeI", "topVideos": "PL4fGSI1pDJn69On1f-8NAvX_CYlx7QyZc"},
    "UY": {"topSongs": "PL4fGSI1pDJn5caN5mlO8NWCPSyuHkQANg", "topVideos": "PL4fGSI1pDJn5giLQO3qUCqpp_MSDRmJNA"},
    "ZW": {"topSongs": "PL4fGSI1pDJn7PWidyUayXX6-josrejRMG", "topVideos": "PL4fGSI1pDJn7HuQm191bZDx7ZMMgk9-Bp"},
    # Smart Mapping Countries
    "HK": {"topSongs": "PL4fGSI1pDJn4-UIb6RKHdxam-oAUULIGB", "topVideos": "PL4fGSI1pDJn5FhDrWnRp2NLzJCoPliNgT"},  # -> JP
    "CN": {"topSongs": "PL4fGSI1pDJn6jXS_Tv_N9B8Z0HTRVJE0m", "topVideos": "PL4fGSI1pDJn5S09aId3dUGp40ygUqmPGc"},  # -> KR
    "TW": {"topSongs": "PL4fGSI1pDJn6jXS_Tv_N9B8Z0HTRVJE0m", "topVideos": "PL4fGSI1pDJn5S09aId3dUGp40ygUqmPGc"},  # -> KR
    "VN": {"topSongs": "PL4fGSI1pDJn6jXS_Tv_N9B8Z0HTRVJE0m", "topVideos": "PL4fGSI1pDJn5S09aId3dUGp40ygUqmPGc"},  # -> KR
    "TH": {"topSongs": "PL4fGSI1pDJn6jXS_Tv_N9B8Z0HTRVJE0m", "topVideos": "PL4fGSI1pDJn5S09aId3dUGp40ygUqmPGc"},  # -> KR
    "MY": {"topSongs": "PL4fGSI1pDJn5ObxTlEPlkkornHXUiKX1z", "topVideos": "PL4fGSI1pDJn5QPpj0R4vVgRWk8sSq549G"},  # -> ID
    "SG": {"topSongs": "PL4fGSI1pDJn5ObxTlEPlkkornHXUiKX1z", "topVideos": "PL4fGSI1pDJn5QPpj0R4vVgRWk8sSq549G"},  # -> ID
    "PH": {"topSongs": "PL4fGSI1pDJn6O1LS0XSdF3RyO0Rq_LDeI", "topVideos": "PL4fGSI1pDJn69On1f-8NAvX_CYlx7QyZc"},  # -> US
}


def get_chart_playlist_ids(country: str):
    """Get chart playlist IDs for a country (fallback to ZZ/Global)"""
    config = CHART_CONFIGS.get(country, CHART_CONFIGS.get("ZZ", {}))
    return [config.get("topSongs"), config.get("topVideos")]




def make_cache_key(*args) -> str:
    """Create a hash key from arguments"""
    key_str = ":".join(str(arg) for arg in args)
    return hashlib.md5(key_str.encode()).hexdigest()


# ============================================
# Supabase Cache Functions
# ============================================
supabase_client = None

def get_supabase():
    """Get Supabase client, initialize if needed"""
    global supabase_client
    if supabase_client is None and SUPABASE_URL and SUPABASE_KEY:
        try:
            from supabase import create_client
            supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
            print("Supabase connected successfully!")
        except Exception as e:
            print(f"Supabase connection failed: {e}")
            supabase_client = None
    return supabase_client

def cache_get(key: str):
    """Get value from Supabase cache"""
    sb = get_supabase()
    if sb:
        try:
            result = sb.table("api_cache").select("data, expires_at").eq("key", key).single().execute()
            if result.data:
                expires_at = datetime.fromisoformat(result.data["expires_at"].replace("Z", "+00:00"))
                if expires_at > datetime.now(timezone.utc):
                    return result.data["data"]
                # Expired - delete it
                sb.table("api_cache").delete().eq("key", key).execute()
        except Exception as e:
            # No data found or error
            pass
    return None

def cache_set(key: str, value, ttl: int = CACHE_TTL):
    """Set value in Supabase cache"""
    sb = get_supabase()
    if sb:
        try:
            expires_at = datetime.now(timezone.utc) + timedelta(seconds=ttl)
            sb.table("api_cache").upsert({
                "key": key,
                "data": value,
                "expires_at": expires_at.isoformat()
            }).execute()
        except Exception as e:
            print(f"Supabase set error: {e}")


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

    # Supported languages by ytmusicapi (based on recent error message)
    # ko, hi, it, de, tr, en, pt, cs, zh_CN, ja, es, ru, fr, nl, ar, ur, zh_TW
    SUPPORTED_LANGUAGES = [
        "ko", "hi", "it", "de", "tr", "en", "pt", "cs", "zh_CN", "ja",
        "es", "ru", "fr", "nl", "ar", "ur", "zh_TW"
    ]

    # Fallback to English if language is not supported (e.g. 'id', 'th', 'vi')
    if language not in SUPPORTED_LANGUAGES:
        language = "en"

    # Initialize YTMusic with language and location for correct regional data
    return YTMusic(language=language, location=country)

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


# ============================================
# YouTube Playlist Tracks Endpoint (Optimized for instant playback)
# ============================================
import requests
import concurrent.futures

TTL_PLAYLIST_TRACKS = 24 * 3600  # 24시간 캐싱

def extract_video_ids_from_youtube(playlist_id: str) -> list[str]:
    """
    Extract video IDs from a YouTube playlist page.
    Uses YouTube's embed page which is simpler to parse.
    """
    try:
        # Method 1: Try YouTube's oembed/playlist info
        url = f"https://www.youtube.com/playlist?list={playlist_id}"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }

        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code != 200:
            return []

        # Extract video IDs from the page content
        # YouTube embeds video IDs in the format "videoId":"XXXXXXXXXXX"
        import re
        video_ids = re.findall(r'"videoId":"([a-zA-Z0-9_-]{11})"', response.text)

        # Remove duplicates while preserving order
        seen = set()
        unique_ids = []
        for vid in video_ids:
            if vid not in seen:
                seen.add(vid)
                unique_ids.append(vid)

        return unique_ids[:100]  # Limit to 100 videos

    except Exception as e:
        print(f"Error extracting video IDs: {e}")
        return []


def fetch_video_metadata(video_id: str) -> dict:
    """Fetch video metadata from noembed.com"""
    try:
        res = requests.get(
            f"https://noembed.com/embed?url=https://www.youtube.com/watch?v={video_id}",
            timeout=5
        )
        if res.status_code == 200:
            data = res.json()
            return {
                "videoId": video_id,
                "title": data.get("title", "Unknown"),
                "artist": data.get("author_name", "Unknown Artist"),
                "thumbnail": f"https://img.youtube.com/vi/{video_id}/mqdefault.jpg"
            }
    except Exception:
        pass

    return {
        "videoId": video_id,
        "title": "Unknown",
        "artist": "Unknown Artist",
        "thumbnail": f"https://img.youtube.com/vi/{video_id}/mqdefault.jpg"
    }


@app.get("/playlist/tracks")
def get_playlist_tracks(playlistId: str = Query(..., description="YouTube playlist ID (PLxxx)")):
    """
    Get tracks for a YouTube playlist with metadata.
    Optimized for frontend instant playback preloading.
    Cached for 24 hours in Supabase.
    """
    cache_key = make_cache_key("playlist_tracks", playlistId)

    # Check cache
    cached = cache_get(cache_key)
    if cached is not None:
        print(f"[CACHE HIT] /playlist/tracks playlistId={playlistId[:20]}...")
        return cached

    print(f"[CACHE MISS] /playlist/tracks playlistId={playlistId[:20]}...")

    # Extract video IDs from YouTube playlist
    video_ids = extract_video_ids_from_youtube(playlistId)

    if not video_ids:
        return {"playlistId": playlistId, "tracks": [], "error": "Failed to extract video IDs"}

    # Fetch metadata in parallel (10 workers)
    tracks = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        future_to_vid = {executor.submit(fetch_video_metadata, vid): vid for vid in video_ids}
        for future in concurrent.futures.as_completed(future_to_vid):
            try:
                track = future.result()
                tracks.append(track)
            except Exception:
                pass

    # Sort tracks by original order
    vid_to_track = {t["videoId"]: t for t in tracks}
    ordered_tracks = [vid_to_track[vid] for vid in video_ids if vid in vid_to_track]

    result = {
        "playlistId": playlistId,
        "tracks": ordered_tracks,
        "count": len(ordered_tracks)
    }

    # Cache result
    cache_set(cache_key, result, TTL_PLAYLIST_TRACKS)
    print(f"[CACHED] /playlist/tracks playlistId={playlistId[:20]}... ({len(ordered_tracks)} tracks)")

    return result

@app.get("/cache/status")
def cache_status():
    """Get current cache statistics from Supabase"""
    sb = get_supabase()
    if sb:
        try:
            count_result = sb.table("api_cache").select("key", count="exact").execute()
            return {
                "type": "supabase",
                "connected": True,
                "keys": count_result.count if count_result.count else 0,
                "ttl": CACHE_TTL
            }
        except Exception as e:
            return {"type": "supabase", "connected": False, "error": str(e)}
    return {"type": "supabase", "connected": False, "message": "Supabase not configured"}


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
    
    # Check cache
    cached = cache_get(cache_key)
    if cached is not None:
        print(f"[CACHE HIT] /artist/{artist_id}")
        return cached
    
    try:
        print(f"[CACHE MISS] /artist/{artist_id}")
        yt = get_ytmusic(country=country, language=language)
        result = run_with_retry(yt.get_artist, artist_id)
        
        # Store in cache (24시간 TTL)
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
    
    # Check cache
    cached = cache_get(cache_key)
    if cached is not None:
        print(f"[CACHE HIT] /album/{browse_id}")
        return cached
    
    try:
        print(f"[CACHE MISS] /album/{browse_id}")
        yt = get_ytmusic()
        result = run_with_retry(yt.get_album, browse_id)
        
        # Store in cache (72시간 TTL)
        cache_set(cache_key, result, TTL_ALBUM)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/song/{video_id}")
def get_song(video_id: str):
    cache_key = make_cache_key("song", video_id)
    
    # Check cache
    cached = cache_get(cache_key)
    if cached is not None:
        print(f"[CACHE HIT] /song/{video_id}")
        return cached
    
    try:
        print(f"[CACHE MISS] /song/{video_id}")
        yt = get_ytmusic()
        result = run_with_retry(yt.get_song, video_id)
        
        # Store in cache (72시간 TTL)
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
    cache_key = make_cache_key("watch", videoId, playlistId)
    
    # Check cache
    cached = cache_get(cache_key)
    if cached is not None:
        print(f"[CACHE HIT] /watch videoId={videoId} playlistId={playlistId}")
        return cached
    
    try:
        print(f"[CACHE MISS] /watch videoId={videoId} playlistId={playlistId}")
        yt = get_ytmusic()
        result = run_with_retry(yt.get_watch_playlist, videoId=videoId, playlistId=playlistId)
        
        # Store in cache (24시간 TTL)
        cache_set(cache_key, result, CACHE_TTL)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/playlist/{playlist_id}")
def get_playlist(playlist_id: str, limit: int = 100):
    """Get full playlist with all tracks (up to limit)
    Automatically detects album IDs (OLAK5uy_) and uses get_album() instead
    """
    cache_key = make_cache_key("playlist", playlist_id, limit)
    
    # Check cache
    cached = cache_get(cache_key)
    if cached is not None:
        print(f"[CACHE HIT] /playlist/{playlist_id}")
        return cached
    
    try:
        print(f"[CACHE MISS] /playlist/{playlist_id}")
        yt = get_ytmusic()
        
        # Detect ID type and use appropriate API
        if playlist_id.startswith("OLAK5uy_"):
            # This is an Album ID - use get_album()
            print(f"[/playlist] Detected Album ID, using get_album()")
            result = run_with_retry(yt.get_album, playlist_id)
        else:
            # Regular playlist ID - use get_playlist()
            result = run_with_retry(yt.get_playlist, playlist_id, limit=limit)
        
        # Store in cache (48시간 TTL)
        cache_set(cache_key, result, TTL_MOOD_PLAYLISTS)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/home")
def get_home(limit: int = 100, country: str = "US", language: str = "en"):
    cache_key = make_cache_key("home", limit, country, language)

    cached = cache_get(cache_key)
    if cached is not None:
        print(f"[CACHE HIT] /home country={country} lang={language}")
        return cached

    try:
        print(f"[CACHE MISS] /home country={country} lang={language}")
        yt = get_ytmusic(country=country, language=language)
        result = run_with_retry(yt.get_home, limit=limit)

        cache_set(cache_key, result, TTL_HOME)
        return result
    except Exception as e:
        # Fallback to US if the requested country fails
        if country != "US":
            print(f"[FALLBACK] /home country={country} failed, trying US...")
            try:
                yt_fallback = get_ytmusic(country="US", language="en")
                result = run_with_retry(yt_fallback.get_home, limit=limit)
                # Cache with original key so next request is fast
                cache_set(cache_key, result, TTL_HOME)
                return result
            except Exception as fallback_error:
                print(f"[FALLBACK FAILED] US also failed: {fallback_error}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/charts")
def get_charts(country: str = "US", language: str = "en"):
    cache_key = make_cache_key("charts", country, language)

    cached = cache_get(cache_key)
    if cached is not None:
        print(f"[CACHE HIT] /charts country={country}")
        return cached

    try:
        print(f"[CACHE MISS] /charts country={country}")
        yt = get_ytmusic(country=country, language=language)
        result = run_with_retry(yt.get_charts, country=country)

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

    cached = cache_get(cache_key)
    if cached is not None:
        print(f"[CACHE HIT] /moods country={country} lang={language}")
        return cached

    try:
        print(f"[CACHE MISS] /moods country={country} lang={language}")
        yt = get_ytmusic(country=country, language=language)
        result = run_with_retry(yt.get_mood_categories)

        cache_set(cache_key, result, TTL_MOODS)
        return result
    except Exception as e:
        # Fallback to US if the requested country fails
        if country != "US":
            print(f"[FALLBACK] /moods country={country} failed, trying US...")
            try:
                yt_fallback = get_ytmusic(country="US", language="en")
                result = run_with_retry(yt_fallback.get_mood_categories)
                cache_set(cache_key, result, TTL_MOODS)
                return result
            except Exception as fallback_error:
                print(f"[FALLBACK FAILED] US also failed: {fallback_error}")
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

    cached = cache_get(cache_key)
    if cached is not None:
        print(f"[CACHE HIT] /moods/playlists params={params[:20]}... country={country}")
        return cached

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

        cache_set(cache_key, final_result, TTL_MOOD_PLAYLISTS)
        return final_result

    except Exception as e:
        # Fallback to US if the requested country fails
        if country != "US":
            print(f"[FALLBACK] /moods/playlists country={country} failed, trying US...")
            try:
                yt_fallback = get_ytmusic(country="US", language="en")
                result = None
                try:
                    result = run_with_retry(yt_fallback.get_mood_playlists, params)
                except KeyError:
                    pass
                if not result:
                    result = parse_genre_playlists(yt_fallback, params)
                final_result = result if result else []
                cache_set(cache_key, final_result, TTL_MOOD_PLAYLISTS)
                return final_result
            except Exception as fallback_error:
                print(f"[FALLBACK FAILED] US also failed: {fallback_error}")
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
    Also prefetches albums/playlists from home data for instant banner clicks.
    """
    if not CACHE_WARMING_ENABLED:
        print("[CACHE WARMING] Disabled via environment variable")
        return
    
    print(f"[CACHE WARMING] Starting cache warming for {len(ALL_COUNTRIES)} countries...")
    success_count = 0
    error_count = 0
    prefetch_count = 0
    
    for country in ALL_COUNTRIES:
        try:
            yt = get_ytmusic(country=country, language="en")
            
            # Warm charts cache + get artists for prefetching
            cache_key = make_cache_key("charts", country, "en")
            charts_data = cache_get(cache_key)
            if charts_data is None:
                charts_data = yt.get_charts(country=country)
                cache_set(cache_key, charts_data, TTL_CHARTS)
                print(f"[CACHE WARMING] Charts cached for {country}")
            
            # Prefetch chart playlists (topSongs, topVideos, trending)
            # These are hardcoded chart playlist IDs from charts-constants.ts
            chart_playlists = get_chart_playlist_ids(country)
            for playlist_id in chart_playlists:
                if playlist_id:
                    watch_key = make_cache_key("watch", None, playlist_id)
                    if cache_get(watch_key) is None:
                        try:
                            watch_data = yt.get_watch_playlist(playlistId=playlist_id)
                            cache_set(watch_key, watch_data, CACHE_TTL)
                            prefetch_count += 1
                        except Exception:
                            pass
            
            # 🔥 Prefetch top 40 artists from charts (for instant artist click!)
            if charts_data and isinstance(charts_data, dict):
                artists = charts_data.get("artists", {}).get("results", [])
                for artist in artists[:40]:  # Top 40 artists
                    if not isinstance(artist, dict):
                        continue
                    artist_id = artist.get("browseId")
                    if artist_id:
                        artist_key = make_cache_key("artist", artist_id, country, "en")
                        if cache_get(artist_key) is None:
                            try:
                                artist_data = yt.get_artist(artist_id)
                                cache_set(artist_key, artist_data, TTL_ARTIST)
                                prefetch_count += 1
                            except Exception:
                                pass

            
            # Warm home cache + prefetch albums/playlists
            cache_key = make_cache_key("home", 100, country, "en")
            home_data = cache_get(cache_key)
            if home_data is None:
                home_data = yt.get_home(limit=100)
                cache_set(cache_key, home_data, TTL_HOME)
                print(f"[CACHE WARMING] Home cached for {country}")
            
            # Prefetch albums and playlists from home data
            if home_data and isinstance(home_data, list):
                for section in home_data:
                    if not section or not isinstance(section, dict):
                        continue
                    contents = section.get("contents", [])
                    for item in contents:
                        if not item or not isinstance(item, dict):
                            continue
                        
                        # Prefetch album data
                        browse_id = item.get("browseId")
                        if browse_id and browse_id.startswith("MPREb"):
                            album_key = make_cache_key("album", browse_id)
                            if cache_get(album_key) is None:
                                try:
                                    album_data = yt.get_album(browse_id)
                                    cache_set(album_key, album_data, TTL_ALBUM)
                                    prefetch_count += 1
                                except Exception:
                                    pass
                        
                        # Prefetch playlist/watch data
                        playlist_id = item.get("playlistId")
                        if playlist_id:
                            watch_key = make_cache_key("watch", None, playlist_id)
                            if cache_get(watch_key) is None:
                                try:
                                    watch_data = yt.get_watch_playlist(playlistId=playlist_id)
                                    cache_set(watch_key, watch_data, CACHE_TTL)
                                    prefetch_count += 1
                                except Exception:
                                    pass
            
            # Warm moods cache + prefetch mood playlists
            cache_key = make_cache_key("moods", country, "en")
            moods_data = cache_get(cache_key)
            if moods_data is None:
                moods_data = yt.get_mood_categories()
                cache_set(cache_key, moods_data, TTL_MOODS)
                print(f"[CACHE WARMING] Moods cached for {country}")
            
            # Prefetch playlists for ALL mood categories (instant response)
            if moods_data and isinstance(moods_data, dict):
                for section_name, categories in moods_data.items():
                    if not isinstance(categories, list):
                        continue
                    # Prefetch ALL categories for instant response
                    for cat in categories:
                        if not isinstance(cat, dict):
                            continue
                        params = cat.get("params")
                        if not params:
                            continue
                        
                        # Get playlists for this category
                        playlist_cache_key = make_cache_key("mood_playlists", params, country, "en")
                        playlists = cache_get(playlist_cache_key)
                        if playlists is None:
                            try:
                                playlists = yt.get_mood_playlists(params)
                                cache_set(playlist_cache_key, playlists, TTL_MOOD_PLAYLISTS)
                            except Exception:
                                continue
                        
                        # Prefetch watch data for each playlist (limited to first 5)
                        if playlists and isinstance(playlists, list):
                            for playlist in playlists[:5]:
                                if not isinstance(playlist, dict):
                                    continue
                                playlist_id = playlist.get("playlistId")
                                if playlist_id:
                                    watch_key = make_cache_key("watch", None, playlist_id)
                                    if cache_get(watch_key) is None:
                                        try:
                                            watch_data = yt.get_watch_playlist(playlistId=playlist_id)
                                            cache_set(watch_key, watch_data, CACHE_TTL)
                                            prefetch_count += 1
                                        except Exception:
                                            pass

            
            success_count += 1
            
        except Exception as e:
            error_count += 1
            print(f"[CACHE WARMING] Error for {country}: {e}")
    
    print(f"[CACHE WARMING] Complete! Countries: {success_count}, Errors: {error_count}, Prefetched: {prefetch_count}")


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
    if CACHE_WARMING_ENABLED and SUPABASE_URL:
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
    sb = get_supabase()
    if not sb:
        return {"error": "Supabase not connected"}

    try:
        # Get all cached keys
        result = sb.table("api_cache").select("key").execute()
        cached_keys = set(row["key"] for row in result.data) if result.data else set()

        status = {}
        for country in ALL_COUNTRIES:
            charts_key = make_cache_key("charts", country, "en")
            home_key = make_cache_key("home", 100, country, "en")
            moods_key = make_cache_key("moods", country, "en")

            status[country] = {
                "charts": charts_key in cached_keys,
                "home": home_key in cached_keys,
                "moods": moods_key in cached_keys
            }

        cached_count = sum(1 for s in status.values() if all(s.values()))

        return {
            "total_countries": len(ALL_COUNTRIES),
            "fully_cached": cached_count,
            "countries": status
        }
    except Exception as e:
        return {"error": str(e)}
