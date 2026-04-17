// 데이터 로딩·파싱·매칭 유틸 모듈
// 전제: RECIPES, dataLoaded, dataSource, loadDataStartedAt, communityPosts,
//       RECIPE_BEST_PHOTOS, CAT_IMAGES, updateBestPhotos(), initTags(), render() 는 index.html에서 선언됨

var DESC_FIX={};
// 재료목록(추가 INGS) 로드 상태 - 관리자 확인용
var EXTRA_INGS_STATUS={state:'idle',added:0,rows:0,message:'아직 실행 전',updatedAt:0};
var INGS_CACHE_KEY='nt_ings_cache_v1';
var INGS_CACHE_TS_KEY='nt_ings_cache_ts_v1';
var INGS_CACHE_MAX_AGE_MS=24*60*60*1000; // 24시간

// === GOOGLE SHEETS CONFIG ===
var SHEET_ID='13DpBAiqpcdWLgfh-mRE_cBvt-T1jtrhD_hE_KJ9mk4w';
var SHEET_NAME='레시피'; // 구글 시트 탭 이름

// CSV를 파싱하여 객체 배열로 변환
function parseCSV(text) {
  var lines = [], inQ = false, cur = '', row = [], result = [];
  for (var i = 0; i < text.length; i++) {
    var ch = text[i];
    if (ch === '"') { inQ = !inQ; }
    else if (ch === ',' && !inQ) { row.push(cur); cur = ''; }
    else if ((ch === '\n' || ch === '\r') && !inQ) {
      if (ch === '\r' && text[i+1] === '\n') i++;
      row.push(cur); cur = '';
      if (row.some(function(c){return c.trim();})) lines.push(row);
      row = [];
    } else { cur += ch; }
  }
  if (cur || row.length) { row.push(cur); lines.push(row); }
  if (lines.length < 2) return [];
  var headers = lines[0].map(function(h){ return h.trim(); });
  for (var r = 1; r < lines.length; r++) {
    var obj = {};
    headers.forEach(function(h, i){
      var v = (lines[r][i] || '').trim();
      // 구글 시트 CSV에서 \n이 문자열로 들어오는 경우 실제 줄바꿈으로 변환
      v = v.replace(/\\n/g, '\n');
      obj[h] = v;
    });
    result.push(obj);
  }
  return result;
}

