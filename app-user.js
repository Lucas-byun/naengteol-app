// 사용자 프로필·닉네임·유저 등록 모듈
// 전제: fbDB, fbUid, render(), showCartPopup(), openCropModal() 는 다른 파일에서 선언됨

var RECIPE_BEST_PHOTOS={}; // recipeId -> {photo, likes, emoji}

// === 커뮤니티 좋아요 최다 사진 → 레시피 대표 이미지/이모지 반영 ===
function updateBestPhotos(){
  // communityPosts 중 사진 있고 recipeId 있고 좋아요 1개 이상인 것만 대표사진 후보
  var posts=communityPosts.filter(function(p){return p.photo&&p.recipeId&&(p.likes||0)>=1;});
  // recipeId별로 좋아요 최다 사진 찾기 (동점 시 먼저 등록된 글 유지)
  var best={};
  posts.forEach(function(p){
    var id=p.recipeId;
    if(!best[id]||((p.likes||0)>(best[id].likes||0))){
      best[id]={photo:p.photo,likes:p.likes||0,emoji:p.emoji||'',author:p.nickname||p.user||p.author||''};
    }
  });
  RECIPE_BEST_PHOTOS=best;
  // ⚠️ CAT_IMAGES 카테고리 공유 제거: 같은 카테고리의 다른 레시피 썸네일이 바뀌는 버그 방지
  // 레시피 카드는 getRecipeBestPhoto(r.id)로 레시피별 개별 사진만 사용
}

// 레시피 카드/상세에서 대표 이미지 가져오기 (recipeId 기반)
function getRecipeBestPhoto(recipeId){
  return RECIPE_BEST_PHOTOS[recipeId] || null;
}

