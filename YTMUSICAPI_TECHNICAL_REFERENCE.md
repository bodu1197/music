# ytmusicapi 완전 기술 레퍼런스
## Unofficial API for YouTube Music - 박사급 기술 문서

> **문서 버전**: 1.0
> **기준 라이브러리 버전**: 1.11.4 (2025년 12월 19일)
> **작성일**: 2025년 12월 31일
> **Python 요구사항**: 3.10 이상

---

# 1. 개요 (Overview)

## 1.1 라이브러리 정의

**ytmusicapi**는 YouTube Music 웹 클라이언트의 요청을 에뮬레이션하여 YouTube Music API와 상호작용하는 비공식 Python 3 라이브러리입니다.

```
핵심 목적:
- YouTube Music 라이브러리 콘텐츠 검색
- 플레이리스트 관리 자동화
- 음악 업로드 기능
- 차트/트렌드 데이터 수집
```

## 1.2 주요 특징

| 카테고리 | 기능 |
|----------|------|
| **Browsing** | 검색, 아티스트, 앨범, 곡, 가사, 관련 콘텐츠 |
| **Explore** | 무드/장르 플레이리스트, 글로벌/국가별 차트 |
| **Library** | 라이브러리 관리, 구독, 평가, 재생 기록 |
| **Playlists** | 생성, 수정, 삭제, 항목 관리 |
| **Podcasts** | 팟캐스트, 에피소드, 채널 |
| **Uploads** | 음악 업로드, 삭제, 관리 |
| **Localization** | 196개국, 16개 언어 지원 |

## 1.3 공식 리소스

| 리소스 | URL |
|--------|-----|
| 공식 문서 | https://ytmusicapi.readthedocs.io/en/stable/ |
| GitHub | https://github.com/sigma67/ytmusicapi |
| PyPI | https://pypi.org/project/ytmusicapi/ |
| 릴리즈 | https://github.com/sigma67/ytmusicapi/releases |

---

# 2. 아키텍처 (Architecture)

## 2.1 클래스 계층 구조

```
YTMusic (메인 클래스)
├── YTMusicBase (기본 기능)
├── BrowsingMixin (검색/탐색)
├── SearchMixin (검색 전용)
├── WatchMixin (재생 관련)
├── ChartsMixin (차트)
├── ExploreMixin (탐색)
├── LibraryMixin (라이브러리)
├── PlaylistsMixin (플레이리스트)
├── PodcastsMixin (팟캐스트)
└── UploadsMixin (업로드)
```

## 2.2 YTMusic 클래스 생성자

```python
YTMusic(
    auth: str | dict[str, Any] | None = None,      # 인증 파일 경로 또는 딕셔너리
    user: str | None = None,                        # Brand Account ID
    requests_session: Session | None = None,        # 커스텀 세션
    proxies: dict[str, str] | None = None,          # 프록시 설정
    language: str = 'en',                           # 언어 코드
    location: str = '',                             # 국가 코드
    oauth_credentials: OAuthCredentials | None = None  # OAuth 인증정보
)
```

## 2.3 컨텍스트 관리자

```python
# 모바일 앱 에뮬레이션 모드
with ytmusic.as_mobile():
    # 모바일 전용 기능 사용
    pass
```

---

# 3. 인증 시스템 (Authentication)

## 3.1 인증 방식 비교

| 방식 | 복잡도 | 업로드 지원 | 유효기간 | 권장 용도 |
|------|--------|------------|----------|----------|
| **비인증** | 없음 | X | - | 공개 데이터만 |
| **OAuth** | 낮음 | X | 갱신 가능 | 일반 사용 |
| **Browser** | 중간 | O | ~2년 | 업로드 필요시 |

## 3.2 비인증 사용

```python
from ytmusicapi import YTMusic

ytmusic = YTMusic()  # 인증 없이 초기화

# 사용 가능한 기능
ytmusic.search("BTS")
ytmusic.get_artist("UC9vrvNSL3xcWGSkV86REBSg")
ytmusic.get_charts("KR")
```

## 3.3 OAuth 인증

### 3.3.1 사전 요구사항 (2024년 11월 이후)

1. Google Cloud Console에서 프로젝트 생성
2. YouTube Data API 활성화
3. OAuth 클라이언트 ID 생성 (TVs and Limited Input devices)
4. Client ID와 Client Secret 획득

### 3.3.2 설정 방법

```bash
# CLI로 설정
ytmusicapi oauth
```

```python
# 프로그래밍 방식
from ytmusicapi import YTMusic, OAuthCredentials

# oauth.json 생성 후 사용
ytmusic = YTMusic(
    'oauth.json',
    oauth_credentials=OAuthCredentials(
        client_id='YOUR_CLIENT_ID',
        client_secret='YOUR_CLIENT_SECRET'
    )
)
```

### 3.3.3 Brand Account 사용

```python
# Brand Account ID 지정
ytmusic = YTMusic("oauth.json", "101234161234936123473")
```

## 3.4 Browser 인증

