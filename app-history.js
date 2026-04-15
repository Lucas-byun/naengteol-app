// 요리 기록 · 사진 갤러리 · 사진 뷰어 · 크롭 모달 모듈
// 전제: cookHistory, userPosts, communityPosts, RECIPES, BADGES, earnedBadges,
//        fbDB, fbUid, getLocalDateStr, render, showCartPopup, checkBadges,
//        checkLevelUp, completeMission, todayMission 등은 전역 또는 타 모듈에서 선언됨

function addPhotoToHistory(idx,input){
  var file=input.files[0];if(!file)return;
  var reader=new FileReader();
  reader.onload=function(e){
    // 크롭 모달 열기 (드래그/핀치로 원하는 부분 선택 가능)
    openCropModal(e.target.result, function(croppedDataUrl){
      cookHistory[idx].photo=croppedDataUrl;
      cookHistory[idx].photoDate=getLocalDateStr();
      localStorage.setItem('nt_history',JSON.stringify(cookHistory));
      render();
      showCartPopup('📸 사진 추가 완료!',cookHistory[idx].name+' ('+cookHistory[idx].date+' 요리) 사진 저장됨');
    });
  };
  reader.readAsDataURL(file);
}
function showRecipePhotos(recipeId,sortAsc){
  var photos=cookHistory.filter(function(ch){return ch.id===recipeId&&ch.photo});
  var allEntries=cookHistory.filter(function(ch){return ch.id===recipeId&&(ch.photo||ch.comment)});
  if(sortAsc)allEntries=allEntries.slice().reverse();
  var r=RECIPES.find(function(x){return x.id===recipeId});
  // 사진 없는 요리 기록 목록 (사진 추가 대상 후보)
  var noPhotoEntries=cookHistory.map(function(ch,i){return{ch:ch,idx:i};}).filter(function(o){return o.ch.id===recipeId&&!o.ch.photo});
  var histIdx=noPhotoEntries.length>0?noPhotoEntries[0].idx:-1;
  // 전체화면 뷰어용 사진 배열 준비
  var viewerList=allEntries.filter(function(ch){return ch.photo}).map(function(ch){return{photo:ch.photo,comment:ch.comment||'',date:ch.date,name:r?r.name:'',emoji:r?r.emoji:'🍳'};});
  var h='<div id="galleryPopup" style="position:fixed;top:0;left:0;right:0;bottom:0;z-index:999;background:rgba(0,0,0,.85);overflow-y:auto" onclick="if(event.target===this)this.remove()">';
  h+='<div style="max-width:480px;margin:0 auto;padding:16px">';
  // Header
  h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">';
  h+='<div style="color:#fff;font-size:16px;font-weight:700">'+(r?r.emoji+' '+r.name:'')+'</div>';
  h+='<button onclick="document.getElementById(\'galleryPopup\').remove()" style="background:none;border:none;color:#fff;font-size:24px;cursor:pointer">✕</button>';
  h+='</div>';
  h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">';
  h+='<span style="color:#aaa;font-size:12px">📸 갤러리 · '+photos.length+'장</span>';
  h+='<button onclick="var p=document.getElementById(\'galleryPopup\');if(p)p.remove();showRecipePhotos(\''+esc(recipeId)+'\','+(sortAsc?'false':'true')+')" style="background:none;border:1px solid rgba(255,255,255,.3);color:#ccc;font-size:11px;padding:3px 10px;border-radius:6px;cursor:pointer;font-family:inherit">'+(sortAsc?'↓ 최신순':'↑ 오래된순')+'</button>';
  h+='</div>';
  // Add photo section - 사진 없는 기록이 여러 개면 선택 UI 표시
  if(noPhotoEntries.length>0){
    h+='<div id="photoAddSection" style="margin-bottom:16px">';
    if(noPhotoEntries.length===1){
      // 사진 없는 기록이 1개: 기존 방식대로 바로 추가
      h+='<label style="display:flex;align-items:center;justify-content:center;gap:6px;padding:12px;border:2px dashed rgba(255,255,255,.3);border-radius:12px;color:#fff;font-size:14px;font-weight:700;cursor:pointer">';
      h+='<input type="file" accept="image/*" style="display:none" onchange="previewPhotoInGallery('+noPhotoEntries[0].idx+',this)">';
      h+='📸 사진 추가하기</label>';
    }else{
      // 사진 없는 기록이 여러 개: 어느 기록에 붙일지 선택
      h+='<div style="border:2px dashed rgba(255,255,255,.3);border-radius:12px;padding:12px">';
      h+='<div style="color:#fff;font-size:13px;font-weight:700;margin-bottom:8px;text-align:center">📸 어느 요리 기록에 사진을 추가할까요?</div>';
      h+='<div style="display:flex;flex-direction:column;gap:6px">';
      noPhotoEntries.forEach(function(o){
        var label=o.ch.date+(o.ch.rating?' · '+getRatingStars(o.ch.rating):'')+(o.ch.comment?' · \"'+o.ch.comment.substring(0,15)+(o.ch.comment.length>15?'…':'')+'\"':'');
        h+='<label style="display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.1);border-radius:8px;padding:10px 12px;cursor:pointer">';
        h+='<input type="file" accept="image/*" style="display:none" onchange="previewPhotoInGallery('+o.idx+',this)">';
        h+='<span style="font-size:18px">'+(r?r.emoji:'🍳')+'</span>';
        h+='<span style="color:#fff;font-size:12px;flex:1">'+label+'</span>';
        h+='<span style="color:#fbc02d;font-size:11px">📸 추가</span>';
        h+='</label>';
      });
      h+='</div></div>';
    }
    // Preview area (hidden initially)
    h+='<div id="photoPreviewArea" style="display:none;margin-top:12px">';
    h+='<div id="photoTargetInfo" style="color:#fbc02d;font-size:11px;margin-bottom:6px;text-align:center"></div>';
    h+='<img id="galleryPreviewImg" style="width:100%;border-radius:12px;margin-bottom:10px">';
    h+='<input type="text" id="galleryCommentInput" placeholder="한줄 코멘트 (선택)" style="width:100%;padding:10px 14px;border:1px solid rgba(255,255,255,.2);border-radius:10px;font-size:13px;font-family:inherit;outline:none;background:rgba(255,255,255,.1);color:#fff;box-sizing:border-box;margin-bottom:10px">';
    h+='<div style="display:flex;gap:8px">';
    h+='<button onclick="cancelPhotoPreview()" style="flex:1;padding:10px;border:1px solid rgba(255,255,255,.3);border-radius:10px;background:none;color:#fff;font-size:13px;cursor:pointer;font-family:inherit">취소</button>';
    h+='<button onclick="savePhotoWithComment(_pendingPhotoIdx)" style="flex:1;padding:10px;border:none;border-radius:10px;background:var(--primary);color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">저장</button>';
    h+='</div></div>';
    h+='</div>';
  }
  // Existing photos & comments
  if(allEntries.length>0){
    var viewerPhotoIdx=0;
    allEntries.forEach(function(ch){
      var chIdx=cookHistory.indexOf(ch);
      var thisViewerIdx=ch.photo?viewerPhotoIdx:-1;
      if(ch.photo)viewerPhotoIdx++;
      h+='<div style="margin-bottom:20px;background:rgba(255,255,255,.05);border-radius:14px;overflow:hidden">';
      if(ch.photo){
        h+='<div style="position:relative">';
        // 사진 클릭 시 전체화면 뷰어
        h+='<img src="'+ch.photo+'" style="width:100%;display:block;border-radius:14px 14px 0 0;object-fit:cover;cursor:zoom-in" onclick="openPhotoViewer('+JSON.stringify(viewerList)+','+thisViewerIdx+')">';
        h+='<div style="position:absolute;bottom:8px;right:8px;display:flex;gap:6px">';
        h+='<label style="background:rgba(0,0,0,.65);color:#fff;font-size:11px;padding:5px 10px;border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:4px">';
        h+='<input type="file" accept="image/*" style="display:none" onchange="changeExistingPhoto('+chIdx+',this,\''+esc(recipeId)+'\')">'; 
        h+='🔄 변경</label>';
        h+='</div>';
        h+='</div>';
      }else{
        h+='<div style="padding:16px;text-align:center">';
        h+='<div style="font-size:36px;margin-bottom:6px">'+(r?r.emoji:'🍳')+'</div>';
        h+='<label style="display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,.15);color:#fff;font-size:12px;padding:6px 12px;border-radius:8px;cursor:pointer">';
        h+='<input type="file" accept="image/*" style="display:none" onchange="changeExistingPhoto('+chIdx+',this,\''+esc(recipeId)+'\')">'; 
        h+='📸 사진 추가</label>';
        h+='</div>';
      }
      h+='<div style="padding:10px 12px">';
      h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">';
      h+='<span style="color:#aaa;font-size:11px">🍳 '+ch.date+(ch.photoDate&&ch.photoDate!==ch.date?' · 📸 '+ch.photoDate:'')+'</span>';
      h+='<div style="display:flex;gap:4px">';
      if(ch.photo)h+='<button onclick="sharePhotoToCommunity('+chIdx+')" style="background:none;border:1px solid rgba(255,165,0,.6);color:#ffd580;font-size:10px;padding:3px 8px;border-radius:6px;cursor:pointer;font-family:inherit">📢 자랑</button>';
      h+='<button onclick="inlineEditComment('+chIdx+',\''+esc(recipeId)+'\')" style="background:none;border:1px solid rgba(255,255,255,.3);color:#ccc;font-size:10px;padding:3px 8px;border-radius:6px;cursor:pointer;font-family:inherit">'+(ch.comment?'✏️ 수정':'💬 코멘트')+'</button>';
      if(ch.photo)h+='<button onclick="deletePhotoOnly('+chIdx+',\''+esc(recipeId)+'\')" style="background:none;border:1px solid rgba(229,57,53,.6);color:#ef9a9a;font-size:10px;padding:3px 8px;border-radius:6px;cursor:pointer;font-family:inherit">🗑️</button>';
      h+='</div>';
      h+='</div>';
      // 별점 표시
      if(ch.rating){
        h+='<div style="margin-bottom:4px">'+getRatingStars(ch.rating)+'<span style="color:#aaa;font-size:10px;margin-left:4px">'+ch.rating+'/5</span></div>';
      }
      // 코멘트 인라인 편집 영역
      h+='<div id="commentArea_'+chIdx+'">';
      if(ch.comment){
        h+='<div style="color:#fff;font-size:13px;line-height:1.5;background:rgba(255,255,255,.08);border-radius:8px;padding:8px 10px">'+ch.comment+'</div>';
      }else{
        h+='<div style="color:#666;font-size:12px;font-style:italic">코멘트 없음</div>';
      }
      h+='</div>';
      h+='</div>';
      h+='</div>';
    });
  }else{
    h+='<div style="text-align:center;padding:24px 0">';
    h+='<div style="font-size:40px;margin-bottom:8px">📷</div>';
    h+='<div style="color:#aaa;font-size:13px">아직 사진이 없어요<br>위 버튼으로 첫 사진을 추가해보세요!</div>';
    h+='</div>';
  }
  h+='</div></div>';
  document.body.insertAdjacentHTML('beforeend',h);
}
function changeExistingPhoto(idx,input,recipeId){
  var file=input.files[0];if(!file)return;
  var reader=new FileReader();
  reader.onload=function(e){
    // 크롭 모달 열기 (드래그/핀치로 원하는 부분 선택 가능)
    openCropModal(e.target.result, function(croppedDataUrl){
      cookHistory[idx].photo=croppedDataUrl;
      cookHistory[idx].photoDate=getLocalDateStr();
      localStorage.setItem('nt_history',JSON.stringify(cookHistory));
      var popup=document.getElementById('galleryPopup');
      if(popup)popup.remove();
      render();
      showRecipePhotos(recipeId);
    });
  };
  reader.readAsDataURL(file);
}
function editPhotoComment(idx,recipeId){
  var current=cookHistory[idx]?cookHistory[idx].comment||'':'';
  var newComment=prompt('코멘트를 입력하세요 (최대 80자):',current);
  if(newComment===null)return;
  newComment=newComment.trim().substring(0,80);
  cookHistory[idx].comment=newComment;
  localStorage.setItem('nt_history',JSON.stringify(cookHistory));
  var popup=document.getElementById('galleryPopup');
  if(popup)popup.remove();
  render();
  showRecipePhotos(recipeId);
}
// ===== 별점 / 코멘트 헬퍼 함수 =====
function setRating(val){
  document.getElementById('ratingInput').value=val;
  hoverRating(val,true);
}
function hoverRating(val,lock){
  var stars=document.querySelectorAll('#ratingStars span');
  var locked=parseInt(document.getElementById('ratingInput').value)||0;
  stars.forEach(function(s,i){
    var n=i+1;
    var active=val>0?n<=val:n<=locked;
    s.textContent=active?'★':'☆';
    s.style.color=active?'#fbc02d':'#ccc';
    s.style.transform=(val>0&&n===val)?'scale(1.2)':'scale(1)';
  });
}
function applyCommentTag(tag){
  var inp=document.getElementById('commentInput');
  if(!inp)return;
  // 20자 초과 방지
  var t=tag.length>20?tag.slice(0,20):tag;
  inp.value=t;
  updateCommentCount(inp,'commentCount');
  inp.focus();
}
function updateCommentCount(inp,countId){
  var el=document.getElementById(countId);
  if(!el)return;
  var len=inp.value.length;
  el.textContent=len+'/20';
  el.style.color=len>=18?'#e53935':len>=15?'#ff9800':'#aaa';
}
function getRatingStars(rating){
  if(!rating||rating<1)return '';
  var s='';
  for(var i=1;i<=5;i++)s+=(i<=rating?'★':'☆');
  return '<span style="color:#fbc02d;font-size:13px">'+s+'</span>';
}
function filterMyHistory(q){
  var list=document.getElementById('myHistList');
  if(!list)return;
  var items=list.querySelectorAll('[data-hist-id]');
  var kw=q.trim().toLowerCase();
  var found=0;
  items.forEach(function(el){
    var name=(el.getAttribute('data-hist-name')||'').toLowerCase();
    var comment=(el.getAttribute('data-hist-comment')||'').toLowerCase();
    var show=!kw||name.indexOf(kw)!==-1||comment.indexOf(kw)!==-1;
    el.style.display=show?'':'none';
    if(show)found++;
  });
  var noResult=document.getElementById('myHistNoResult');
  if(noResult)noResult.style.display=(kw&&found===0)?'block':'none';
}
function deletePhotoOnly(idx,recipeId){
  if(!confirm('사진만 삭제할까요?\n(요리 기록과 코멘트는 유지됩니다)'))return;
  delete cookHistory[idx].photo;
  delete cookHistory[idx].photoDate;
  localStorage.setItem('nt_history',JSON.stringify(cookHistory));
  var popup=document.getElementById('galleryPopup');
  if(popup)popup.remove();
  render();
  showRecipePhotos(recipeId);
}
function inlineEditComment(idx,recipeId){
  var area=document.getElementById('commentArea_'+idx);
  if(!area)return;
  var current=cookHistory[idx]?cookHistory[idx].comment||'':'';
  // 이미 입력중이면 스킵
  if(area.querySelector('textarea'))return;
  area.innerHTML='';
  var wrap=document.createElement('div');
  wrap.style.cssText='display:flex;flex-direction:column;gap:6px';
  var ta=document.createElement('textarea');
  ta.value=current;
  ta.placeholder='한줄 코멘트 (최대 20자)';
  ta.maxLength=20;
  ta.style.cssText='width:100%;padding:8px 10px;border:1px solid rgba(255,255,255,.3);border-radius:8px;font-size:13px;font-family:inherit;outline:none;background:rgba(255,255,255,.1);color:#fff;box-sizing:border-box;resize:none;line-height:1.4';
  ta.rows=1;
  // 글자수 카운터
  var countSpan=document.createElement('span');
  countSpan.style.cssText='font-size:10px;color:#aaa;text-align:right;display:block';
  countSpan.textContent=current.length+'/20';
  ta.addEventListener('input',function(){
    var l=ta.value.length;
    countSpan.textContent=l+'/20';
    countSpan.style.color=l>=18?'#e53935':l>=15?'#ff9800':'#aaa';
  });
  // 템플릿 태그
  var ITAGS=['😋 맛있어요','🎉 첫 성공!','👨‍👩‍👧 가족이 좋아해','🔄 다음엔 더 잘할게','간단하고 맛있어','실패했지만 맛있어'];
  var tagWrap=document.createElement('div');
  tagWrap.style.cssText='display:flex;flex-wrap:wrap;gap:4px;margin-top:4px';
  ITAGS.forEach(function(t){
    var sp=document.createElement('span');
    sp.textContent=t;
    sp.style.cssText='padding:3px 8px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);border-radius:12px;font-size:10px;color:#ccc;cursor:pointer';
    sp.onclick=function(){
      ta.value=t.length>20?t.slice(0,20):t;
      var l=ta.value.length;
      countSpan.textContent=l+'/20';
      countSpan.style.color=l>=18?'#e53935':l>=15?'#ff9800':'#aaa';
    };
    tagWrap.appendChild(sp);
  });
  var btnRow=document.createElement('div');
  btnRow.style.cssText='display:flex;gap:6px;margin-top:4px';
  var cancelBtn=document.createElement('button');
  cancelBtn.textContent='취소';
  cancelBtn.style.cssText='flex:1;padding:6px;border:1px solid rgba(255,255,255,.3);border-radius:8px;background:none;color:#ccc;font-size:12px;cursor:pointer;font-family:inherit';
  cancelBtn.onclick=function(){
    var c=cookHistory[idx]?cookHistory[idx].comment||'':'';
    var stars=cookHistory[idx]?getRatingStars(cookHistory[idx].rating):'';
    area.innerHTML=(stars?'<div style="margin-bottom:4px">'+stars+'</div>':'')+(c?'<div style="color:#fff;font-size:13px;line-height:1.5;background:rgba(255,255,255,.08);border-radius:8px;padding:8px 10px">'+c+'</div>':'<div style="color:#666;font-size:12px;font-style:italic">코멘트 없음</div>');
  };
  var saveBtn=document.createElement('button');
  saveBtn.textContent='저장';
  saveBtn.style.cssText='flex:1;padding:6px;border:none;border-radius:8px;background:var(--primary);color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit';
  saveBtn.onclick=function(){
    var val=ta.value.trim().substring(0,20);
    cookHistory[idx].comment=val;
    localStorage.setItem('nt_history',JSON.stringify(cookHistory));
    var stars=cookHistory[idx]?getRatingStars(cookHistory[idx].rating):'';
    area.innerHTML=(stars?'<div style="margin-bottom:4px">'+stars+'</div>':'')+(val?'<div style="color:#fff;font-size:13px;line-height:1.5;background:rgba(255,255,255,.08);border-radius:8px;padding:8px 10px">'+val+'</div>':'<div style="color:#666;font-size:12px;font-style:italic">코멘트 없음</div>');
    render();
  };
  btnRow.appendChild(cancelBtn);
  btnRow.appendChild(saveBtn);
  wrap.appendChild(ta);
  wrap.appendChild(countSpan);
  wrap.appendChild(tagWrap);
  wrap.appendChild(btnRow);
  area.appendChild(wrap);
  ta.focus();
}
function sharePhotoToCommunity(idx){
  var ch=cookHistory[idx];
  if(!ch||!ch.photo){showCartPopup('📸 사진이 없어요!','코멘트만 있는 기록은 커뮤니티에 자랑할 수 없어요.');return;}
  var r=RECIPES.find(function(x){return x.id===ch.id});
  if(!confirm('이 사진을 커뮤니티에 자랑할까요?\n(관리자 승인 후 등록됩니다)'))return;
  var postId='p_'+Date.now();
  var newPost={
    id:postId,
    recipe:r?r.name:'',
    recipeId:ch.id,
    emoji:r?r.emoji:'🍳',
    user:getDisplayName(),
    nickname:getDisplayName(),
    uid:fbUid||'',
    date:getLocalDateStr(),
    text:ch.comment||'',
    photo:ch.photo,
    rating:ch.rating||0,
    likes:0,
    status:'pending',
    submittedAt:new Date().toISOString()
  };
  fbDB.ref('community/pending').push(newPost).then(function(){
    ch.shared=true;
    localStorage.setItem('nt_history',JSON.stringify(cookHistory));
    showCartPopup('⏳ 자랑 신청 완료!','관리자 승인 후 커뮤니티에 등록됩니다.');
  }).catch(function(){
    showCartPopup('❌ 오류','자랑 신청 중 오류가 발생했습니다. 다시 시도해주세요.');
  });
}
function showAllPhotosModal(){
  var allPosts=cookHistory.filter(function(ch){return ch.photo||ch.comment});
  if(allPosts.length===0){showCartPopup('📷 사진이 없어요','아직 요리 사진이 없습니다. 요리를 완료하고 사진을 남겨보세요!');return;}
  // 전체화면 뷰어용 사진 배열 (전역 변수에 저장하여 onclick에서 안전하게 참조)
  window._albumViewerPhotos=allPosts.filter(function(ch){return ch.photo}).map(function(ch){
    var r=RECIPES.find(function(x){return x.id===ch.id});
    return{photo:ch.photo,comment:ch.comment||'',date:ch.date,name:r?r.name:'',emoji:r?r.emoji:'🍳'};
  });
  var allViewerPhotos=window._albumViewerPhotos;
  var existing=document.getElementById('allPhotosModal');
  if(existing)existing.remove();
  var h='<div id="allPhotosModal" style="position:fixed;top:0;left:0;right:0;bottom:0;z-index:999;background:#000;overflow-y:auto" onclick="if(event.target===this)this.remove()">';
  h+='<div style="max-width:480px;margin:0 auto;padding:16px">';
  // Header
  h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;position:sticky;top:0;background:#000;padding:8px 0;z-index:1">';
  h+='<div style="color:#fff;font-size:16px;font-weight:700">🖼️ 내 사진첩</div>';
  h+='<div style="display:flex;align-items:center;gap:8px">';
  h+='<button onclick="document.getElementById(\'allPhotosModal\').remove()" style="background:none;border:none;color:#fff;font-size:24px;cursor:pointer;line-height:1">✕</button>';
  h+='</div></div>';
  h+='<div style="color:#aaa;font-size:11px;margin-bottom:12px">사진 '+allViewerPhotos.length+'장 · 전체 기록 '+allPosts.length+'개 · 사진 탭 시 전체화면</div>';
  // 사진이 있는 것만 먼저, 없는 것(코멘트만) 나중에
  var withPhoto=allPosts.filter(function(ch){return ch.photo});
  var withoutPhoto=allPosts.filter(function(ch){return !ch.photo&&ch.comment});
  // 사진 그리드 (3열) - 클릭 시 전체화면 뷰어
  if(withPhoto.length>0){
    h+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:3px;margin-bottom:16px">';
    var viewerIdx=0;
    withPhoto.forEach(function(ch){
      var chIdx=cookHistory.indexOf(ch);
      var thisVIdx=viewerIdx++;
      h+='<div style="border-radius:0;overflow:hidden">';
      h+='<div style="aspect-ratio:1;position:relative;cursor:zoom-in" onclick="openPhotoViewer(window._albumViewerPhotos,'+thisVIdx+')">'; 
      h+='<img src="'+ch.photo+'" style="width:100%;height:100%;object-fit:cover">';
      h+='<div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,.7));padding:4px 5px">';
      h+='<div style="font-size:9px;color:#fff;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+ch.emoji+' '+ch.name+'</div>';
      h+='</div>';
      h+='</div>';
      if(ch.comment){
        h+='<div style="padding:4px 3px;font-size:10px;color:#ccc;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;background:#111">💬 '+ch.comment+'</div>';
      }else{
        h+='<div style="padding:4px 3px;font-size:9px;color:#555;background:#111">'+ch.date+'</div>';
      }
      h+='</div>';
    });
    h+='</div>';
  }
  // 코멘트만 있는 항목 (사진만 보기 필터 시 숨김)
  if(withoutPhoto.length>0){
    h+='<div style="margin-bottom:8px;font-size:12px;color:#888;font-weight:700">💬 코멘트만 있는 기록 ('+withoutPhoto.length+')</div>';
    withoutPhoto.forEach(function(ch){
      h+='<div style="background:#111;border-radius:10px;padding:12px;margin-bottom:8px;cursor:pointer" onclick="showRecipePhotos(\''+esc(ch.id)+'\')">'; 
      h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">';
      h+='<span style="font-size:20px">'+ch.emoji+'</span>';
      h+='<span style="color:#fff;font-size:13px;font-weight:600">'+ch.name+'</span>';
      h+='<span style="color:#666;font-size:11px;margin-left:auto">'+ch.date+'</span>';
      h+='</div>';
      h+='<div style="color:#ccc;font-size:13px;line-height:1.5">💬 '+ch.comment+'</div>';
      h+='</div>';
    });
  }
  if(withPhoto.length===0){
    h+='<div style="text-align:center;padding:40px 0">';
    h+='<div style="font-size:48px;margin-bottom:12px">📷</div>';
    h+='<div style="color:#aaa;font-size:14px">아직 사진이 없어요<br>요리 완료 후 사진을 남겨보세요!</div>';
    h+='</div>';
  }
  h+='</div></div>';
  document.body.insertAdjacentHTML('beforeend',h);
}
var _pendingPhotoData=null;
var _pendingPhotoIdx=-1;
function previewPhotoInGallery(idx,input){
  var file=input.files[0];if(!file)return;
  _pendingPhotoIdx=idx;
  var reader=new FileReader();
  reader.onload=function(e){
    // 크롭 모달 열기 (드래그/핀치로 원하는 부분 선택 가능)
    openCropModal(e.target.result, function(croppedDataUrl){
      _pendingPhotoData=croppedDataUrl;
      var preview=document.getElementById('photoPreviewArea');
      var previewImg=document.getElementById('galleryPreviewImg');
      if(preview&&previewImg){preview.style.display='block';previewImg.src=_pendingPhotoData;}
      // 선택된 요리 기록 날짜 표시
      var targetInfo=document.getElementById('photoTargetInfo');
      if(targetInfo&&cookHistory[idx]){
        targetInfo.textContent='📅 '+cookHistory[idx].date+' 요리 기록에 저장됩니다';
      }
    });
  };
  reader.readAsDataURL(file);
}
function cancelPhotoPreview(){
  _pendingPhotoData=null;_pendingPhotoIdx=-1;
  var preview=document.getElementById('photoPreviewArea');
  if(preview)preview.style.display='none';
}
function savePhotoWithComment(idx){
  if(!_pendingPhotoData||idx<0)return;
  var commentInput=document.getElementById('galleryCommentInput');
  var comment=commentInput?commentInput.value.trim():'';
  cookHistory[idx].photo=_pendingPhotoData;
  cookHistory[idx].photoDate=getLocalDateStr();
  if(comment)cookHistory[idx].comment=comment;
  localStorage.setItem('nt_history',JSON.stringify(cookHistory));
  _pendingPhotoData=null;_pendingPhotoIdx=-1;
  // Close and reopen gallery to show new photo
  var popup=document.getElementById('galleryPopup');
  if(popup)popup.remove();
  var recipeId=cookHistory[idx].id;
  render();
  showRecipePhotos(recipeId);
  checkBadges();
  // 미션 체크
  if(todayMission&&!todayMission._done&&todayMission.check){
    var hasPhoto=arguments[2]||false;
    if(todayMission.check(arguments[0],hasPhoto))completeMission();
  }
}