// ============================================================
// 📋 레시피 추가/삭제 방법 (구글 시트에서 관리)
// ============================================================
// ✅ 레시피 추가: 구글 시트 Sheet1에 새 행 추가
//    필수 컬럼: ID, 이름, 이모지, 카테고리, 난이도, 시간(분), 설명, 인분, 칼로리, 필수재료, 조리순서
//    선택 컬럼: 팁1, 팁2, 팁3, 곁들임, 선택재료
//
// ✅ 레시피 삭제: 구글 시트에서 해당 행 삭제 (또는 ID 비워두기)
//
// ✅ 레시피 수정: 구글 시트에서 해당 셀 직접 수정 → 앱 새로고침 시 자동 반영
//
// ⚠️ ID 규칙: 영문+숫자 조합 (예: r001, g001, k001)
//    중복 ID 금지! 삭제 시 해당 ID 재사용 금지
// ============================================================
function sheetRowToRecipe(r) {
  var diffMap = {'쉬움':1,'보통':2,'어려움':3};
  // 필수재료: 줄바꿈 또는 • 기호로 분리 (구글 시트 CSV 내보내기 시 줄바꿈이 제거될 수 있음)
  function splitIngLines(str) {
    if (!str) return [];
    var lines;
    if (str.indexOf('\n') >= 0) {
      // 줄바꿈이 있는 경우: \n으로 분리
      lines = str.split('\n');
    } else {
      // 줄바꿈 없이 • 기호만 있는 경우 (구글 시트 CSV 내보내기): • 로 직접 분리
      lines = str.split('•');
    }
    return lines.map(function(s){ return s.replace(/^[•·\s]+/, '').trim(); }).filter(Boolean);
  }
  var reqLines = splitIngLines(r['필수재료']);
  var optLines = splitIngLines(r['선택재료']);
  var ings = [];
  reqLines.forEach(function(v){ if(v) ings.push({t:'req', v:v}); });
  optLines.forEach(function(v){ if(v) ings.push({t:'opt', v:v}); });

  // 조리순서: 줄바꿈 기준으로 분리 + [재료명] 태그 인식
  // 시트 형식: 번호 없이 내용만, 선택재료 단계는 [재료명] 태그로 시작
  var rawSteps = (r['조리순서']||'');
  // parseCSV에서 이미 \\n → \n 변환됨. 실제 줄바꿈으로 분리
  // 구형 호환: 줄바꿈 없이 번호(1. 2. 3.)로만 구분된 경우도 처리
  var stepLines;
  if (rawSteps.indexOf('\n') >= 0) {
    stepLines = rawSteps.split('\n').map(function(s){return s.trim();}).filter(Boolean);
  } else if (/\d+\.\s/.test(rawSteps)) {
    // 번호 기준 분리 (구형 호환)
    stepLines = rawSteps.split(/(?=\d+\.\s)/).map(function(s){return s.trim();}).filter(Boolean);
  } else {
    stepLines = rawSteps ? [rawSteps.trim()] : [];
  }
  var steps = stepLines.map(function(s) {
    // 앞의 번호 제거 (1. 2. 3. 형태)
    s = s.replace(/^\d+[\-\d]*\.\s*/, '');
    // (팁: ...) 파싱
    var tipMatch = s.match(/\(팁:\s*([^)]+)\)$/);
    var tip = '';
    if (tipMatch) { tip = tipMatch[1].trim(); s = s.replace(tipMatch[0], '').trim(); }
    
    // [재료명] 태그 파싱 (새 형식: [참기름] 또는 구형: [참기름 있을 때])
    // 1) 줄 맨 앞에 있는 태그 (정상 형식)
    var optTagMatch = s.match(/^\[([^\]]+)\]\s*/);
    var optIng = '';
    if (optTagMatch) {
      optIng = optTagMatch[1]
        .replace(/\s*(있을\s*때|없을\s*때|추가\s*시|있으면)\s*$/, '')
        .trim();
      s = s.replace(optTagMatch[0], '').trim();
      s = s.replace(/^\d+[\-\d]*\.\s*/, '');
    } else {
      // 2) 문장 중간에 있는 태그 (GPT가 잘못 생성한 경우: "선택한 [참기름]을 ...")
      var midTagMatch = s.match(/\[([^\]]+)\]/);
      if (midTagMatch) {
        optIng = midTagMatch[1]
          .replace(/\s*(있을\s*때|없을\s*때|추가\s*시|있으면)\s*$/, '')
          .trim();
        // 문장에서 태그 제거 ("선택한 [참기름]을" → "참기름을")
        s = s.replace(/선택한\s*\[[^\]]+\]/g, optIng)
             .replace(/\[[^\]]+\]/g, optIng)
             .trim();
      }
    }
    return {x: s, p: tip, optIng: optIng};
  });

  // 팁 배열 (팁1, 팁2, 팁3)
  var tips = [r['팁1'], r['팁2'], r['팁3']].filter(Boolean);

  return {
    id:     r['ID'] || '',
    name:   r['이름'] || '',
    emoji:  r['이모지'] || '🍽️',
    cat:    r['카테고리'] || '',
    diff:   diffMap[r['난이도']] || 1,
    time:   parseInt(r['시간(분)']) || 10,
    desc:   DESC_FIX[r['ID']] || r['설명'] || '',
    serving: parseInt(r['인분']) || 1,
    kcal:   parseInt(r['칼로리']) || 0,
    keep:   '',
    tips:   tips,
    pair:   r['곁들임'] || '',
    ings:   ings,
    steps:  steps,
    sheetTags: (r['태그']||'').split(',').map(function(t){return t.trim();}).filter(Boolean),
  };
}

// === LOAD ===
async function loadData(){
  loadDataStartedAt=Date.now();
  var CACHE_KEY='nt_recipe_cache_v1';
  var CACHE_TS_KEY='nt_recipe_cache_ts_v1';
  var CACHE_MAX_AGE_MS=6*60*60*1000; // 6시간

  // 0) 재료 캐시가 있으면 먼저 반영 (시트 우선 구조의 체감속도 개선)
  applyCachedIngs();
  // 0-1) 재료목록 시트는 항상 백그라운드에서 최신화
  //      (레시피 캐시가 신선해 조기 return 되어도 재료는 최신 반영되도록)
  loadExtraIngs({replaceAll:true});

  // 1) 레시피 캐시가 있으면 먼저 즉시 표시 (체감 속도 개선)
  try{
    var cachedRaw=localStorage.getItem(CACHE_KEY);
    var cachedTs=parseInt(localStorage.getItem(CACHE_TS_KEY)||'0',10)||0;
    if(cachedRaw){
      var cachedRecipes=JSON.parse(cachedRaw);
      if(Array.isArray(cachedRecipes)&&cachedRecipes.length>0){
        RECIPES=cachedRecipes;
        dataSource='cache';
        dataLoaded=true;
        updateBestPhotos(); initTags(); render();
        // 캐시가 신선하면 네트워크 재요청 생략
        if(Date.now()-cachedTs<CACHE_MAX_AGE_MS){
          console.log('⚡ 캐시 레시피 사용: '+RECIPES.length+'개');
          return;
        }
      }
    }
  }catch(e){}

  // 구글 시트 CSV 직접 fetch
  var csvUrl = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID
    + '/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent(SHEET_NAME);

  // 5초 타임아웃: 5초 안에 데이터 안 오면 앱 먼저 표시
  var _loadDone = false;
  var timeoutId = setTimeout(function(){
    if(!_loadDone){
      console.warn('⏱️ 로딩 타임아웃 - 앱 먼저 표시');
      _loadDone = true;
      dataLoaded = true;
      render();
    }
  }, 4000);

  fetch(csvUrl)
    .then(function(res){
      if(!res.ok) throw new Error('HTTP ' + res.status);
      return res.text();
    })
    .then(function(text){
      clearTimeout(timeoutId);
      var rows = parseCSV(text);
      if(rows.length === 0) throw new Error('빈 데이터');
      RECIPES = rows
        .filter(function(r){ return r['ID'] && r['이름']; })
        .map(sheetRowToRecipe);
      dataSource = 'sheets';
      _loadDone = true; dataLoaded = true;
      try{
        localStorage.setItem(CACHE_KEY,JSON.stringify(RECIPES));
        localStorage.setItem(CACHE_TS_KEY,String(Date.now()));
      }catch(e){}
      console.log('✅ Google Sheets 연동 성공: ' + RECIPES.length + '개 레시피');
      updateBestPhotos(); initTags(); render();
      // optIng 불일치 검증 — 개발자 콘솔 경고
      runOptIngLinkCheck();
    })
    .catch(function(e){
      clearTimeout(timeoutId);
      console.warn('⚠️ Sheets 연동 실패:', e.message);
      RECIPES = [];
      dataSource = 'error';
      _loadDone = true; dataLoaded = true;
      // 연결 실패 시에도 render() 호출하여 앱 표시 (흰 화면 방지)
      render();
    });
}

