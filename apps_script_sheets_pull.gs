// ============================================================
// 냉털앱 구글시트 - Firebase 직접 Pull 방식 v1
// 변경사항: 앱에서 push하는 방식 → 시트가 Firebase REST API로 직접 pull
// 앱에서 동기화 버튼 불필요, 시트에서 수동/자동 실행
// ============================================================

// Firebase Realtime Database REST API URL (공개 읽기 권한 필요)
var FIREBASE_URL = 'https://naengteol-f45a6-default-rtdb.asia-southeast1.firebasedatabase.app';
var SPREADSHEET_ID = '13DpBAiqpcdWLgfh-mRE_cBvt-T1jtrhD_hE_KJ9mk4w';

// ============================================================
// 메인 동기화 함수 (수동 실행 또는 트리거에서 호출)
// ============================================================
function syncAll() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var syncTime = new Date().toISOString();
  var results = {};

  try {
    // 1. Firebase에서 전체 데이터 가져오기
    var usersData = fetchFirebase('/users.json');
    var communityData = fetchFirebase('/community.json');
    var historyData = fetchFirebase('/history.json');

    // 2. 유저목록 탭
    results.users = syncUsers(ss, usersData, communityData);

    // 3. 커뮤니티 탭
    results.community = syncCommunity(ss, communityData);

    // 4. 레시피카운트 탭
    results.recipes = syncRecipes(ss, historyData, communityData);

    // 5. 로그 기록
    logSync(ss, syncTime, results);

    // 완료 로그
    Logger.log('✅ 동기화 완료! 유저: ' + results.users + ' / 커뮤니티: ' + results.community + ' / 레시피: ' + results.recipes);

    // 시트에서 실행 시 알림 (트리거 실행 시에는 무시됨)
    try {
      SpreadsheetApp.getUi().alert('✅ 동기화 완료!\n\n' +
        '유저: ' + results.users + '\n' +
        '커뮤니티: ' + results.community + '\n' +
        '레시피: ' + results.recipes);
    } catch(uiErr) {
      // 트리거/편집기 실행 시 UI 없음 - 무시
    }

  } catch(e) {
    logSync(ss, syncTime, {error: e.toString()});
    Logger.log('❌ 동기화 오류: ' + e.toString());
    try { SpreadsheetApp.getUi().alert('❌ 동기화 오류: ' + e.toString()); } catch(uiErr) {}
  }
}

// ============================================================
// Firebase REST API 호출 함수
// ============================================================
function fetchFirebase(path) {
  var url = FIREBASE_URL + path;
  var response = UrlFetchApp.fetch(url, {
    method: 'GET',
    muteHttpExceptions: true
  });
  var code = response.getResponseCode();
  if (code !== 200) {
    throw new Error('Firebase 오류 ' + code + ': ' + path);
  }
  var raw = JSON.parse(response.getContentText());
  return raw;
}

// ============================================================
// 유저목록 탭 동기화
// ============================================================
function syncUsers(ss, usersRaw, communityRaw) {
  var sheet = ss.getSheetByName('유저목록') || ss.insertSheet('유저목록');
  var headers = ['UID', '닉네임', '가입일시', '게시글수', '닉네임이력', '동기화시각'];
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setFontWeight('bold').setBackground('#fbc02d');

  if (!usersRaw) return '유저 0명';

  // 커뮤니티 게시글수 집계
  var postCount = {};
  if (communityRaw) {
    Object.values(communityRaw).forEach(function(p) {
      if (p.uid) postCount[p.uid] = (postCount[p.uid] || 0) + 1;
    });
  }

  var now = new Date().toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'});
  var rows = Object.keys(usersRaw).map(function(uid) {
    var u = usersRaw[uid];
    var histStr = '';
    if (u.nicknameHistory && u.nicknameHistory.length > 0) {
      histStr = u.nicknameHistory.map(function(h) {
        var d = h.changedAt ? h.changedAt.substring(0, 10) : '';
        return h.nickname + '(' + d + ')';
      }).join(' → ');
    }
    return [uid, u.nickname || '', u.timestamp || '', postCount[uid] || 0, histStr, now];
  });

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    sheet.autoResizeColumns(1, headers.length);
  }
  return '유저 ' + rows.length + '명';
}

// ============================================================
// 커뮤니티 탭 동기화
// ============================================================
function syncCommunity(ss, communityRaw) {
  var sheet = ss.getSheetByName('커뮤니티') || ss.insertSheet('커뮤니티');
  var headers = ['게시글ID', 'UID', '닉네임', '레시피명', '레시피ID', '내용', '평점', '좋아요', '날짜', '상태', '동기화시각'];
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setFontWeight('bold').setBackground('#4caf50').setFontColor('#fff');

  if (!communityRaw) return '커뮤니티 0건';

  var now = new Date().toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'});
  var rows = Object.keys(communityRaw).map(function(postId) {
    var p = communityRaw[postId];
    return [
      postId,
      p.uid || '',
      p.nickname || '',
      p.recipe || '',
      p.recipeId || '',
      p.text || '',
      p.rating || 0,
      p.likes || 0,
      p.date || '',
      p.status || 'approved',
      now
    ];
  });

  // 날짜 내림차순 정렬
  rows.sort(function(a, b) { return b[8] > a[8] ? 1 : -1; });

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    sheet.autoResizeColumns(1, headers.length);
  }
  return '커뮤니티 ' + rows.length + '건';
}