### 3.4.1 헤더 추출 절차

1. 브라우저에서 https://music.youtube.com 접속 (로그인 상태)
2. 개발자 도구 열기 (F12 또는 Ctrl+Shift+I)
3. Network 탭 선택
4. "/browse" 필터링
5. POST 요청 선택 (Status 200)
6. Request Headers 복사

### 3.4.2 브라우저별 복사 방법

**Firefox (권장):**
```
우클릭 → Copy → Copy Request Headers
```

**Chrome/Edge:**
```
Headers 탭 → Request Headers 섹션 복사
또는: 우클릭 → Copy as fetch (Node.js)
```

### 3.4.3 설정 파일 생성

```bash
# CLI 방식
ytmusicapi browser
# 프롬프트에 헤더 붙여넣기
```

```python
# 프로그래밍 방식
import ytmusicapi
ytmusicapi.setup(filepath="browser.json", headers_raw="<붙여넣은 헤더>")
```

### 3.4.4 수동 파일 생성

```json
{
    "Accept": "*/*",
    "Authorization": "SAPISIDHASH ...",
    "Content-Type": "application/json",
    "X-Goog-AuthUser": "0",
    "x-origin": "https://music.youtube.com",
    "Cookie": "VISITOR_INFO1_LIVE=...; ..."
}
```

---

# 4. API 완전 레퍼런스 (Complete API Reference)

## 4.1 BrowsingMixin (탐색 기능)

### get_home()
```python
def get_home() -> list[dict]
```
YouTube Music 홈 피드 콘텐츠를 반환합니다.

**반환값:**
```python
[
    {
        "title": "Quick picks",
        "contents": [
            {
                "title": "Song Title",
                "videoId": "dQw4w9WgXcQ",
                "artists": [{"name": "Artist", "id": "UC..."}],
                "thumbnails": [...]
            }
        ]
    }
]
```

### get_artist()
```python
def get_artist(channelId: str) -> dict
```
아티스트 정보와 상위 릴리즈를 반환합니다.

**매개변수:**
- `channelId`: 아티스트의 YouTube 채널 ID

**반환값:**
```python
{
    "name": "Oasis",
    "channelId": "UCUDVBtnOQi4c7E8jebpjc9Q",
    "description": "Oasis were an English rock band...",
    "views": "1838795605",
    "subscribers": "2.3M",
    "subscribed": False,
    "thumbnails": [...],
    "songs": {
        "browseId": "VLPL...",
        "results": [
            {
                "videoId": "ZrOKjDZOtkA",
                "title": "Wonderwall (Remastered)",
                "artist": "Oasis",
                "album": "(What's The Story) Morning Glory?"
            }
        ]
    },
    "albums": {
        "browseId": "...",
        "params": "...",
        "results": [...]
    },
    "singles": {...},
    "videos": {...},
    "related": {...}
}
```

### get_artist_albums()
```python
def get_artist_albums(
    channelId: str,
    params: str,
    limit: int | None = 100,
    order: ArtistOrderType | None = None
) -> list[dict]
```
아티스트의 전체 앨범 목록을 반환합니다.

### get_album()
```python
def get_album(browseId: str) -> dict
```
앨범 상세 정보를 반환합니다.

**반환값:**
```python
{
    "title": "Seven",
    "type": "Album",
    "thumbnails": [...],
    "description": "Seven is the seventh studio album...",
    "artists": [
        {"name": "Martin Garrix", "id": "UCqJnSdHjKtfsrHi9aI-9d3g"}
    ],
    "year": "2016",
    "trackCount": 7,
    "duration": "23 minutes",
    "durationMs": 1439579,
    "audioPlaylistId": "OLAK5uy_kGnhwT08mQMGw8fArBowdtlew3DpgUt9c",
    "tracks": [
        {
            "videoId": "8xMNeXI9wxI",
            "title": "WIEE (feat. Mesto)",
            "artists": [...],
            "album": "Seven",
            "likeStatus": "INDIFFERENT",
            "thumbnails": [...],
            "isAvailable": True,
            "isExplicit": False,
            "duration": "3:23",
            "duration_seconds": 203
        }
    ]
}
```

### get_album_browse_id()
```python
def get_album_browse_id(audioPlaylistId: str) -> str | None
```
오디오 플레이리스트 ID로 앨범 browseId를 조회합니다.

### get_song()
```python
def get_song(videoId: str, signatureTimestamp: int | None = None) -> dict
```
곡의 메타데이터와 스트리밍 정보를 반환합니다.

**반환값:**
```python
{
    "videoId": "dQw4w9WgXcQ",
    "title": "Never Gonna Give You Up",
    "lengthSeconds": "212",
    "keywords": [...],
    "channelId": "UCuAXFkgsw1L7xaCfnd5JJOw",
    "shortDescription": "...",
    "thumbnail": {...},
    "viewCount": "1234567890",
    "author": "Rick Astley",
    "isPrivate": False,
    "isLiveContent": False,
    "microformat": {...},
    "streamingData": {...},
    "playabilityStatus": {...}
}
```