// === 재료 로드 (Google Sheets "재료목록" 탭) ===
// Sheets "재료목록" 탭을 INGS 소스로 사용합니다.
// 탭 컬럼: 이름 | 이모지 | 카테고리 | 동의어
// 탭이 없거나 오류 발생 시 캐시/기본 INGS를 유지합니다.
// Google Sheets에서 "재료목록" 탭 추가 방법:
//   1. Sheets에서 "+" 버튼 → 시트 이름을 "재료목록" 으로 설정
//   2. 1행: 이름 | 이모지 | 카테고리 | 동의어 (헤더)
//   3. 2행부터 추가 재료 입력 (예: 새우 | 🦐 | 해산물 | 흰새우)
function loadExtraIngs(opts){
  opts=opts||{};
  var replaceAll=opts.replaceAll!==false;
  EXTRA_INGS_STATUS={state:'loading',added:0,rows:0,message:'재료목록 시트 불러오는 중...',updatedAt:Date.now()};
  function normKey(k){return String(k||'').replace(/\ufeff/g,'').replace(/\s+/g,'').toLowerCase();}
  function getRowVal(row, aliases){
    // 1) 정확히 같은 키 우선
    for(var i=0;i<aliases.length;i++){
      var v=row[aliases[i]];
      if(v!=null&&String(v).trim())return String(v).trim();
    }
    // 2) 공백/BOM/대소문자 차이 무시한 키로 재시도
    var m={};
    Object.keys(row).forEach(function(k){m[normKey(k)]=row[k];});
    for(var j=0;j<aliases.length;j++){
      var v2=m[normKey(aliases[j])];
      if(v2!=null&&String(v2).trim())return String(v2).trim();
    }
    return '';
  }
  fetch('https://docs.google.com/spreadsheets/d/'+SHEET_ID+'/gviz/tq?tqx=out:csv&sheet='+encodeURIComponent('재료목록'))
    .then(function(res){
      if(!res.ok){
        EXTRA_INGS_STATUS={state:'error',added:0,rows:0,message:'시트 응답 실패('+res.status+')',updatedAt:Date.now()};
        console.info('[재료목록] 시트 응답 실패('+res.status+') — 기본 INGS만 사용');
        return;
      }
      return res.text();
    })
    .then(function(csv){
      if(!csv)return;
      var rows=parseCSV(csv);
      var iconByName={};
      (INGS||[]).forEach(function(i){if(i&&i.n&&i.ic)iconByName[i.n]=i.ic;});
      var nextIngs=[];
      var seen={};
      var added=0;
      rows.forEach(function(row){
        var n=getRowVal(row,['이름','재료명','name']);
        var e=getRowVal(row,['이모지','emoji']);
        var c=getRowVal(row,['카테고리','분류','category']);
        var synRaw=getRowVal(row,['동의어','별칭','alias']);
        if(!n)return;
        if(seen[n])return;
        seen[n]=true;
        nextIngs.push({n:n,e:e||'🥘',c:c||'기타',ic:iconByName[n]||''});
        // 동의어 등록 (양방향, | 구분 지원)
        synRaw.split('|').map(function(s){return s.trim();}).filter(Boolean).forEach(function(syn){
          SYN_MAP[syn]=n;
          if(!SYN_MAP[n])SYN_MAP[n]=syn;
        });
        added++;
      });

      if(replaceAll&&nextIngs.length>0){
        INGS=nextIngs;
        rebuildIngredientCategories();
      }else if(!replaceAll&&nextIngs.length>0){
        nextIngs.forEach(function(ni){
          if(!INGS.find(function(i){return i.n===ni.n;}))INGS.push(ni);
        });
        rebuildIngredientCategories();
      }

      if(nextIngs.length>0){
        saveIngsCache(nextIngs);
        var msg=replaceAll?('재료목록 '+nextIngs.length+'종 전체 반영 완료'):('추가 재료 '+added+'종 로드됨');
        EXTRA_INGS_STATUS={state:'loaded',added:added,rows:rows.length,message:msg,updatedAt:Date.now()};
        console.log('[재료목록] '+msg);
        render(); // INGS 변경 반영
      }else{
        EXTRA_INGS_STATUS={state:'noop',added:0,rows:rows.length,message:'시트 재료가 비어 있어 기존 목록 유지',updatedAt:Date.now()};
        console.info('[재료목록] 시트 재료 없음 — 기존 INGS 유지');
      }
    })
    .catch(function(e){
      EXTRA_INGS_STATUS={state:'error',added:0,rows:0,message:'로드 실패'+(e&&e.message?('('+e.message+')'):''),updatedAt:Date.now()};
      console.info('[재료목록] 로드 실패 — 기본 INGS만 사용',e&&e.message?('('+e.message+')'):'');
    });
}

