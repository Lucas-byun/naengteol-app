// 내기록 탭 렌더링 모듈 (renderMyPage)
// 전제: cookHistory, earnedBadges, BADGES, RECIPES, communityPosts,
//        getLevel, getCookStats, getLocalDateStr, render, esc, ehtml,
//        userNickname, userProfilePhoto, getProfilePhotoHtml,
//        enableNicknameEdit, cancelNicknameEdit, submitNickname,
//        triggerProfilePhotoUpload, deleteProfilePhoto,
//        showRecipePhotos, showAllPhotosModal, showAboutPage 등이 타 모듈에서 선언됨

// History & Badge tab rendering — add to "my" tab
function renderMyPage(){
  var stats=getCookStats();
  var h='<div class="recipe-section">';
  // Stats
  // 닉네임 설정 카드
  // 프로필 카드 (사진 + 닉네임)
  h+='<div style="background:var(--card);border:1.5px solid var(--border);border-radius:14px;padding:16px;margin-bottom:16px">';
  // 상단: 프로필 사진 + 닉네임 표시
  h+='<div style="display:flex;align-items:center;gap:14px;margin-bottom:12px">';
  // 프로필 사진 영역
  h+='<div style="position:relative;flex-shrink:0;cursor:pointer" onclick="triggerProfilePhotoUpload()">';
  h+=getProfilePhotoHtml(64);
  h+='<div style="position:absolute;bottom:0;right:0;width:20px;height:20px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;font-size:11px;border:2px solid var(--bg)">📷</div>';
  h+='</div>';
  // 닉네임 영역
  h+='<div style="flex:1;min-width:0">';
  h+='<div style="font-size:11px;color:var(--sub);margin-bottom:4px">내 닉네임 <span style="font-size:10px;color:#aaa">(1~15자, 중복 불가)</span></div>';
  // 읽기전용 표시 영역
  h+='<div id="nicknameDisplay" style="display:flex;align-items:center;gap:8px">';
  h+='<span style="font-size:16px;font-weight:700;color:var(--text)">'+ehtml(userNickname||'닉네임 없음')+'</span>';
  h+='<button onclick="enableNicknameEdit()" style="padding:4px 10px;border:1.5px solid var(--primary);border-radius:8px;background:transparent;color:var(--primary);font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap">수정</button>';
  h+='</div>';
  // 수정 입력 영역 (기본 숨김)
  h+='<div id="nicknameEditArea" style="display:none;flex-direction:column;gap:6px;margin-top:4px">';
  h+='<div style="display:flex;gap:6px;align-items:center">';
  h+='<input id="nicknameInput" type="text" maxlength="15" placeholder="닉네임 입력 (1~15자)" value="'+esc(userNickname)+'" style="flex:1;padding:8px 12px;border:1.5px solid var(--border);border-radius:10px;font-size:14px;font-family:inherit;outline:none;min-width:0" oninput="var l=this.value.length;this.style.borderColor=l>15||l<1?&apos;#e53935&apos;:&apos;var(--border)&apos;">';
  h+='<button id="nicknameSaveBtn" onclick="submitNickname()" style="padding:8px 14px;border:none;border-radius:10px;background:var(--primary);color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap">저장</button>';
  h+='<button onclick="cancelNicknameEdit()" style="padding:8px 10px;border:1.5px solid #ccc;border-radius:10px;background:transparent;color:var(--sub);font-size:13px;cursor:pointer;font-family:inherit;white-space:nowrap">취소</button>';
  h+='</div>';
  h+='</div>';
  h+='</div></div>';
  // 프로필 사진 안내 및 삭제 버튼
  h+='<div style="display:flex;align-items:center;justify-content:space-between;padding-top:10px;border-top:1px solid var(--border)">';
  h+='<div style="font-size:11px;color:var(--sub)">📷 프로필 사진을 탭하여 변경 (자동 압축 적용)</div>';
  if(userProfilePhoto)h+='<button onclick="deleteProfilePhoto()" style="padding:4px 10px;border:1.5px solid #e53935;border-radius:8px;background:transparent;color:#e53935;font-size:11px;cursor:pointer;font-family:inherit">사진 삭제</button>';
  h+='</div>';
  h+='</div>';
  h+='<h2 style="color:var(--text)">📊 내 요리 기록</h2>';
  // === ⭐ 내 Best 요리 TOP3 (내 평점 기반) ===
  (function(){
    var myBestMap={};
    cookHistory.forEach(function(ch){
      if(!ch.rating||ch.rating<1)return;
      if(!myBestMap[ch.id])myBestMap[ch.id]={id:ch.id,totalRating:0,count:0,cookCount:0};
      myBestMap[ch.id].totalRating+=ch.rating;
      myBestMap[ch.id].count++;
    });
    cookHistory.forEach(function(ch){
      if(!myBestMap[ch.id])return;
      myBestMap[ch.id].cookCount=(myBestMap[ch.id].cookCount||0)+1;
    });
    var myBestList=Object.values(myBestMap).map(function(v){
      return Object.assign({},v,{avgRating:v.totalRating/v.count});
    }).sort(function(a,b){
      if(b.avgRating!==a.avgRating)return b.avgRating-a.avgRating;
      return b.cookCount-a.cookCount;
    }).slice(0,3);
    if(myBestList.length>0){
      h+='<div style="background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:16px;padding:16px;margin-bottom:16px">';
      h+='<div style="font-size:13px;font-weight:700;color:#fbc02d;margin-bottom:4px">⭐ 내 Best 요리 TOP'+myBestList.length+'</div>';
      h+='<div style="font-size:10px;color:rgba(255,255,255,.4);margin-bottom:10px">내 평점 높은 순 · 동점 시 요리 횟수 많은 순</div>';
      var myBestMedals=['🥇','🥈','🥉'];
      myBestList.forEach(function(b,i){
        var recipe=RECIPES.find(function(rr){return rr.id===b.id});
        if(!recipe)return;
        var stars='';
        var avgR=Math.round(b.avgRating);
        for(var si=1;si<=5;si++)stars+=(si<=avgR?'★':'☆');
        h+='<div onclick="openDetail(\''+b.id+'\')" style="display:flex;align-items:center;gap:10px;padding:8px 0;cursor:pointer'+(i<myBestList.length-1?';border-bottom:1px solid rgba(255,255,255,.08)':'')+'">'
        h+='<span style="font-size:16px;min-width:22px">'+myBestMedals[i]+'</span>';
        h+='<span style="font-size:24px">'+recipe.emoji+'</span>';
        h+='<div style="flex:1;min-width:0">';
        h+='<div style="font-size:12px;font-weight:600;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+recipe.name+'</div>';
        h+='<div style="font-size:11px;color:#fbc02d;margin-top:2px">'+stars+' <span style="color:rgba(255,255,255,.5);font-size:10px">('+b.avgRating.toFixed(1)+'점 · '+b.cookCount+'회)</span></div>';
        h+='</div>';
        h+='</div>';
      });
      h+='</div>';
    }
  })();
  // 문구형 스탯 카드
  // 코멘트/별점 통계
  var commentCount=cookHistory.filter(function(ch){return ch.comment&&ch.comment.trim()}).length;
  var ratedList=cookHistory.filter(function(ch){return ch.rating&&ch.rating>0});
  var avgRating=ratedList.length>0?(ratedList.reduce(function(s,ch){return s+ch.rating},0)/ratedList.length).toFixed(1):null;
  h+='<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:16px">';
  h+='<div class="info-card" style="text-align:left;padding:14px 16px">';
  h+='<div style="font-size:22px;margin-bottom:4px">🍳</div>';
  h+='<div style="font-size:18px;font-weight:800;color:var(--primary)">'+stats.total+'번</div>';
  h+='<div style="font-size:12px;color:var(--sub);margin-top:2px">'+stats.total+'번 요리했어요!</div>';
  h+='</div>';
  h+='<div class="info-card" style="text-align:left;padding:14px 16px">';
  h+='<div style="font-size:22px;margin-bottom:4px">📖</div>';
  h+='<div style="font-size:18px;font-weight:800;color:var(--primary)">'+stats.unique+'가지</div>';
  h+='<div style="font-size:12px;color:var(--sub);margin-top:2px">다양한 메뉴 도전!</div>';
  h+='</div>';
  h+='<div class="info-card" style="text-align:left;padding:14px 16px">';
  h+='<div style="font-size:22px;margin-bottom:4px">💬</div>';
  h+='<div style="font-size:18px;font-weight:800;color:var(--primary)">'+commentCount+'개</div>';
  h+='<div style="font-size:12px;color:var(--sub);margin-top:2px">코멘트 남긴 요리</div>';
  h+='</div>';
  h+='<div class="info-card" style="text-align:left;padding:14px 16px">';
  h+='<div style="font-size:22px;margin-bottom:4px">⭐</div>';
  h+='<div style="font-size:18px;font-weight:800;color:var(--primary)">'+(avgRating?avgRating+'점':'-')+'</div>';
  h+='<div style="font-size:12px;color:var(--sub);margin-top:2px">'+(avgRating?'평균 만족도 ('+ratedList.length+'회 평가)':'별점 평가 전')+'</div>';
  h+='</div>';
  h+='</div>';
  // 레벨 카드
  var lvl=getLevel();
  var nextLvl=LEVEL_TABLE[lvl.lv]||null; // 다음 레벨 (lvl.lv는 1부터 시작, 배열 인덱스는 0부터)
  var nextLvlMsg='';
  if(nextLvl){
    nextLvlMsg='🎯 Lv.'+(lvl.lv+1)+' 승급 목표: '+nextLvl.req;
  }else{
    nextLvlMsg='🏆 최고 레벨 달성! 전설의 셰프!';
  }
  h+='<div style="background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:16px;padding:24px;margin-bottom:16px;color:#fff;text-align:center;border:1px solid rgba(255,215,0,.2)">';
  h+='<div style="font-size:56px;margin-bottom:10px">'+lvl.icon+'</div>';
  h+='<div style="font-size:12px;color:rgba(255,255,255,.5);margin-bottom:4px">나의 레벨</div>';
  h+='<div style="font-size:24px;font-weight:800;color:#fbc02d;margin-bottom:8px">Lv.'+lvl.lv+' '+lvl.name+'</div>';
  h+='<div style="display:inline-block;background:rgba(255,255,255,.1);padding:4px 12px;border-radius:20px;font-size:11px;color:rgba(255,255,255,.7)">'+nextLvlMsg+'</div>';
  h+='<div style="display:flex;justify-content:space-around;margin-top:24px;padding-top:20px;border-top:1px solid rgba(255,255,255,.1)">';
  h+='<div><div style="font-size:18px;font-weight:700;color:#fbc02d">'+stats.total+'</div><div style="font-size:10px;color:rgba(255,255,255,.5)">전체 요리</div></div>';
  h+='<div><div style="font-size:18px;font-weight:700;color:#fbc02d">'+commentCount+'</div><div style="font-size:10px;color:rgba(255,255,255,.5)">코멘트</div></div>';
  h+='<div><div style="font-size:18px;font-weight:700;color:#fbc02d">'+(avgRating||'-')+'</div><div style="font-size:10px;color:rgba(255,255,255,.5)">평균 별점</div></div>';
  h+='<div><div style="font-size:18px;font-weight:700;color:#fbc02d">'+stats.unique+'</div><div style="font-size:10px;color:rgba(255,255,255,.5)">요리 종류</div></div>';
  h+='</div></div>';
  // Weekly challenge
  var wkDone=stats.thisWeek>=5;
  h+='<div style="background:linear-gradient(135deg,'+(wkDone?'#e8f5e9,#c8e6c9':'#fff8f3,#f0e6d2')+');border:2px solid '+(wkDone?'#66bb6a':'var(--primary)')+';border-radius:14px;padding:14px 16px;margin-bottom:16px">';
  h+='<div style="display:flex;align-items:center;justify-content:space-between">';
  h+='<div style="flex:1">';
  h+='<div style="font-size:11px;font-weight:700;color:'+(wkDone?'#388e3c':'var(--primary)')+';margin-bottom:4px">🎯 이번 주 챌린지</div>';
  h+='<div style="font-size:14px;font-weight:600;color:#333;margin-bottom:6px">이번 주 5회 요리 완성</div>';
  h+='<div style="font-size:12px;color:#666;margin-bottom:8px">'+stats.thisWeek+'/5 완료'+(wkDone?' ✅':'')+'</div>';
  h+='<div style="height:8px;background:var(--border);border-radius:4px;overflow:hidden"><div style="height:100%;width:'+Math.min(stats.thisWeek/5*100,100)+'%;background:'+(wkDone?'#66bb6a':'var(--primary)')+';border-radius:4px;transition:width .3s"></div></div>';
  h+='</div>';
  h+='<div style="text-align:center;margin-left:12px">';
  if(wkDone){
    h+='<div style="font-size:28px">🏆</div>';
    h+='<div style="font-size:11px;font-weight:700;color:#388e3c">달성!</div>';
  }else{
    h+='<div style="font-size:28px;opacity:.5">🎯</div>';
    h+='<div style="font-size:11px;color:var(--sub)">도전 중</div>';
  }
  h+='</div>';
  h+='</div></div>';
  // My Gallery (photos + comments)
  var galleryPosts=cookHistory.filter(function(ch){return ch.photo||ch.comment});
  var photoPosts=cookHistory.filter(function(ch){return ch.photo});
  if(galleryPosts.length>0){
    h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">';
    h+='<h2 style="color:var(--text);margin:0">📸 갤러리 ('+galleryPosts.length+')</h2>';
    h+='<button onclick="showAllPhotosModal()" style="padding:6px 12px;border:1px solid var(--primary);border-radius:8px;background:none;color:var(--primary);font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">🖼️ 전체 사진첩</button>';
    h+='</div>';
    // 전체화면 뷰어용 사진 배열 (미리보기용)
    var previewViewerPhotos=galleryPosts.filter(function(ch){return ch.photo}).slice(0,9).map(function(ch){
      var r2=RECIPES.find(function(x){return x.id===ch.id});
      return{photo:ch.photo,comment:ch.comment||'',date:ch.date,name:r2?r2.name:'',emoji:r2?r2.emoji:'🍳'};
    });
    var previewVIdx=0;
    h+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:4px">';
    galleryPosts.slice(0,9).forEach(function(ch){
      var thisPreviewVIdx=ch.photo?previewVIdx:-1;
      if(ch.photo)previewVIdx++;
      var clickAction=ch.photo?'openPhotoViewer('+JSON.stringify(previewViewerPhotos)+','+thisPreviewVIdx+')':'showRecipePhotos(\''+esc(ch.id)+'\')'; 
      h+='<div style="border-radius:10px;overflow:hidden;cursor:pointer" onclick="'+clickAction+'">';
      h+='<div style="aspect-ratio:1;position:relative">';
      if(ch.photo){
        h+='<img src="'+ch.photo+'" style="width:100%;height:100%;object-fit:cover">';
      }else{
        h+='<div style="width:100%;height:100%;background:var(--card);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px">';
        h+='<div style="font-size:28px;margin-bottom:4px">'+ch.emoji+'</div>';
        h+='</div>';
      }
      h+='<div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,.7));padding:4px 5px">';
      h+='<div style="font-size:9px;color:#fff;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+ch.emoji+' '+ch.name+'</div>';
      h+='</div>';
      h+='</div>';
      if(ch.comment){
        h+='<div style="padding:4px 2px;font-size:10px;color:var(--sub);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">💬 '+ch.comment+'</div>';
      }else{
        h+='<div style="padding:4px 2px;font-size:9px;color:#555">'+ch.date+'</div>';
      }
      h+='</div>';
    });
    h+='</div>';
    if(galleryPosts.length>9){
      h+='<div style="text-align:center;margin-bottom:16px"><button onclick="showAllPhotosModal()" style="padding:6px 16px;border:1px solid var(--border);border-radius:8px;background:var(--card);color:var(--sub);font-size:12px;cursor:pointer;font-family:inherit">+'+(galleryPosts.length-9)+'장 더 보기</button></div>';
    }else{
      h+='<div style="margin-bottom:16px"></div>';
    }
  }
  // My Cooking Records (통합: 카운팅 + 사진 + 최근 일자)
  
  h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">';
  h+='<h2 style="color:var(--text);margin:0">🍳 내 요리 기록</h2>';
  h+='</div>';
  h+='<div style="position:relative;margin-bottom:12px">';
  h+='<input type="text" id="myHistSearch" placeholder="코멘트/요리명 검색..." style="width:100%;padding:9px 36px 9px 14px;border:1px solid var(--border);border-radius:10px;font-size:13px;font-family:inherit;outline:none;background:var(--card);color:var(--text);box-sizing:border-box" oninput="filterMyHistory(this.value)">';
  h+='<span style="position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:14px;color:#aaa">🔍</span>';
  h+='</div>';
  h+='<div id="myHistList">';
  var countMap={};
  cookHistory.forEach(function(ch){
    if(!countMap[ch.id])countMap[ch.id]={count:0,name:ch.name,emoji:ch.emoji,photo:null,lastDate:ch.date,id:ch.id,shared:false};
    countMap[ch.id].count++;
    if(ch.date>countMap[ch.id].lastDate)countMap[ch.id].lastDate=ch.date;
    if(ch.photo&&!countMap[ch.id].photo)countMap[ch.id].photo=ch.photo;
    if(ch.comment&&!countMap[ch.id].comment)countMap[ch.id].comment=ch.comment;
    if(ch.shared)countMap[ch.id].shared=true;
  });
  var sorted=Object.values(countMap).sort(function(a,b){return b.lastDate>a.lastDate?1:b.lastDate<a.lastDate?-1:b.count-a.count});
  if(sorted.length===0){
    h+='<div class="empty"><div class="em">🧑‍🍳</div><div class="empty-title">아직 요리 기록이 없어요</div><div class="empty-sub">레시피를 선택하고 요리를 완성해보세요!<br>요리 횟수에 따라 레벨이 올라가요.</div><button class="empty-cta" onclick="tab=\\\'cook\\\';render()">🥕 재료 고르러 가기</button></div>';
  }else{
    // Diet suggestion
    var recentCats=cookHistory.slice(0,5).map(function(h2){return h2.cat});
    var allCats=['밥/덮밥','면류','찌개/국','달걀요리','볶음/구이','조림','전/부침','나물/반찬','간식/분식'];
    var missingCats=allCats.filter(function(c){return recentCats.indexOf(c)===-1});
    if(missingCats.length>0&&cookHistory.length>=3){
      var suggestCat=missingCats[Math.floor(Math.random()*missingCats.length)];
      var suggestR=RECIPES.filter(function(r2){return r2.cat===suggestCat})[0];
      if(suggestR)h+='<div style="background:#e3f2fd;border-radius:10px;padding:12px;margin-bottom:12px;font-size:13px;color:#333">💡 <b>'+suggestCat+'</b>은 어때요? <span style="color:#1976d2;cursor:pointer" onclick="openDetail(\''+suggestR.id+'\')">→ '+suggestR.name+'</span></div>';
    }
    sorted.forEach(function(item,idx){
      if(!localStorage.getItem('nt_hist_all')&&idx>=5)return;
      var recipePhotos=cookHistory.filter(function(ch){return ch.id===item.id&&ch.photo});
      var lastComment=cookHistory.find(function(ch){return ch.id===item.id&&ch.comment});
      var itemComment=lastComment?lastComment.comment:'';
      h+='<div style="padding:10px 0;border-bottom:1px solid var(--border)" data-hist-id="'+esc(item.id)+'" data-hist-name="'+esc(item.name)+'" data-hist-comment="'+esc(itemComment)+'">';
      h+='<div style="display:flex;align-items:center;gap:8px">';
      h+='<div style="width:36px;height:36px;border-radius:10px;background:var(--card);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;border:1px solid var(--border);cursor:pointer" onclick="showRecipePhotos(\''+esc(item.id)+'\')">' +item.emoji+'</div>';
      h+='<div style="flex:1;min-width:0;cursor:pointer" onclick="showRecipePhotos(\''+esc(item.id)+'\')">';
      h+='<div style="display:flex;align-items:center;gap:6px;overflow:hidden">';
      h+='<span style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text)">'+item.name+'</span>';
      h+='<span style="font-size:10px;color:#fff;background:var(--primary);border-radius:10px;padding:1px 6px;flex-shrink:0">'+item.count+'회</span>';
      h+='</div>';
      h+='<div style="font-size:10px;color:var(--sub);margin-top:2px">'+item.lastDate.slice(5)+(recipePhotos.length>0?' · 사진 '+recipePhotos.length+'장':'')+'</div>';
      // 별점 표시 (최근 요리에 별점이 있는 경우)
      var lastRating=cookHistory.find(function(ch){return ch.id===item.id&&ch.rating});
      if(lastRating)h+='<div style="font-size:11px;margin-top:2px">'+getRatingStars(lastRating.rating)+'</div>';
      if(lastComment)h+='<div style="font-size:11px;color:var(--sub);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">💬 '+lastComment.comment+'</div>';
      h+='</div>';
      h+='<div style="display:flex;flex-direction:column;gap:4px;flex-shrink:0">';
      h+='<button onclick="event.stopPropagation();editCommentBtn(this)" data-id="'+esc(item.id)+'" data-name="'+esc(item.name)+'" style="padding:5px 10px;border:1px solid '+(lastComment?'#7b5ea7':'var(--primary)')+';border-radius:8px;background:'+(lastComment?'var(--bg)':'rgba(255,140,0,.08)')+';color:'+(lastComment?'#7b5ea7':'var(--primary)')+';font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">'+(lastComment?'💬 한줄평 수정':'✏️ 한마디 남기기')+'</button>';
      if(item.shared){
        h+='<button disabled style="padding:5px 10px;border:1px solid #aaa;border-radius:8px;background:#f5f5f5;color:#aaa;font-size:11px;font-weight:700;cursor:not-allowed;font-family:inherit">자랑완료</button>';
      } else {
        h+='<button onclick="event.stopPropagation();openHistoryShare(\''+esc(item.id)+'\',\''+esc(item.name)+'\',\''+esc(item.emoji)+'\')" style="padding:5px 10px;border:1px solid var(--primary);border-radius:8px;background:var(--bg);color:var(--primary);font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">자랑하기</button>';
      }
      h+='<button onclick="event.stopPropagation();deleteCookHistory(\''+esc(item.id)+'\')" style="padding:5px 10px;border:1px solid #d84315;border-radius:8px;background:var(--bg);color:#d84315;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">삭제</button>';
      h+='</div>';     h+='</div>';
      h+='</div>';
    });
    if(!localStorage.getItem('nt_hist_all')&&sorted.length>5){
      h+='<div style="text-align:center;padding:10px"><button onclick="localStorage.setItem(\'nt_hist_all\',\'1\');render()" style="padding:6px 16px;border:1px solid var(--border);border-radius:8px;background:var(--card);color:var(--sub);font-size:12px;cursor:pointer;font-family:inherit">+'+(sorted.length-5)+'개 더보기</button></div>';
    }else if(localStorage.getItem('nt_hist_all')&&sorted.length>5){
      h+='<div style="text-align:center;padding:10px"><button onclick="localStorage.removeItem(\'nt_hist_all\');render()" style="padding:6px 16px;border:1px solid var(--border);border-radius:8px;background:var(--card);color:var(--sub);font-size:12px;cursor:pointer;font-family:inherit">접기</button></div>';
    }
  }
  h+='<div id="myHistNoResult" style="display:none;text-align:center;padding:20px;color:var(--sub);font-size:13px">🔍 검색 결과가 없어요</div>';
  h+='</div>'; // myHistList 닫기
  // Badges
  var bc=earnedBadges.length;
  h+='<h2 style="margin-top:16px;color:var(--text)">🏅 뱃지 ('+earnedBadges.length+'/'+BADGES.length+')</h2>';
  // 획득한 뱃지
  var earnedList=BADGES.filter(function(b){return earnedBadges.indexOf(b.id)!==-1});
  var notEarnedList=BADGES.filter(function(b){return earnedBadges.indexOf(b.id)===-1&&!b.hidden});
  var hiddenList=BADGES.filter(function(b){return earnedBadges.indexOf(b.id)===-1&&b.hidden});
  if(earnedList.length>0){
    h+='<div style="font-size:12px;font-weight:700;color:var(--primary);margin-bottom:6px">✅ 획득한 뱃지 ('+earnedList.length+')</div>';
    h+='<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:12px">';
    earnedList.forEach(function(b){
      h+='<div style="text-align:center;padding:8px;border-radius:10px;background:var(--card);border:1px solid var(--border)">';
      h+='<div style="font-size:24px">'+b.icon+'</div>';
      h+='<div style="font-size:10px;margin-top:2px;color:var(--text)">'+b.name+'</div>';

      h+='</div>';
    });
    h+='</div>';
  }
  // 미획득 뱃지
  if(notEarnedList.length>0){
    h+='<div style="font-size:12px;font-weight:700;color:var(--sub);margin-bottom:6px">🔲 미획득 ('+notEarnedList.length+')</div>';
    h+='<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:12px">';
    notEarnedList.forEach(function(b){
      h+='<div style="text-align:center;padding:8px;border-radius:10px;background:var(--border);opacity:.5">';
      h+='<div style="font-size:24px;filter:grayscale(1)">'+b.icon+'</div>';
      h+='<div style="font-size:10px;margin-top:2px;color:var(--sub)">'+b.name+'</div>';
      h+='</div>';
    });
    h+='</div>';
  }
  // 히든 뱃지
  if(hiddenList.length>0){
    h+='<div style="font-size:12px;font-weight:700;color:var(--sub);margin-bottom:6px">🔒 히든 뱃지 ('+hiddenList.length+')</div>';
    h+='<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:12px">';
    hiddenList.forEach(function(b){
      h+='<div style="text-align:center;padding:8px;border-radius:10px;background:var(--border);opacity:.25">';
      h+='<div style="font-size:24px">🔒</div>';
      h+='<div style="font-size:10px;margin-top:2px;color:var(--sub)">???</div>';
      h+='</div>';
    });
    h+='</div>';
  }
  // 보상 잠금 해제 (뱃지 아래) — 레벨 15단계에 맞춰 4단계 보상
  h+='<h2 style="margin-top:16px;color:var(--text)">🎁 보상</h2>';
  h+='<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">';
  
  // 보상 1: 뇱지 20개 (Lv.7 냉털 고수 달성 시점)
  h+='<div style="display:flex;align-items:center;gap:12px;padding:12px;border-radius:12px;background:'+(bc>=20?'linear-gradient(135deg,#fff8f3,#f0e6d2)':'var(--card)')+';border:1px solid '+(bc>=20?'var(--primary)':'var(--border)')+'">';
  h+='<div style="font-size:24px">'+(bc>=20?'🔓':'🔒')+'</div>';
  h+='<div style="flex:1"><div style="font-size:13px;font-weight:700;color:'+(bc>=20?'var(--primary)':'var(--sub)')+'">🏅 뱃지 20개 달성 (Lv.7)</div>';
  h+='<div style="font-size:11px;color:'+(bc>=20?'#555':'var(--sub)')+'">🎲 "나를 위한 추천" 업그레이드 <span style="font-size:10px;color:#aaa">(추후 기능 추가 예정)</span></div>';
  if(bc<20)h+='<div style="font-size:10px;color:#aaa;margin-top:2px">'+bc+'/20 — '+(20-bc)+'개 더 모으면 해금</div>';
  h+='</div></div>';
  
  // 보상 2: 뱃지 45개 (Lv.10 주방의 달인 달성 시점)
  h+='<div style="display:flex;align-items:center;gap:12px;padding:12px;border-radius:12px;background:'+(bc>=45?'linear-gradient(135deg,#e8f5e9,#c8e6c9)':'var(--card)')+';border:1px solid '+(bc>=45?'#66bb6a':'var(--border)')+'">';
  h+='<div style="font-size:24px">'+(bc>=45?'🔓':'🔒')+'</div>';
  h+='<div style="flex:1"><div style="font-size:13px;font-weight:700;color:'+(bc>=45?'#388e3c':'var(--sub)')+'">⚡ 뱃지 45개 달성 (Lv.10)</div>';
  h+='<div style="font-size:11px;color:'+(bc>=45?'#555':'var(--sub)')+'">📊 요리 통계 상세 분석 해금 <span style="font-size:10px;color:#aaa">(추후 기능 추가 예정)</span></div>';
  if(bc<45)h+='<div style="font-size:10px;color:#aaa;margin-top:2px">'+bc+'/45 — '+(45-bc)+'개 더 모으면 해금</div>';
  h+='</div></div>';
  
  // 보상 3: 뱃지 70개 (Lv.13 전설의 셰프 달성 시점)
  h+='<div style="display:flex;align-items:center;gap:12px;padding:12px;border-radius:12px;background:'+(bc>=70?'linear-gradient(135deg,#e3f2fd,#bbdefb)':'var(--card)')+';border:1px solid '+(bc>=70?'#42a5f5':'var(--border)')+'">';
  h+='<div style="font-size:24px">'+(bc>=70?'🔓':'🔒')+'</div>';
  h+='<div style="flex:1"><div style="font-size:13px;font-weight:700;color:'+(bc>=70?'#1976d2':'var(--sub)')+'">🔱 뱃지 70개 달성 (Lv.13)</div>';
  h+='<div style="font-size:11px;color:'+(bc>=70?'#555':'var(--sub)')+'">🏆 명예의 전당 + 프리미엄 뱃지 테두리 <span style="font-size:10px;color:#aaa">(추후 기능 추가 예정)</span></div>';
  if(bc<70)h+='<div style="font-size:10px;color:#aaa;margin-top:2px">'+bc+'/70 — '+(70-bc)+'개 더 모으면 해금</div>';
  h+='</div></div>';
  
  // 보상 4: 뱃지 90개 전부 (Lv.15 냉털 레전드 달성)
  h+='<div style="display:flex;align-items:center;gap:12px;padding:12px;border-radius:12px;background:'+(bc>=90?'linear-gradient(135deg,#fff8e1,#ffe082)':'var(--card)')+';border:1px solid '+(bc>=90?'#f9a825':'var(--border)')+'">';
  h+='<div style="font-size:24px">'+(bc>=90?'🌟':'🔒')+'</div>';
  h+='<div style="flex:1"><div style="font-size:13px;font-weight:700;color:'+(bc>=90?'#f57f17':'var(--sub)')+'">🌟 뱃지 90개 ALL 달성 (Lv.15)</div>';
  h+='<div style="font-size:11px;color:'+(bc>=90?'#555':'var(--sub)')+'">👑 냉털 레전드 칭호 + 특별 프로필 테두리 <span style="font-size:10px;color:#aaa">(추후 기능 추가 예정)</span></div>';
  if(bc<90)h+='<div style="font-size:10px;color:#aaa;margin-top:2px">'+bc+'/90 — '+(90-bc)+'개 더 모으면 해금</div>';
  h+='</div></div>';
  
  h+='</div>';
  h+='</div>';
  // 데이터 저장 안내문
  h+='<div style="margin:0 16px 16px;padding:14px 16px;background:#fff8e1;border-radius:12px;border:1px solid #ffe082">';
  h+='<div style="font-size:12px;font-weight:700;color:#f57f17;margin-bottom:6px">📦 내 기록 저장 안내</div>';
  h+='<div style="font-size:12px;color:#795548;line-height:1.8">';
  h+='요리 기록(텍스트)은 서버에 자동 백업됩니다.<br>';
  h+='단, 요리 사진은 이 기기에만 저장되어 <b>앱 삭제 시 사라질 수 있어요.</b><br>';
  h+='<span style="color:#1976d2">🔜 추후 구글 계정 연동 시 사진 포함 전체 기록 보관 기능이 추가될 예정입니다.</span>';
  h+='</div></div>';

  h+='<div style="text-align:center;padding:16px 0 32px"><button onclick="showAboutPage()" style="padding:10px 24px;border:1px solid var(--border);border-radius:10px;background:var(--card);color:var(--sub);font-size:13px;cursor:pointer;font-family:inherit">ℹ️ 앱 정보 · 개인정보처리방침</button></div>';
  h+='<div id="myPageInstallBtn" style="display:none;text-align:center;padding:0 16px 32px"><button onclick="triggerInstallPrompt()" style="width:100%;padding:12px 24px;border:none;border-radius:10px;background:linear-gradient(135deg,var(--primary),#ff9800);color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 4px 12px rgba(232,101,42,.3)">📱 홈 화면에 냉털 추가</button><div style="font-size:11px;color:var(--sub);margin-top:8px">언제든 쉽게 앱을 실행할 수 있어요!</div></div>';
  return h;
}