### get_song_related()
```python
def get_song_related(browseId: str) -> list[dict]
```
관련 곡 목록을 반환합니다.

### get_lyrics()
```python
def get_lyrics(browseId: str) -> Lyrics | None
```
곡의 가사를 반환합니다.

**반환값:**
```python
{
    "lyrics": "We're no strangers to love...",
    "source": "LyricFind",
    "hasTimestamps": False
}

# 타임스탬프 가사 (TimedLyrics)
{
    "lyrics": [
        {
            "text": "We're no strangers to love",
            "id": "1",
            "startTimeMs": "18410",
            "endTimeMs": "21950"
        }
    ],
    "source": "LyricFind",
    "hasTimestamps": True
}
```

### get_user()
```python
def get_user(channelId: str) -> dict
```
유저 프로필 정보를 반환합니다.

### get_user_playlists()
```python
def get_user_playlists(channelId: str, params: str) -> list[dict]
```

### get_user_videos()
```python
def get_user_videos(channelId: str, params: str) -> list[dict]
```

### get_tasteprofile()
```python
def get_tasteprofile() -> dict
```
사용자의 취향 프로필을 반환합니다.

### set_tasteprofile()
```python
def set_tasteprofile(artists: list[str], taste_profile: dict | None = None) -> dict
```
취향 프로필을 설정합니다.

---

## 4.2 SearchMixin (검색 기능)

### search()
```python
def search(
    query: str,
    filter: str | None = None,
    scope: str | None = None,
    limit: int = 20,
    ignore_spelling: bool = False
) -> list[dict]
```
YouTube Music 콘텐츠를 검색합니다.

**매개변수:**
- `query`: 검색어
- `filter`: 필터 유형
  - `None`: 전체 결과 (상위 결과 포함)
  - `"songs"`: 곡만
  - `"videos"`: 영상만
  - `"albums"`: 앨범만
  - `"artists"`: 아티스트만
  - `"playlists"`: 플레이리스트만
  - `"community_playlists"`: 커뮤니티 플레이리스트
  - `"featured_playlists"`: 추천 플레이리스트
  - `"uploads"`: 업로드된 곡
  - `"podcasts"`: 팟캐스트
  - `"episodes"`: 에피소드
- `scope`: 범위
  - `None`: 전체 YouTube Music
  - `"library"`: 내 라이브러리만
  - `"uploads"`: 업로드한 곡만
- `limit`: 결과 개수 제한
- `ignore_spelling`: 맞춤법 교정 무시

**반환값 (필터 없음):**
```python
[
    {
        "category": "Top result",
        "resultType": "song",
        "videoId": "...",
        "title": "...",
        "artists": [...],
        "album": {...}
    },
    {
        "category": "Songs",
        "resultType": "song",
        ...
    }
]
```

### get_search_suggestions()
```python
def get_search_suggestions(
    query: str,
    detailed_runs: bool = False
) -> list[str] | list[dict]
```
검색 자동완성 제안을 반환합니다.

### remove_search_suggestions()
```python
def remove_search_suggestions(query: str) -> bool
```
검색 기록에서 제안을 제거합니다.

---

## 4.3 WatchMixin (재생 기능)

### get_watch_playlist()
```python
def get_watch_playlist(
    videoId: str | None = None,
    playlistId: str | None = None,
    limit: int = 25,
    radio: bool = False,
    shuffle: bool = False
) -> dict
```
재생 대기열/플레이리스트를 반환합니다.

**매개변수:**
- `videoId`: 시작 곡 ID
- `playlistId`: 플레이리스트 ID
- `limit`: 곡 수 제한
- `radio`: 라디오 모드
- `shuffle`: 셔플 모드

**라디오 모드 ID 생성:**
```python
# 곡/비디오 기반 라디오
radio_id = "RDAMVM" + videoId

# 플레이리스트/앨범 기반 라디오
radio_id = "RDAMPL" + playlistId
```

---

## 4.4 ChartsMixin (차트 기능)

### get_charts()
```python
def get_charts(country: str = "ZZ") -> dict
```
국가별 또는 글로벌 차트를 반환합니다.

**매개변수:**
- `country`: ISO 3166-1 alpha-2 국가 코드
  - `"ZZ"`: 글로벌
  - `"KR"`: 한국
  - `"US"`: 미국
  - `"JP"`: 일본

**반환값:**
```python
{
    "countries": {
        "selected": {"text": "South Korea"},
        "options": [...]
    },
    "songs": {
        "playlist": "VLPL4fGSI1pDJn...",
        "items": [
            {
                "title": "Song Title",
                "videoId": "...",
                "artists": [...],
                "rank": "1",
                "trend": "up"
            }
        ]
    },
    "videos": {...},
    "artists": {...},
    "trending": {...},  # 글로벌에는 없음
    "genres": {...}     # US에만 있음
}
```

---

## 4.5 ExploreMixin (탐색 기능)