// === COOKING HISTORY & BADGES ===
var cookHistory=[];try{var ch=localStorage.getItem('nt_history');if(ch)cookHistory=JSON.parse(ch);}catch(e){}
var userPosts=[];try{var up=localStorage.getItem('nt_posts');if(up)userPosts=JSON.parse(up);}catch(e){}
// Firebase cookHistory 백업 및 복원
function backupHistoryToFirebase(){
  if(!fbUid||!cookHistory.length)return;
  // 사진(base64) 제외하고 텍스트 데이터만 저장
  var slim=cookHistory.slice(0,100).map(function(h){
    var o={id:h.id,name:h.name,emoji:h.emoji||'',cat:h.cat||'',date:h.date||'',rating:h.rating||0,comment:h.comment||'',shared:h.shared||false};
    // ImgBB URL이면 저장, base64는 제외
    if(h.photo&&h.photo.startsWith('http'))o.photo=h.photo;
    return o;
  });
  fbDB.ref('userHistory/'+fbUid+'/entries').set(slim).catch(function(){});
  fbDB.ref('userHistory/'+fbUid+'/updatedAt').set(new Date().toISOString()).catch(function(){});
}
function restoreHistoryFromFirebase(){
  if(!fbUid)return;
  fbDB.ref('userHistory/'+fbUid+'/entries').once('value').then(function(snap){
    var fbData=snap.val();
    if(!fbData||!Array.isArray(fbData)||fbData.length===0)return;
    // 로컈 데이터와 Firebase 데이터 병합 (날짜 기준 중복 제거)
    var localDates=new Set(cookHistory.map(function(h){return h.id+'_'+h.date;}));
    var merged=cookHistory.slice();
    fbData.forEach(function(h){
      if(!localDates.has(h.id+'_'+h.date))merged.push(h);
    });
    merged.sort(function(a,b){return (b.date||'').localeCompare(a.date||'');});
    if(merged.length>cookHistory.length){
      cookHistory=merged.slice(0,100);
      localStorage.setItem('nt_history',JSON.stringify(cookHistory));
    }
  }).catch(function(){});
}
// 앱 시작 시 Firebase에서 기록 복원 시도
setTimeout(function(){restoreHistoryFromFirebase();},2000);

