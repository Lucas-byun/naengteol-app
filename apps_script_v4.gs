// ============================================================
// 냉털 앱 - 통합 Google Apps Script v4.0
// 수정사항: 레시피카운트 탭에 평점 집계 컬럼 추가
//   - E열: 총평점합계, F열: 평점횟수, G열: 평균평점
//   - saveCookLog 액션에 rating 파라미터 추가 처리
//   - syncFirebaseToSheet는 기존 횟수만 동기화 (평점은 앱에서 직접 전송)
// ============================================================

var SHEET_ID = '13DpBAiqpcdWLgfh-mRE_cBvt-T1jtrhD_hE_KJ9mk4w';
var FOLDER_NAME = '냉털앱_커뮤니티사진';
var FIREBASE_DB_URL = 'https://naengteol-f45a6-default-rtdb.asia-southeast1.firebasedatabase.app';

function getOrCreateFolder() {
  var folders = DriveApp.getFoldersByName(FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    var folder = DriveApp.createFolder(FOLDER_NAME);
    return folder;
  }
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;

    if (action === 'save_community_post') {
      return saveCommunityPost(data);
    } else if (action === 'save_cook_log') {
      return saveCookLog(data);
    } else if (action === 'update_likes') {
      return updateLikes(data);
    } else if (action === 'sync_firebase') {
      return syncFirebaseToSheet();
    } else if (action === 'registerUser') {
      return registerUser(data);
    } else if (action === 'logCommunityApproval') {
      return logCommunityApproval(data);
    } else if (action === 'delete_community_post') {
      return deleteCommunityPost(data);
    }

    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: 'Unknown action: ' + action}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var action = (e.parameter && e.parameter.action) || '';
    
    // 유저 등록 요청 처리 (GET 방식 - CORS 우회용)
    if (action === 'registerUser') {
      return registerUser(e.parameter);
    }

    // 인기 레시피 TOP 10 반환 (기본 동작)
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var countSheet = ss.getSheetByName('레시피카운트');
    if (!countSheet) {
      return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    }

    var rows = countSheet.getDataRange().getValues();
    var result = [];
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0]) {
        result.push({
          id: rows[i][0],
          name: rows[i][1],
          count: rows[i][2] || 0,
          avgRating: rows[i][6] || 0  // G열: 평균평점
        });
      }
    }
    result.sort(function(a, b) { return b.count - a.count; });

    return ContentService
      .createTextOutput(JSON.stringify(result.slice(0, 10)))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  }
}

// ── 1. 커뮤니티 글 저장 ──
function saveCommunityPost(data) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName('커뮤니티');
  if (!sheet) {
    sheet = ss.insertSheet('커뮤니티');
    sheet.appendRow(['ID', '날짜', '유저', '레시피ID', '레시피명', '이모지', '내용', '사진URL', '상태', '좋아요']);
    sheet.getRange(1, 1, 1, 10).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  var photoUrl = '';
  if (data.photo && data.photo.startsWith('data:image')) {
    try {
      var folder = getOrCreateFolder();
      var base64Data = data.photo.split(',')[1];
      var mimeType = data.photo.split(';')[0].split(':')[1] || 'image/jpeg';
      var ext = mimeType === 'image/png' ? '.png' : '.jpg';
      var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, (data.id || Date.now()) + ext);
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      photoUrl = 'https://drive.google.com/uc?export=view&id=' + file.getId();
    } catch (photoErr) {
      photoUrl = '';
    }
  }

  sheet.appendRow([
    data.id || '',
    data.date || new Date().toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'}),
    data.user || 'anonymous',
    data.recipeId || '',
    data.recipe || '',
    data.emoji || '',
    data.text || '',
    photoUrl,
    'pending',
    0
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({success: true, photoUrl: photoUrl}))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── 2. 요리 횟수 카운팅 + 평점 집계 ──
function saveCookLog(data) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var rating = data.rating ? parseFloat(data.rating) : 0;
  updateRecipeCount(ss, data.recipe_id, data.recipe_name, rating);
  return ContentService.createTextOutput(JSON.stringify({status: 'ok'})).setMimeType(ContentService.MimeType.JSON);
}