// ============================================================
// 레시피카운트 탭 동기화 (history 기반)
// ============================================================
function syncRecipes(ss, historyRaw, communityRaw) {
  var sheet = ss.getSheetByName('레시피카운트') || ss.insertSheet('레시피카운트');
  var headers = ['레시피ID', '레시피명', '요리횟수', '최근요리일', '내평점합계', '내평점횟수', '내평균평점', '커뮤평점합계', '커뮤평점횟수', '커뮤평균평점', '동기화시각'];
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setFontWeight('bold').setBackground('#1565c0').setFontColor('#fff');

  // history 데이터에서 레시피별 집계
  var recipeMap = {};

  if (historyRaw) {
    // history는 uid별로 구성됨: history/{uid}/{entryId}
    Object.values(historyRaw).forEach(function(userHistory) {
      if (typeof userHistory !== 'object') return;
      Object.values(userHistory).forEach(function(entry) {
        if (!entry || !entry.recipeId) return;
        var rid = entry.recipeId;
        if (!recipeMap[rid]) {
          recipeMap[rid] = {
            recipeId: rid,
            recipeName: entry.recipeName || entry.recipe || '',
            count: 0,
            lastDate: '',
            totalRating: 0,
            ratingCount: 0,
            commTotalRating: 0,
            commRatingCount: 0
          };
        }
        recipeMap[rid].count++;
        if (entry.date && entry.date > recipeMap[rid].lastDate) {
          recipeMap[rid].lastDate = entry.date;
        }
        if (entry.rating && entry.rating > 0) {
          recipeMap[rid].totalRating += Number(entry.rating);
          recipeMap[rid].ratingCount++;
        }
      });
    });
  }

  // 커뮤니티 평점 집계
  if (communityRaw) {
    Object.values(communityRaw).forEach(function(p) {
      if (!p.recipeId || !p.rating || p.rating <= 0) return;
      var rid = p.recipeId;
      if (!recipeMap[rid]) {
        recipeMap[rid] = {
          recipeId: rid,
          recipeName: p.recipe || '',
          count: 0, lastDate: '',
          totalRating: 0, ratingCount: 0,
          commTotalRating: 0, commRatingCount: 0
        };
      }
      recipeMap[rid].commTotalRating += Number(p.rating);
      recipeMap[rid].commRatingCount++;
    });
  }

  var recipes = Object.values(recipeMap);
  recipes.sort(function(a, b) { return b.count - a.count; });

  if (recipes.length === 0) return '레시피 0개';

  var now = new Date().toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'});
  var rows = recipes.map(function(r) {
    var avgRating = r.ratingCount > 0 ? Math.round(r.totalRating / r.ratingCount * 10) / 10 : '';
    var commAvgRating = r.commRatingCount > 0 ? Math.round(r.commTotalRating / r.commRatingCount * 10) / 10 : '';
    return [
      r.recipeId, r.recipeName, r.count, r.lastDate,
      r.totalRating, r.ratingCount, avgRating,
      r.commTotalRating, r.commRatingCount, commAvgRating,
      now
    ];
  });

  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  sheet.autoResizeColumns(1, headers.length);
  return '레시피 ' + rows.length + '개';
}

// ============================================================
// 동기화 로그 탭 기록
// ============================================================
function logSync(ss, syncTime, results) {
  var sheet = ss.getSheetByName('동기화로그') || ss.insertSheet('동기화로그');
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 5).setValues([['동기화시각', '유저', '커뮤니티', '레시피', '비고']])
      .setFontWeight('bold').setBackground('#607d8b').setFontColor('#fff');
  }
  var now = new Date().toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'});
  sheet.appendRow([
    now,
    results.users || '',
    results.community || '',
    results.recipes || '',
    results.error ? '오류: ' + results.error : '시트 직접 pull'
  ]);
}

// ============================================================
// 자동 트리거 설정 함수 (최초 1회만 실행)
// ============================================================
function setupDailyTrigger() {
  // 기존 트리거 삭제
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'syncAll') {
      ScriptApp.deleteTrigger(t);
    }
  });
  // 매일 새벽 3시 트리거 등록
  ScriptApp.newTrigger('syncAll')
    .timeBased()
    .everyDays(1)
    .atHour(3)
    .create();
  SpreadsheetApp.getUi().alert('✅ 매일 새벽 3시 자동 동기화 트리거가 설정되었습니다!');
}

// ============================================================
// 메뉴 추가 (시트 열 때 자동으로 메뉴 생성)
// ============================================================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🧊 냉털 동기화')
    .addItem('🔄 지금 동기화', 'syncAll')
    .addSeparator()
    .addItem('⏰ 매일 자동 동기화 설정', 'setupDailyTrigger')
    .addToUi();
}
