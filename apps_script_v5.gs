// 냉털앱 Google Apps Script v5
// 변경사항: 실시간 개별 전송 제거 → 관리자 fullSync 방식으로 통합
// 기존 액션(save_cook_log, registerUser, logCommunityApproval)은 호환성 유지를 위해 남겨둠

var SPREADSHEET_ID = '13DpBAiqpcdWLgfh-mRE_cBvt-T1jtrhD_hE_KJ9mk4w';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;

    if (action === 'fullSync') {
      return fullSync(data);
    } else if (action === 'save_cook_log') {
      // 기존 호환성 유지 (실제로는 호출되지 않음)
      return ContentService.createTextOutput(JSON.stringify({ok:true, msg:'legacy'}))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === 'registerUser') {
      return ContentService.createTextOutput(JSON.stringify({ok:true, msg:'legacy'}))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === 'logCommunityApproval') {
      return ContentService.createTextOutput(JSON.stringify({ok:true, msg:'legacy'}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ok:false, msg:'unknown action: ' + action}))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ok:false, msg:err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // GET 요청은 모두 무시 (기존 호환성)
  return ContentService.createTextOutput(JSON.stringify({ok:true, msg:'GET ignored'}))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===== 전체 동기화 함수 =====
function fullSync(data) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var syncTime = data.syncTime || new Date().toISOString();
  var results = {};

  // 1. 유저목록 탭 동기화
  try {
    results.users = syncUsers(ss, data.users || []);
  } catch(e) {
    results.users = 'ERROR: ' + e.toString();
  }

  // 2. 커뮤니티 탭 동기화
  try {
    results.community = syncCommunity(ss, data.community || []);
  } catch(e) {
    results.community = 'ERROR: ' + e.toString();
  }

  // 3. 레시피카운트 탭 동기화
  try {
    results.recipes = syncRecipes(ss, data.recipes || []);
  } catch(e) {
    results.recipes = 'ERROR: ' + e.toString();
  }

  // 4. 동기화 로그 탭에 기록
  try {
    logSync(ss, syncTime, data.users ? data.users.length : 0, data.community ? data.community.length : 0, data.recipes ? data.recipes.length : 0);
  } catch(e) {}

  return ContentService.createTextOutput(JSON.stringify({
    ok: true,
    msg: '동기화 완료',
    results: results,
    syncTime: syncTime
  })).setMimeType(ContentService.MimeType.JSON);
}

// ===== 유저목록 탭 동기화 =====
function syncUsers(ss, users) {
  var sheetName = '유저목록';
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  // 헤더 설정
  var headers = ['UID', '닉네임', '가입일시', '게시글수', '동기화시각'];
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#fbc02d');

  if (users.length === 0) return '유저 0명';

  var now = new Date().toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'});
  var rows = users.map(function(u) {
    return [u.uid || '', u.nickname || '', u.timestamp || '', u.posts || 0, now];
  });

  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  
  // 열 너비 자동 조정
  sheet.autoResizeColumns(1, headers.length);

  return '유저 ' + users.length + '명 동기화 완료';
}

// ===== 커뮤니티 탭 동기화 =====
function syncCommunity(ss, community) {
  var sheetName = '커뮤니티';
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  // 헤더 설정
  var headers = ['게시글ID', 'UID', '닉네임', '레시피명', '레시피ID', '내용', '좋아요', '날짜', '상태', '동기화시각'];
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#4caf50').setFontColor('#fff');

  if (community.length === 0) return '커뮤니티 0건';

  var now = new Date().toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'});
  var rows = community.map(function(p) {
    return [
      p.postId || '',
      p.uid || '',
      p.nickname || '',
      p.recipe || '',
      p.recipeId || '',
      p.text || '',
      p.likes || 0,
      p.date || '',
      p.status || 'approved',
      now
    ];
  });

  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  sheet.autoResizeColumns(1, headers.length);

  return '커뮤니티 ' + community.length + '건 동기화 완료';
}

// ===== 레시피카운트 탭 동기화 =====
function syncRecipes(ss, recipes) {
  var sheetName = '레시피카운트';
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  // 헤더 설정 (A~G열)
  var headers = ['레시피ID', '레시피명', '요리횟수', '최근요리일', '총평점합계', '평점횟수', '평균평점', '동기화시각'];
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1565c0').setFontColor('#fff');

  if (recipes.length === 0) return '레시피 0개';

  // 요리횟수 내림차순 정렬
  recipes.sort(function(a, b) { return (b.count || 0) - (a.count || 0); });

  var now = new Date().toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'});
  var rows = recipes.map(function(r) {
    return [
      r.recipeId || '',
      r.recipeName || '',
      r.count || 0,
      r.lastDate || '',
      r.totalRating || 0,
      r.ratingCount || 0,
      r.avgRating !== '' && r.avgRating !== null ? r.avgRating : '',
      now
    ];
  });

  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  sheet.autoResizeColumns(1, headers.length);

  return '레시피 ' + recipes.length + '개 동기화 완료';
}

// ===== 동기화 로그 탭 기록 =====
function logSync(ss, syncTime, userCount, commCount, recipeCount) {
  var sheetName = '동기화로그';
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.getRange(1, 1, 1, 5).setValues([['동기화시각', '유저수', '커뮤니티수', '레시피수', '비고']]);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#607d8b').setFontColor('#fff');
  }

  var now = new Date().toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'});
  sheet.appendRow([now, userCount, commCount, recipeCount, '관리자 수동 동기화']);
}
