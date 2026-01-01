from fastapi import APIRouter, HTTPException
from ytmusicapi import YTMusic

router = APIRouter()
yt = YTMusic()

# Fallback Home Data
FALLBACK_HOME = [
    {
        "title": "New Release Mix",
        "contents": [
             {
                "title": "Super Shy",
                "artists": [{"name": "NewJeans"}],
                "thumbnails": [{"url": "https://lh3.googleusercontent.com/I2vM9r-b7g-I_vYg-E7tG8-HnDwXoCOZq-iZk5sV6dKkYj0H5z6gI1wZ9s0wH5z6gI1wZ9s0wH5z6g=w544-h544-l90-rj"}],
                "videoId": "ArmDp-zijuc"
            },
            {
               "title": "Seven (feat. Latto)",
                "artists": [{"name": "Jung Kook"}],
                 "thumbnails": [{"url": "https://lh3.googleusercontent.com/28x_6wL-t_YH8k_-yL7z_xH5z6gI1wZ9s0wH5z6gI1wZ9s0wH5z6gI1wZ9s0wH5z6gI1wZ9s0wH5z6g=w544-h544-l90-rj"}],
                 "videoId": "QU9c0053UAU"
            }
        ]
    },
     {
        "title": "Quick Picks",
        "contents": [
             {
                "title": "Hype Boy",
                "artists": [{"name": "NewJeans"}],
                "thumbnails": [{"url": "https://lh3.googleusercontent.com/I2vM9r-b7g-I_vYg-E7tG8-HnDwXoCOZq-iZk5sV6dKkYj0H5z6gI1wZ9s0wH5z6gI1wZ9s0wH5z6g=w544-h544-l90-rj"}],
                 "videoId": "11cta61wi0g"
            },
            {
               "title": "Dynamite",
                "artists": [{"name": "BTS"}],
                 "thumbnails": [{"url": "https://lh3.googleusercontent.com/I_vYg-E7tG8-HnDwXoCOZq-iZk5sV6dKkYj0H5z6gI1wZ9s0wH5z6gI1wZ9s0wH5z6gI1wZ9s0wH5z6g=w544-h544-l90-rj"}],
                 "videoId": "gdZLi9oWNZg"
            }
        ]
    }
]

@router.get("")
def get_home():
    try:
        # Note: language and location should ideally be dynamic based on request headers
        # Unauthenticated get_home might fail or need fallback
        home_data = yt.get_home()
        if not home_data:
             return {"home": FALLBACK_HOME}
        return {"home": home_data}
    except Exception as e:
        print(f"Error fetching home data, using fallback: {e}")
        # Return fallback data instead of empty error
        return {"home": FALLBACK_HOME}
