# CLAUDE.md — 냉털 앱 (naengteol-app)

AI 어시스턴트를 위한 코드베이스 가이드입니다.

---

## 1. 프로젝트 개요

**냉털 — 냉장고를 털자!** 는 냉장고에 있는 재료를 선택하면 만들 수 있는 레시피를 추천해 주는 모바일 우선 PWA입니다. 한국 요리 초보자를 타깃으로 하며, 요리 기록, 배지 시스템, 커뮤니티 사진 공유 기능을 갖추고 있습니다.

**핵심 제약:**
- 빌드 도구 없음, 패키지 매니저 없음 (`package.json` 없음)
- 모든 프론트엔드 코드가 **단일 파일** `index.html` 에 포함 (5,400줄+)
- `npm install`, `webpack`, `babel` 등 일체 사용 불가
- 수정은 항상 `index.html` 직접 편집

---

## 2. 기술 스택 및 외부 의존성

| 영역 | 기술 |
|---|---|
| 프론트엔드 | Vanilla JS (ES5 기반) + HTML5 + CSS3 |
| 실시간 DB | Firebase Realtime Database (프로젝트: `naengteol-f45a6`) |
| 레시피 데이터 | Google Sheets CSV (`SHEET_ID` 참조) |
| 백엔드 미들웨어 | Google Apps Script (`apps_script_v5.gs`) |
| 이미지 업로드 | Cloudflare Workers 프록시 → imgbb |
| PWA | `manifest.json` + `sw.js` (현재 캐시 버전: `naengteol-v15`) |
| Firebase SDK | v9.23.0 compat mode (CDN 로드) |

**주요 하드코딩 상수 위치 (`index.html`):**
- Firebase 초기화: 316줄 (`firebaseConfig`)
- Apps Script URL: 329줄 (`COMMUNITY_SCRIPT_URL`)
- Google Sheets ID: 408줄 (`SHEET_ID = '13DpBAiqpcdWLgfh-mRE_cBvt-T1jtrhD_hE_KJ9mk4w'`)

---

## 3. 파일 구조

```
naengteol-app/
├── index.html               # 메인 SPA — 모든 프론트엔드 코드 (5,400줄 / ~420KB)
├── sw.js                    # Service Worker — 캐시 버전 관리 (CACHE_VERSION 상수)
├── manifest.json            # PWA 매니페스트 (테마색: #E8652A)
├── offline.html             # 오프라인 폴백 페이지
├── firebase_rules.json      # Firebase RTDB 보안 규칙 (참조용, 콘솔에서 직접 적용)
├── apps_script_v5.gs        # 현재 사용 중인 Google Apps Script (fullSync)
├── apps_script_v4.gs        # 구버전 — 수정 금지 (deprecated)
├── apps_script_sheets_pull.gs  # Firebase→Sheets 수동 동기화 스크립트
├── icons/                   # 앱 아이콘 및 배지 이미지 — 수정 금지
├── check_new_code.py        # JS 문법 검사 (따옴표/문법 오류 탐지)
├── find_error.py            # 괄호 불균형 탐지
├── fix_best.py              # Best 요리 섹션 패치 스크립트 (참조용)
├── fix_gallery.py           # 갤러리 섹션 패치 스크립트 (참조용)
├── fix_home_best.py         # 홈 Best 섹션 패치 스크립트 (참조용)
├── set_code*.js             # Monaco 에디터 코드 주입용 — 수정 금지
└── index_full.html          # 백업 파일 — 수정 금지
```

---

## 4. index.html 구조 가이드

5,400줄 단일 파일에서 코드를 빠르게 찾기 위한 줄 번호 맵입니다.