function getExtraIngsStatus(){return EXTRA_INGS_STATUS;}

function rebuildIngredientCategories(){
  var seen={'자주':true,'전체':true};
  var next=['자주'];
  (INGS||[]).forEach(function(i){
    var c=(i&&i.c)?String(i.c).trim():'기타';
    if(!c||seen[c])return;
    seen[c]=true;
    next.push(c);
  });
  next.push('전체');
  CATS=next;
}

function saveIngsCache(ings){
  try{
    localStorage.setItem(INGS_CACHE_KEY,JSON.stringify(ings||[]));
    localStorage.setItem(INGS_CACHE_TS_KEY,String(Date.now()));
  }catch(e){}
}

function applyCachedIngs(){
  try{
    var raw=localStorage.getItem(INGS_CACHE_KEY);
    var ts=parseInt(localStorage.getItem(INGS_CACHE_TS_KEY)||'0',10)||0;
    if(!raw)return false;
    if(Date.now()-ts>INGS_CACHE_MAX_AGE_MS)return false;
    var cached=JSON.parse(raw);
    if(!Array.isArray(cached)||cached.length===0)return false;
    INGS=cached.filter(function(i){return i&&i.n;}).map(function(i){
      return {n:i.n,e:i.e||'🥘',c:i.c||'기타',ic:i.ic||''};
    });
    rebuildIngredientCategories();
    EXTRA_INGS_STATUS={state:'cache',added:INGS.length,rows:INGS.length,message:'캐시 재료목록 사용',updatedAt:Date.now()};
    return true;
  }catch(e){
    return false;
  }
}