var tempPhoto=null;
var tempPhotoFile=null;
function handlePhoto(input){
  var file=input.files[0];if(!file)return;
  tempPhotoFile=file;
  var reader=new FileReader();
  reader.onload=function(e){
    // 정사각형 크롭 모달 열기
    openCropModal(e.target.result, function(croppedDataUrl){
      tempPhoto=croppedDataUrl;
      var preview=document.getElementById('photoPreview');
      var photoImg=document.getElementById('photoImg');
      if(preview&&photoImg){preview.style.display='block';photoImg.src=tempPhoto;}
      var btn=document.getElementById('photoBtn');
      if(btn){btn.innerHTML='✅ 사진 선택 완료<br>(다시 찍기)';btn.style.borderStyle='solid';btn.style.background='#e8f5e9';}
      var galleryBtn=document.getElementById('photoGalleryBtn');
      if(galleryBtn){galleryBtn.innerHTML='✅ 사진 선택 완료<br>(다시 찾기)';galleryBtn.style.borderStyle='solid';galleryBtn.style.background='#e8f5e9';galleryBtn.style.color='#388e3c';}
    });
  };
  reader.readAsDataURL(file);
}
function completeCookSave(recipeId,share){
  // 1. DOM이 살아있는 동안 코멘트/별점/사진 값을 먼저 읽음
  var commentEl=document.getElementById('commentInput');
  var commentText=commentEl?commentEl.value.trim():'';
  var ratingEl=document.getElementById('ratingInput');
  var rating=ratingEl?parseInt(ratingEl.value)||0:0;
  var photo=tempPhoto||null;
  // 2. 커뮤니티 자랑 시 사진 필수 검증
  if(share&&!photo){
    showCartPopup('📸 사진이 없어요!','커뮤니티에 자랑하려면 사진이 필수입니다.\n사진을 찍거나 갤러리에서 선택해주세요!');
    return;
  }
  // 3. 요리 기록 추가 (unshift) - rating도 함께 전달하여 Google Sheets에 평점 집계
  addCookHistory(recipeId,false,rating);
  // 4. 방금 추가된 cookHistory[0]에 코멘트/별점/사진 저장
  var entry=cookHistory[0];
  if(entry&&entry.id==recipeId){
    if(photo)entry.photo=photo;
    if(commentText)entry.comment=commentText;
    if(rating>0)entry.rating=rating;
    localStorage.setItem('nt_history',JSON.stringify(cookHistory));
  }
  // 5. 커뮤니티 자랑
  if(share&&photo){
    var r=RECIPES.find(function(x){return x.id===recipeId});
    var postId='p_'+Date.now();
    var newPost={
      id:postId,
      recipe:r?r.name:'',
      recipeId:recipeId,
      emoji:r?r.emoji:'🍳',
      user:getDisplayName(),
      date:getLocalDateStr(),
      text:commentText,
      photo:photo,
      rating:rating>0?rating:0,
      likes:0,
      status:'pending',
      submittedAt:new Date().toISOString()
    };
    fbDB.ref('community/pending').push(newPost).then(function(){
      var sharedEntry=cookHistory.find(function(ch){return ch.id===recipeId&&!ch.shared});
      if(sharedEntry){sharedEntry.shared=true;localStorage.setItem('nt_history',JSON.stringify(cookHistory));}
      showCartPopup('⏳ 자랑 신청 완료!','관리자 승인 후 커뮤니티에 등록됩니다.');
    }).catch(function(){showCartPopup('❌ 오류','게시글 저장 중 오류가 발생했습니다.');});
  } else {
    showCartPopup('✅ 저장 완료!','내기록에 저장되었어요! 승급에 한 걸음 더 다가갔어요 🎉');
  }
  tempPhoto=null;
  tempPhotoFile=null;
  closeFS();
}