### get_explore()
```python
def get_explore() -> dict
```
탐색 페이지 콘텐츠를 반환합니다 (신규/트렌딩).

### get_mood_categories()
```python
def get_mood_categories() -> list[dict]
```
무드/장르 카테고리를 반환합니다.

**반환값:**
```python
[
    {
        "title": "Genres",
        "categories": [
            {
                "title": "Pop",
                "params": "ggMPOg1uX1..."
            }
        ]
    },
    {
        "title": "Moods & moments",
        "categories": [
            {
                "title": "Chill",
                "params": "ggMPOg1uX1..."
            }
        ]
    }
]
```

### get_mood_playlists()
```python
def get_mood_playlists(params: str) -> list[dict]
```
특정 무드/장르의 플레이리스트를 반환합니다.

---

## 4.6 LibraryMixin (라이브러리 기능)

### get_library_playlists()
```python
def get_library_playlists(limit: int = 25) -> list[dict]
```

### get_library_songs()
```python
def get_library_songs(
    limit: int = 25,
    validate_responses: bool = False,
    order: str | None = None
) -> list[dict]
```

**매개변수:**
- `order`: 정렬 순서
  - `None`: 최근 추가순
  - `"a_to_z"`: 제목 알파벳순
  - `"z_to_a"`: 제목 역순
  - `"recently_added"`: 최근 추가순

### get_library_albums()
```python
def get_library_albums(limit: int = 25, order: str | None = None) -> list[dict]
```

### get_library_artists()
```python
def get_library_artists(limit: int = 25, order: str | None = None) -> list[dict]
```

### get_library_subscriptions()
```python
def get_library_subscriptions(limit: int = 25, order: str | None = None) -> list[dict]
```

### get_library_podcasts()
```python
def get_library_podcasts(limit: int = 25, order: str | None = None) -> list[dict]
```

### get_library_channels()
```python
def get_library_channels(limit: int = 25, order: str | None = None) -> list[dict]
```

### get_liked_songs()
```python
def get_liked_songs(limit: int = 100) -> dict
```
'좋아요 표시한 음악' 플레이리스트를 반환합니다.

### get_saved_episodes()
```python
def get_saved_episodes(limit: int = 100) -> dict
```

### get_history()
```python
def get_history() -> list[dict]
```
재생 기록을 반환합니다.

### add_history_item()
```python
def add_history_item(song: dict) -> dict
```

### remove_history_items()
```python
def remove_history_items(feedbackTokens: list[str]) -> dict
```

### rate_song()
```python
def rate_song(videoId: str, rating: str = "INDIFFERENT") -> dict
```
곡에 평점을 매깁니다.

**매개변수:**
- `rating`:
  - `"LIKE"`: 좋아요
  - `"DISLIKE"`: 싫어요
  - `"INDIFFERENT"`: 평가 해제

### rate_playlist()
```python
def rate_playlist(playlistId: str, rating: str = "INDIFFERENT") -> dict
```

### subscribe_artists()
```python
def subscribe_artists(channelIds: list[str]) -> dict
```

### unsubscribe_artists()
```python
def unsubscribe_artists(channelIds: list[str]) -> dict
```

### edit_song_library_status()
```python
def edit_song_library_status(feedbackTokens: list[str]) -> dict
```
곡을 라이브러리에 추가/제거합니다.

### get_account_info()
```python
def get_account_info() -> dict
```

---

## 4.7 PlaylistsMixin (플레이리스트 기능)

### get_playlist()
```python
def get_playlist(
    playlistId: str,
    limit: int | None = 100,
    related: bool = False,
    suggestions_limit: int = 0
) -> dict
```
플레이리스트 상세 정보를 반환합니다.

**반환값:**
```python
{
    "id": "PLQwVIlKxHM6qv-o99iX9R85og7IzF9YS_",
    "privacy": "PUBLIC",
    "title": "My Playlist",
    "thumbnails": [...],
    "description": "Description text",
    "author": {...},
    "year": "2024",
    "duration": "2 hours",
    "duration_seconds": 7200,
    "trackCount": 50,
    "tracks": [
        {
            "videoId": "...",
            "title": "...",
            "artists": [...],
            "album": {...},
            "likeStatus": "LIKE",
            "thumbnails": [...],
            "isAvailable": True,
            "isExplicit": False,
            "duration": "3:45",
            "duration_seconds": 225,
            "setVideoId": "ABC123..."  # 항목 이동/삭제에 사용
        }
    ],
    "suggestions": [...],  # suggestions_limit > 0일 때
    "related": [...]       # related=True일 때
}
```

### create_playlist()
```python
def create_playlist(
    title: str,
    description: str,
    privacy_status: str = "PRIVATE",
    video_ids: list[str] | None = None,
    source_playlist: str | None = None
) -> str | dict
```
새 플레이리스트를 생성합니다.

**매개변수:**
- `privacy_status`:
  - `"PRIVATE"`: 비공개
  - `"PUBLIC"`: 공개
  - `"UNLISTED"`: 일부 공개

