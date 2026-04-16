// 관리자 기능 모듈 (CSV 내보내기, 통계 대시보드, pending 리스너)
// 전제: fbDB, isAdminSession, tab, render, COMMUNITY_SCRIPT_URL 등이 전역 선언됨

var pendingPostsCache=[];
var _pendingListener=null;

// 관리자 패널 HTML 조각 (index.html 간소화용)
function renderAdminExportPanel(){
  var h='';
  h+='<div style="margin-top:0px;padding:12px;background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:12px;border:1px solid rgba(255,200,0,.3)">';
  h+='<div style="font-size:12px;font-weight:700;color:#fbc02d;margin-bottom:8px">📊 데이터 내보내기 (CSV)</div>';
  h+='<div style="font-size:11px;color:rgba(255,255,255,.5);margin-bottom:10px">Firebase 데이터를 CSV로 다운로드 후 구글 시트에 붙여넣기<br>(유저목록 · 커뮤니티 · 레시피카운트)</div>';
  h+='<button onclick="exportUsersCSV()" style="width:100%;padding:9px;background:linear-gradient(135deg,#fbc02d,#f57f17);border:none;border-radius:8px;color:#1a1a2e;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:6px">👥 유저목록 CSV 다운로드</button>';
  h+='<button onclick="exportCommunityCSV()" style="width:100%;padding:9px;background:linear-gradient(135deg,#4caf50,#2e7d32);border:none;border-radius:8px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:6px">💬 커뮤니티 CSV 다운로드</button>';
  h+='<button onclick="exportRecipesCSV()" style="width:100%;padding:9px;background:linear-gradient(135deg,#1565c0,#0d47a1);border:none;border-radius:8px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:6px">🍽️ 레시피카운트 CSV 다운로드</button>';
  h+='<button onclick="exportIngredientsCSV()" style="width:100%;padding:9px;background:linear-gradient(135deg,#00897b,#00695c);border:none;border-radius:8px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:6px">🥕 재료목록 CSV 다운로드(업로드용)</button>';
  h+='<button onclick="syncIngredientsToSheet()" style="width:100%;padding:9px;background:linear-gradient(135deg,#26a69a,#00796b);border:none;border-radius:8px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:6px">☁️ 재료목록 자동 업로드</button>';
  h+='<div style="display:flex;gap:6px">';
  h+='<button onclick="openIngredientSheet()" style="flex:1;padding:8px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);border-radius:8px;color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">📄 시트 열기</button>';
  h+='<button onclick="showIngredientSheetGuide()" style="flex:1;padding:8px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);border-radius:8px;color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">❓ 업로드 방법</button>';
  h+='</div>';
  h+='<button onclick="showAppsScriptDeployGuide()" style="width:100%;padding:8px;margin-top:6px;background:rgba(255,255,255,.05);border:1px dashed rgba(255,255,255,.25);border-radius:8px;color:#cfd8dc;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">🛠 Apps Script 업데이트 방법</button>';
  h+='</div>';
  return h;
}

function renderAdminQualityPanel(){
  var h='';
  h+='<div style="margin-top:8px;padding:12px;background:linear-gradient(135deg,#1b2838,#0d1b2a);border-radius:12px;border:1px solid rgba(100,200,100,.3)">';
  h+='<div style="font-size:12px;font-weight:700;color:#81c784;margin-bottom:8px">🔍 데이터 품질 진단</div>';
  h+='<div style="font-size:11px;color:rgba(255,255,255,.5);margin-bottom:10px">결과는 브라우저 개발자 콘솔(F12)에 출력됩니다</div>';
  var exApi=window.NT_APP_API||{};
  if(typeof exApi.getExtraIngsStatus==='function'){
    var ex=exApi.getExtraIngsStatus()||{};
    var stateMap={idle:'대기',loading:'로딩중',loaded:'성공',noop:'변경없음',error:'오류'};
    var st=stateMap[ex.state]||ex.state||'알수없음';
    h+='<div style="font-size:11px;color:#b2dfdb;margin:2px 0 8px">📌 재료목록 연동 상태: <b>'+st+'</b> · '+(ex.message||'-')+(ex.rows?(' · 시트행 '+ex.rows+'개'):'')+'</div>';
    h+='<button onclick="(window.NT_APP_API&&window.NT_APP_API.reloadExtraIngs?window.NT_APP_API.reloadExtraIngs():loadExtraIngs());showCartPopup(\'🔄 재시도 시작\',\'재료목록 시트 재동기화를 시작했습니다. 잠시 후 상태를 확인하세요.\');setTimeout(render,700);" style="width:100%;padding:8px;background:linear-gradient(135deg,#00897b,#00695c);border:none;border-radius:8px;color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:8px">🧪 재료목록 연동 재시도</button>';
  }
  h+='<button onclick="runIngCoverageCheck();showCartPopup(\'✅ 진단 완료\',\'브라우저 콘솔(F12)에서 결과를 확인하세요.\')" style="width:100%;padding:9px;background:linear-gradient(135deg,#388e3c,#1b5e20);border:none;border-radius:8px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:6px">🥕 재료 커버리지 점검</button>';
  h+='<button onclick="triggerOptIngCheck()" style="width:100%;padding:9px;background:linear-gradient(135deg,#f57c00,#bf360c);border:none;border-radius:8px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">⚙️ 선택재료 연결 점검</button>';
  h+='</div>';
  return h;
}