// 레시피 대표 이모지 가져오기 (좋아요 최다 포스트의 이모지 우선)
function getRecipeBestEmoji(r){
  if(RECIPE_BEST_PHOTOS[r.id]&&RECIPE_BEST_PHOTOS[r.id].emoji){
    return RECIPE_BEST_PHOTOS[r.id].emoji;
  }
  return r.emoji;
}
// === INGREDIENT DB ===
var INGS=[{n:'달걀',e:'🥚',c:'달걀·유제품',ic:'icons/ing_000.png'},{n:'우유',e:'🥛',c:'달걀·유제품',ic:'icons/ing_001.png'},{n:'생크림',e:'🍶',c:'달걀·유제품',ic:'icons/ing_002.png'},{n:'치즈',e:'🧀',c:'달걀·유제품',ic:'icons/ing_003.png'},{n:'버터',e:'🧈',c:'달걀·유제품',ic:'icons/ing_004.png'},{n:'마요네즈',e:'🍯',c:'달걀·유제품',ic:'icons/ing_005.png'},{n:'양파',e:'🧅',c:'채소',ic:'icons/ing_006.png'},{n:'대파',e:'🫛',c:'채소',ic:'icons/ing_007.png'},{n:'마늘',e:'🧄',c:'채소',ic:'icons/ing_008.png'},{n:'당근',e:'🥕',c:'채소',ic:'icons/ing_009.png'},{n:'감자',e:'🥔',c:'채소',ic:'icons/ing_010.png'},{n:'애호박',e:'🥝',c:'채소',ic:'icons/ing_011.png'},{n:'버섯',e:'🍄',c:'채소',ic:'icons/ing_012.png'},{n:'콩나물',e:'🌱',c:'채소',ic:'icons/ing_013.png'},{n:'양배추',e:'🥗',c:'채소',ic:'icons/ing_014.png'},{n:'오이',e:'🥒',c:'채소',ic:'icons/ing_015.png'},{n:'시금치',e:'🌿',c:'채소',ic:'icons/ing_016.png'},{n:'고추',e:'🌶️',c:'채소',ic:'icons/ing_017.png'},{n:'쪽파',e:'🌿',c:'채소',ic:'icons/ing_018.png'},{n:'피망',e:'🫑',c:'채소',ic:'icons/ing_019.png'},{n:'토마토',e:'🍅',c:'채소',ic:'icons/ing_020.png'},{n:'가지',e:'🍆',c:'채소',ic:'icons/ing_021.png'},{n:'고구마',e:'🍠',c:'채소',ic:'icons/ing_022.png'},{n:'무',e:'🥬',c:'채소',ic:'icons/ing_023.png'},{n:'돼지고기',e:'🐷',c:'육류',ic:'icons/ing_024.png'},{n:'소고기',e:'🐄',c:'육류',ic:'icons/ing_025.png'},{n:'닭고기',e:'🍗',c:'육류',ic:'icons/ing_026.png'},{n:'소시지',e:'🌭',c:'육류',ic:'icons/ing_027.png'},{n:'스팸',e:'🥫',c:'육류',ic:'icons/ing_028.png'},{n:'햄',e:'🍖',c:'육류',ic:'icons/ing_029.png'},{n:'닭가슴살',e:'🍗',c:'육류',ic:'icons/ing_030.png'},{n:'베이컨',e:'🥓',c:'육류',ic:'icons/ing_031.png'},{n:'참치캔',e:'🐟',c:'해산물',ic:'icons/ing_032.png'},{n:'어묵',e:'🍢',c:'해산물',ic:'icons/ing_033.png'},{n:'미역',e:'🌊',c:'해산물',ic:'icons/ing_034.png'},{n:'밥',e:'🍚',c:'주재료',ic:'icons/ing_035.png'},{n:'라면',e:'🍜',c:'주재료',ic:'icons/ing_036.png'},{n:'소면',e:'🍥',c:'주재료',ic:'icons/ing_037.png'},{n:'당면',e:'🍜',c:'주재료',ic:'icons/ing_038.png'},{n:'파스타면',e:'🍝',c:'주재료',ic:'icons/ing_039.png'},{n:'쫄면',e:'🥡',c:'주재료',ic:'icons/ing_040.png'},{n:'식빵',e:'🍞',c:'주재료',ic:'icons/ing_041.png'},{n:'두부',e:'🧊',c:'주재료',ic:'icons/ing_042.png'},{n:'순두부',e:'🥣',c:'주재료',ic:'icons/ing_043.png'},{n:'떡',e:'🍡',c:'주재료',ic:'icons/ing_044.png'},{n:'냉동만두',e:'🥟',c:'가공식품',ic:'icons/ing_045.png'},{n:'밀가루',e:'🌾',c:'주재료',ic:'icons/ing_046.png'},{n:'김',e:'🍙',c:'주재료',ic:'icons/ing_047.png'},{n:'김치',e:'🥬',c:'주재료',ic:'icons/ing_048.png'},{n:'간장',e:'🫗',c:'양념·소스',ic:'icons/ing_049.png'},{n:'된장',e:'🫘',c:'양념·소스',ic:'icons/ing_050.png'},{n:'고추장',e:'🏺',c:'양념·소스',ic:'icons/ing_051.png'},{n:'고춧가루',e:'🔥',c:'양념·소스',ic:'icons/ing_052.png'},{n:'참기름',e:'🫒',c:'양념·소스',ic:'icons/ing_053.png'},{n:'식용유',e:'🛢️',c:'양념·소스',ic:'icons/ing_054.png'},{n:'올리브유',e:'🧴',c:'양념·소스',ic:'icons/ing_055.png'},{n:'소금',e:'🧂',c:'양념·소스',ic:'icons/ing_056.png'},{n:'설탕',e:'🍬',c:'양념·소스',ic:'icons/ing_057.png'},{n:'식초',e:'🍋',c:'양념·소스',ic:'icons/ing_058.png'},{n:'국간장',e:'🥄',c:'양념·소스',ic:'icons/ing_059.png'},{n:'케첩',e:'🍅',c:'양념·소스',ic:'icons/ing_060.png'},{n:'굴소스',e:'🦪',c:'양념·소스',ic:'icons/ing_061.png'},{n:'카레가루',e:'🍛',c:'양념·소스',ic:'icons/ing_062.png'},{n:'우동면',e:'🍜',c:'주재료',ic:'icons/ing_063.png'}];
var CATS=['자주','채소','육류','해산물','달걀·유제품','주재료','양념·소스','전체'];
var FAV_INGS=['달걀','양파','마늘','대파','밥','김치','참치캔','돼지고기','감자','두부','버섯','간장','참기름','식용유','소금','설탕'];