**반환값:** 생성된 플레이리스트 ID

### edit_playlist()
```python
def edit_playlist(
    playlistId: str,
    title: str | None = None,
    description: str | None = None,
    privacyStatus: str | None = None,
    moveItem: tuple[str, str] | None = None,
    addPlaylistId: str | None = None,
    addToTop: bool | None = None
) -> str | dict
```
플레이리스트를 수정합니다.

**매개변수:**
- `moveItem`: (setVideoId, 이동할_위치의_setVideoId) 튜플
- `addPlaylistId`: 다른 플레이리스트 추가
- `addToTop`: True면 상단에 추가

### delete_playlist()
```python
def delete_playlist(playlistId: str) -> str | dict
```

### add_playlist_items()
```python
def add_playlist_items(
    playlistId: str,
    videoIds: list[str] | None = None,
    source_playlist: str | None = None,
    duplicates: bool = False
) -> dict
```
플레이리스트에 항목을 추가합니다.

**반환값:**
```python
{
    "status": "STATUS_SUCCEEDED",
    "playlistEditResults": [
        {"videoId": "...", "setVideoId": "..."}
    ]
}
```

### remove_playlist_items()
```python
def remove_playlist_items(playlistId: str, videos: list[dict]) -> str | dict
```
플레이리스트에서 항목을 제거합니다.

**매개변수:**
- `videos`: `get_playlist()`에서 반환된 트랙 객체 리스트 (videoId, setVideoId 필요)

---

## 4.8 PodcastsMixin (팟캐스트 기능)

### get_podcast()
```python
def get_podcast(playlistId: str, limit: int = 100) -> dict
```

### get_episode()
```python
def get_episode(videoId: str) -> dict
```

### get_channel()
```python
def get_channel(channelId: str) -> dict
```

### get_channel_episodes()
```python
def get_channel_episodes(
    channelId: str,
    params: str,
    limit: int | None = 100
) -> list[dict]
```

### get_episodes_playlist()
```python
def get_episodes_playlist(playlistId: str = "RDPN", limit: int = 50) -> dict
```

---

## 4.9 UploadsMixin (업로드 기능)

> **중요**: 업로드 기능은 Browser 인증이 필요합니다. OAuth로는 작동하지 않습니다.

### get_library_upload_songs()
```python
def get_library_upload_songs(
    limit: int = 25,
    order: str | None = None
) -> list[dict]
```

### get_library_upload_artists()
```python
def get_library_upload_artists(
    limit: int = 25,
    order: str | None = None
) -> list[dict]
```

### get_library_upload_albums()
```python
def get_library_upload_albums(
    limit: int = 25,
    order: str | None = None
) -> list[dict]
```

### get_library_upload_artist()
```python
def get_library_upload_artist(browseId: str, limit: int = 25) -> list[dict]
```

### get_library_upload_album()
```python
def get_library_upload_album(browseId: str) -> dict
```

### upload_song()
```python
def upload_song(filepath: str) -> str | requests.Response
```
음악 파일을 업로드합니다.

**지원 형식:** MP3, M4A, WMA, FLAC, OGG

**반환값:**
- 성공: `"STATUS_SUCCEEDED"`
- 실패: Response 객체

### delete_upload_entity()
```python
def delete_upload_entity(entityId: str) -> str | dict
```
업로드된 곡/앨범을 삭제합니다.

---

# 5. 데이터 구조 상세 (Data Structures)

## 5.1 Browse ID 접두사

| 접두사 | 의미 | 예시 |
|--------|------|------|
| `UC` | YouTube 채널 | `UCuAXFkgsw1L7xaCfnd5JJOw` |
| `VLPL` | 플레이리스트 | `VLPLMpM3Z0118S42R1npOhcjoakLIv1aqnS1` |
| `OLAK5uy_` | 앨범 | `OLAK5uy_kGnhwT08mQMGw8fArBowdtlew3DpgUt9c` |
| `MPRE` | 앨범 (다른 형식) | `MPREb_K9vM9B6dCxP` |
| `RDAMVM` | 곡/비디오 기반 라디오 | `RDAMVMdQw4w9WgXcQ` |
| `RDAMPL` | 플레이리스트 기반 라디오 | `RDAMPLOLAK5uy_k...` |
| `MPLA` | 라이브러리 아티스트 | `MPLAUCxxx` |
| `MPSP` | 팟캐스트 | `MPSPPLxxx` |
| `MPED` | 에피소드 | `MPEDxxx` |
| `FEmusic_` | 탐색 페이지 | `FEmusic_liked_videos` |

## 5.2 핵심 객체 구조