function startPendingListener(){
  if(_pendingListener)return; // 이미 구독 중이면 중복 방지
  _pendingListener=fbDB.ref('community/pending').on('value',function(snap){
    pendingPostsCache=[];
    snap.forEach(function(child){
      pendingPostsCache.push(Object.assign({_fbKey:child.key},child.val()));
    });
    // 커뮤니티 탭이 열려있으면 즉시 갱신
    if(tab==='comm'){render();}
  });
}

// 페이지 로드 시 이미 관리자면 바로 구독 시작 — 호출은 fbDB 초기화 후 index.html에서 수행
function getPendingPosts(){return pendingPostsCache;}
function savePendingPosts(posts){
  // Firebase 기반으로 전환되어 직접 호출 불필요 (하위 호환성 유지)
}

function downloadCSV(filename, rows){
  var bom='\uFEFF'; // UTF-8 BOM (한글 깨짐 방지)
  var csv=bom+rows.map(function(r){
    return r.map(function(v){
      var s=String(v===null||v===undefined?'':v);
      if(s.includes(',')|| s.includes('"')||s.includes('\n'))s='"'+s.replace(/"/g,'""')+'"';
      return s;
    }).join(',');
  }).join('\n');
  var blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url; a.download=filename; a.click();
  URL.revokeObjectURL(url);
}

// ===== 유저목록 CSV =====
async function exportUsersCSV(){
  try{
    var snap=await fbDB.ref('users').once('value');
    var usersRaw=snap.val()||{};
    // 게시글수 집계 (approved + pending 각각 읽기)
    var postCount={};
    try{
      var snapApproved=await fbDB.ref('community/approved').once('value');
      var approvedRaw=snapApproved.val()||{};
      Object.values(approvedRaw).forEach(function(p){if(p&&p.uid)postCount[p.uid]=(postCount[p.uid]||0)+1;});
    }catch(e2){/* 읽기 실패 시 무시 */}
    try{
      var snapPending=await fbDB.ref('community/pending').once('value');
      var pendingRaw=snapPending.val()||{};
      Object.values(pendingRaw).forEach(function(p){if(p&&p.uid)postCount[p.uid]=(postCount[p.uid]||0)+1;});
    }catch(e3){/* 읽기 실패 시 무시 */}
    var now=new Date().toLocaleString('ko-KR',{timeZone:'Asia/Seoul'});
    var rows=[['UID','닉네임','가입일시','게시글수','닉네임이력','내보내기시각']];
    Object.keys(usersRaw).forEach(function(uid){
      var u=usersRaw[uid];
      var hist='';
      if(u.nicknameHistory&&u.nicknameHistory.length>0){
        hist=u.nicknameHistory.map(function(h){return h.nickname+'('+(h.changedAt||'').substring(0,10)+')';}).join(' → ');
      }
      rows.push([uid,u.nickname||'',u.timestamp||'',postCount[uid]||0,hist,now]);
    });
    downloadCSV('냉털_유저목록_'+new Date().toISOString().substring(0,10)+'.csv',rows);
    alert('✅ 유저목록 CSV 다운로드 완료! ('+( rows.length-1)+'명)\n\n구글 시트에서 파일 → 가져오기 → 업로드로 붙여넣으세요.');
  }catch(e){alert('❌ 오류: '+e.message);}
}

// ===== 커뮤니티 CSV =====
async function exportCommunityCSV(){
  try{
    var snap=await fbDB.ref('community').once('value');
    var commRaw=snap.val()||{};
    var now=new Date().toLocaleString('ko-KR',{timeZone:'Asia/Seoul'});
    var rows=[['게시글ID','UID','닉네임','레시피명','레시피ID','내용','평점','좋아요','날짜','상태','내보내기시각']];
    Object.keys(commRaw).forEach(function(pid){
      var p=commRaw[pid];
      if(!p)return;
      rows.push([pid,p.uid||'',p.nickname||'',p.recipe||'',p.recipeId||'',p.text||'',p.rating||0,p.likes||0,p.date||'',p.status||'approved',now]);
    });
    rows.sort(function(a,b){return b[8]>a[8]?1:-1;});
    downloadCSV('냉털_커뮤니티_'+new Date().toISOString().substring(0,10)+'.csv',rows);
    alert('✅ 커뮤니티 CSV 다운로드 완료! ('+(rows.length-1)+'건)');
  }catch(e){alert('❌ 오류: '+e.message);}
}

// ===== 레시피카운트 CSV =====
async function exportRecipesCSV(){
  try{
    var snapH=await fbDB.ref('history').once('value');
    var histRaw=snapH.val()||{};
    var snapC=await fbDB.ref('community').once('value');
    var commRaw=snapC.val()||{};
    var recipeMap={};
    // history 집계
    Object.values(histRaw).forEach(function(userHist){
      if(typeof userHist!=='object')return;
      Object.values(userHist).forEach(function(entry){
        if(!entry||!entry.recipeId)return;
        var rid=entry.recipeId;
        if(!recipeMap[rid])recipeMap[rid]={recipeId:rid,recipeName:entry.recipeName||entry.recipe||'',count:0,lastDate:'',totalRating:0,ratingCount:0,commTotal:0,commCount:0};
        recipeMap[rid].count++;
        if(entry.date&&entry.date>recipeMap[rid].lastDate)recipeMap[rid].lastDate=entry.date;
        if(entry.rating&&entry.rating>0){recipeMap[rid].totalRating+=Number(entry.rating);recipeMap[rid].ratingCount++;}
      });
    });
    // 커뮤니티 평점 집계
    Object.values(commRaw).forEach(function(p){
      if(!p||!p.recipeId||!p.rating||p.rating<=0)return;
      var rid=p.recipeId;
      if(!recipeMap[rid])recipeMap[rid]={recipeId:rid,recipeName:p.recipe||'',count:0,lastDate:'',totalRating:0,ratingCount:0,commTotal:0,commCount:0};
      recipeMap[rid].commTotal+=Number(p.rating);
      recipeMap[rid].commCount++;
    });
    var now=new Date().toLocaleString('ko-KR',{timeZone:'Asia/Seoul'});
    var rows=[['레시피ID','레시피명','요리횟수','최근요리일','내평점합계','내평점횟수','내평균평점','커뮤평점합계','커뮤평점횟수','커뮤평균평점','내보내기시각']];
    Object.values(recipeMap).sort(function(a,b){return b.count-a.count;}).forEach(function(r){
      var avg=r.ratingCount>0?Math.round(r.totalRating/r.ratingCount*10)/10:'';
      var cAvg=r.commCount>0?Math.round(r.commTotal/r.commCount*10)/10:'';
      rows.push([r.recipeId,r.recipeName,r.count,r.lastDate,r.totalRating,r.ratingCount,avg,r.commTotal,r.commCount,cAvg,now]);
    });
    downloadCSV('냉털_레시피카운트_'+new Date().toISOString().substring(0,10)+'.csv',rows);
    alert('✅ 레시피카운트 CSV 다운로드 완료! ('+(rows.length-1)+'개)');
  }catch(e){alert('❌ 오류: '+e.message);}
}

// ===== 재료목록 CSV (Google Sheets 재료목록 탭 업로드용) =====
function exportIngredientsCSV(){
  try{
    // 동의어 역인덱스: 표준명 -> 별칭 목록
    var aliasByName={};
    Object.keys(SYN_MAP||{}).forEach(function(k){
      var v=SYN_MAP[k];
      if(!v||k===v)return;
      if(!aliasByName[v])aliasByName[v]=[];
      if(aliasByName[v].indexOf(k)===-1)aliasByName[v].push(k);
    });
    var rows=[['이름','이모지','카테고리','동의어']];
    (INGS||[]).forEach(function(i){
      if(!i||!i.n)return;
      rows.push([
        i.n,
        i.e||'',
        i.c||'기타',
        (aliasByName[i.n]||[]).join('|')
      ]);
    });
    downloadCSV('냉털_재료목록_업로드용_'+new Date().toISOString().substring(0,10)+'.csv',rows);
    alert('✅ 재료목록 CSV 다운로드 완료! ('+(rows.length-1)+'종)\n\n다음 단계:\n1) 관리자 > 📄 시트 열기\n2) "재료목록" 탭 선택\n3) 파일 > 가져오기 > 업로드');
  }catch(e){
    alert('❌ 재료목록 CSV 생성 실패: '+e.message);
  }
}

function openIngredientSheet(){
  var url='https://docs.google.com/spreadsheets/d/'+SHEET_ID+'/edit';
  window.open(url,'_blank');
}

function showIngredientSheetGuide(){
  alert('재료목록 반영 경로 (초간단)\n\n[권장] 자동 업로드\n1) "☁️ 재료목록 자동 업로드" 클릭\n2) 완료 후 앱에서 자동 재동기화\n\n[수동] CSV 업로드\n1) "🥕 재료목록 CSV 다운로드(업로드용)" 클릭\n2) "📄 시트 열기" 클릭\n3) 구글 시트 "재료목록" 탭 > 파일 > 가져오기 > 업로드');
}

function showAppsScriptDeployGuide(){
  alert('자동 업로드가 "unknown action"으로 실패하면, Apps Script를 한 번만 업데이트하면 됩니다.\n\n1) 저장소의 apps_script_v5.gs 코드 복사\n2) script.google.com > 프로젝트 열기\n3) 기존 코드 전체 삭제 후 붙여넣기/저장\n4) 우측 상단 "배포" > "배포 관리"\n5) 웹 앱 재배포(또는 새 버전 배포)\n6) 앱으로 돌아와 다시 "☁️ 재료목록 자동 업로드" 클릭');
}

async function syncIngredientsToSheet(){
  try{
    if(typeof COMMUNITY_SCRIPT_URL!=='string'||!COMMUNITY_SCRIPT_URL){
      alert('❌ 자동 업로드 URL이 설정되지 않았습니다.');
      return;
    }
    if(!confirm('현재 앱 재료목록을 구글 시트 "재료목록" 탭에 자동 업로드할까요?\n(기존 탭 데이터는 덮어쓰기됩니다)'))return;
    var aliasByName={};
    Object.keys(SYN_MAP||{}).forEach(function(k){
      var v=SYN_MAP[k];
      if(!v||k===v)return;
      if(!aliasByName[v])aliasByName[v]=[];
      if(aliasByName[v].indexOf(k)===-1)aliasByName[v].push(k);
    });
    var ingredients=(INGS||[]).filter(function(i){return i&&i.n;}).map(function(i){
      return {name:i.n,emoji:i.e||'',category:i.c||'기타',alias:(aliasByName[i.n]||[]).join('|')};
    });
    var resp=await fetch(COMMUNITY_SCRIPT_URL,{
      method:'POST',
      headers:{'Content-Type':'text/plain'},
      body:JSON.stringify({action:'syncIngredients',ingredients:ingredients,syncTime:new Date().toISOString()})
    });
    var result=await resp.json();
    if(result&&result.ok){
      alert('✅ 재료목록 자동 업로드 완료! ('+ingredients.length+'종)\n\n앱에서도 바로 다시 불러옵니다.');
      if(window.NT_APP_API&&window.NT_APP_API.reloadExtraIngs)window.NT_APP_API.reloadExtraIngs();
      setTimeout(render,700);
    }else{
      var msg=(result&&result.msg)?String(result.msg):'응답 확인 필요';
      if(msg.indexOf('unknown action: syncIngredients')>=0){
        alert('❌ 자동 업로드 실패: 서버가 구버전 Apps Script입니다.\n\n해결:\n- 관리자 화면의 "🛠 Apps Script 업데이트 방법" 버튼을 눌러\n  안내 순서대로 웹앱을 재배포해 주세요.');
      }else{
        alert('❌ 자동 업로드 실패: '+msg);
      }
    }
  }catch(e){
    alert('❌ 자동 업로드 오류: '+e.message);
  }
}

// ===== 관리자 통계 대시보드 =====
async function loadAdminStats(){
  var area=document.getElementById('adminStatsArea');
  if(!area)return;
  area.innerHTML='<div style="text-align:center;padding:16px;color:rgba(255,255,255,.5);font-size:12px">⏳ 데이터 불러오는 중...</div>';
  try{
    // Firebase 데이터 병렬 로드 (community는 approved/pending 분리 읽기)
    var [snapUsers, snapApproved, snapPending, snapCookLogs, snapAccessLogs] = await Promise.all([
      fbDB.ref('users').once('value'),
      fbDB.ref('community/approved').once('value'),
      fbDB.ref('community/pending').once('value'),
      fbDB.ref('cookLogs').once('value'),
      fbDB.ref('accessLogs').once('value')
    ]);
    var usersRaw = snapUsers.val()||{};
    var approvedRaw = snapApproved.val()||{};
    var pendingRaw = snapPending.val()||{};
    var cookLogsRaw = snapCookLogs.val()||{};
    var accessLogsRaw = snapAccessLogs.val()||{};

    // 최근 7일 일일 접속자 수 집계
    var now = new Date();
    var dailyStats = [];
    for(var d=6;d>=0;d--){
      var dt = new Date(now);
      dt.setDate(dt.getDate()-d);
      var dateKey = dt.toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).replace(/\. /g,'-').replace('.','');
      var dayLabel = (d===0)?'오늘':(d===1)?'어제':(dt.getMonth()+1)+'/'+(dt.getDate());
      var cnt = accessLogsRaw[dateKey] ? Object.keys(accessLogsRaw[dateKey]).length : 0;
      dailyStats.push({label:dayLabel, count:cnt});
    }
    var todayCount = dailyStats[6].count;
    var maxDaily = Math.max.apply(null, dailyStats.map(function(d){return d.count;})) || 1;

    // 유저 통계
    var totalUsers = Object.keys(usersRaw).length;
    var thisMonth = now.getFullYear()+'-'+(String(now.getMonth()+1).padStart(2,'0'));
    var newUsersThisMonth = Object.values(usersRaw).filter(function(u){
      return u.timestamp && u.timestamp.startsWith(thisMonth);
    }).length;

    // 커뮤니티 통계
    var approvedComm = Object.values(approvedRaw).filter(Boolean);
    var pendingComm = Object.values(pendingRaw).filter(Boolean);
    var totalLikes = approvedComm.reduce(function(s,p){return s+(p.likes||0);},0);
    var ratingsArr = approvedComm.filter(function(p){return p.rating>0;}).map(function(p){return p.rating;});
    var avgRating = ratingsArr.length>0 ? Math.round(ratingsArr.reduce(function(s,r){return s+r;},0)/ratingsArr.length*10)/10 : '-';

    // 레시피 통계 (cookLogs 기반: cookLogs/{uid}/{recipeId} = count)
    var recipeMap = {};
    var recipeIdToName = {};
    RECIPES.forEach(function(r){recipeIdToName[r.id]=r.name;});
    Object.values(cookLogsRaw).forEach(function(userLogs){
      if(typeof userLogs!=='object')return;
      Object.keys(userLogs).forEach(function(rid){
        var cnt = userLogs[rid]||0;
        if(!recipeMap[rid])recipeMap[rid]={name:recipeIdToName[rid]||rid,count:0};
        recipeMap[rid].count+=cnt;
      });
    });
    var recipeList = Object.values(recipeMap).sort(function(a,b){return b.count-a.count;});
    var totalCooks = recipeList.reduce(function(s,r){return s+r.count;},0);
    
    // 인기 레시피 TOP 3
    var top3 = recipeList.slice(0,3);
    
    // 장바구니 담기 횟수 (favs 기반)
    var favsRaw = await fbDB.ref('favs').once('value').then(function(snap){return snap.val()||{};})
    var totalFavs = 0;
    Object.values(favsRaw).forEach(function(userFavs){
      if(typeof userFavs==='object')totalFavs += Object.keys(userFavs).length;
    });
    
    // 리뷰 수 (별점 달린 게시글 수)
    var reviewCount = approvedComm.filter(function(p){return p.rating>0;}).length;

    // TOP 3 레시피 HTML (강조 표시)
    var top3html = top3.map(function(r,i){
      var medal = i===0?'🥇':i===1?'🥈':i===2?'🥉':'';
      return '<div style="margin-bottom:8px;padding:8px;background:rgba(251,192,45,.1);border-left:3px solid #fbc02d;border-radius:4px">'
        +'<div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700">'
        +'<span>'+medal+' '+r.name+'</span><span style="color:#fbc02d">'+r.count+'회</span></div>'
        +'</div>';
    }).join('');
    
    // TOP 10 레시피 HTML
    var top10 = recipeList.slice(0,10);
    var maxCount = top10.length>0 ? top10[0].count : 1;
    var top10html = top10.map(function(r,i){
      var bar = Math.round(r.count/maxCount*100);
      var medal = i===0?'🥇':i===1?'🥈':i===2?'🥉':(i+1)+'위';
      return '<div style="margin-bottom:6px">'
        +'<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px">'
        +'<span>'+medal+' '+r.name+'</span><span style="color:#fbc02d;font-weight:700">'+r.count+'회</span></div>'
        +'<div style="background:rgba(255,255,255,.1);border-radius:4px;height:5px">'
        +'<div style="background:linear-gradient(90deg,#fbc02d,#f57f17);width:'+bar+'%;height:100%;border-radius:4px"></div></div>'
        +'</div>';
    }).join('');

    var statsHtml = '<div style="margin-top:12px;margin-bottom:10px;padding:14px;background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:12px;border:1px solid rgba(123,31,162,.5);text-align:left">';
    // 헤더
    statsHtml += '<div style="font-size:12px;font-weight:700;color:#ce93d8;margin-bottom:12px">📊 통계 대시보드 <span style="font-size:10px;font-weight:400;color:rgba(255,255,255,.4)">· '+now.toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})+'</span></div>';
    // 유저 카드
    statsHtml += '<div style="display:flex;gap:8px;margin-bottom:10px">';
    statsHtml += '<div style="flex:1;background:rgba(255,255,255,.05);border-radius:8px;padding:10px;text-align:center">';
    statsHtml += '<div style="font-size:22px;font-weight:700;color:#fbc02d">'+totalUsers+'</div>';
    statsHtml += '<div style="font-size:10px;color:rgba(255,255,255,.5)">총 유저</div></div>';
    statsHtml += '<div style="flex:1;background:rgba(255,255,255,.05);border-radius:8px;padding:10px;text-align:center">';
    statsHtml += '<div style="font-size:22px;font-weight:700;color:#81c784">'+newUsersThisMonth+'</div>';
    statsHtml += '<div style="font-size:10px;color:rgba(255,255,255,.5)">이번달 신규</div></div>';
    statsHtml += '<div style="flex:1;background:rgba(255,255,255,.05);border-radius:8px;padding:10px;text-align:center">';
    statsHtml += '<div style="font-size:22px;font-weight:700;color:#64b5f6">'+totalCooks+'</div>';
    statsHtml += '<div style="font-size:10px;color:rgba(255,255,255,.5)">총 요리횟수</div></div>';
    statsHtml += '</div>';
    // 커뮤니티 카드
    statsHtml += '<div style="display:flex;gap:8px;margin-bottom:12px">';
    statsHtml += '<div style="flex:1;background:rgba(255,255,255,.05);border-radius:8px;padding:10px;text-align:center">';
    statsHtml += '<div style="font-size:22px;font-weight:700;color:#fff">'+approvedComm.length+'</div>';
    statsHtml += '<div style="font-size:10px;color:rgba(255,255,255,.5)">커뮤니티 게시글</div></div>';
    statsHtml += '<div style="flex:1;background:rgba(255,255,255,.05);border-radius:8px;padding:10px;text-align:center">';
    statsHtml += '<div style="font-size:22px;font-weight:700;color:'+(pendingComm.length>0?'#ff8a65':'rgba(255,255,255,.4)')+'">'+ pendingComm.length+'</div>';
    statsHtml += '<div style="font-size:10px;color:rgba(255,255,255,.5)">승인 대기</div></div>';
    statsHtml += '<div style="flex:1;background:rgba(255,255,255,.05);border-radius:8px;padding:10px;text-align:center">';
    statsHtml += '<div style="font-size:22px;font-weight:700;color:#ffb74d">'+avgRating+'</div>';
    statsHtml += '<div style="font-size:10px;color:rgba(255,255,255,.5)">평균 평점</div></div>';
    statsHtml += '</div>';
    // 새로운 통계 카드: 장바구니, 리뷰 수
    statsHtml += '<div style="display:flex;gap:8px;margin-bottom:12px">';
    statsHtml += '<div style="flex:1;background:rgba(255,255,255,.05);border-radius:8px;padding:10px;text-align:center">';
    statsHtml += '<div style="font-size:22px;font-weight:700;color:#4db8ff">'+totalFavs+'</div>';
    statsHtml += '<div style="font-size:10px;color:rgba(255,255,255,.5)">장바구니 담기</div></div>';
    statsHtml += '<div style="flex:1;background:rgba(255,255,255,.05);border-radius:8px;padding:10px;text-align:center">';
    statsHtml += '<div style="font-size:22px;font-weight:700;color:#81c784">'+reviewCount+'</div>';
    statsHtml += '<div style="font-size:10px;color:rgba(255,255,255,.5)">리뷰 수</div></div>';
    statsHtml += '</div>';
    // 일일 접속자 수 섹션
    statsHtml += '<div style="font-size:11px;font-weight:700;color:#ce93d8;margin-bottom:8px">📅 일일 접속자 수 (최근 7일)</div>';
    statsHtml += '<div style="background:rgba(255,255,255,.04);border-radius:8px;padding:10px;margin-bottom:12px">';
    dailyStats.forEach(function(ds){
      var barW = Math.round(ds.count/maxDaily*100);
      var isToday = ds.label==='오늘';
      statsHtml += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px">';
      statsHtml += '<div style="width:28px;font-size:10px;color:rgba(255,255,255,'+(isToday?'.9':'.5')+')'+(isToday?';font-weight:700':'')+'">'+ds.label+'</div>';
      statsHtml += '<div style="flex:1;background:rgba(255,255,255,.08);border-radius:3px;height:14px;position:relative">';
      statsHtml += '<div style="background:'+(isToday?'linear-gradient(90deg,#42a5f5,#1565c0)':'linear-gradient(90deg,#546e7a,#37474f)')+';width:'+barW+'%;height:100%;border-radius:3px"></div>';
      statsHtml += '</div>';
      statsHtml += '<div style="width:22px;font-size:10px;text-align:right;color:'+(isToday?'#64b5f6':'rgba(255,255,255,.5)')+'">'+(ds.count||'-')+'</div>';
      statsHtml += '</div>';
    });
    statsHtml += '</div>';
    // 인기 레시피 TOP 3 (강조)
    statsHtml += '<div style="font-size:11px;font-weight:700;color:#fbc02d;margin-bottom:8px;margin-top:12px">⭐ 인기 레시피 TOP 3</div>';
    statsHtml += top3.length>0 ? top3html : '<div style="font-size:11px;color:rgba(255,255,255,.4);padding:8px 0">아직 요리 기록이 없어요.</div>';
    statsHtml += '<div style="margin-top:12px;margin-bottom:8px;border-top:1px solid rgba(255,255,255,.1);padding-top:12px"></div>';
    // 레시피 TOP 10
    statsHtml += '<div style="font-size:11px;font-weight:700;color:#ce93d8;margin-bottom:8px">🍽️ 레시피 TOP '+Math.min(10,top10.length)+'</div>';
    statsHtml += top10.length>0 ? top10html : '<div style="font-size:11px;color:rgba(255,255,255,.4);padding:8px 0">아직 요리 기록이 없어요. 앱에서 요리를 완료하면 여기에 표시됩니다!</div>';
    statsHtml += '</div>';

    area.innerHTML = statsHtml;
  }catch(e){
    console.error('Admin stats error:', e);
    var errorDiv=document.createElement('div');errorDiv.style.cssText='color:#ef9a9a;font-size:11px;padding:8px';
    errorDiv.textContent='❌ 오류: '+e.message;
    area.innerHTML='';
    area.appendChild(errorDiv);
  }
}