// Expand fallback
var FALLBACK=[];

// === STATE ===
var RECIPES=[],dataLoaded=false,dataSource='',loadDataStartedAt=0,_loadStatusTimer=null;
var sel=new Set(),favs=new Set(),tab='cook',mode='ing',cat='자주',searchQ='',detailR=null,fsR=null,servMul=1,fsServMul=1,mealFilter='전체',diffFilter='전체',timeFilter=0;
var onboardStep=0,showOnboard=!localStorage.getItem('nt_done'),showSearch=false,showFavIngs=true;
// 프로필 사진 (localStorage 저장)
var userProfilePhoto=localStorage.getItem('nt_profile_photo')||'';
function saveProfilePhoto(dataUrl){
  userProfilePhoto=dataUrl;
  if(dataUrl){localStorage.setItem('nt_profile_photo',dataUrl);}else{localStorage.removeItem('nt_profile_photo');}
}
function getProfilePhotoHtml(size,style){
  size=size||40;
  style=style||'';
  if(userProfilePhoto){
    return '<img src="'+userProfilePhoto+'" style="width:'+size+'px;height:'+size+'px;border-radius:50%;object-fit:cover;border:2px solid var(--border);'+style+'">';
  }
  // 이니셜 원형 아바타 (닉네임 첫 글자)
  var initials=(userNickname||'냉').charAt(0);
  var colors=['#E8652A','#1976d2','#388e3c','#7b1fa2','#c62828','#00838f'];
  var colorIdx=initials.charCodeAt(0)%colors.length;
  var bgColor=colors[colorIdx];
  return '<div style="width:'+size+'px;height:'+size+'px;border-radius:50%;background:'+bgColor+';display:flex;align-items:center;justify-content:center;font-size:'+(Math.round(size*0.42))+'px;font-weight:700;color:#fff;border:2px solid var(--border);'+style+'">'+initials+'</div>';
}
function triggerProfilePhotoUpload(){
  var inp=document.createElement('input');
  inp.type='file';
  inp.accept='image/*';
  inp.onchange=function(e){
    var file=e.target.files[0];
    if(!file)return;
    var reader=new FileReader();
    reader.onload=function(ev){
      // 크롭 모달 열기 (드래그/핀치로 원하는 부분 선택 가능)
      openCropModal(ev.target.result, function(croppedDataUrl){
        saveProfilePhoto(croppedDataUrl);
        render();
        showCartPopup('✅ 프로필 사진 저장','프로필 사진이 변경되었습니다!');
      });
    };
    reader.readAsDataURL(file);
  };
  inp.click();
}
function deleteProfilePhoto(){
  if(!confirm('프로필 사진을 삭제하시겠습니까?'))return;
  saveProfilePhoto('');
  render();
  showCartPopup('🗑️ 삭제 완료','프로필 사진이 삭제되었습니다.');
}

