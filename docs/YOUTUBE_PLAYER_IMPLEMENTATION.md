# YouTube IFrame API 구현 기술 문서

> **중요**: 이 문서는 YouTube 플레이어 구현의 핵심 패턴을 설명합니다.
> 이 패턴들을 변경하면 플레이어가 작동하지 않습니다. 반드시 이 문서를 읽고 이해한 후 수정하세요.

## 핵심 원칙

### 1. 싱글톤 패턴 (CRITICAL)

YouTube 플레이어는 **전역 싱글톤**으로 관리해야 합니다. React 컴포넌트 내부 state로 관리하면 안 됩니다.

```typescript
// ✅ 올바른 방법: 컴포넌트 외부에 전역 변수
let globalPlayerInstance: YT.Player | null = null;
let globalPlayerReady = false;
let globalPendingVideoId: string | null = null;

// ❌ 잘못된 방법: 컴포넌트 내부 state
const [player, setPlayer] = useState<YT.Player | null>(null); // 절대 이렇게 하지 마세요
```

**이유**: React 컴포넌트는 리렌더링되고, 페이지 이동 시 언마운트됩니다. 플레이어를 state로 관리하면 매번 새로 생성되어 음악이 끊깁니다.

### 2. 고정 Element ID (CRITICAL)

플레이어 DOM 요소는 **고정된 ID**를 사용해야 합니다.

```typescript
// ✅ 올바른 방법
const PLAYER_ELEMENT_ID = "youtube-player-global";

// ❌ 잘못된 방법
const playerId = useId(); // 매번 다른 ID 생성 - 절대 금지
const playerId = `player-${Math.random()}`; // 절대 금지
```

**이유**: YouTube IFrame API는 특정 ID의 DOM 요소에 플레이어를 생성합니다. ID가 바뀌면 새 플레이어가 생성되고, 이전 플레이어와의 연결이 끊어집니다.

### 3. Pending Video 패턴 (CRITICAL)

플레이어가 준비되기 전에 트랙이 설정될 수 있습니다. 이를 처리하는 패턴:

```typescript
// 전역 변수
let globalPendingVideoId: string | null = null;

// 트랙 변경 시
useEffect(() => {
    if (!currentTrack?.videoId) return;

    if (globalPlayerReady && globalPlayerInstance) {
        // 플레이어 준비됨 → 바로 재생
        globalPlayerInstance.loadVideoById(currentTrack.videoId, 0);
    } else {
        // 플레이어 아직 준비 안됨 → 저장해두기
        globalPendingVideoId = currentTrack.videoId;
    }
}, [currentTrack?.videoId]);

// 플레이어 onReady 콜백에서
onReady: (event) => {
    globalPlayerReady = true;
    globalPlayerInstance = event.target;

    // 저장해둔 비디오가 있으면 재생
    if (globalPendingVideoId) {
        event.target.loadVideoById(globalPendingVideoId, 0);
        globalPendingVideoId = null;
    }
}
```

**이유**: 사용자가 트랙을 클릭했을 때 플레이어가 아직 로딩 중일 수 있습니다. pendingVideoId에 저장해두고, 플레이어가 준비되면 자동으로 재생합니다.

### 4. Cleanup 금지 (CRITICAL)

컴포넌트 언마운트 시 플레이어를 destroy하면 안 됩니다.

```typescript
// ✅ 올바른 방법: cleanup 없음
useEffect(() => {
    // 플레이어 초기화 코드...

    // NO CLEANUP - 플레이어는 persist!
}, []);

// ❌ 잘못된 방법
useEffect(() => {
    // 플레이어 초기화...

    return () => {
        player?.destroy(); // 절대 금지!
        globalPlayerInstance = null; // 절대 금지!
    };
}, []);
```

**이유**: 페이지 이동해도 음악은 계속 재생되어야 합니다. cleanup하면 음악이 끊깁니다.

## 파일 구조

### `components/player/YouTubePlayer.tsx`

YouTube IFrame API를 래핑하는 컴포넌트입니다.

핵심 구조:
```typescript
// 1. 전역 싱글톤 상태 (컴포넌트 외부)
let globalPlayerInstance: YT.Player | null = null;
let globalPlayerReady = false;
let globalPendingVideoId: string | null = null;
let apiScriptLoaded = false;
let apiScriptLoading = false;

const PLAYER_ELEMENT_ID = "youtube-player-global";

// 2. 컴포넌트
export default function YouTubePlayer({ className }) {
    // useEffect에서 플레이어 초기화
    // - API 스크립트 로드
    // - YT.Player 생성
    // - 이벤트 핸들러 연결
}
```

### `components/player/PlayerSidebar.tsx`

YouTubePlayer를 **보이는 위치**에 렌더링합니다.

