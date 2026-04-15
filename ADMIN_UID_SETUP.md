# 관리자 UID 권한 설정 가이드 (초보자용)

이 앱의 관리자 권한은 **비밀번호 방식이 아니라 UID 방식**입니다.

즉, Firebase Realtime Database의 아래 경로에 `true`를 넣어야 관리자 권한이 생깁니다.

- 경로: `adminUids/{관리자UID}`
- 값: `true`

---

## 1) 먼저 내 UID 확인하기

앱에서 자동 익명 로그인이 되면 UID가 `fbUid`에 저장됩니다.
그리고 `localStorage.nt_uid`에도 저장됩니다.

관련 코드:
- `ensureFirebaseAuth()`에서 `fbUid=user.uid` 후 `localStorage` 저장【index.html】
- 관리자 체크 시 `adminUids/{fbUid}`를 읽어 권한 확인【app-security.js】

---

## 2) Firebase 콘솔에서 관리자 UID 등록하기

> 가장 쉬운 방법: Firebase 콘솔에서 수동 등록

1. Firebase 콘솔 → **Realtime Database** → **Data**
2. `adminUids` 노드 생성 (없으면 만들기)
3. 그 아래에 내 UID를 Key로 추가
4. 값(Value)을 `true`(boolean)로 저장

예시:

```json
{
  "adminUids": {
    "QmX...abc123": true
  }
}
```

---

## 3) 앱에서 관리자 모드 켜기

1. 앱에서 **커뮤니티 탭**으로 이동
2. 아래쪽 `관리자` 버튼 클릭
3. 확인창 승인
4. 성공하면 관리자 모드 활성화

---

## 4) 왜 직접 앱에서 adminUids를 못 바꾸나요?

보안 규칙에서 `adminUids`는 클라이언트 쓰기를 막아두었습니다.

- `adminUids/$uid`의 `.write`가 `false`

즉, 앱 사용자(클라이언트)가 자기 마음대로 관리자 권한을 만들 수 없게 막아둔 것입니다.

---

## 5) 자주 막히는 원인

1. UID를 문자열로 잘못 넣음 (예: `"true"`로 저장)  
   → 반드시 **boolean true** 로 저장
2. 잘못된 UID 등록  
   → 현재 로그인된 UID와 DB에 넣은 Key가 정확히 같아야 함
3. 앱 캐시/세션 이슈  
   → 앱 새로고침 후 다시 `관리자` 버튼 클릭