function updateRecipeCount(ss, recipeId, recipeName, rating) {
  if (!recipeId) return;
  var countSheet = ss.getSheetByName('레시피카운트');
  if (!countSheet) {
    countSheet = ss.insertSheet('레시피카운트');
    // 헤더: A=레시피ID, B=레시피명, C=요리횟수, D=최근요리일, E=총평점합계, F=평점횟수, G=평균평점
    countSheet.appendRow(['레시피ID', '레시피명', '요리횟수', '최근요리일', '총평점합계', '평점횟수', '평균평점']);
    countSheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#fff3e0');
    countSheet.setFrozenRows(1);
  }
  
  // 기존 헤더가 4열짜리인 경우 E~G 헤더 추가
  var headerRow = countSheet.getRange(1, 1, 1, 7).getValues()[0];
  if (!headerRow[4]) {
    countSheet.getRange(1, 5).setValue('총평점합계');
    countSheet.getRange(1, 6).setValue('평점횟수');
    countSheet.getRange(1, 7).setValue('평균평점');
    countSheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#fff3e0');
  }
  
  var today = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm');
  var rows = countSheet.getDataRange().getValues();
  var found = false;
  
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === recipeId) {
      // 요리 횟수 +1
      var newCount = (rows[i][2] || 0) + 1;
      countSheet.getRange(i + 1, 3).setValue(newCount);
      countSheet.getRange(i + 1, 4).setValue(today);
      
      // 평점 집계 (rating이 1~5 사이인 경우만)
      if (rating && rating >= 1 && rating <= 5) {
        var totalRating = (rows[i][4] || 0) + rating;
        var ratingCount = (rows[i][5] || 0) + 1;
        var avgRating = Math.round((totalRating / ratingCount) * 10) / 10;
        countSheet.getRange(i + 1, 5).setValue(totalRating);
        countSheet.getRange(i + 1, 6).setValue(ratingCount);
        countSheet.getRange(i + 1, 7).setValue(avgRating);
      }
      
      found = true;
      break;
    }
  }
  
  if (!found) {
    var totalRating = (rating && rating >= 1 && rating <= 5) ? rating : 0;
    var ratingCount = (rating && rating >= 1 && rating <= 5) ? 1 : 0;
    var avgRating = ratingCount > 0 ? rating : 0;
    countSheet.appendRow([recipeId, recipeName, 1, today, totalRating, ratingCount, avgRating]);
  }
}

// ── 3. 커뮤니티 좋아요 수 업데이트 ──
function updateLikes(data) {
  if (!data.id) return ContentService.createTextOutput(JSON.stringify({success: false, error: 'no id'})).setMimeType(ContentService.MimeType.JSON);
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName('커뮤니티');
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({success: false, error: 'no sheet'})).setMimeType(ContentService.MimeType.JSON);
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.id) {
      sheet.getRange(i + 1, 10).setValue(data.likes || 0);
      return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({success: false, error: 'post not found'})).setMimeType(ContentService.MimeType.JSON);
}