### Song/Track 객체
```python
{
    "videoId": str,              # 필수
    "title": str,                # 필수
    "artists": [                 # 아티스트 목록
        {"name": str, "id": str | None}
    ],
    "album": {                   # 앨범 정보
        "name": str,
        "id": str
    },
    "duration": str,             # "3:45" 형식
    "duration_seconds": int,     # 225
    "thumbnails": [              # 썸네일 목록
        {"url": str, "width": int, "height": int}
    ],
    "isExplicit": bool,
    "isAvailable": bool,
    "likeStatus": str,           # "LIKE", "DISLIKE", "INDIFFERENT"
    "setVideoId": str,           # 플레이리스트 항목 식별자
    "feedbackTokens": {          # 라이브러리 추가/제거용
        "add": str,
        "remove": str
    }
}
```

### Artist 객체
```python
{
    "name": str,
    "channelId": str,            # UC로 시작
    "thumbnails": [...],
    "subscribers": str,          # "2.3M"
    "description": str,
    "views": str,                # "1838795605"
    "subscribed": bool
}
```

### Album 객체
```python
{
    "browseId": str,             # MPRE 또는 OLAK5uy_
    "title": str,
    "type": str,                 # "Album", "Single", "EP"
    "artists": [...],
    "year": str,
    "thumbnails": [...],
    "audioPlaylistId": str,      # OLAK5uy_로 시작
    "trackCount": int,
    "duration": str,
    "duration_seconds": int
}
```

---

# 6. 제한사항 및 해결방안 (Limitations & Solutions)

## 6.1 Rate Limiting

### 증상
```
Error 429: "You are creating too many playlists. Please wait a while before creating further playlists."
reason: 'RATE_LIMIT_EXCEEDED'
status: 'RESOURCE_EXHAUSTED'
```

### 제한 특성
| 항목 | 값 |
|------|-----|
| 리셋 주기 | 1시간 (정시 기준) |
| 영향 받는 작업 | 플레이리스트 생성/삭제, 대량 업로드 |
| 일반 사용 영향 | 거의 없음 |

### 해결 방안
```python
import time
from functools import wraps

def rate_limit_handler(max_retries=3, delay=60):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if 'RATE_LIMIT_EXCEEDED' in str(e):
                        if attempt < max_retries - 1:
                            time.sleep(delay)
                            continue
                    raise
            return None
        return wrapper
    return decorator

@rate_limit_handler()
def create_playlist_safely(ytmusic, title, description):
    return ytmusic.create_playlist(title, description)
```

## 6.2 IP 차단 (Cloud/Datacenter)

### 증상
- 클라우드 VM에서 API 호출 실패
- 빈 응답 또는 403 오류

### 해결 방안: 프록시 사용

```python
from ytmusicapi import YTMusic

# 프록시 설정
proxies = {
    "http": "http://user:pass@proxy.example.com:8080",
    "https": "http://user:pass@proxy.example.com:8080"
}

ytmusic = YTMusic("oauth.json", proxies=proxies)
```

### 권장 프록시 서비스
| 서비스 | 유형 | 가격 |
|--------|------|------|
| WebShare | Residential | $5-30/월 |
| Bright Data | Residential | $50+/월 |
| SmartProxy | Residential | $15+/월 |

## 6.3 인증 만료

### OAuth
- 자동 갱신됨
- `OAuthCredentials` 클래스가 처리

### Browser 인증
- 약 2년간 유효
- 로그아웃 시 무효화
- 재설정 필요

## 6.4 Songs vs Videos

| 구분 | Songs | Videos |
|------|-------|--------|
| 업로더 | 공식 아티스트 | 모든 사용자 |
| 라이브러리 추가 | 가능 | 불가 |
| 차트 포함 | 가능 | 가능 |
| 가사 | 보통 있음 | 없음 |

## 6.5 Pagination 동작

```python
# limit=50 요청 시:
# - YouTube Music은 20-100개씩 반환
# - 라이브러리는 limit 도달까지 계속 요청
# - 실제 반환량은 limit보다 많을 수 있음

songs = ytmusic.get_library_songs(limit=50)
print(len(songs))  # 50-100 사이일 수 있음
```

---

# 7. 실전 구현 예제 (Implementation Examples)

## 7.1 기본 검색 및 재생

```python
from ytmusicapi import YTMusic

# 비인증 모드로 초기화
ytmusic = YTMusic()

# 검색
results = ytmusic.search("BTS Dynamite", filter="songs")
print(f"검색 결과: {len(results)}개")

for song in results[:5]:
    print(f"- {song['title']} by {song['artists'][0]['name']}")
    print(f"  Video ID: {song['videoId']}")
```

## 7.2 아티스트 정보 수집

```python
from ytmusicapi import YTMusic

ytmusic = YTMusic()

# 아티스트 검색
search = ytmusic.search("IU", filter="artists")
artist_id = search[0]['browseId']

# 아티스트 상세 정보
artist = ytmusic.get_artist(artist_id)
print(f"아티스트: {artist['name']}")
print(f"구독자: {artist['subscribers']}")
print(f"총 조회수: {artist['views']}")

# 상위 곡
for song in artist['songs']['results'][:5]:
    print(f"  - {song['title']}")

# 전체 앨범 목록
if 'albums' in artist:
    albums = ytmusic.get_artist_albums(
        artist['albums']['browseId'],
        artist['albums']['params']
    )
    print(f"\n앨범 수: {len(albums)}개")
```