```
1-10줄     : HTML <head> (meta, manifest 링크, theme-color)
~287줄     : Firebase SDK CDN <script> 태그
316-326줄  : Firebase 초기화 (firebaseConfig, fbApp, fbDB)
329줄      : COMMUNITY_SCRIPT_URL (Apps Script 엔드포인트)
337-338줄  : fbUid 생성 및 localStorage 저장
345줄      : nt_last_access 접속일 기록
357줄      : reportRecipeToFirebase() 함수
408줄      : SHEET_ID, SHEET_NAME 상수
411-454줄  : parseCSV() 함수
455-578줄  : sheetRowToRecipe() 함수 (CSV 행 → 레시피 객체)
579줄      : INGS 배열 (재료 DB, 인라인 정의)
580줄      : CATS 배열 (재료 카테고리)
587줄      : RECIPES, dataLoaded, dataSource 전역 변수
588줄      : sel, favs, tab, mode, cat, searchQ, detailR, fsR, servMul 전역 변수
589줄      : onboardStep, showOnboard, showSearch, showFavIngs
591줄      : userProfilePhoto
641줄      : userNickname
745줄      : cart 초기화
1299줄     : sel/favs를 localStorage에서 복원
1300줄     : save() 함수
1315줄     : loadData() 함수 (Google Sheets CSV 로드)
1361줄     : SYN_MAP (재료 동의어 맵)
1362줄     : ingMatch() 함수
1370줄     : matchRecipe() 함수
1404줄     : esc() 함수
1405줄     : toggleIngredient() 함수
1734줄     : render() 메인 렌더링 함수
2113줄     : renderCard() 레시피 카드 HTML 반환
2154줄     : renderDetail() 레시피 상세 화면
2295줄     : renderFS() 전체화면 요리 모드
2689줄     : toggleFav() 즐겨찾기 토글
2957줄     : renderCommunity() 커뮤니티 탭
3908-3909줄: cookHistory, userPosts 초기화
3943줄     : communityPosts 초기화
4534줄     : getTodayMission() 함수
4594줄     : loginStreak, lastLoginDate 초기화
4702줄     : earnedBadges 초기화
4744줄     : renderMyPage() 내기록 탭
5371줄     : Service Worker 등록
```

---

## 5. 전역 상태 변수 참조

### 데이터 변수
```js
var RECIPES = [];            // 레시피 배열 (Google Sheets에서 loadData()로 로드)
var INGS = [...];            // 재료 DB 배열 (하드코딩, 579줄)
var CATS = [...];            // 재료 카테고리 배열 (580줄)
var SHEET_ID = '...';        // Google Sheets ID (408줄)
var dataLoaded = false;      // loadData() 완료 여부
```

### UI 상태 변수 (588줄)
```js
var sel = new Set();         // 선택된 재료 이름 Set
var favs = new Set();        // 즐겨찾기 레시피 ID Set
var tab = 'cook';            // 현재 탭: 'cook' | 'fav' | 'my' | 'comm'
var mode = 'ing';            // cook 탭 모드: 'ing'(재료선택) | 'cook'(레시피목록)
var cat = '자주';             // 재료 카테고리 필터
var searchQ = '';            // 검색 쿼리
var detailR = null;          // 현재 열린 레시피 상세 객체 (null이면 상세 닫힘)
var fsR = null;              // 전체화면 요리 모드 레시피 (null이면 닫힘)
var servMul = 1;             // 인분 배수 (1~10)
var fsServMul = 1;           // 전체화면 모드 인분 배수
var mealFilter = '전체';     // 식사 유형 필터
```

### 사용자 데이터 변수
```js
var cookHistory = [];        // 요리 기록 배열 (localStorage nt_history, 3908줄)
var userPosts = [];          // 사용자 게시물 배열 (localStorage nt_posts, 3909줄)
var communityPosts = [];     // 승인된 커뮤니티 게시물 배열 (Firebase, 3943줄)
var userNickname = '';       // 사용자 닉네임 (localStorage nt_nickname, 641줄)
var userProfilePhoto = '';   // 프로필 사진 dataURL (localStorage nt_profile_photo, 591줄)
var earnedBadges = [];       // 획득 배지 배열 (localStorage nt_badges, 4702줄)
var fbUid = '';              // Firebase 고유 사용자 ID (localStorage nt_uid, 337줄)
var loginStreak = 0;         // 연속 로그인 일수 (4594줄)
```