// === MATCH ===
// Synonym map for ingredient matching
var SYN_MAP={'계란':'달걀','달걀':'계란','파':'대파','대파':'파','고기':'돼지고기','돼지':'돼지고기','소고기':'쇠고기','쇠고기':'소고기','닭':'닭고기','닭고기':'닭','새우':'해산물','국간장':'간장','진간장':'간장','양조간장':'간장','맛간장':'간장','올리브유':'식용유','포도씨유':'식용유','카놀라유':'식용유','들기름':'참기름','백설탕':'설탕','황설탕':'설탕','흑설탕':'설탕','쪽파':'대파','청양고추':'고추','홍고추':'고추','풋고추':'고추','청고추':'고추','새송이버섯':'버섯','팽이버섯':'버섯','표고버섯':'버섯','느타리버섯':'버섯','양송이버섯':'버섯','슬라이스치즈':'치즈','모짜렐라':'치즈','체다치즈':'치즈','크림치즈':'치즈'};
function ingMatch(v,s){
  var nm=v.split(/\s/)[0].replace(/[()]/g,'');
  // 1) 직접 매칭
  if(s===nm||v.startsWith(s+' ')||v.startsWith(s+'('))return true;
  // 2) 순방향 동의어: 사용자 선택 재료의 표준명 → 레시피 재료 (예: 계란→달걀)
  var syn=SYN_MAP[s];
  if(syn&&(syn===nm||v.startsWith(syn+' ')||v.startsWith(syn+'(')))return true;
  // 3) 역방향 동의어: 레시피 재료명의 표준명이 선택 재료와 일치 (예: 양조간장→간장)
  var revSyn=SYN_MAP[nm];
  if(revSyn&&revSyn===s)return true;
  return false;
}
function matchRecipe(r,selArr){
  var req=r.ings.filter(function(i){return i.t==='req'});
  var hv=req.filter(function(i){return selArr.some(function(s){return ingMatch(i.v,s)})});
  var opt=r.ings.filter(function(i){return i.t==='opt'});
  var hvOpt=opt.filter(function(i){return selArr.some(function(s){return ingMatch(i.v,s)})});
  var pct=req.length?Math.round(hv.length/req.length*100):100;
  return{pct:Math.min(pct,100),have:hv.length,total:req.length,optHave:hvOpt.length,optTotal:opt.length};
}
function getMatched(){
  // sel을 배열로 미리 변환하여 matchRecipe 내 [...sel] 반복 스프레드 제거
  var selArr=[...sel];
  var all=RECIPES.map(function(r){return Object.assign({},r,{match:matchRecipe(r,selArr)})}).filter(function(r){return r.match.pct>=20});
  all.sort(function(a,b){if(a.match.pct===100&&b.match.pct!==100)return -1;if(b.match.pct===100&&a.match.pct!==100)return 1;return b.match.pct-a.match.pct;});
  return all;
}
function countPerfect(m){return m.filter(function(r){return r.match.pct===100}).length;}
function getTopUnlock(){
  var selArr=[...sel];
  var allR=RECIPES.map(function(r){return Object.assign({},r,{match:matchRecipe(r,selArr)})});
  var missingMap=new Map();
  allR.filter(function(r){return r.match.pct>=20&&r.match.pct<100}).forEach(function(r){
    r.ings.filter(function(i){return i.t==='req'}).forEach(function(i){
      if(!selArr.some(function(s){return ingMatch(i.v,s)})){
        var nm=i.v.split(/\s/)[0].replace(/[()]/g,'');
        if(!missingMap.has(nm))missingMap.set(nm,{name:nm,unlocks:0});
      }
    });
  });
  missingMap.forEach(function(item){
    var extSel=new Set([...sel,item.name]);
    item.unlocks=allR.filter(function(r){
      if(r.match.pct===100)return false;
      var req=r.ings.filter(function(i){return i.t==='req'});
      return req.every(function(i){return[...extSel].some(function(s){return ingMatch(i.v,s)})});
    }).length;
  });
  var sorted=[...missingMap.values()].filter(function(x){return x.unlocks>0}).sort(function(a,b){return b.unlocks-a.unlocks});
  return sorted.length>0?sorted[0]:null;
}

// 레시피 필터 공통 함수 — mealFilter, diffFilter, timeFilter, activeTag 일괄 적용
// CAT_LABEL_MAP, RECIPE_TAGS 는 index.html 전역에서 선언됨
function applyRecipeFilters(list){
  if(mealFilter!=='전체')list=list.filter(function(r){return CAT_LABEL_MAP[r.cat]===mealFilter;});
  if(diffFilter!=='전체')list=list.filter(function(r){return r.diff===diffFilter;});
  if(timeFilter>0)list=list.filter(function(r){return r.time<=timeFilter;});
  if(activeTag)list=list.filter(function(r){return RECIPE_TAGS[r.id]&&RECIPE_TAGS[r.id].indexOf(activeTag)!==-1;});
  return list;
}

// === 재료 커버리지 진단 (관리자 전용) ===
// 각 레시피 필수재료가 INGS 배열에 매칭되는지 점검
// 브라우저 콘솔 또는 관리자 모달에서 결과 확인
function runIngCoverageCheck(){
  if(!RECIPES||!RECIPES.length){console.warn('[커버리지] RECIPES 없음');return null;}
  var ingNames=INGS.map(function(i){return i.n;});
  var unmatched={};
  var total=0,matched=0;
  RECIPES.forEach(function(r){
    r.ings.filter(function(i){return i.t==='req';}).forEach(function(i){
      total++;
      var nm=i.v.split(/\s/)[0].replace(/[()]/g,'');
      // INGS 직접 매칭 또는 SYN_MAP 역방향 확인
      var found=ingNames.some(function(n){return n===nm||SYN_MAP[n]===nm||SYN_MAP[nm]===n;});
      if(found){matched++;}
      else{
        if(!unmatched[nm])unmatched[nm]={count:0,recipes:[]};
        unmatched[nm].count++;
        unmatched[nm].recipes.push(r.name);
      }
    });
  });
  var pct=total?Math.round(matched/total*100):0;
  console.log('[재료 커버리지] '+matched+'/'+total+' ('+pct+'%) 매칭됨');
  var unmatchedList=Object.keys(unmatched).sort(function(a,b){return unmatched[b].count-unmatched[a].count;});
  if(unmatchedList.length===0){
    console.log('[재료 커버리지] 모든 필수재료가 INGS에 매칭됩니다 ✅');
  }else{
    console.warn('[재료 커버리지] INGS 미매칭 재료 ('+unmatchedList.length+'종):');
    unmatchedList.forEach(function(nm){
      console.warn('  - '+nm+' ('+unmatched[nm].count+'개 레시피: '+unmatched[nm].recipes.slice(0,3).join(', ')+(unmatched[nm].recipes.length>3?'...':'')+')');
    });
  }
  return {pct:pct,matched:matched,total:total,unmatched:unmatched};
}

