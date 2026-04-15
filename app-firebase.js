// Firebase 헬퍼 함수 모듈
// 전제: fbDB, fbAuth, fbUid, fbAuthReady, COMMUNITY_SCRIPT_URL 는 index.html에서 선언됨

// 커뮤니티 승인 기록 (현재 비활성 — 관리자 동기화 버튼 방식 사용)
function reportCommunityApprovalToSheet(post){
  // 실시간 전송 제거 - 관리자 동기화 버튼 사용
}

function getCurrentUid(){
  return fbUid||'unknown_uid';
}

function ensureFirebaseAuth(){
  try{
    fbAuth.onAuthStateChanged(function(user){
      if(user&&user.uid){
        fbUid=user.uid;
        fbAuthReady=true;
        localStorage.setItem('nt_uid',fbUid);
        recordDailyAccess();
        if(typeof refreshAdminUidFlag==='function'){
          refreshAdminUidFlag().then(function(isAdminUid){
            if(!isAdminUid){
              localStorage.removeItem('nt_admin');
            }else if(isAdminSession()&&typeof startPendingListener==='function'){
              startPendingListener();
            }
            if(typeof tab!=='undefined'&&tab==='comm'&&typeof render==='function')render();
          }).catch(function(){});
        }
        return;
      }
      fbAuth.signInAnonymously().catch(function(e){
        console.warn('[Firebase Auth] 익명 로그인 실패:',e&&e.message?e.message:e);
      });
    });
  }catch(e){
    console.warn('[Firebase Auth] 초기화 실패:',e&&e.message?e.message:e);
  }
}

// 일일 접속 기록 (날짜별 고유 접속자 수 집계용)
function recordDailyAccess(){
  try{
    var today=new Date().toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).replace(/\. /g,'-').replace('.','')
    var lastAccessDate=localStorage.getItem('nt_last_access');
    if(lastAccessDate===today)return;
    fbDB.ref('accessLogs/'+today+'/'+getCurrentUid()).set(true).then(function(){
      localStorage.setItem('nt_last_access',today);
    }).catch(function(){});
  }catch(e){}
}

// 요리 완성 시 카운트 +1
function reportRecipeToFirebase(recipeId,recipeName){
  try{
    fbDB.ref('recipes/'+recipeId+'/count').transaction(function(c){return(c||0)+1;})
      .catch(function(e){console.warn('[Firebase] 레시피 카운트 실패:',e);});
    fbDB.ref('recipes/'+recipeId+'/name').set(recipeName)
      .catch(function(e){console.warn('[Firebase] 레시피 이름 저장 실패:',e);});
  }catch(e){console.warn('[Firebase] reportRecipeToFirebase 오류:',e);}
}

// 레시피 랭킹 Top5 실시간 리스닝
var recipeRanking=[];
function listenRecipeRanking(){
  fbDB.ref('recipes').orderByChild('count').limitToLast(10).on('value',function(snap){
    recipeRanking=[];
    snap.forEach(function(child){
      var d=child.val();
      if(d&&d.count>0)recipeRanking.push({id:child.key,name:d.name||'',count:d.count});
    });
    recipeRanking.sort(function(a,b){return b.count-a.count||(a.id<b.id?-1:1)});
    recipeRanking=recipeRanking.slice(0,5);
    if(dataLoaded&&document.getElementById('app'))render();
  });
}

// 즐겨찾기 랭킹 Top3 실시간 리스닝
var favRanking=[];
function listenFavRanking(){
  fbDB.ref('favs').orderByChild('count').limitToLast(10).on('value',function(snap){
    favRanking=[];
    snap.forEach(function(child){
      var d=child.val();
      if(d&&d.count>0)favRanking.push({id:child.key,name:d.name||'',count:d.count});
    });
    favRanking.sort(function(a,b){return b.count-a.count||(a.id<b.id?-1:1)});
    favRanking=favRanking.slice(0,3);
    if(dataLoaded&&document.getElementById('app'))render();
  });
}

// 레시피 ID → 메달 반환 (Top5 기준)
function getRecipeMedal(recipeId){
  for(var i=0;i<recipeRanking.length;i++){
    if(recipeRanking[i].id===recipeId)return['🥇','🥈','🥉','4⃣','5⃣'][i];
  }
  return '';
}