---

## 6. localStorage 키 목록

새 기능 추가 시 기존 키와 충돌하지 않도록 반드시 참조하세요.  
**규칙: 새 키는 반드시 `nt_` 접두사 사용**

| 키 | 타입 | 설명 |
|---|---|---|
| `nt_uid` | string | 기기별 고유 사용자 ID |
| `nt_nickname` | string | 사용자 닉네임 |
| `nt_profile_photo` | dataURL | 프로필 사진 |
| `nt_history` | JSON 배열 | 요리 기록 |
| `nt_sel` | JSON 배열 | 선택된 재료 이름 배열 |
| `nt_fav` | JSON 배열 | 즐겨찾기 레시피 ID 배열 |
| `nt_cart` | JSON 배열 | 장보기 목록 |
| `nt_badges` | JSON 배열 | 획득 배지 배열 |
| `nt_posts` | JSON 배열 | 사용자 게시물 배열 |
| `nt_done` | string `'1'` | 온보딩 완료 여부 |
| `nt_admin` | string `'1'` | 관리자 모드 활성화 여부 |
| `nt_last_access` | string (날짜) | 마지막 접속 날짜 |
| `nt_login_streak` | number (string) | 연속 로그인 일수 |
| `nt_last_login` | string (날짜) | 마지막 로그인 날짜 |
| `nt_mission_date` | string (날짜) | 오늘의 미션 날짜 |
| `nt_mission_id` | string | 오늘의 미션 ID |
| `nt_mission_done` | string `'true'/'false'` | 미션 완료 여부 |
| `nt_mission_hide` | string `'1'` | 미션 카드 숨김 여부 |
| `nt_mission_hidden_date` | string (날짜) | 미션 숨김 날짜 |
| `nt_fav_sort` | string | 즐겨찾기 정렬 방식 (`'default'` \| `'rating'`) |
| `nt_liked_{postId}` | string `'1'` | 특정 게시물 좋아요 여부 |
| `nt_random_hide` | string | 랜덤 레시피 카드 숨김 여부 |

---

## 7. Firebase RTDB 데이터 구조

```
Firebase Realtime Database 최상위 경로:
├── accessLogs/
│   └── {date}/
│       └── {uid}              → true  (일일 접속 기록)
├── community/
│   ├── approved/
│   │   └── {postId}           → 게시물 객체 (승인된 커뮤니티 글)
│   ├── pending/
│   │   └── {fbKey}            → 게시물 객체 (승인 대기 중)
│   └── likes/
│       └── {fbKey}/
│           └── {uid}          → true (좋아요 기록)
├── favs/
│   └── {recipeId}/
│       ├── count              → number (즐겨찾기 수)
│       └── name               → string
├── history/
│   └── {uid}/
│       └── {timestamp}        → 요리 기록 객체
├── nicknames/
│   └── {encodedNick}          → uid (닉네임 중복 방지)
├── recipes/
│   └── {recipeId}/
│       ├── count              → number (요리 완성 횟수)
│       └── name               → string
├── recipeRanking/             → 집계 데이터 (Apps Script fullSync)
└── users/
    └── {uid}                  → 사용자 프로필 객체
```

**보안 규칙:** 전체 read 공개, 각 경로별 write 공개 (`firebase_rules.json` 참조).  
**Firebase Storage 미사용:** Spark 무료 플랜 제한으로 이미지는 imgbb-proxy(Cloudflare Workers)를 사용.

---

## 8. 코딩 컨벤션