// === 선택재료(optIng) 연결 점검 (관리자/개발자용) ===
// step.optIng 값이 실제 선택재료(ings.type==='opt')와 연결되는지 확인
function runOptIngLinkCheck(){
  if(!RECIPES||!RECIPES.length){console.warn('[optIng 점검] RECIPES 없음');return null;}
  var total=0,mismatch=0;
  RECIPES.forEach(function(r){
    r.steps.forEach(function(s){
      if(!s.optIng)return;
      total++;
      var found=r.ings.some(function(i){
        if(i.t!=='opt')return false;
        var nm=i.v.split(/\s/)[0].replace(/[()]/g,'');
        return nm===s.optIng||i.v.startsWith(s.optIng+' ')||i.v.startsWith(s.optIng+'(');
      });
      if(!found){
        mismatch++;
        console.warn('[optIng 불일치] 레시피:',r.name,'/ optIng:',s.optIng,'/ 선택재료:',r.ings.filter(function(i){return i.t==='opt';}).map(function(i){return i.v;}));
      }
    });
  });
  if(mismatch===0)console.log('[optIng 점검] '+total+'개 항목 모두 정상 ✅');
  else console.warn('[optIng 점검] '+mismatch+'/'+total+'개 항목 불일치');
  return {total:total,mismatch:mismatch};
}
// 진단 API 버전 공개 (index.html과 버전 혼재 시 안전 연결용)
window.NT_APP_API=window.NT_APP_API||{};
window.NT_APP_API.diagApiVersion=2;
window.NT_APP_API.runOptIngLinkCheck=runOptIngLinkCheck;
window.NT_APP_API.getExtraIngsStatus=getExtraIngsStatus;
window.NT_APP_API.reloadExtraIngs=loadExtraIngs;