// ===== 관리자 전용: Google Sheets 수동 동기화 (구버전 - 미사용) =====
async function syncToSheets(){
  var btn=document.getElementById('syncBtn');
  if(btn){btn.disabled=true;btn.textContent='⏳ 동기화 중...';}
  try{
    // 1. Firebase에서 각 노드별 개별 읽기 (루트 전체 읽기는 권한 오류 발생)
    var snapUsers=await fbDB.ref('users').once('value');
    var snapCommApproved=await fbDB.ref('community/approved').once('value');
    var snapCommPending=await fbDB.ref('community/pending').once('value');
    var snapRecipes=await fbDB.ref('recipes').once('value');

    // 2. 유저목록 데이터 정리
    var users=[];
    var usersRaw=snapUsers.val()||{};
    Object.keys(usersRaw).forEach(function(uid){
      var u=usersRaw[uid];
      users.push({
        uid:uid,
        nickname:u.nickname||'',
        timestamp:u.timestamp||u.registeredAt||u.joinedAt||'',
        posts:(u.posts||0),
        nicknameHistory:u.nicknameHistory||[]
      });
    });

    // 3. 커뮤니티 데이터 정리
    var community=[];
    // 승인된 게시물
    var approvedRaw=snapCommApproved.val()||{};
    Object.keys(approvedRaw).forEach(function(pid){
      var p=approvedRaw[pid];
      if(!p)return;
      community.push({
        postId:pid,
        uid:p.uid||'',
        nickname:p.nickname||'나',
        recipe:p.recipe||'',
        recipeId:p.recipeId||'',
        text:p.text||'',
        rating:p.rating||0,
        likes:p.likes||0,
        date:p.date||'',
        status:'approved'
      });
    });
    // 대기 중 게시물
    var pendingRaw=snapCommPending.val()||{};
    Object.keys(pendingRaw).forEach(function(pid){
      var p=pendingRaw[pid];
      if(!p)return;
      community.push({
        postId:pid,
        uid:p.uid||'',
        nickname:p.nickname||'나',
        recipe:p.recipe||'',
        recipeId:p.recipeId||'',
        text:p.text||'',
        rating:p.rating||0,
        likes:0,
        date:p.date||'',
        status:'pending'
      });
    });

    // 4. 레시피카운트 데이터 정리
    var recipes=[];
    var recipesRaw=snapRecipes.val()||{};
    Object.keys(recipesRaw).forEach(function(rid){
      var r=recipesRaw[rid];
      if(!r||!r.count)return;
      var avgRating=null;
      if(r.totalRating&&r.ratingCount&&r.ratingCount>0){
        avgRating=Math.round((r.totalRating/r.ratingCount)*10)/10;
      }
      var commAvgRating=null;
      if(r.commTotalRating&&r.commRatingCount&&r.commRatingCount>0){
        commAvgRating=Math.round((r.commTotalRating/r.commRatingCount)*10)/10;
      }
      recipes.push({
        recipeId:rid,
        recipeName:r.name||'',
        count:r.count||0,
        lastDate:r.lastDate||'',
        totalRating:r.totalRating||0,
        ratingCount:r.ratingCount||0,
        avgRating:avgRating!==null?avgRating:'',
        commTotalRating:r.commTotalRating||0,
        commRatingCount:r.commRatingCount||0,
        commAvgRating:commAvgRating!==null?commAvgRating:''
      });
    });

    // 5. Apps Script로 전체 데이터 전송
    var payload={
      action:'fullSync',
      users:users,
      community:community,
      recipes:recipes,
      syncTime:new Date().toISOString()
    };

    var resp=await fetch(COMMUNITY_SCRIPT_URL,{
      method:'POST',
      headers:{'Content-Type':'text/plain'},
      body:JSON.stringify(payload)
    });
    var result=await resp.json();

    if(result&&result.ok){
      alert('✅ 동기화 완료!\n\n유저: '+users.length+'명\n커뮤니티: '+community.length+'건\n레시피카운트: '+recipes.length+'개');
    }else{
      alert('⚠️ 동기화 완료 (응답: '+(result&&result.msg?result.msg:'확인 필요')+')');
    }
  }catch(e){
    alert('❌ 동기화 실패: '+e.message);
  }finally{
    if(btn){btn.disabled=false;btn.textContent='🔄 지금 동기화하기';}
  }
}

async function activateAdmin(){
  var ok=await verifyAdminPassword(true);
  if(ok){
    localStorage.setItem('nt_admin','1');
    startPendingListener(); // 관리자 활성화 시 pending 실시간 구독 시작
    alert('✅ 관리자 모드 활성화! 커뮤니티 탭 하단에서 대기 글을 승인/거절할 수 있습니다.');
    tab='comm'; // 커뮤니티 탭으로 이동
    render();
  }else{
    alert('❌ 비밀번호가 다릅니다.');
  }
}