### 네이밍
- **상수:** `UPPERCASE` (예: `RECIPES`, `SHEET_ID`, `CATS`, `INGS`)
- **상태 변수:** `camelCase` (예: `cookHistory`, `userNickname`, `earnedBadges`)
- **약어 허용:** `tab`, `mode`, `cat`, `sel`, `favs`, `fsR`, `fsServMul`
- **함수명:** 동사 시작 (예: `render`, `save`, `load`, `toggle`, `open`, `close`, `report`)
- **새 localStorage 키:** 반드시 `nt_` 접두사

### HTML 렌더링 패턴
모든 화면은 문자열 `h` 를 축적한 뒤 `innerHTML` 로 일괄 적용하는 방식을 사용합니다.

```js
// 표준 렌더링 패턴
function render() {
  var h = '';
  h += '<div class="card">';
  h += '<span>' + esc(r.name) + '</span>';  // 사용자 입력은 반드시 esc() 통과
  h += '</div>';
  document.getElementById('app').innerHTML = h;
}

// onclick 이벤트: 인라인 방식 사용 (addEventListener 방식 혼용 금지)
h += '<button onclick="openDetail(\'' + r.id + '\')">' + esc(r.name) + '</button>';
```

### JavaScript 스타일
- **기본:** ES5 호환 (`var` 사용)
- **허용:** 파일 내 이미 사용 중인 `async/await`, `Set`, `[...spread]`, `const`/`let`은 그대로 사용 가능
- **이벤트 핸들러:** 인라인 `onclick=""` 방식 (새 기능에도 동일하게 적용)
- **주석:** 한국어 작성

### `esc()` 함수 (1404줄)
```js
function esc(s) { return s.replace(/'/g, "\\'"); }
```
**주의:** 이 함수는 인라인 `onclick=""` 속성 내에서 단일따옴표(`'`)가 문자열을 깨뜨리지 않도록 이스케이프합니다.  
HTML 태그 자체를 이스케이프하지는 않으므로, **사용자 입력을 `innerHTML`에 직접 삽입할 때는 `<`, `>`, `&` 등도 처리해야 합니다.**

---

## 9. 레시피 데이터 구조

`sheetRowToRecipe()` (455줄)가 Google Sheets CSV 행을 아래 객체로 변환합니다.

```js
{
  id:       'r001',           // 영문+숫자 고유 ID (삭제 후 재사용 금지)
  name:     '김치찌개',
  emoji:    '🍲',
  cat:      '찌개/국',         // 레시피 카테고리
  diff:     2,                // 난이도: 1=쉬움, 2=보통, 3=어려움
  time:     30,               // 조리 시간(분)
  desc:     '...',
  serving:  2,
  kcal:     '350kcal',
  ings: [
    { t: 'req', v: '돼지고기 200g' },  // t: 'req'=필수, 'opt'=선택
    { t: 'opt', v: '대파 1/2대' }
  ],
  steps: [
    { x: '프라이팬을 달군다', p: '팁 내용', optIng: '' }
    // optIng: 이 단계에서 사용하는 선택재료명 (없으면 '')
  ],
  tips: ['팁1', '팁2'],
  sheetTags: ['매운맛', '한식'],
}
```

**Google Sheets 컬럼 순서:** `ID`, `이름`, `이모지`, `카테고리`, `난이도`, `시간(분)`, `설명`, `인분`, `칼로리`, `필수재료`, `조리순서`, `팁1`, `팁2`, `팁3`, `곁들임`, `선택재료`, `태그`

**레시피 데이터 수정 방법:**  
`index.html`이 아닌 **Google Sheets** (`SHEET_ID`)에서 수정 → 앱 새로고침 시 자동 반영  
(참조: `index.html` 441-453줄 주석)

**재료 동의어 (`SYN_MAP`, 1361줄):**  
새 재료를 `INGS`에 추가할 때 동의어가 있다면 `SYN_MAP`에 양방향으로 추가 (예: `'달걀'↔'계란'`).

---