// === HELPERS ===
// 로컬 날짜 문자열 반환 (toISOString은 UTC 기준이라 한국 자정 전후 오류 발생)
function getLocalDateStr(d){var dt=d||new Date();return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0');}
function toggleIngredient(n){
  sel.has(n)?sel.delete(n):sel.add(n);
  save();
  // Save scroll positions before any potential re-render
  var obContent=document.querySelector('.ob-content');
  var obScroll=obContent?obContent.scrollTop:0;
  var winScroll=window.scrollY||window.pageYOffset||0;
  // Update only the clicked button without full re-render
  var needFullRender=false;
  document.querySelectorAll('.ing-btn').forEach(function(btn){
    // data-name 속성으로 매칭 (textContent가 ✓ 포함 시 깨짐 방지)
    var bName=btn.getAttribute('data-name');
    if(bName===n){
      var isOn=sel.has(n);
      btn.classList.toggle('on',isOn);
      // 체크마크 추가/제거
      var check=btn.querySelector('.ing-check');
      if(isOn&&!check){
        btn.insertAdjacentHTML('afterbegin','<span class="ing-check" style="position:absolute;top:2px;right:4px;font-size:11px;color:#d84315;font-weight:700">✓</span>');
      }else if(!isOn&&check){
        check.remove();
      }
    }
  });
  // Update selected count in onboarding
  var selCount=document.querySelector('.ob-content b');
  if(selCount&&selCount.textContent.includes('선택한 재료')){
    selCount.textContent='선택한 재료 ('+sel.size+'개)';
  }
  // Update ingredient tags in onboarding (need re-render for tag list)
  if(showOnboard){needFullRender=true;}
  // Update header count
  var countEl=document.querySelector('.my-ing-count');
  if(!showOnboard)needFullRender=true; // 항상 full render로 냉장고 태그+카운트 동기화
  if(countEl)countEl.innerHTML='🧊 냉장고 '+sel.size;
  if(needFullRender){
    render();
    // Restore scroll after render
    var newOb=document.querySelector('.ob-content');
    if(newOb)setTimeout(function(){newOb.scrollTop=obScroll;},0);
    else window.scrollTo(0,winScroll);
  }
}
function ingBtn(n,on){var ig=INGS.find(function(i){return i.n===n});var icon=ig&&ig.ic?'<img src="'+ig.ic+'" width="46" height="46" onerror="this.style.display=\'none\';this.nextSibling.style.display=\'block\'" style="display:block;margin:0 auto;object-fit:contain;flex-shrink:0"><span style="display:none;font-size:24px;line-height:1">'+(ig?ig.e:'')+'</span>':'<span class="em">'+(ig?ig.e:'')+'</span>';return '<button class="ing-btn '+(on?'on':'')+'" data-name="'+esc(n)+'" onclick="toggleIngredient(\''+esc(n)+'\')">'+(on?'<span class="ing-check" style="position:absolute;top:3px;right:5px;font-size:10px;color:#fff;font-weight:700;width:16px;height:16px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;line-height:1">✓</span>':'')+icon+n+'</button>';}
function ingTag(s){var ig=INGS.find(function(i){return i.n===s});var icon=ig&&ig.ic?'<img src="'+ig.ic+'" width="16" height="16" style="vertical-align:middle" onerror="this.outerHTML=\''+ig.e+'\'">':ig?ig.e:'';return '<span class="my-ing-tag">'+icon+' '+s+' <span class="x" onclick="sel.delete(\''+esc(s)+'\');save();render()">✕</span></span>';}
// 한국어 수사를 숫자로 변환 (스케일링 전처리용)
var KO_NUM_MAP={'한':1,'두':2,'세':3,'네':4,'다섯':5,'여섯':6,'일곱':7,'여덟':8,'아홉':9,'열':10,'반':0.5};
function replaceKoNum(txt){
  // "반 개" → "0.5 개", "두 장" → "2 장" 등 (단어 경계 기준)
  return txt.replace(/\b(열|다섯|여섯|일곱|여덟|아홉|한|두|세|네|반)\s+/g,function(m,w){
    return KO_NUM_MAP[w]+' ';
  });
}
function scaleVal(txt,mul,isStep){
  if(mul===1)return txt;
  txt=replaceKoNum(txt);
  // 조리순서 모드: 시간/온도/비율 패턴은 배수 적용 제외
  if(isStep){
    // 제외 패턴: 숫자+분/초/시간/도/°C, 비율(1:1.5), 단계번호(1. 2. 등), 범위(15~20)
    var skipPatterns=[
      /\d+\s*분/g,/\d+\s*초/g,/\d+\s*시간/g,
      /\d+\s*°[Cc]/g,/\d+\s*도/g,
      /\d+\s*:\s*\d+/g,
      /~\s*\d+/g
    ];
    var masked=txt;
    var placeholders=[];
    skipPatterns.forEach(function(pat){
      masked=masked.replace(pat,function(m){
        var idx=placeholders.length;
        placeholders.push(m);
        return '§§'+idx+'§§';
      });
    });
    // 배수 적용
    var scaled=masked.replace(/(\d+\.?\d*)\s*\/\s*(\d+\.?\d*)|(\d+\.?\d*)/g,function(m,num,den,whole){
      // 플레이스홀더는 건드리지 않음
      if(m.indexOf('§')>=0)return m;
      var n;
      if(num!==undefined&&den!==undefined){n=(parseFloat(num)/parseFloat(den))*mul;}
      else{n=parseFloat(whole)*mul;}
      if(n%1===0)return ''+n;
      var fracs=[[1/4,'1/4'],[1/3,'1/3'],[1/2,'1/2'],[2/3,'2/3'],[3/4,'3/4']];
      for(var i=0;i<fracs.length;i++){if(Math.abs(n-fracs[i][0])<0.01)return fracs[i][1];}
      var intPart=Math.floor(n);var fracPart=n-intPart;
      for(var j=0;j<fracs.length;j++){if(Math.abs(fracPart-fracs[j][0])<0.01)return (intPart>0?intPart+'와 ':'')+fracs[j][1];}
      return n.toFixed(1);
    });
    // 플레이스홀더 복원
    placeholders.forEach(function(orig,idx){
      scaled=scaled.replace('§§'+idx+'§§',orig);
    });
    return scaled;
  }
  // 일반 모드(재료): 분수(예: 1/2, 2/3) 먼저 처리한 후 배수 적용
  return txt.replace(/(\d+\.?\d*)\s*\/\s*(\d+\.?\d*)|(\d+\.?\d*)/g,function(m,num,den,whole){   var n;
    if(num!==undefined&&den!==undefined){
      // 분수인 경우: 분자/분모 → 소수로 변환 후 배수 적용
      n=(parseFloat(num)/parseFloat(den))*mul;
    } else {
      n=parseFloat(whole)*mul;
    }
    // 결과가 정수면 정수로, 소수면 소수점 1자리로 표시
    // 단, 결과가 분수로 표현 가능한 경우 분수로 표시
    if(n%1===0) return ''+n;
    // 주요 분수 표현 (1/4, 1/3, 1/2, 2/3, 3/4)
    var fracs=[[1/4,'1/4'],[1/3,'1/3'],[1/2,'1/2'],[2/3,'2/3'],[3/4,'3/4']];
    for(var i=0;i<fracs.length;i++){if(Math.abs(n-fracs[i][0])<0.01)return fracs[i][1];}
    // 정수+분수 조합 (예: 1.5 → 1과 1/2)
    var intPart=Math.floor(n);
    var fracPart=n-intPart;
    for(var j=0;j<fracs.length;j++){if(Math.abs(fracPart-fracs[j][0])<0.01)return (intPart>0?intPart+'와 ':'')+fracs[j][1];}
    return n.toFixed(1);
  });
}

// === g 단위 → 일상 단위 자동 변환 ===
// 변환표는 Google Sheets "개량단위변환표" 탭과 동기화됨
var G_CONVERT_TABLE = [
  // 고기류
  ['돼지고기',100,30,'약 1인분'],['돼지고기',150,30,'약 1~2인분'],['돼지고기',200,30,'약 2인분'],['돼지고기',300,30,'약 3인분'],
  ['소고기',100,30,'약 1인분'],['소고기',150,30,'약 1~2인분'],['소고기',200,30,'약 2인분'],['소고기',300,30,'약 3인분'],
  ['닭가슴살',100,30,'약 1조각'],['닭가슴살',150,30,'약 1~2조각'],['닭가슴살',200,30,'약 2조각'],['닭가슴살',300,30,'약 3조각'],
  ['닭고기',400,50,'약 반 마리'],['닭고기',800,50,'약 1마리'],
  // 두부
  ['두부',100,20,'1/4모'],['두부',200,20,'1/2모'],['두부',400,20,'1모'],
  // 김치
  ['김치',50,20,'약 1/4컵'],['김치',100,20,'약 1/2컵'],['김치',200,20,'약 1컵'],['김치',300,20,'약 1컵 반'],
  // 채소류
  ['콩나물',100,30,'반 봉지'],['콩나물',200,30,'반 봉지'],['콩나물',300,30,'3/4 봉지'],
  ['버섯',150,30,'한 팩 1/2'],['버섯',200,30,'한 팩'],
  ['양배추',100,20,'1/8통'],['양배추',150,20,'1/4통'],['양배추',200,20,'1/4통'],['양배추',300,20,'1/3통'],
  ['무',100,20,'두께 2cm 1토막'],['무',200,20,'두께 2cm 2토막'],['무',300,20,'1/4개'],
  ['고구마',300,30,'중간 크기 2개'],['고구마',400,30,'중간 크기 2~3개'],
  ['당근',30,15,'1/4개'],['당근',50,15,'1/3개'],['당근',100,20,'1/2개'],['당근',200,20,'1개'],
  ['쪽파',50,15,'5~6대'],['쪽파',100,20,'10대'],
  ['시금치',100,20,'반 봉지'],['시금치',150,20,'반 봉지'],
  // 면류/어묵
  ['어묵',50,20,'1~2장'],['어묵',150,20,'2~3장'],['어묵',200,20,'3~4장'],
  ['당면',100,20,'1인분'],['당면',150,20,'1~2인분'],['당면',200,20,'2인분'],
  ['파스타면',150,20,'1인분'],['파스타면',200,20,'2인분'],
  ['소면',100,20,'1인분'],['소면',200,20,'2인분'],
  // 가공식품
  ['스팸',100,20,'1/2캔'],['스팸',200,20,'1캔'],
  ['햄',50,15,'2~3장'],['햄',100,20,'4~5장'],['햄',150,20,'반 덩이'],
  ['소시지',100,20,'3~4개'],['소시지',150,20,'4~5개'],['소시지',200,20,'6~7개'],
  ['베이컨',100,20,'4~5장'],
  // 기타
  ['버터',10,5,'1작은술'],['버터',30,10,'2큰술'],
  ['치즈',30,10,'1~2장'],['치즈',100,20,'3~4장'],
  ['미역',10,5,'한 줌'],
  ['떡',100,20,'한 줌'],['떡',150,20,'한 줌 반'],['떡',200,20,'2인분'],
  ['카레가루',100,10,'1봉지'],
  ['해물믹스',50,20,'한 줌'],
  ['마요네즈',10,5,'1작은술']
];
function convertGUnit(txt) {
  // 숫자g 패턴 감지: "재료명 200g" 형태
  return txt.replace(/(\d+)\s*g\b/g, function(match, amtStr, offset) {
    var amt = parseInt(amtStr);
    // 재료명 추출: g 앞 텍스트에서 마지막 단어(한글)
    var before = txt.substring(0, offset);
    var ingMatch = before.match(/([가-힣a-zA-Z()]+(?:\s*[가-힣a-zA-Z()]+)*)\s*$/);
    if (!ingMatch) return match;
    var ingName = ingMatch[1].trim();
    // 변환표에서 가장 가까운 항목 찾기
    var best = null, bestDiff = 9999;
    for (var i = 0; i < G_CONVERT_TABLE.length; i++) {
      var row = G_CONVERT_TABLE[i];
      var keyword = row[0], gVal = row[1], tolerance = row[2], label = row[3];
      if (ingName.indexOf(keyword) >= 0) {
        var diff = Math.abs(amt - gVal);
        if (diff <= tolerance && diff < bestDiff) {
          best = label;
          bestDiff = diff;
        }
      }
    }
    if (best) {
      return '<span style="color:#888;font-size:0.9em">' + amt + 'g</span> <span style="color:var(--primary);font-weight:600;font-size:0.9em">(' + best + ')</span>';
    }
    return match;
  });
}