## 7.3 플레이리스트 관리

```python
from ytmusicapi import YTMusic, OAuthCredentials

# OAuth 인증
ytmusic = YTMusic(
    'oauth.json',
    oauth_credentials=OAuthCredentials(
        client_id='YOUR_CLIENT_ID',
        client_secret='YOUR_CLIENT_SECRET'
    )
)

# 플레이리스트 생성
playlist_id = ytmusic.create_playlist(
    "My K-Pop Mix",
    "Best K-Pop songs curated by AI",
    privacy_status="PRIVATE"
)
print(f"생성된 플레이리스트: {playlist_id}")

# 곡 검색 및 추가
songs_to_add = []
for query in ["BTS Dynamite", "BLACKPINK DDU-DU", "IU Celebrity"]:
    result = ytmusic.search(query, filter="songs", limit=1)
    if result:
        songs_to_add.append(result[0]['videoId'])

# 플레이리스트에 추가
if songs_to_add:
    ytmusic.add_playlist_items(playlist_id, songs_to_add)
    print(f"추가된 곡: {len(songs_to_add)}개")

# 플레이리스트 내용 확인
playlist = ytmusic.get_playlist(playlist_id)
for track in playlist['tracks']:
    print(f"  - {track['title']}")
```

## 7.4 차트 데이터 수집

```python
from ytmusicapi import YTMusic

ytmusic = YTMusic()

# 한국 차트
kr_charts = ytmusic.get_charts("KR")

print("=== 한국 TOP 10 ===")
for i, song in enumerate(kr_charts['songs']['items'][:10], 1):
    trend = song.get('trend', '')
    print(f"{i}. {song['title']} - {song['artists'][0]['name']} {trend}")

# 글로벌 차트
global_charts = ytmusic.get_charts("ZZ")
print("\n=== 글로벌 TOP 10 ===")
for i, song in enumerate(global_charts['songs']['items'][:10], 1):
    print(f"{i}. {song['title']} - {song['artists'][0]['name']}")
```

## 7.5 라이브러리 백업

```python
from ytmusicapi import YTMusic, OAuthCredentials
import json

ytmusic = YTMusic(
    'oauth.json',
    oauth_credentials=OAuthCredentials(
        client_id='YOUR_CLIENT_ID',
        client_secret='YOUR_CLIENT_SECRET'
    )
)

# 라이브러리 수집
backup = {
    "liked_songs": [],
    "playlists": [],
    "albums": [],
    "artists": []
}

# 좋아요 표시한 곡
liked = ytmusic.get_liked_songs(limit=5000)
backup["liked_songs"] = [
    {"videoId": t['videoId'], "title": t['title']}
    for t in liked['tracks']
]
print(f"좋아요 곡: {len(backup['liked_songs'])}개")

# 플레이리스트
playlists = ytmusic.get_library_playlists(limit=100)
for pl in playlists:
    if pl.get('playlistId'):
        detail = ytmusic.get_playlist(pl['playlistId'], limit=5000)
        backup["playlists"].append({
            "title": pl['title'],
            "tracks": [
                {"videoId": t['videoId'], "title": t['title']}
                for t in detail.get('tracks', [])
            ]
        })
print(f"플레이리스트: {len(backup['playlists'])}개")

# 저장
with open('ytmusic_backup.json', 'w', encoding='utf-8') as f:
    json.dump(backup, f, ensure_ascii=False, indent=2)

print("백업 완료: ytmusic_backup.json")
```

## 7.6 캐시 시스템 구현

```python
from ytmusicapi import YTMusic
import json
import time
from pathlib import Path

class CachedYTMusic:
    def __init__(self, cache_dir="cache", ttl_hours=24):
        self.ytmusic = YTMusic()
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)
        self.ttl_seconds = ttl_hours * 3600

    def _cache_key(self, method, *args):
        key = f"{method}_{'_'.join(str(a) for a in args)}"
        return self.cache_dir / f"{key}.json"

    def _is_valid(self, cache_file):
        if not cache_file.exists():
            return False
        mtime = cache_file.stat().st_mtime
        return (time.time() - mtime) < self.ttl_seconds

    def _load_cache(self, cache_file):
        with open(cache_file, 'r', encoding='utf-8') as f:
            return json.load(f)

    def _save_cache(self, cache_file, data):
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def get_artist(self, channel_id):
        cache_file = self._cache_key("artist", channel_id)
        if self._is_valid(cache_file):
            return self._load_cache(cache_file)

        data = self.ytmusic.get_artist(channel_id)
        self._save_cache(cache_file, data)
        return data

    def get_album(self, browse_id):
        cache_file = self._cache_key("album", browse_id)
        if self._is_valid(cache_file):
            return self._load_cache(cache_file)

        data = self.ytmusic.get_album(browse_id)
        self._save_cache(cache_file, data)
        return data

    def get_charts(self, country="ZZ"):
        cache_file = self._cache_key("charts", country)
        # 차트는 1시간 캐시
        if cache_file.exists():
            mtime = cache_file.stat().st_mtime
            if (time.time() - mtime) < 3600:
                return self._load_cache(cache_file)

        data = self.ytmusic.get_charts(country)
        self._save_cache(cache_file, data)
        return data

# 사용 예
cached = CachedYTMusic()
artist = cached.get_artist("UC9vrvNSL3xcWGSkV86REBSg")  # 첫 호출: API
artist = cached.get_artist("UC9vrvNSL3xcWGSkV86REBSg")  # 두 번째: 캐시
```