## 10. 주요 함수 참조

### 렌더링
| 함수 | 줄 | 설명 |
|---|---|---|
| `render()` | 1734 | 전체 앱 재렌더링 — 상태 변경 후 항상 이 함수 호출 |
| `renderCard(r)` | 2113 | 레시피 카드 HTML 문자열 반환 |
| `renderDetail()` | 2154 | 레시피 상세 화면 (`detailR` 필요) |
| `renderFS()` | 2295 | 전체화면 요리 모드 (`fsR` 필요) |
| `renderCommunity()` | 2957 | 커뮤니티 탭 |
| `renderMyPage()` | 4744 | 내기록 탭 |

### 유틸리티
| 함수 | 줄 | 설명 |
|---|---|---|
| `esc(str)` | 1404 | 인라인 onclick용 단일따옴표 이스케이프 |
| `save()` | 1300 | `sel`, `favs`를 localStorage에 저장 |
| `saveCart()` | 746 | 장보기 목록 저장 |
| `ingMatch(v, s)` | 1362 | 재료 매칭 (SYN_MAP 동의어 처리 포함) |
| `matchRecipe(r, selArr)` | 1370 | 레시피-재료 매칭 퍼센트 반환 `{pct, have, total}` |
| `getTodayMission()` | 4534 | 오늘의 미션 객체 반환 |
| `toggleIngredient(n)` | 1405 | 재료 선택/해제 후 `save()` + `render()` |

### Firebase 관련
| 함수 | 줄 | 설명 |
|---|---|---|
| `reportRecipeToFirebase(id, name)` | 357 | 요리 완성 시 RTDB 카운트 +1 |
| `toggleFav(id)` | 2689 | 즐겨찾기 토글 + Firebase `favs` 동기화 |

---

## 11. 배포 프로세스

```markdown
배포 전 체크리스트:

1. sw.js의 CACHE_VERSION 버전 증가
   예: 'naengteol-v15' → 'naengteol-v16'
   ※ 이 값을 올리지 않으면 기존 사용자는 구버전 캐시를 계속 사용합니다

2. (선택) Python 검증 스크립트 실행
   python check_new_code.py   # JS 따옴표/문법 검사
   python find_error.py       # 괄호 불균형 탐지

3. git commit & push
   커밋 메시지 형식: "fix: 변경내용 설명 (v{버전})"
   예: "fix: 오늘의 미션 버튼 항상 표시 (v16)"

4. 배포 후 확인
   - 브라우저 강제 새로고침 (Ctrl+Shift+R)
   - 개발자 콘솔에서 '[SW] 등록 성공' 확인
   - 데이터 로드 확인 (콘솔에서 Google Sheets 로드 성공 메시지)
```

---

## 12. 중요 주의사항

### 절대 하지 말 것

```
1. apps_script_v4.gs 수정 — deprecated, 하위 호환 참조용만
2. index_full.html 수정 — 백업 파일
3. set_code*.js 수정 — Monaco 에디터 배포 도구, 참조용
4. 레시피 ID 재사용 — 삭제된 ID는 영구 폐기
5. CACHE_VERSION 올리지 않고 배포 — 캐시 무효화 실패
```

### XSS 주의사항

`esc()` 함수는 인라인 `onclick` 속성의 따옴표만 이스케이프합니다.  
**사용자 입력을 `innerHTML`에 삽입할 때는 HTML 특수문자도 별도 처리해야 합니다.**

```js
// 위험: 사용자 입력 직접 삽입
h += '<div>' + userInput + '</div>';

// 안전: 단일따옴표만 이스케이프 (onclick 속성에서만 유효)
h += '<button onclick="fn(\'' + esc(safeId) + '\')">클릭</button>';

// innerHTML에 사용자 텍스트 표시 시: textContent 또는 별도 HTML 인코딩 사용 권장
el.textContent = userInput;
```

### Firebase API 키 공개에 대해

