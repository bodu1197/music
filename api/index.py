from fastapi import FastAPI
from api.music.search import router as search_router
from api.music.home import router as home_router

app = FastAPI()

app.include_router(search_router, prefix="/api/music/search", tags=["search"])
app.include_router(home_router, prefix="/api/music/home", tags=["home"])

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "VibeStation API is running"}