---

# 8. 버전 히스토리 (Version History)

## 8.1 2025년 주요 변경사항

### v1.11.4 (2025-12-19) - 최신
- 오디오 플레이리스트 `playNavigationEndpoint` 누락 시 KeyError 수정
- get_explore 트렌딩 에피소드 처리 수정
- get_charts 비인증 접근 시 아티스트 랭크 데이터 누락 크래시 수정
- 기여자: sgvictorino

### v1.11.3 (2025-11-30)
- MUSIC_PAGE_TYPE_AUDIOBOOK 지원 추가

### v1.11.2 (2025-11-24)
- 협업 플레이리스트 수정
- get_album 다중 아티스트 반환
- Chrome 인증 문서 개선

### v1.11.1 (2025-08-30)
- 체코어 번역 추가
- get_home 아티스트 파싱 수정
- 추천 채널 파싱 추가

### v1.11.0 (2025-07-31) - 중요
- **Breaking Change**: Python 3.9 지원 중단
- `py.typed` 추가 (strict typing)
- `get_explore()` 함수 추가
- get_charts 구조 변경 대응

### v1.10.x (2025 상반기)
- 오디오 플레이리스트 지원
- OAuthCredentials 사용 편의성 개선
- 세션 비활성화 옵션 제거

## 8.2 Breaking Changes 요약

| 버전 | 변경 내용 | 마이그레이션 |
|------|----------|-------------|
| 1.11.0 | Python 3.9 제거 | Python 3.10+ 업그레이드 |
| 1.10.0 | OAuth 사용법 변경 | OAuthCredentials 사용 |
| 1.8.0 | 일부 반환값 구조 변경 | 문서 확인 필요 |

---

# 9. 부록 (Appendix)

## 9.1 지원 언어 (16개)

| 코드 | 언어 |
|------|------|
| ar | 아랍어 |
| de | 독일어 |
| en | 영어 |
| es | 스페인어 |
| fr | 프랑스어 |
| hi | 힌디어 |
| it | 이탈리아어 |
| ja | 일본어 |
| ko | 한국어 |
| nl | 네덜란드어 |
| pt | 포르투갈어 |
| ru | 러시아어 |
| tr | 터키어 |
| vi | 베트남어 |
| zh_CN | 중국어 (간체) |
| zh_TW | 중국어 (번체) |

## 9.2 주요 국가 코드

| 코드 | 국가 |
|------|------|
| ZZ | 글로벌 |
| KR | 한국 |
| US | 미국 |
| JP | 일본 |
| GB | 영국 |
| DE | 독일 |
| FR | 프랑스 |
| BR | 브라질 |
| IN | 인도 |
| CN | 중국 |

## 9.3 오류 코드

| 상태 | 원인 | 해결 |
|------|------|------|
| 401 | 인증 실패 | 인증 정보 재설정 |
| 403 | 권한 없음 | 다른 계정 또는 인증 방식 시도 |
| 429 | Rate Limit | 대기 후 재시도 |
| 503 | 서버 오류 | 잠시 후 재시도 |

## 9.4 PyInstaller 패키징

```bash
# 로케일 파일 포함
pyinstaller --add-data "path/to/ytmusicapi/locales:ytmusicapi/locales" your_script.py

# 또는 전체 패키지 포함
pyinstaller --collect-all ytmusicapi your_script.py
```

---

# 10. 참고 문헌 (References)

1. **공식 문서**: https://ytmusicapi.readthedocs.io/en/stable/
2. **GitHub 저장소**: https://github.com/sigma67/ytmusicapi
3. **PyPI 패키지**: https://pypi.org/project/ytmusicapi/
4. **릴리즈 노트**: https://github.com/sigma67/ytmusicapi/releases
5. **FAQ**: https://ytmusicapi.readthedocs.io/en/stable/faq.html
6. **Google OAuth 문서**: https://developers.google.com/youtube/registering_an_application

---

**문서 작성**: Claude AI (Opus 4.5)
**최종 수정**: 2025년 12월 31일
**라이선스**: MIT License (원본 라이브러리 기준)

> **면책 조항**: 이 라이브러리는 Google이 지원하거나 보증하지 않습니다. YouTube Music의 비공식 API이며, 서비스 약관 변경에 따라 기능이 제한될 수 있습니다.