`index.html`에 Firebase `apiKey`가 하드코딩되어 노출되어 있는 것은 **의도된 설계**입니다.  
클라이언트 사이드 PWA에서 Firebase를 사용하면 API 키는 반드시 클라이언트에 노출됩니다.  
보안은 `firebase_rules.json`의 규칙으로 처리합니다. 키를 숨기거나 환경 변수로 이전하지 마세요.

### render() 호출 규칙

상태 변수를 변경한 뒤 반드시 `render()`를 호출해야 화면에 반영됩니다.

```js
// 예시: 탭 전환
tab = 'comm';
render();

// 예시: 재료 선택 (toggleIngredient가 내부적으로 save() + render() 호출)
toggleIngredient('달걀');
```

### 흰 화면(White Screen) 버그 방지

`render()` 내부 JS 문법 오류가 흰 화면의 주요 원인입니다. `index.html` 수정 후:
- 인라인 `onclick=""` 문자열 내 따옴표 이스케이프 (`\'`) 확인
- `h +=` 줄에서 열린 따옴표와 닫힌 따옴표 방향 일치 확인
- `python find_error.py` 로 괄호 균형 검사 권장

---

## 13. Service Worker 캐시 전략

| 요청 유형 | 전략 | 설명 |
|---|---|---|
| Firebase / Google API 도메인 | 네트워크 직접 | 캐시 안 함 (실시간 데이터) |
| `/icons/` 경로 | Cache-first | 캐시 우선, 없으면 네트워크, 오프라인 시 투명 PNG |
| 앱 셸 (`/`, `/index.html` 등) | Network-first | 네트워크 우선, 실패 시 캐시, 캐시 없으면 `offline.html` |

**SHELL_ASSETS** (`sw.js` 6-15줄):
```
'/', '/index.html', '/offline.html', '/manifest.json',
'/icons/app_icon_192.png', '/icons/app_icon_512.png',
'/icons/icon-48.png', '/icons/splash_fridge.png'
```

**캐시 무효화:** `CACHE_VERSION` 값(`sw.js` 3줄)을 올리면 다음 방문 시 구버전 캐시가 자동 삭제되고 새 파일이 캐시됩니다.

---

## 14. Google Apps Script 연동

**현재 버전:** `apps_script_v5.gs` — `fullSync` 방식 (관리자 버튼으로만 호출)

**`fullSync` 동작:** 사용자 목록, 커뮤니티 게시물, 레시피 통계를 Firebase에서 읽어 Google Sheets의 해당 탭(`유저목록`, `커뮤니티`, `레시피카운트`, `동기화로그`)에 일괄 업데이트합니다.

**중요:**
- `apps_script_v4.gs`의 구버전 액션(`save_cook_log`, `registerUser`, `logCommunityApproval`)은 legacy 응답만 반환하므로 새 기능에 사용하지 마세요.
- Apps Script는 Google Apps Script 웹 편집기에서 직접 배포 필요 (git 파일은 참조용)
- `COMMUNITY_SCRIPT_URL` 변경 시 `index.html` 329줄 수정

---

## 15. 탭 기반 기능 구조

```
tab='cook' (🍽️ 요리)
  └── mode='ing'  → 재료 선택 화면 (INGS 배열 기반, cat 카테고리 필터)
  └── mode='cook' → 레시피 목록 (matchRecipe()로 재료 매칭)
       └── detailR != null → renderDetail() 레시피 상세
            └── fsR != null → renderFS() 전체화면 요리 모드

tab='fav'  (❤️ 즐겨찾기)
  └── favs Set에 저장된 레시피 목록, nt_fav_sort로 정렬

tab='my'   (📊 내기록)
  └── renderMyPage() → 요리 기록, 배지, 미션, 연속 로그인, 프로필

tab='comm' (💬 커뮤니티)
  └── renderCommunity() → Firebase approved 게시물 목록, 좋아요
```