// 닉네임 (localStorage 저장, 1~15자) — 최초 접속 시 기본 닉네임 자동 부여
function genDefaultNickname(){
  var n=Math.floor(100000+Math.random()*900000); // 100000~999999
  return '초보요리사'+n;
}
var userNickname=localStorage.getItem('nt_nickname')||'';
if(!userNickname){
  var defaultNick=genDefaultNickname();
  userNickname=defaultNick;
  localStorage.setItem('nt_nickname',defaultNick);
}
function saveNickname(nick){
  var t=(nick||'').trim().slice(0,15);
  userNickname=t;
  localStorage.setItem('nt_nickname',t);
  // Firebase users 노드에 유저 정보 저장
  registerUserToFirebase(t);
}
function getDisplayName(){return userNickname||'냉털러';}
// 닉네임 수정 모드 전환
function enableNicknameEdit(){
  var display=document.getElementById('nicknameDisplay');
  var editArea=document.getElementById('nicknameEditArea');
  if(display)display.style.display='none';
  if(editArea){editArea.style.display='flex';}
  var inp=document.getElementById('nicknameInput');
  if(inp){inp.focus();inp.select();}
}
function cancelNicknameEdit(){
  var display=document.getElementById('nicknameDisplay');
  var editArea=document.getElementById('nicknameEditArea');
  if(display)display.style.display='flex';
  if(editArea)editArea.style.display='none';
  var inp=document.getElementById('nicknameInput');
  if(inp)inp.value=userNickname;
}
// 닉네임 저장 버튼 클릭 시 — Firebase 중복 체크 후 저장
function submitNickname(){
  var v=(document.getElementById('nicknameInput').value||'').trim();
  if(!v){showCartPopup('⚠️ 닉네임 오류','닉네임을 입력해주세요!');return;}
  if(v.length<1||v.length>15){showCartPopup('⚠️ 닉네임 오류','닉네임은 1자 이상 15자 이하로 입력해주세요!');return;}
  // 내 현재 닉네임과 같으면 바로 저장 (중복 체크 불필요)
  if(v===userNickname){showCartPopup('✅ 저장 완료','닉네임이 ['+v+']으로 유지됩니다!');return;}
  // Firebase nicknames 인덱스 노드로 빠른 중복 체크
  var btn=document.getElementById('nicknameSaveBtn');
  if(btn){btn.disabled=true;btn.textContent='확인 중...';}
  // nicknames/{encoded} = uid 형태로 저장된 인덱스 사용
  var encodedNick=v.replace(/[.#$\[\]]/g,'_');
  fbDB.ref('nicknames/'+encodedNick).once('value',function(snap){
    if(btn){btn.disabled=false;btn.textContent='저장';}
    var existingUid=snap.val();
    var isDup=snap.exists()&&existingUid!==fbUid;
    if(isDup){
      showCartPopup('⚠️ 중복 닉네임','이미 사용 중인 닉네임입니다.\n다른 닉네임을 입력해주세요!');
    } else {
      // 이전 닉네임 인덱스 제거
      if(userNickname&&userNickname!==v){
        var oldEncoded=userNickname.replace(/[.#$\[\]]/g,'_');
        fbDB.ref('nicknames/'+oldEncoded).remove().catch(function(){});
      }
      // 새 닉네임 인덱스 저장
      fbDB.ref('nicknames/'+encodedNick).set(fbUid).catch(function(){});
      saveNickname(v);
      render();
      cancelNicknameEdit();
      showCartPopup('✅ 저장 완료','닉네임이 ['+v+']으로 설정되었어요!\n커뮤니티 자랑하기에 반영됩니다 🎉');
    }
  },function(err){
    // Firebase 조회 실패 시 그냥 저장
    if(btn){btn.disabled=false;btn.textContent='저장';}
    saveNickname(v);
    cancelNicknameEdit();
    render();
    showCartPopup('✅ 저장 완료','닉네임이 ['+v+']으로 설정되었어요!\n커뮤니티 자랑하기에 반영됩니다 🎉');
  });
}
// 유저 정보를 Firebase users 노드 + Google Sheets에 등록/업데이트
function registerUserToFirebase(nickname){
  if(!nickname)return;
  var now=new Date().toISOString();
  var userData={uid:fbUid,nickname:nickname,updatedAt:now};
  // Firebase users/{uid} 에 저장 (닉네임 이력도 함께 기록)
  fbDB.ref('users/'+fbUid).transaction(function(existing){
    if(existing){
      // 이전 닉네임이 다를 경우에만 이력에 추가
      var prevNick=existing.nickname||'';
      var updated=Object.assign({},existing,{nickname:nickname,updatedAt:now});
      if(prevNick && prevNick!==nickname){
        var history=existing.nicknameHistory||[];
        history.push({nickname:prevNick,changedAt:now});
        // 최대 20개까지만 보관
        if(history.length>20)history=history.slice(history.length-20);
        updated.nicknameHistory=history;
      }
      return updated;
    } else {
      return Object.assign({},userData,{registeredAt:now,nicknameHistory:[]});
    }
  }).catch(function(){});
  // Google Sheets 유저목록 시트에도 기록 (백그라운드, 실패 무시)
  reportUserToSheet(nickname,now);
}
// Google Sheets 유저목록 → 관리자 수동 동기화 방식으로 변경 (실시간 전송 제거)
function reportUserToSheet(nickname,timestamp){
  // 실시간 전송 제거 - 관리자 동기화 버튼 사용
}