function savePhotoComment(recipeId,share){
  var comment=document.getElementById('commentInput');
  var commentText=comment?comment.value.trim():'';
  var ratingEl=document.getElementById('ratingInput');
  var rating=ratingEl?parseInt(ratingEl.value)||0:0;
  // 커뮤니티 자랑 시 사진 필수 검증
  if(share&&!tempPhoto){
    showCartPopup('📸 사진이 없어요!','커뮤니티에 자랑하려면 사진이 필수입니다.\n사진을 찍거나 갤러리에서 선택해주세요!');
    return;
  }
  // Update latest history entry with photo+comment
  var entry=cookHistory[0];
  if(entry && entry.id == recipeId){
    if(tempPhoto)entry.photo=tempPhoto;
    if(commentText)entry.comment=commentText;
    if(rating>0)entry.rating=rating;
    localStorage.setItem('nt_history',JSON.stringify(cookHistory));
  }
  // Share to community - ImgBB 업로드 후 URL만 Firebase에 저장
  if(share&&tempPhoto){
    var r=RECIPES.find(function(x){return x.id===recipeId});
    // 업로드 중 안내 팝업
    var uploadingId='uploading_'+Date.now();
    var uploadingHtml='<div id="'+uploadingId+'" style="position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center">';
    uploadingHtml+='<div style="background:var(--bg);border-radius:16px;padding:24px;text-align:center;max-width:280px">';
    uploadingHtml+='<div style="font-size:40px;margin-bottom:12px">📤</div>';
    uploadingHtml+='<div style="font-size:15px;font-weight:700;margin-bottom:6px">사진 업로드 중...</div>';
    uploadingHtml+='<div style="font-size:12px;color:var(--sub)">잠시만 기다려주세요</div>';
    uploadingHtml+='</div></div>';
    document.body.insertAdjacentHTML('beforeend',uploadingHtml);
    // ImgBB 업로드
    var base64Data=tempPhoto.indexOf(',')>-1?tempPhoto.split(',')[1]:tempPhoto;
    var fd=new FormData();
    fd.append('image',base64Data);
    // API 키는 Cloudflare Worker 내부에서 처리 (코드에 노출되지 않음)
    fetch('https://imgbb-proxy.rookiesmart1031.workers.dev',{method:'POST',body:fd})
    .then(function(res){return res.json();})
    .then(function(imgData){
      // 업로드 팝업 제거
      var up=document.getElementById(uploadingId);if(up)up.remove();
      var photoUrl=(imgData.success&&imgData.data&&imgData.data.display_url)?imgData.data.display_url:tempPhoto;
      var postId='p_'+Date.now();
      var newPost={
        id:postId,
        recipe:r?r.name:'',
        recipeId:recipeId,
        emoji:r?r.emoji:'🍳',
        user:getDisplayName(),
        nickname:getDisplayName(),
        uid:fbUid||'',
        date:getLocalDateStr(),
        text:commentText,
        photo:photoUrl,
        rating:rating||0,
        likes:0,
        status:'pending',
        submittedAt:new Date().toISOString()
      };
      return fbDB.ref('community/pending').push(newPost);
    }).then(function(){
      // shared 플래그 저장 - 내기록 탭에서 자랑완료 버튼으로 표시
      var sharedEntry=cookHistory.find(function(ch){return ch.id===recipeId});
      if(sharedEntry){
        sharedEntry.shared=true;
        localStorage.setItem('nt_history',JSON.stringify(cookHistory));
      }
      var popupId='saveConfirmPopup_'+Date.now();
      var popup='<div id="'+popupId+'" style="position:fixed;top:0;left:0;right:0;bottom:0;z-index:999;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center" onclick="this.remove()">';
      popup+='<div style="background:var(--bg);border-radius:16px;padding:24px;text-align:center;max-width:280px">';
      popup+='<div style="font-size:48px;margin-bottom:12px">⏳</div>';
      popup+='<div style="font-size:15px;font-weight:700;margin-bottom:8px">자랑 신청 완료!</div>';
      popup+='<div style="font-size:12px;color:var(--sub)">관리자 승인 후 커뮤니티에 등록됩니다.</div>';
      popup+='<button style="margin-top:16px;width:100%;padding:10px;border:none;border-radius:10px;background:var(--primary);color:#fff;font-weight:700;cursor:pointer;font-family:inherit">확인</button>';
      popup+='</div></div>';
      document.body.insertAdjacentHTML('beforeend',popup);
      setTimeout(function(){var p=document.getElementById(popupId);if(p)p.remove();},3000);
    }).catch(function(){
      var up=document.getElementById(uploadingId);if(up)up.remove();
      showCartPopup('❌ 오류','게시글 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    });
  } else {
    // 내기록에만 저장 시 바로 확인 팝업
    var popupId='saveConfirmPopup_'+Date.now();
    var popup='<div id="'+popupId+'" style="position:fixed;top:0;left:0;right:0;bottom:0;z-index:999;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center" onclick="this.remove()">';
    popup+='<div style="background:var(--bg);border-radius:16px;padding:24px;text-align:center;max-width:280px">';
    popup+='<div style="font-size:48px;margin-bottom:12px">✅</div>';
    popup+='<div style="font-size:15px;font-weight:700;margin-bottom:8px">내기록에 저장되었어요!</div>';
    popup+='<div style="font-size:12px;color:var(--sub)">승급에 한 걸음 더 다가갔어요! 🎉</div>';
    popup+='<button style="margin-top:16px;width:100%;padding:10px;border:none;border-radius:10px;background:var(--primary);color:#fff;font-weight:700;cursor:pointer;font-family:inherit">확인</button>';
    popup+='</div></div>';
    document.body.insertAdjacentHTML('beforeend',popup);
    setTimeout(function(){var p=document.getElementById(popupId);if(p)p.remove();},3000);
  }
  tempPhoto=null;
  tempPhotoFile=null;
  // 승급 체크 (뱃지/횟수 기반)
  checkLevelUp();
}

// === 내기록에서 커뮤니티 자랑 모달 ===

  
function editCommentBtn(btn){
  var recipeId = btn.getAttribute('data-id');
  var recipeName = btn.getAttribute('data-name');
  openEditComment(recipeId, recipeName);
}

function openEditComment(recipeId, recipeName){
    var existing = cookHistory.find(function(ch){return ch.id===recipeId && ch.comment});
    var currentComment = existing ? existing.comment : '';
    var newComment = prompt((currentComment ? '한줄평 수정' : '한줄평 추가') + ' — ' + recipeName, currentComment || '');
    if(newComment === null) return; // 취소
    newComment = newComment.trim();
    // 기존 코멘트 업데이트 또는 새로 추가
    var updated = false;
    cookHistory = cookHistory.map(function(ch){
      if(ch.id === recipeId && ch.comment){
        updated = true;
        if(newComment === '') {
          var c = Object.assign({}, ch);
          delete c.comment;
          return c;
        }
        return Object.assign({}, ch, {comment: newComment});
      }
      return ch;
    });
    if(!updated && newComment !== ''){
      // 해당 레시피의 가장 최근 기록에 코멘트 추가
      var lastIdx = -1;
      cookHistory.forEach(function(ch, i){ if(ch.id === recipeId) lastIdx = i; });
      if(lastIdx >= 0){
        cookHistory[lastIdx] = Object.assign({}, cookHistory[lastIdx], {comment: newComment});
      }
    }
    localStorage.setItem('nt_cook_hist', JSON.stringify(cookHistory));
    render();
  }

function openHistoryShare(recipeId, recipeName, recipeEmoji){
  var histEntry = cookHistory.find(function(h){return h.id===recipeId});
  var existPhoto = histEntry && histEntry.photo ? histEntry.photo : null;
  var modal = document.createElement('div');
  modal.id = 'histShareModal';
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:999;background:rgba(0,0,0,.5);display:flex;align-items:flex-end;justify-content:center';
  var inner = document.createElement('div');
  inner.style.cssText = 'background:var(--bg);border-radius:20px 20px 0 0;padding:20px;width:100%;max-width:480px;max-height:85vh;overflow-y:auto';
  
  var h = '';
  h += '<div style="text-align:center;margin-bottom:16px">';
  h += '<div style="font-size:32px;margin-bottom:4px">'+recipeEmoji+'</div>';
  h += '<div style="font-size:16px;font-weight:700;color:var(--text)">'+recipeName+' 자랑하기</div>';
  h += '<div style="font-size:12px;color:var(--sub);margin-top:4px">커뮤니티에 공유할 내용을 작성해주세요</div>';
  h += '</div>';
  
  // 사진 영역
  h += '<div style="margin-bottom:12px">';
  h += '<div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px">📸 사진</div>';
  if(existPhoto){
    h += '<div id="shareImgWrap" style="position:relative">';
    h += '<img id="sharePreview" src="'+existPhoto+'" style="width:100%;max-height:200px;object-fit:cover;border-radius:12px;border:1px solid var(--border)">';
    h += '<button id="shareRemoveBtn" style="position:absolute;top:6px;right:6px;background:rgba(0,0,0,.5);border:none;border-radius:50%;width:24px;height:24px;color:#fff;font-size:14px;cursor:pointer;line-height:24px;text-align:center">✕</button>';
    h += '</div>';
    h += '<div id="sharePhotoUpload" style="display:none">';
  } else {
    h += '<div id="sharePhotoUpload">';
  }
  h += '<label style="display:block;border:2px dashed var(--border);border-radius:12px;padding:20px;text-align:center;cursor:pointer;color:var(--sub);font-size:13px">';
  h += '📷 사진 추가 (선택)<input id="shareFileInput" type="file" accept="image/*" style="display:none">';
  h += '</label>';
  h += '</div>';
  h += '</div>';
  
  // 한마디 입력
  h += '<div style="margin-bottom:16px">';
  h += '<div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px">💬 한마디</div>';
  h += '<textarea id="shareComment" placeholder="맛있게 만들었어요! 꿀팁은..." style="width:100%;padding:10px;border:1px solid var(--border);border-radius:10px;font-size:13px;font-family:inherit;background:var(--bg);color:var(--text);resize:none;height:80px;box-sizing:border-box"></textarea>';
  h += '</div>';
  
  // 버튼
  h += '<div style="display:flex;gap:8px">';
  h += '<button id="shareCancelBtn" style="flex:1;padding:12px;border:1px solid var(--border);border-radius:12px;background:var(--bg);color:var(--text);font-size:14px;cursor:pointer;font-family:inherit">취소</button>';
  h += '<button id="shareSubmitBtn" style="flex:2;padding:12px;border:none;border-radius:12px;background:var(--primary);color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">📢 커뮤니티에 자랑!</button>';
  h += '</div>';
  h += '<div style="margin-top:10px;padding:8px 10px;background:#fff8e1;border-radius:8px;border-left:3px solid #ffc107;font-size:11px;color:#795548;line-height:1.5">⏳ 커뮤니티 게시글은 <b>관리자 승인 후</b> 등록됩니다. 승인 전까지 커뮤니티 탭에서 "⏳ 대기중" 표시가 보입니다.</div>';
  
  inner.innerHTML = h;
  modal.appendChild(inner);
  document.body.appendChild(modal);
  
  // 이벤트 바인딩 (onclick 문자열 충돌 방지)
  modal._existPhoto = existPhoto;
  modal._recipeId = recipeId;
  modal._recipeName = recipeName;
  modal._recipeEmoji = recipeEmoji;
  
  var cancelBtn = document.getElementById('shareCancelBtn');
  if(cancelBtn) cancelBtn.onclick = function(){ modal.remove(); };
  
  var submitBtn = document.getElementById('shareSubmitBtn');
  if(submitBtn) submitBtn.onclick = function(){ submitHistoryShare(modal); };
  
  var removeBtn = document.getElementById('shareRemoveBtn');
  if(removeBtn) removeBtn.onclick = function(){
    document.getElementById('sharePreview').src='';
    document.getElementById('shareImgWrap').style.display='none';
    document.getElementById('sharePhotoUpload').style.display='block';
    modal._existPhoto = null;
  };
  
  var fileInput = document.getElementById('shareFileInput');
  if(fileInput) fileInput.onchange = function(){ previewSharePhoto(this, modal); };
}

function previewSharePhoto(input, modal){
  if(!input.files||!input.files[0])return;
  var reader=new FileReader();
  reader.onload=function(e){
    // 정사각형 크롭 모달 열기
    openCropModal(e.target.result, function(croppedDataUrl){
      var wrap = document.getElementById('shareImgWrap');
      if(!wrap){
        var uploadDiv = document.getElementById('sharePhotoUpload');
        var newWrap = document.createElement('div');
        newWrap.id = 'shareImgWrap';
        newWrap.style.cssText = 'position:relative;margin-bottom:8px';
        var img = document.createElement('img');
        img.id = 'sharePreview';
        img.style.cssText = 'width:100%;border-radius:12px;border:1px solid var(--border);display:block';
        img.src = croppedDataUrl;
        var removeBtn = document.createElement('button');
        removeBtn.id = 'shareRemoveBtn';
        removeBtn.style.cssText = 'position:absolute;top:6px;right:6px;background:rgba(0,0,0,.5);border:none;border-radius:50%;width:24px;height:24px;color:#fff;font-size:14px;cursor:pointer;line-height:24px;text-align:center';
        removeBtn.textContent = '✕';
        removeBtn.onclick = function(){
          newWrap.style.display='none';
          document.getElementById('sharePhotoUpload').style.display='block';
          if(modal)modal._existPhoto=null;
        };
        newWrap.appendChild(img);
        newWrap.appendChild(removeBtn);
        uploadDiv.parentNode.insertBefore(newWrap, uploadDiv);
        uploadDiv.style.display='none';
      } else {
        document.getElementById('sharePreview').src = croppedDataUrl;
        wrap.style.display='block';
        document.getElementById('sharePhotoUpload').style.display='none';
      }
    });
  };
  reader.readAsDataURL(input.files[0]);
}

function submitHistoryShare(modal){
  var comment = document.getElementById('shareComment');
  var commentText = comment ? comment.value.trim() : '';
  var preview = document.getElementById('sharePreview');
  var previewSrc=(preview&&typeof preview.src==='string')?preview.src:'';
  var photoData = previewSrc.startsWith('data:') ? previewSrc : (modal._existPhoto || null);
  
  if(!photoData){
    showCartPopup('📸 사진이 없어요!','커뮤니티에 자랑하려면 사진이 필수입니다.\n사진을 추가해주세요!');
    return;
  }
  
  var postId = 'p_'+Date.now();
  var recipeName = modal._recipeName;
  var recipeId = modal._recipeId;
  var recipeEmoji = modal._recipeEmoji;
  
  // 해당 레시피의 최근 평점 자동 포함
  var autoRating = 0;
  if(recipeId){
    var ratedHistory = cookHistory.filter(function(h){return h.id===recipeId&&h.rating&&h.rating>0;});
    if(ratedHistory.length>0){
      // 가장 최근 평점 사용
      autoRating = ratedHistory[0].rating;
    }
  }
  
  modal.remove();
  
  var newPost = {
    id: postId,
    recipe: recipeName,
    recipeId: recipeId,
    emoji: recipeEmoji,
    user: getDisplayName(),
    date: getLocalDateStr(),
    text: commentText,
    photo: photoData,
    likes: 0,
    status: 'pending',
    submittedAt: new Date().toISOString()
  };
  if(autoRating>0)newPost.rating=autoRating;
  fbDB.ref('community/pending').push(newPost).then(function(){
    // 자랑완료 플래그 저장 (중복 자랑 방지)
    cookHistory = cookHistory.map(function(h){
      if(h.id === recipeId && !h.shared){
        return Object.assign({}, h, {shared: true, sharedAt: new Date().toISOString()});
      }
      return h;
    });
    localStorage.setItem('nt_history', JSON.stringify(cookHistory));
    render();
    var popup='<div style="position:fixed;top:0;left:0;right:0;bottom:0;z-index:999;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center" onclick="this.remove()">';
    popup+='<div style="background:var(--bg);border-radius:16px;padding:24px;text-align:center;max-width:280px">';
    popup+='<div style="font-size:48px;margin-bottom:12px">📬</div>';
    popup+='<div style="font-size:15px;font-weight:700;margin-bottom:8px">자랑 신청 완료!</div>';
    popup+='<div style="font-size:13px;color:var(--sub);line-height:1.6">관리자 승인 후 커뮤니티에 게시됩니다.<br>보통 빠르게 처리됩니다 😊</div>';
    popup+='<div style="font-size:11px;color:#aaa;margin-top:12px">탭하면 닫힘</div></div></div>';
    document.body.insertAdjacentHTML('beforeend', popup);
  }).catch(function(){
    showCartPopup('❌ 오류','게시글 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
  });
}

function addCookHistory(id,skipBadge,ratingVal){
  var r=RECIPES.find(function(x){return x.id===id});if(!r)return;
  cookHistory.unshift({id:id,name:r.name,emoji:r.emoji,cat:r.cat,date:getLocalDateStr()});
  if(cookHistory.length>100)cookHistory=cookHistory.slice(0,100);
  localStorage.setItem('nt_history',JSON.stringify(cookHistory));
  reportRecipeToFirebase(id,r.name);
  // Firebase 백업 (비동기)
  setTimeout(function(){backupHistoryToFirebase();},500);
  // cookLogs Firebase 저장: cookLogs/{uid}/{recipeId} 카운터 +1
  try{
    if(fbUid&&id){
      fbDB.ref('cookLogs/'+fbUid+'/'+id).transaction(function(c){return(c||0)+1;});
    }
  }catch(e){}
  // Google Sheets 레시피카운트 → 관리자 수동 동기화 방식으로 변경 (실시간 전송 제거)
  if(!skipBadge)checkBadges();
  else checkLevelUp();
  // 요리 완료 시 미션 체크
  if(todayMission&&!todayMission._done&&todayMission.check){
    if(todayMission.check(id,false))completeMission();
  }
  }

// 커뮤니티는 Firebase Realtime Database로 완전 이전 (COMMUNITY_SCRIPT_URL 제거)
function getCookStats(){
  var total=cookHistory.length;
  // RECIPES.find 반복 호출 성능 최적화: Map으로 캐시
  var recipeMap={};
  RECIPES.forEach(function(r){recipeMap[r.id]=r;});
  function getR(id){return recipeMap[id]||null;}
  
  var unique=new Set(cookHistory.map(function(h){return h.id})).size;
  var cats=new Set(cookHistory.map(function(h){return h.cat})).size;
  var thisWeek=cookHistory.filter(function(h){var d=new Date(h.date);var now=new Date();var diff=(now-d)/(1000*60*60*24);return diff<=7}).length;
  var streak=0;
  var days=new Set(cookHistory.map(function(h){return h.date}));
  for(var i=0;i<30;i++){var d=new Date();d.setDate(d.getDate()-i);var ds=getLocalDateStr(d);if(days.has(ds))streak++;else break;}
  var photos=cookHistory.filter(function(h){return h.photo}).length;
  var comments=cookHistory.filter(function(h){return h.comment}).length;
  var shares=userPosts.length;
  var easyCount=cookHistory.filter(function(h){var r=getR(h.id);return r&&r.diff===1}).length;
  var medCount=cookHistory.filter(function(h){var r=getR(h.id);return r&&r.diff===2}).length;
  var veryEasyCount=cookHistory.filter(function(h){var r=getR(h.id);return r&&r.diff===0}).length;
  var hardCount=cookHistory.filter(function(h){var r=getR(h.id);return r&&r.diff===3}).length;
  var catMap={};cookHistory.forEach(function(h){catMap[h.cat]=(catMap[h.cat]||0)+1});
  var topCat=Object.entries(catMap).sort(function(a,b){return b[1]-a[1]})[0];
  // 특별 뉴지용 카운트
  var speedCount=cookHistory.filter(function(h){var r=getR(h.id);return r&&r.time<=5}).length;
  var dietCount=cookHistory.filter(function(h){var r=getR(h.id);return r&&r.kcal&&r.kcal<=200}).length;
  var nightCount=cookHistory.filter(function(h){var r=getR(h.id);return r&&(r.cat==='간식/분식'||r.name.includes('라면')||r.name.includes('볶음밥'))}).length;
  var rainyCount=cookHistory.filter(function(h){var r=getR(h.id);return r&&r.cat==='전/부침'}).length;
  var banchanCount=cookHistory.filter(function(h){var r=getR(h.id);return r&&(r.cat==='나물/반찬'||r.cat==='조림')}).length;
  var repeatMap={};cookHistory.forEach(function(h){repeatMap[h.id]=(repeatMap[h.id]||0)+1});
  var maxRepeat=Math.max(0,...Object.values(repeatMap));
  var weekendCount=cookHistory.filter(function(h){var d=new Date(h.date);return d.getDay()===0||d.getDay()===6}).length;
  return{total:total,unique:unique,cats:cats,thisWeek:thisWeek,streak:streak,photos:photos,comments:comments,shares:shares,easyCount:easyCount,medCount:medCount,veryEasyCount:veryEasyCount,hardCount:hardCount,speedCount:speedCount,dietCount:dietCount,nightCount:nightCount,rainyCount:rainyCount,banchanCount:banchanCount,maxRepeat:maxRepeat,weekendCount:weekendCount,allDiffCount:new Set([veryEasyCount>0?0:-1,easyCount>0?1:-1,medCount>0?2:-1,hardCount>0?3:-1].filter(function(x){return x>=0})).size,topCat:topCat?topCat[0]:''};
}


// ===== 정사각형 크롭 모달 로직 =====
var _cropCallback=null;   // 크롭 확정 시 호출할 콜백 (base64 전달)
var _cropOrigSrc='';       // 원본 이미지 src
var _cropImgNW=0, _cropImgNH=0; // 원본 이미지 크기
// 선택박스 방식 변수
var _cropSelX=0, _cropSelY=0, _cropSelW=0, _cropSelH=0; // 선택박스 위치/크기 (표시 px)
var _cropImgDispW=0, _cropImgDispH=0; // 화면에 표시된 이미지 크기
var _cropDragMode=null; // 'move' | 'tl'|'tr'|'bl'|'br'
var _cropDragStartX=0, _cropDragStartY=0;
var _cropSelStartX=0, _cropSelStartY=0, _cropSelStartW=0, _cropSelStartH=0;

// ===== 사진 전체화면 뷰어 + 스와이프 =====
var _viewerPhotos=[];
var _viewerIdx=0;
var _viewerTouchStartX=0;
function openPhotoViewer(photos,startIdx){
  if(!photos||photos.length===0)return;
  _viewerPhotos=photos;
  _viewerIdx=startIdx||0;
  var existing=document.getElementById('photoViewerOverlay');
  if(existing)existing.remove();
  var el=document.createElement('div');
  el.id='photoViewerOverlay';
  el.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;z-index:1100;background:#000;display:flex;flex-direction:column;justify-content:center;align-items:center;user-select:none';
  el.innerHTML=_buildViewerHTML();
  document.body.appendChild(el);
  // 터치 스와이프
  el.addEventListener('touchstart',function(e){_viewerTouchStartX=e.touches[0].clientX;},{passive:true});
  el.addEventListener('touchend',function(e){
    var dx=e.changedTouches[0].clientX-_viewerTouchStartX;
    if(Math.abs(dx)>50){if(dx<0)_viewerNext();else _viewerPrev();}
  },{passive:true});
  // 키보드
  el._keyHandler=function(e){
    if(e.key==='ArrowRight')_viewerNext();
    else if(e.key==='ArrowLeft')_viewerPrev();
    else if(e.key==='Escape')closePhotoViewer();
  };
  document.addEventListener('keydown',el._keyHandler);
}
function _buildViewerHTML(){
  var p=_viewerPhotos[_viewerIdx];
  var total=_viewerPhotos.length;
  var viewerPhoto=safeUrl(p.photo);
  var h='';
  // 상단 바
  h+='<div style="position:absolute;top:0;left:0;right:0;display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:linear-gradient(rgba(0,0,0,.7),transparent);z-index:2">';
  h+='<div style="color:#fff;font-size:13px;font-weight:700">'+ehtml(p.emoji||'')+(p.name?' '+ehtml(p.name):'')+'</div>';
  h+='<div style="display:flex;align-items:center;gap:12px">';
  h+='<span style="color:#aaa;font-size:12px">'+(_viewerIdx+1)+' / '+total+'</span>';
  h+='<button onclick="closePhotoViewer()" style="background:none;border:none;color:#fff;font-size:26px;cursor:pointer;line-height:1">✕</button>';
  h+='</div></div>';
  // 사진
  if(viewerPhoto)h+='<img src="'+eattr(viewerPhoto)+'" style="max-width:100%;max-height:calc(100vh - 140px);object-fit:contain;display:block" onclick="event.stopPropagation()">';
  // 코멘트
  if(p.comment){
    h+='<div style="position:absolute;bottom:60px;left:0;right:0;padding:10px 20px;background:linear-gradient(transparent,rgba(0,0,0,.8));text-align:center">';
    h+='<div style="color:#fff;font-size:13px;line-height:1.5">💬 '+ehtml(p.comment)+'</div>';
    h+='</div>';
  }
  // 하단 네비게이션
  h+='<div style="position:absolute;bottom:0;left:0;right:0;display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:linear-gradient(transparent,rgba(0,0,0,.7))">';
  h+='<button onclick="_viewerPrev()" style="background:rgba(255,255,255,.15);border:none;color:#fff;font-size:20px;width:44px;height:44px;border-radius:50%;cursor:pointer;'+(total<=1?'opacity:.2;pointer-events:none':'')+'">&lt;</button>';
  h+='<div style="color:#aaa;font-size:11px">'+ehtml(p.date||'')+'</div>';
  h+='<button onclick="_viewerNext()" style="background:rgba(255,255,255,.15);border:none;color:#fff;font-size:20px;width:44px;height:44px;border-radius:50%;cursor:pointer;'+(total<=1?'opacity:.2;pointer-events:none':'')+'">&gt;</button>';
  h+='</div>';
  return h;
}
function _viewerNext(){
  if(_viewerIdx<_viewerPhotos.length-1){_viewerIdx++;_refreshViewer();}
}
function _viewerPrev(){
  if(_viewerIdx>0){_viewerIdx--;_refreshViewer();}
}
function _refreshViewer(){
  var el=document.getElementById('photoViewerOverlay');
  if(el)el.innerHTML=_buildViewerHTML();
}
function closePhotoViewer(){
  var el=document.getElementById('photoViewerOverlay');
  if(el){
    if(el._keyHandler)document.removeEventListener('keydown',el._keyHandler);
    el.remove();
  }
}
// ===== END 사진 전체화면 뷰어 =====

// ===== 크롭 모달 (선택박스 방식) =====
function openCropModal(srcDataUrl, callback){
  _cropCallback=callback;
  _cropOrigSrc=srcDataUrl;
  var overlay=document.getElementById('cropModalOverlay');
  var img=document.getElementById('cropFullImg');
  img.onload=function(){
    _cropImgNW=img.naturalWidth;
    _cropImgNH=img.naturalHeight;
    _cropImgDispW=img.offsetWidth;
    _cropImgDispH=img.offsetHeight;
    // 선택박스 초기화: 이미지 전체의 60%를 중앙에 배치
    var minSide=Math.min(_cropImgDispW,_cropImgDispH);
    _cropSelW=Math.round(minSide*0.6);
    _cropSelH=Math.round(minSide*0.6);
    _cropSelX=Math.round((_cropImgDispW-_cropSelW)/2);
    _cropSelY=Math.round((_cropImgDispH-_cropSelH)/2);
    _cropUpdateSelBox();
  };
  img.src=srcDataUrl;
  overlay.classList.add('active');
  // 이미지 로드 후 스타일 적용을 위해 짧간 대기
  setTimeout(function(){
    if(img.complete&&img.naturalWidth>0){
      _cropImgDispW=img.offsetWidth;
      _cropImgDispH=img.offsetHeight;
      var minSide=Math.min(_cropImgDispW,_cropImgDispH);
      _cropSelW=Math.round(minSide*0.6);
      _cropSelH=Math.round(minSide*0.6);
      _cropSelX=Math.round((_cropImgDispW-_cropSelW)/2);
      _cropSelY=Math.round((_cropImgDispH-_cropSelH)/2);
      _cropUpdateSelBox();
    }
  },100);
}

function _cropUpdateSelBox(){
  var sel=document.getElementById('cropSelBox');
  if(!sel)return;
  sel.style.left=_cropSelX+'px';
  sel.style.top=_cropSelY+'px';
  sel.style.width=_cropSelW+'px';
  sel.style.height=_cropSelH+'px';
}

function cropCancel(){
  document.getElementById('cropModalOverlay').classList.remove('active');
  _cropCallback=null;
}

function cropConfirm(){
  var OUTPUT_SIZE=800; // 출력 해상도
  var img=document.getElementById('cropFullImg');
  _cropImgDispW=img.offsetWidth;
  _cropImgDispH=img.offsetHeight;
  // 화면 표시 크기 대비 원본 이미지 비율
  var scaleX=_cropImgNW/_cropImgDispW;
  var scaleY=_cropImgNH/_cropImgDispH;
  // 선택박스를 원본 이미지 좌표로 변환
  var srcX=_cropSelX*scaleX;
  var srcY=_cropSelY*scaleY;
  var srcW=_cropSelW*scaleX;
  var srcH=_cropSelH*scaleY;
  var canvas=document.createElement('canvas');
  canvas.width=OUTPUT_SIZE;
  canvas.height=OUTPUT_SIZE;
  var ctx=canvas.getContext('2d');
  var origImg=new Image();
  origImg.onload=function(){
    ctx.drawImage(origImg,srcX,srcY,srcW,srcH,0,0,OUTPUT_SIZE,OUTPUT_SIZE);
    var result=canvas.toDataURL('image/jpeg',0.88);
    document.getElementById('cropModalOverlay').classList.remove('active');
    if(_cropCallback)_cropCallback(result);
    _cropCallback=null;
  };
  origImg.src=_cropOrigSrc;
}

// 선택박스 드래그 이벤트 (PC 마우스 + 모바일 터치)
(function(){
  var MIN_SEL=40; // 최소 선택 크기
  function getPos(e){
    if(e.touches)return{x:e.touches[0].clientX,y:e.touches[0].clientY};
    return{x:e.clientX,y:e.clientY};
  }
  function clamp(v,min,max){return Math.max(min,Math.min(max,v));}

  document.addEventListener('DOMContentLoaded',function(){
    var sel=document.getElementById('cropSelBox');
    var container=document.getElementById('cropImgContainer');
    if(!sel||!container)return;

    function startDrag(e,mode){
      _cropDragMode=mode;
      var p=getPos(e);
      _cropDragStartX=p.x; _cropDragStartY=p.y;
      _cropSelStartX=_cropSelX; _cropSelStartY=_cropSelY;
      _cropSelStartW=_cropSelW; _cropSelStartH=_cropSelH;
      e.preventDefault();
      e.stopPropagation();
    }

    // 선택박스 이동 (move)
    sel.addEventListener('mousedown',function(e){
      // 핸들 클릭이 아닌 경우만 move
      if(e.target.classList.contains('crop-sel-handle'))return;
      startDrag(e,'move');
    });
    sel.addEventListener('touchstart',function(e){
      if(e.target.classList.contains('crop-sel-handle'))return;
      startDrag(e,'move');
    },{passive:false});

    // 모서리 핸들 (resize)
    sel.querySelectorAll('.crop-sel-handle').forEach(function(h){
      h.addEventListener('mousedown',function(e){startDrag(e,h.dataset.corner);});
      h.addEventListener('touchstart',function(e){startDrag(e,h.dataset.corner);},{passive:false});
    });

    function onMove(e){
      if(!_cropDragMode)return;
      var p=getPos(e);
      var dx=p.x-_cropDragStartX, dy=p.y-_cropDragStartY;
      var imgEl=document.getElementById('cropFullImg');
      var imgW=imgEl.offsetWidth, imgH=imgEl.offsetHeight;

      if(_cropDragMode==='move'){
        _cropSelX=clamp(_cropSelStartX+dx,0,imgW-_cropSelW);
        _cropSelY=clamp(_cropSelStartY+dy,0,imgH-_cropSelH);
      } else if(_cropDragMode==='br'){
        var nw=clamp(_cropSelStartW+dx,MIN_SEL,imgW-_cropSelX);
        var nh=clamp(_cropSelStartH+dy,MIN_SEL,imgH-_cropSelY);
        _cropSelW=nw; _cropSelH=nh;
      } else if(_cropDragMode==='tl'){
        var nw=clamp(_cropSelStartW-dx,MIN_SEL,_cropSelStartX+_cropSelStartW);
        var nh=clamp(_cropSelStartH-dy,MIN_SEL,_cropSelStartY+_cropSelStartH);
        _cropSelX=_cropSelStartX+_cropSelStartW-nw;
        _cropSelY=_cropSelStartY+_cropSelStartH-nh;
        _cropSelW=nw; _cropSelH=nh;
      } else if(_cropDragMode==='tr'){
        var nw=clamp(_cropSelStartW+dx,MIN_SEL,imgW-_cropSelX);
        var nh=clamp(_cropSelStartH-dy,MIN_SEL,_cropSelStartY+_cropSelStartH);
        _cropSelY=_cropSelStartY+_cropSelStartH-nh;
        _cropSelW=nw; _cropSelH=nh;
      } else if(_cropDragMode==='bl'){
        var nw=clamp(_cropSelStartW-dx,MIN_SEL,_cropSelStartX+_cropSelStartW);
        var nh=clamp(_cropSelStartH+dy,MIN_SEL,imgH-_cropSelY);
        _cropSelX=_cropSelStartX+_cropSelStartW-nw;
        _cropSelW=nw; _cropSelH=nh;
      }
      _cropUpdateSelBox();
      e.preventDefault();
    }
    document.addEventListener('mousemove',onMove);
    document.addEventListener('touchmove',onMove,{passive:false});
    function endDrag(){_cropDragMode=null;}
    document.addEventListener('mouseup',endDrag);
    document.addEventListener('touchend',endDrag);
  });
})();
// ===== END 크롭 모달 로직 =====
