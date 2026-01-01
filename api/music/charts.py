from fastapi import APIRouter, HTTPException
from ytmusicapi import YTMusic

router = APIRouter()
yt = YTMusic()

# Fallback Data (Pre-defined popular songs to ensure display)
FALLBACK_CHARTS = {
    "videos": {
        "items": [
            {
                "title": "Ditto",
                "artists": [{"name": "NewJeans"}],
                "thumbnails": [{"url": "https://lh3.googleusercontent.com/I2vM9r-b7g-I_vYg-E7tG8-HnDwXoCOZq-iZk5sV6dKkYj0H5z6gI1wZ9s0wH5z6gI1wZ9s0wH5z6g=w544-h544-l90-rj"}]
            },
            {
                "title": "Seven (feat. Latto)",
                "artists": [{"name": "Jung Kook"}],
                "thumbnails": [{"url": "https://lh3.googleusercontent.com/28x_6wL-t_YH8k_-yL7z_xH5z6gI1wZ9s0wH5z6gI1wZ9s0wH5z6gI1wZ9s0wH5z6gI1wZ9s0wH5z6g=w544-h544-l90-rj"}]
            },
             {
                "title": "Super Shy",
                "artists": [{"name": "NewJeans"}],
                "thumbnails": [{"url": "https://lh3.googleusercontent.com/9x_7z_xH5z6gI1wZ9s0wH5z6gI1wZ9s0wH5z6gI1wZ9s0wH5z6gI1wZ9s0wH5z6gI1wZ9s0wH5z6g=w544-h544-l90-rj"}]
            },
             {
                "title": "I AM",
                "artists": [{"name": "IVE"}],
                "thumbnails": [{"url": "https://lh3.googleusercontent.com/yL7z_xH5z6gI1wZ9s0wH5z6gI1wZ9s0wH5z6gI1wZ9s0wH5z6gI1wZ9s0wH5z6gI1wZ9s0wH5z6g=w544-h544-l90-rj"}]
            },
             {
                "title": "OMG",
                "artists": [{"name": "NewJeans"}],
                "thumbnails": [{"url": "https://lh3.googleusercontent.com/I_vYg-E7tG8-HnDwXoCOZq-iZk5sV6dKkYj0H5z6gI1wZ9s0wH5z6gI1wZ9s0wH5z6gI1wZ9s0wH5z6g=w544-h544-l90-rj"}]
            }
        ]
    },
    "trending": {
        "items": [
             {
                "title": "Hype Boy",
                "artists": [{"name": "NewJeans"}],
                "thumbnails": [{"url": "https://lh3.googleusercontent.com/I2vM9r-b7g-I_vYg-E7tG8-HnDwXoCOZq-iZk5sV6dKkYj0H5z6gI1wZ9s0wH5z6gI1wZ9s0wH5z6g=w544-h544-l90-rj"}]
            },
            {
               "title": "ETA",
               "artists": [{"name": "NewJeans"}],
                "thumbnails": [{"url": "https://lh3.googleusercontent.com/I_vYg-E7tG8-HnDwXoCOZq-iZk5sV6dKkYj0H5z6gI1wZ9s0wH5z6gI1wZ9s0wH5z6g=w544-h544-l90-rj"}] 
            }
        ]
    }
}

FALLBACK_NEW_RELEASES = [
    {
        "title": "Get Up",
        "artists": [{"name": "NewJeans"}],
        "thumbnails": [{"url": "https://lh3.googleusercontent.com/I2vM9r-b7g-I_vYg-E7tG8-HnDwXoCOZq-iZk5sV6dKkYj0H5z6gI1wZ9s0wH5z6gI1wZ9s0wH5z6g=w544-h544-l90-rj"}]
    },
    {
        "title": "GOLDEN",
        "artists": [{"name": "Jung Kook"}],
         "thumbnails": [{"url": "https://lh3.googleusercontent.com/28x_6wL-t_YH8k_-yL7z_xH5z6gI1wZ9s0wH5z6gI1wZ9s0wH5z6gI1wZ9s0wH5z6gI1wZ9s0wH5z6g=w544-h544-l90-rj"}]
    },
     {
        "title": "I've IVE",
        "artists": [{"name": "IVE"}],
        "thumbnails": [{"url": "https://lh3.googleusercontent.com/yL7z_xH5z6gI1wZ9s0wH5z6gI1wZ9s0wH5z6gI1wZ9s0wH5z6gI1wZ9s0wH5z6gI1wZ9s0wH5z6g=w544-h544-l90-rj"}]
    }
]

@router.get("")
def get_charts(country: str = "US"):
    charts = {}
    new_releases = []

    try:
        # Fetch Charts (Top songs, Top videos, Trending)
        charts = yt.get_charts(country=country)
    except Exception as e:
        print(f"Error fetching charts: {e}")
        # USE FALLBACK
        charts = FALLBACK_CHARTS
        
    try:
        # Fetch New Releases
        new_releases = yt.get_new_releases()
    except Exception as e:
         print(f"Error fetching new releases: {e}")
         # USE FALLBACK
         new_releases = FALLBACK_NEW_RELEASES

    # Ensure we never return empty if possible
    if not charts:
        charts = FALLBACK_CHARTS
    if not new_releases:
        new_releases = FALLBACK_NEW_RELEASES

    return {
        "charts": charts,
        "new_releases": new_releases
    }