// ── 4. Firebase → 구글 시트 요리 횟수 동기화 ──
function syncFirebaseToSheet() {
  try {
    var url = FIREBASE_DB_URL + '/recipes.json';
    var response = UrlFetchApp.fetch(url, {muteHttpExceptions: true});
    var statusCode = response.getResponseCode();
    if (statusCode !== 200) return ContentService.createTextOutput(JSON.stringify({success: false, error: 'Firebase HTTP ' + statusCode})).setMimeType(ContentService.MimeType.JSON);
    var firebaseData = JSON.parse(response.getContentText());
    if (!firebaseData) return ContentService.createTextOutput(JSON.stringify({success: true, synced: 0})).setMimeType(ContentService.MimeType.JSON);
    var recipes = [];
    for (var recipeId in firebaseData) {
      var rec = firebaseData[recipeId];
      if (rec && rec.count > 0) {
        recipes.push({id: recipeId, name: rec.name || recipeId, count: rec.count || 0});
      }
    }
    recipes.sort(function(a, b) { return b.count - a.count; });
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var countSheet = ss.getSheetByName('레시피카운트');
    
    if (!countSheet) {
      countSheet = ss.insertSheet('레시피카운트');
      countSheet.appendRow(['레시피ID', '레시피명', '요리횟수', '최근동기화', '총평점합계', '평점횟수', '평균평점']);
      countSheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#fff3e0');
      countSheet.setFrozenRows(1);
      var syncTime = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
      for (var i = 0; i < recipes.length; i++) {
        countSheet.appendRow([recipes[i].id, recipes[i].name, recipes[i].count, syncTime, 0, 0, 0]);
      }
    } else {
      // 기존 시트가 있으면 횟수만 업데이트 (평점 데이터 유지)
      var syncTime = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
      var existingRows = countSheet.getDataRange().getValues();
      
      // 기존 헤더가 4열짜리인 경우 E~G 헤더 추가
      if (!existingRows[0][4]) {
        countSheet.getRange(1, 5).setValue('총평점합계');
        countSheet.getRange(1, 6).setValue('평점횟수');
        countSheet.getRange(1, 7).setValue('평균평점');
        countSheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#fff3e0');
      }
      
      for (var r = 0; r < recipes.length; r++) {
        var found = false;
        for (var i = 1; i < existingRows.length; i++) {
          if (existingRows[i][0] === recipes[r].id) {
            countSheet.getRange(i + 1, 3).setValue(recipes[r].count);
            countSheet.getRange(i + 1, 4).setValue(syncTime);
            found = true;
            break;
          }
        }
        if (!found) {
          countSheet.appendRow([recipes[r].id, recipes[r].name, recipes[r].count, syncTime, 0, 0, 0]);
        }
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({success: true, synced: recipes.length, syncTime: syncTime})).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({success: false, error: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

function scheduledFirebaseSync() {
  syncFirebaseToSheet();
}

// ── 6. 유저 닉네임 등록/업데이트 ──
function registerUser(data) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheetName = '유저목록';
    var sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(['uid', '닉네임', '최초등록일', '마지막수정일']);
      sheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#fff3e0');
      sheet.setColumnWidth(1, 220);
      sheet.setColumnWidth(2, 130);
      sheet.setColumnWidth(3, 170);
      sheet.setColumnWidth(4, 170);
      sheet.setFrozenRows(1);
    }

    var uid = data.uid || '';
    var nickname = data.nickname || '';
    var now = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');

    if (!uid || !nickname) {
      return ContentService.createTextOutput(JSON.stringify({success: false, error: 'uid or nickname missing'})).setMimeType(ContentService.MimeType.JSON);
    }

    var values = sheet.getDataRange().getValues();
    var existingRow = -1;
    for (var i = 1; i < values.length; i++) {
      if (values[i][0] === uid) {
        existingRow = i + 1;
        break;
      }
    }

    if (existingRow > 0) {
      sheet.getRange(existingRow, 2).setValue(nickname);
      sheet.getRange(existingRow, 4).setValue(now);
      return ContentService.createTextOutput(JSON.stringify({success: true, action: 'updated'})).setMimeType(ContentService.MimeType.JSON);
    } else {
      sheet.appendRow([uid, nickname, now, now]);
      return ContentService.createTextOutput(JSON.stringify({success: true, action: 'created'})).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({success: false, error: e.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

// ── 7. 커뮤니티 승인 기록 ──
function logCommunityApproval(data) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheetName = '커뮤니티기록';
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(['postId', 'recipe', 'recipeId', 'text', 'likes', 'date', '기록시각']);
    sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#f0f4f8');
    sheet.setFrozenRows(1);
  }
  var now = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
  sheet.appendRow([
    data.postId || '',
    data.recipe || '',
    data.recipeId || '',
    data.text || '',
    data.likes || 0,
    data.date || '',
    now
  ]);
  return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
}

// ── 8. 커뮤니티 글 삭제 ──
function deleteCommunityPost(data) {
  if (!data.id) return ContentService.createTextOutput(JSON.stringify({success: false, error: 'no id'})).setMimeType(ContentService.MimeType.JSON);
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName('커뮤니티');
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({success: false, error: 'no sheet'})).setMimeType(ContentService.MimeType.JSON);
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.id) {
      sheet.getRange(i + 1, 9).setValue('deleted');
      return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({success: false, error: 'post not found'})).setMimeType(ContentService.MimeType.JSON);
}