```tsx
{/* Video Display - 실제 YouTube Player */}
<div className="w-full aspect-video bg-black rounded overflow-hidden">
    <YouTubePlayer className="w-full h-full" />
</div>
```

**중요**: Google ToS 준수를 위해 비디오가 반드시 보여야 합니다. 숨기면 안 됩니다.

### `contexts/PlayerContext.tsx`

전역 플레이어 상태 관리:
- currentPlaylist: 현재 플레이리스트
- currentTrackIndex: 현재 재생 중인 트랙 인덱스
- isPlaying, volume, currentTime 등

### `components/profile/MusicTab.tsx`

음악 탭에서 배너 클릭 처리:

**세 가지 케이스 자동 감지 (CRITICAL):**

데이터가 랜덤으로 날아오므로 자동 감지해서 처리해야 합니다.

```typescript
// 케이스 1: videoId 있음 (노래/비디오)
// → 섹션 전체가 플레이리스트
if (item.videoId) {
    handleTrackClick(sectionContents, index);
}

// 케이스 2: browseId 있음 (앨범/싱글)
// → album API 호출 → 앨범 트랙들이 플레이리스트
else if (item.browseId) {
    handleAlbumClick(item.browseId);
}

// 케이스 3: playlistId 있음 (플레이리스트, 차트, 커뮤니티 재생목록)
// → watch API 호출 → 플레이리스트 트랙들이 플레이리스트
else if (item.playlistId) {
    handlePlaylistClick(item.playlistId);
}
```

**데이터 유형별 ID 패턴:**
| 유형 | ID 필드 | 예시 | API |
|------|---------|------|-----|
| 노래/비디오 | `videoId` | `9L9ynqxHZ2k` | 없음 (섹션 전체) |
| 앨범/싱글 | `browseId` | `MPREb_JCxqCCAndci` | `/album/{browseId}` |
| 플레이리스트 | `playlistId` | `RDCLAK5uy_...`, `PL...` | `/watch?playlistId=` |

**섹션별 예시:**
- 빠른 선곡, 뮤직비디오, Shorts → `videoId` (케이스 1)
- 맞춤 추천 앨범, 최신 음악 → `browseId` (케이스 2)
- Vibe higher, 차트, 커뮤니티 재생목록 → `playlistId` (케이스 3)

## 데이터 흐름

```
1. 사용자가 배너 클릭
   ↓
2. MusicTab.handleItemClick() - 자동 감지
   ├── videoId 있음 → handleTrackClick() → setPlaylist(섹션 전체)
   ├── browseId 있음 → handleAlbumClick() → api.album() → setPlaylist(앨범 트랙들)
   └── playlistId 있음 → handlePlaylistClick() → api.watch() → setPlaylist(플레이리스트 트랙들)
   ↓
3. PlayerContext.setPlaylist()
   - currentPlaylist 업데이트
   - currentTrackIndex 설정
   ↓
4. YouTubePlayer useEffect
   - currentTrack.videoId 감지
   - globalPlayerInstance.loadVideoById() 호출
   ↓
5. YouTube 플레이어 재생 시작
```

## 절대 하지 말아야 할 것들

1. **플레이어를 React state로 관리하지 마세요**
2. **플레이어 element ID를 동적으로 생성하지 마세요**
3. **컴포넌트 언마운트 시 플레이어를 destroy하지 마세요**
4. **YouTubePlayer를 조건부 렌더링하지 마세요** (항상 DOM에 있어야 함)
5. **비디오를 숨기지 마세요** (Google ToS 위반)
6. **데이터를 slice하거나 필터링으로 줄이지 마세요** (모든 섹션, 모든 아이템 표시)

## 참고: search 폴더

`/search` 폴더에 작동하는 예제가 있습니다:
- `search/player.js` - pendingTrack 패턴 참고
- `search/api.js` - startNewPlayback 함수 참고
- `search/layout.html` - 플레이어 element 구조 참고

## 트러블슈팅

### 음악이 재생되지 않음
1. 콘솔에서 `[YouTubePlayer]` 로그 확인
2. `Player ready` 로그가 여러 번 나오면 → 싱글톤 패턴이 깨진 것
3. `pendingVideoId` 확인 → 플레이어 준비 전에 트랙이 설정되었는지

### 비디오가 보이지 않음
1. PlayerSidebar에서 YouTubePlayer가 보이는 위치에 렌더링되는지 확인
2. `display: none`이나 `visibility: hidden`이 적용되었는지 확인

### 섹션 수가 줄어듦
1. MusicTab에서 데이터를 filter하거나 slice하는 코드가 있는지 확인
2. **모든 섹션, 모든 아이템을 표시해야 함**

---

**작성일**: 2026-01-02
**작성자**: Claude Opus 4.5
**버전**: 1.1 (playlistId 케이스 추가)
