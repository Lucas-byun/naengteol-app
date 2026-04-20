// Community UI / moderation module
// 커뮤니티 기본 썸네일(사진 없을 때) 생성
var _commFallbackCache={};
function _commHash(str){
  var s=String(str||'');
  var h=0;
  for(var i=0;i<s.length;i++)h=((h<<5)-h)+s.charCodeAt(i);
  return Math.abs(h||1);
}
function getCommunityBrandColor(){
  try{
    var c=getComputedStyle(document.documentElement).getPropertyValue('--primary');
    c=(c||'').trim();
    if(c)return c;
  }catch(e){}
  return '#ff7043';
}
function getCommunityTypeIcon(recipeName,text){
  var src=((recipeName||'')+' '+(text||'')).toLowerCase();
  if(src.includes('탕')||src.includes('찌개')||src.includes('국')||src.includes('전골'))return '🍲';
  if(src.includes('볶')||src.includes('구이')||src.includes('불고기'))return '🔥';
  if(src.includes('면')||src.includes('파스타')||src.includes('라면'))return '🍜';
  if(src.includes('밥')||src.includes('덮밥')||src.includes('김밥'))return '🍚';
  if(src.includes('샐러드')||src.includes('야채')||src.includes('채소'))return '🥗';
  if(src.includes('빵')||src.includes('토스트')||src.includes('샌드'))return '🥪';
  return '🍽️';
}
function getCommunityThumbAlt(post){
  var p=post||{};
  var name=(p.recipe||'요리').trim()||'요리';
  return name+' 기본 썸네일';
}
function getCommunityTitleLines(title){
  var t=String(title||'').trim();
  if(!t)t='집밥 후기';
  var maxPerLine=8;
  var maxTotal=maxPerLine*2;
  var clipped=t.length>maxTotal?t.slice(0,maxTotal-1)+'…':t;
  var line1=clipped.slice(0,maxPerLine);
  var line2=clipped.slice(maxPerLine);
  return [line1,line2];
}
function getCommunityFallbackThumb(post,mode){
  var p=post||{};
  var brand=getCommunityBrandColor();
  var cacheKey=[mode||'grid',p.recipe||'',p.emoji||'',p.user||'',p.text||'',brand].join('|');
  if(_commFallbackCache[cacheKey])return _commFallbackCache[cacheKey];
  var seed=_commHash((p.recipe||'')+'|'+(p.emoji||'🍳')+'|'+(p.user||''));
  var palettes=[
    ['#FFE082','#FFB300','#6D4C41'],
    ['#B3E5FC','#29B6F6','#0D47A1'],
    ['#C8E6C9','#66BB6A','#1B5E20'],
    ['#F8BBD0','#EC407A','#880E4F'],
    ['#D1C4E9','#7E57C2','#311B92']
  ];
  var colors=palettes[seed%palettes.length];
  var emoji=(p.emoji||'🍳').slice(0,2);
  var typeIcon=getCommunityTypeIcon(p.recipe,p.text);
  var title=(p.recipe||'집밥 후기').trim();
  var titleLines=getCommunityTitleLines(title);
  var size=mode==='detail'?900:600;
  var subtitle=mode==='detail'?'사진이 없어도 멋진 요리!':'사진 없음';
  var svg='';
  svg+='<svg xmlns="http://www.w3.org/2000/svg" width="'+size+'" height="'+size+'" viewBox="0 0 600 600">';
  svg+='<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="'+colors[0]+'"/><stop offset="100%" stop-color="'+colors[1]+'"/></linearGradient></defs>';
  svg+='<rect width="600" height="600" fill="url(#g)"/>';
  svg+='<rect x="0" y="0" width="600" height="600" fill="none" stroke="'+brand+'" stroke-width="10" opacity=".45"/>';
  svg+='<circle cx="520" cy="80" r="120" fill="rgba(255,255,255,.23)"/>';
  svg+='<circle cx="80" cy="520" r="140" fill="rgba(255,255,255,.18)"/>';
  svg+='<circle cx="90" cy="90" r="48" fill="rgba(255,255,255,.92)"/>';
  svg+='<text x="90" y="108" text-anchor="middle" font-size="42">'+typeIcon+'</text>';
  svg+='<rect x="36" y="390" width="528" height="160" rx="24" fill="rgba(255,255,255,.84)"/>';
  svg+='<text x="300" y="210" text-anchor="middle" font-size="120">'+emoji+'</text>';
  var _line1=titleLines[0].replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  var _line2=titleLines[1].replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  svg+='<text x="300" y="445" text-anchor="middle" font-size="36" font-weight="700" fill="'+colors[2]+'">'+_line1+'</text>';
  if(_line2)svg+='<text x="300" y="490" text-anchor="middle" font-size="36" font-weight="700" fill="'+colors[2]+'">'+_line2+'</text>';
  svg+='<text x="300" y="540" text-anchor="middle" font-size="24" fill="'+colors[2]+'" opacity=".85">'+subtitle+'</text>';
  svg+='</svg>';
  var data='data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg);
  _commFallbackCache[cacheKey]=data;
  var cacheSize=Object.keys(_commFallbackCache).length;
  if(cacheSize>300)_commFallbackCache={};
  return data;
}

// 커뮤니티 검색 자동완성
function updateCommAC(val){
  var ac=document.getElementById('commAcList');
  if(!ac)return;
  var q=(val||'').trim();
  if(!q){ac.style.display='none';return;}
  var ql=q.toLowerCase();
  // communityPosts에서 요리명 추출 (중복 제거)
  var names=[];
  communityPosts.forEach(function(c){
    var n=c.recipe||'';
    if(n&&n.toLowerCase().includes(ql)&&!names.includes(n))names.push(n);
  });
  names=names.slice(0,8);
  if(names.length===0){ac.style.display='none';return;}
  ac.innerHTML='';
  names.forEach(function(s,idx){
    var row=document.createElement('div');
    row.style.padding='10px 14px';
    row.style.cursor='pointer';
    row.style.fontSize='14px';
    row.style.display='flex';
    row.style.alignItems='center';
    row.style.borderBottom=(idx<names.length-1?'1px solid var(--border)':'none');
    row.textContent='🔍 '+s;
    row.onmouseover=function(){row.style.background='var(--bg)';};
    row.onmouseout=function(){row.style.background='';};
    row.onclick=function(){selectCommAC(s);};
    ac.appendChild(row);
  });
  ac.style.display='block';
}
function selectCommAC(val){
  var si=document.getElementById('commSearchInput');
  if(si)si.value=val;
  var ac=document.getElementById('commAcList');
  if(ac)ac.style.display='none';
  window._commSearch=val;
  render();
}

// === COMMUNITY (SAMPLE) ===
// 가짜 커뮤니티 게시글 제거 — 실제 유저가 올린 글만 표시
var COMM_DATA=[];
function renderCommunity(){
  var h='<div class="recipe-section"><h2 style="color:var(--text)">💬 요리 후기</h2>';
  h+='<div style="font-size:12px;color:var(--sub);margin-bottom:12px">다른 사용자들의 요리 후기를 구경해보세요!</div>';
  h+='<div style="background:linear-gradient(135deg,rgba(255,193,7,.1),rgba(76,175,80,.1));border-left:4px solid #ffc107;padding:12px;border-radius:8px;margin-bottom:16px;font-size:12px;color:var(--text);line-height:1.5">';
  h+='<div style="font-weight:700;margin-bottom:4px">⭐ 좋아요 많은 사진이 요리 대표 사진으로 선정됩니다!</div>';
  h+='<div style="opacity:.8">맛있게 만든 요리 사진을 공유하고 좋아요를 받아보세요. 가장 인기 있는 사진이 모든 사용자에게 보여집니다.</div>';
  h+='</div>';
  // 승인 대기 중인 본인 글 표시
  var myPendingPosts=getPendingPosts();
  if(myPendingPosts.length>0){
    myPendingPosts.forEach(function(p){
      h+='<div class="comm-card" style="border-left:3px solid #ff9800;opacity:.85">';
      h+='<div class="comm-top"><div class="comm-avatar" style="overflow:hidden;padding:0">'+getProfilePhotoHtml(36)+'</div><div style="flex:1"><div class="comm-user">나 <span style="font-size:10px;background:#ff9800;color:#fff;padding:1px 6px;border-radius:4px">⏳ 관리자 승인 대기중</span></div><div class="comm-date">'+ehtml(p.date||'')+'</div></div></div>';
      h+='<div class="comm-recipe">🍳 '+ehtml(p.recipe||'')+'</div>';
      if(p.text)h+='<div class="comm-txt">'+ehtml(p.text)+'</div>';
      if(p.photo){var pp=safeUrl(p.photo);if(pp)h+='<img class="comm-img" src="'+eattr(pp)+'" alt="'+eattr((p.recipe||'요리')+' 후기 사진')+'" loading="lazy" decoding="async" onerror="this.style.display=\'none\'">';}
      h+='<div class="comm-actions" style="color:#ff9800;font-size:12px">⏳ 승인 대기중입니다. 관리자가 확인 후 게시됩니다.</div>';
      h+='</div>';
    });
  }
  // 레시피별 커뮤니티 평균 별점 계산
  var commRatingMap={};
  communityPosts.forEach(function(c){
    if(!c.rating||c.rating<1||!c.recipeId)return;
    if(!commRatingMap[c.recipeId])commRatingMap[c.recipeId]={total:0,count:0,name:c.recipe||'',emoji:c.emoji||'🍳'};
    commRatingMap[c.recipeId].total+=Number(c.rating);
    commRatingMap[c.recipeId].count++;
  });
  var commRatingList=Object.keys(commRatingMap).map(function(rid){
    var d=commRatingMap[rid];
    return{id:rid,name:d.name,emoji:d.emoji,avg:d.total/d.count,count:d.count};
  }).sort(function(a,b){return b.avg-a.avg||(b.count-a.count)}).slice(0,5);
  // 커뮤니티 평균 별점 TOP5 섹션
  if(commRatingList.length>0){
    h+='<div style="background:linear-gradient(135deg,#fff8e1,#fffde7);border:1px solid #ffe082;border-radius:14px;padding:14px;margin-bottom:16px">';
    h+='<div style="font-size:12px;font-weight:700;color:#f57f17;margin-bottom:10px">⭐ 커뮤니티 평균 별점 TOP'+commRatingList.length+'</div>';
    h+='<div style="font-size:10px;color:#a1887f;margin-top:-6px;margin-bottom:8px">커뮤니티에 별점을 남긴 후기 기준</div>';
    commRatingList.forEach(function(r,i){
      var stars='';
      var avgR=Math.round(r.avg);
      for(var si=1;si<=5;si++)stars+=(si<=avgR?'★':'☆');
      h+='<div role="button" tabindex="0" aria-label="'+eattr((r.name||'레시피')+' 상세 보기')+'" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();openDetail(\''+r.id+'\')}" onclick="openDetail(\''+r.id+'\')" style="display:flex;align-items:center;gap:8px;padding:6px 0;cursor:pointer'+(i<commRatingList.length-1?';border-bottom:1px solid rgba(0,0,0,.06)':'')+'">'
      h+='<span style="font-size:20px">'+ehtml(r.emoji||'🍳')+'</span>';
      h+='<div style="flex:1;min-width:0">';
      h+='<div style="font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+ehtml(r.name||'')+'</div>';
      h+='<div style="font-size:11px;color:#fbc02d">'+stars+' <span style="font-size:10px;color:#888">'+r.avg.toFixed(1)+'점 ('+r.count+'명)</span></div>';
      h+='</div>';
      h+='</div>';
    });
    h+='</div>';
  }
  // ===== 검색창 + 필터 =====
  var isAdmin=isAdminSession();
  var commSearchVal=window._commSearch||'';
  var commSort=window._commSort||'latest';
  h+='<div style="display:flex;gap:8px;margin-bottom:12px;align-items:center">';
  h+='<div style="position:relative;flex:1">';
  h+='<input id="commSearchInput" type="text" placeholder="요리명 검색..." value="'+esc(commSearchVal)+'" autocomplete="off" style="width:100%;box-sizing:border-box;padding:8px 12px;border:1px solid var(--border);border-radius:10px;font-size:13px;background:var(--bg);color:var(--text);font-family:inherit" oninput="updateCommAC(this.value)" onfocus="updateCommAC(this.value)" onblur="setTimeout(function(){var ac=document.getElementById(\'commAcList\');if(ac)ac.style.display=\'none\'},200)">';
  h+='<div id="commAcList" style="display:none;position:absolute;top:100%;left:0;right:0;background:var(--card);border:1.5px solid var(--primary);border-radius:12px;z-index:999;max-height:200px;overflow-y:auto;box-shadow:0 4px 16px rgba(0,0,0,.12);margin-top:4px"></div>';
  h+='</div>';
  h+='<button onclick="var inp=document.getElementById(\'commSearchInput\');window._commSearch=(inp?inp.value:\'\');render()" style="padding:8px 14px;border:none;border-radius:10px;background:var(--primary);color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">검색</button>';
  if(commSearchVal)h+='<button onclick="window._commSearch=\'\';render()" style="padding:8px 10px;border:1px solid var(--border);border-radius:10px;background:var(--bg);font-size:13px;cursor:pointer;font-family:inherit;color:var(--text)">✕</button>';
  h+='<select onchange="window._commSort=this.value;render()" style="padding:8px 10px;border:1px solid var(--border);border-radius:10px;font-size:12px;background:var(--bg);color:var(--text);font-family:inherit">';
  h+='<option value="latest"'+(commSort==='latest'?' selected':'')+'>최신순</option>';
  h+='<option value="likes"'+(commSort==='likes'?' selected':'')+'>좋아요순</option>';
  h+='</select>';
  h+='</div>';
  // ===== 인스타그램 그리드 (2열) =====
  // 검색 + 정렬 필터
  var filteredPosts=communityPosts.slice();
  if(commSearchVal.trim()){
    var kw=commSearchVal.trim().toLowerCase();
    filteredPosts=filteredPosts.filter(function(c){return (c.recipe||'').toLowerCase().includes(kw)||(c.text||'').toLowerCase().includes(kw);});
  }
  if(commSort==='likes'){
    filteredPosts.sort(function(a,b){return (b.likes||0)-(a.likes||0);});
  }
  if(filteredPosts.length>0){
    h+='<div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:10px">📸 후기 사진 ('+filteredPosts.length+'개)</div>';
    h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;margin-bottom:16px">';
    filteredPosts.forEach(function(c,idx){
      var _liked=localStorage.getItem('nt_liked_'+(c.id||c._fbKey||('idx_'+idx)))==='1';
      var _isBest=c.recipeId&&RECIPE_BEST_PHOTOS[c.recipeId]&&RECIPE_BEST_PHOTOS[c.recipeId].photo===c.photo;
      h+='<div role="button" tabindex="0" aria-label="'+eattr((c.recipe||'요리')+' 후기 상세 보기')+'" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();openCommDetail('+idx+')}" onclick="openCommDetail('+idx+')" style="position:relative;cursor:pointer;background:#f5f5f5;aspect-ratio:1/1;overflow:hidden;border-radius:4px">';
      if(c.photo){
        var _thumb=safeUrl(c.photo);
        if(_thumb){
          var _fbThumb=getCommunityFallbackThumb(c,'grid');
          h+='<img src="'+eattr(_thumb)+'" alt="'+eattr((c.recipe||'요리')+' 후기 썸네일')+'" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;display:block" onerror="this.onerror=null;this.src=\''+eattr(_fbThumb)+'\'">';
        }else{
          var _fallbackThumbWhenInvalid=getCommunityFallbackThumb(c,'grid');
          h+='<img src="'+eattr(_fallbackThumbWhenInvalid)+'" alt="'+eattr(getCommunityThumbAlt(c))+'" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;display:block">';
        }
      } else {
        var _fallbackThumb=getCommunityFallbackThumb(c,'grid');
        h+='<img src="'+eattr(_fallbackThumb)+'" alt="'+eattr(getCommunityThumbAlt(c))+'" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;display:block">';
      }
      // 좋아요 수 오버레이
      if((c.likes||0)>0){
        h+='<div style="position:absolute;bottom:4px;left:4px;background:rgba(0,0,0,.55);color:#fff;font-size:10px;padding:2px 5px;border-radius:6px">❤️ '+(c.likes||0)+'</div>';
      }
      // 대표사진 뱃지
      if(_isBest){
        h+='<div style="position:absolute;top:4px;left:4px;background:rgba(255,111,0,.9);color:#fff;font-size:9px;font-weight:700;padding:2px 5px;border-radius:5px">👑</div>';
      }
      // 관리자 삭제 버튼
      if(isAdmin){
        h+='<button onclick="event.stopPropagation();deleteCommunityPost('+idx+')" style="position:absolute;top:4px;right:4px;background:rgba(211,47,47,.85);border:none;border-radius:5px;color:#fff;font-size:10px;padding:2px 6px;cursor:pointer;font-family:inherit">삭제</button>';
      }
      h+='</div>';
    });
    h+='</div>';
  } else if(!isAdmin){
    h+='<div style="text-align:center;padding:40px 20px;color:var(--sub)">';
    h+='<div style="font-size:56px;margin-bottom:16px">📸</div>';
    if(commSearchVal.trim()){
      h+='<div style="font-size:16px;font-weight:700;margin-bottom:6px;color:var(--text)">"'+ehtml(commSearchVal)+'" 검색 결과가 없어요</div>';
      h+='<div style="font-size:13px;line-height:1.5;margin-bottom:16px">다른 요리명으로 검색해보세요!</div>';
    } else {
      h+='<div style="font-size:16px;font-weight:700;margin-bottom:6px;color:var(--text)">아직 등록된 후기가 없어요</div>';
      h+='<div style="font-size:13px;line-height:1.5;margin-bottom:16px">요리를 완성하고 사진을 찍어보세요!<br>다른 사용자들과 요리 경험을 공유할 수 있어요.</div>';
      h+='<button class="empty-cta" onclick="tab=&apos;cook&apos;;render()">🍳 요리 시작하기</button>';
    }
    h+='</div>';
  }
  // 관리자 전용: 승인 대기 섹션
  if(isAdmin){
    var pendingPosts=getPendingPosts();
    if(pendingPosts.length>0){
      h+='<div style="background:linear-gradient(135deg,#fff3e0,#ffe0b2);border:2px solid #ff9800;border-radius:12px;padding:14px;margin-top:16px">';
      h+='<div style="font-size:14px;font-weight:700;color:#e65100;margin-bottom:10px">🔔 승인 대기 ('+pendingPosts.length+'건)</div>';
      pendingPosts.forEach(function(p,pidx){
        h+='<div style="background:#fff;border-radius:10px;padding:12px;margin-bottom:8px;border:1px solid #ffe0b2" id="pendingCard_'+pidx+'">';
        h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">';
        h+='<span style="font-size:20px">'+ehtml(p.emoji||'🍳')+'</span>';
        h+='<div style="flex:1"><div style="font-size:13px;font-weight:600">'+ehtml(p.recipe||'')+'</div><div style="font-size:11px;color:#888">'+ehtml(p.date||'')+' · '+ehtml(p.nickname||p.user||'익명')+'</div></div>';
        h+='</div>';
        if(p.text)h+='<div style="font-size:12px;color:#555;margin-bottom:6px">'+ehtml(p.text)+'</div>';
        if(p.photo){
          h+='<div style="position:relative;margin-bottom:8px">';
          h+='<div id="imgWrap_'+pidx+'" style="overflow:hidden;border-radius:8px;background:#f5f5f5;text-align:center">';
          var _adminPhotoSrc=safeUrl(p.photo);if(_adminPhotoSrc)h+='<img id="adminImg_'+pidx+'" src="'+eattr(_adminPhotoSrc)+'" alt="'+eattr((p.recipe||'요리')+' 관리자 검토 사진')+'" loading="lazy" decoding="async" style="max-width:100%;height:auto;display:block;margin:0 auto;transform-origin:center;transition:transform .2s" onerror="this.style.display=\'none\'">';
          h+='</div>';
          h+='<div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap">';
          h+='<button onclick="adminRotateImg('+pidx+',-90)" class="btn-admin-sm">↺ 왼쪽</button>';
          h+='<button onclick="adminRotateImg('+pidx+',90)" class="btn-admin-sm">↻ 오른쪽</button>';
          h+='<button onclick="adminCropModal('+pidx+')" class="btn-admin-crop">✂️ 크롭</button>';
          h+='<button onclick="adminResetImg('+pidx+',\''+esc(p.photo||'')+'\')" class="btn-admin-sm">↩ 원본</button>';
          h+='</div>';
          h+='</div>';
        }
        h+='<div style="display:flex;gap:6px;margin-top:6px">';
        h+='<button onclick="approvePendingPost('+pidx+')" class="btn-admin-ok">✅ 승인</button>';
        h+='<button onclick="rejectPendingPost('+pidx+')" class="btn-admin-no">❌ 거절</button>';
        h+='</div>';
        h+='</div>';
      });
      h+='</div>';
    } else {
      h+='<div style="background:linear-gradient(135deg,#e8f5e9,#c8e6c9);border:1px solid #66bb6a;border-radius:10px;padding:10px 14px;margin-top:12px;font-size:12px;color:#2e7d32;font-weight:600">✅ 관리자 모드 · 대기 중인 글 없음</div>';
    }
  }
  h+='</div>';return h;
}
// 커뮤니티 상세 팝업 열기
function openCommDetail(idx){
  var c=communityPosts[idx];
  if(!c)return;
  var _liked=localStorage.getItem('nt_liked_'+(c.id||c._fbKey||('idx_'+idx)))==='1';
  var _isBest=c.recipeId&&RECIPE_BEST_PHOTOS[c.recipeId]&&RECIPE_BEST_PHOTOS[c.recipeId].photo===c.photo;
  var stars='';
  if(c.rating&&c.rating>0){for(var i=1;i<=5;i++)stars+=(i<=c.rating?'★':'☆');}
  var overlay=document.createElement('div');
  overlay.id='commDetailOverlay';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;display:flex;align-items:flex-end;justify-content:center';
  overlay.onclick=function(e){if(e.target===overlay)closeCommDetail();};
  var panel=document.createElement('div');
  panel.style.cssText='background:var(--bg);border-radius:20px 20px 0 0;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;padding:0 0 32px';

  var handleWrap=document.createElement('div');
  handleWrap.style.cssText='text-align:center;padding:12px 0 4px';
  var handle=document.createElement('div');
  handle.style.cssText='width:36px;height:4px;background:#ddd;border-radius:2px;display:inline-block';
  handleWrap.appendChild(handle);
  panel.appendChild(handleWrap);

  var header=document.createElement('div');
  header.style.cssText='display:flex;align-items:center;gap:10px;padding:10px 16px 8px';
  var avatar=document.createElement('div');
  avatar.style.cssText='width:38px;height:38px;border-radius:50%;background:var(--primary-light);display:flex;align-items:center;justify-content:center;font-size:20px';
  avatar.textContent=c.emoji||'🍳';
  header.appendChild(avatar);
  var userWrap=document.createElement('div');
  userWrap.style.cssText='flex:1';
  var nameEl=document.createElement('div');
  nameEl.style.cssText='font-size:14px;font-weight:700;color:var(--text)';
  nameEl.textContent=c.nickname||c.user||'익명';
  userWrap.appendChild(nameEl);
  var dateEl=document.createElement('div');
  dateEl.style.cssText='font-size:11px;color:var(--sub)';
  dateEl.textContent=c.date||'';
  userWrap.appendChild(dateEl);
  header.appendChild(userWrap);
  var closeBtn=document.createElement('button');
  closeBtn.type='button';
  closeBtn.style.cssText='background:none;border:none;font-size:22px;color:var(--sub);cursor:pointer;padding:4px';
  closeBtn.textContent='✕';
  closeBtn.onclick=closeCommDetail;
  header.appendChild(closeBtn);
  panel.appendChild(header);

  var recipeWrap=document.createElement('div');
  recipeWrap.style.cssText='padding:0 16px 8px';
  var recipeEl=document.createElement('div');
  recipeEl.style.cssText='font-size:13px;font-weight:600;color:var(--primary)';
  recipeEl.textContent='🍳 '+(c.recipe||'');
  recipeWrap.appendChild(recipeEl);
  if(stars){
    var starsEl=document.createElement('div');
    starsEl.style.cssText='font-size:13px;color:#fbc02d;margin-top:2px';
    starsEl.textContent=stars;
    recipeWrap.appendChild(starsEl);
  }
  panel.appendChild(recipeWrap);

  if(c.photo){
    var photoWrap=document.createElement('div');
    photoWrap.style.cssText='position:relative';
    var _detailPhoto=safeUrl(c.photo);
    if(_detailPhoto){
      var img=document.createElement('img');
      img.src=_detailPhoto;
      img.style.cssText='width:100%;max-height:360px;object-fit:contain;background:#111;display:block';
      img.onerror=function(){this.onerror=null;this.src=getCommunityFallbackThumb(c,'detail');this.style.objectFit='cover';this.style.background='transparent';};
      photoWrap.appendChild(img);
    }else{
      var detailFallback=document.createElement('img');
      detailFallback.src=getCommunityFallbackThumb(c,'detail');
      detailFallback.style.cssText='width:100%;max-height:360px;object-fit:cover;display:block';
      detailFallback.alt=getCommunityThumbAlt(c);
      photoWrap.appendChild(detailFallback);
    }
    if(_isBest){
      var bestBadge=document.createElement('div');
      bestBadge.style.cssText='position:absolute;top:8px;left:8px;background:rgba(255,111,0,.92);color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:8px';
      bestBadge.textContent='👑 대표 사진';
      photoWrap.appendChild(bestBadge);
    }
    panel.appendChild(photoWrap);
  } else {
    var fallbackWrap=document.createElement('div');
    fallbackWrap.style.cssText='position:relative';
    var fallbackImg=document.createElement('img');
    fallbackImg.src=getCommunityFallbackThumb(c,'detail');
    fallbackImg.style.cssText='width:100%;max-height:360px;object-fit:cover;display:block';
    fallbackImg.alt=getCommunityThumbAlt(c);
    fallbackWrap.appendChild(fallbackImg);
    panel.appendChild(fallbackWrap);
  }

  if(c.text){
    var textEl=document.createElement('div');
    textEl.style.cssText='padding:12px 16px;font-size:14px;line-height:1.6;color:var(--text)';
    textEl.textContent=c.text;
    panel.appendChild(textEl);
  }

  var actionWrap=document.createElement('div');
  actionWrap.style.cssText='padding:12px 16px 0;display:flex;align-items:center;gap:12px';
  var likeBtn=document.createElement('button');
  likeBtn.type='button';
  likeBtn.id='commDetailLikeBtn';
  likeBtn.style.cssText='display:flex;align-items:center;gap:6px;padding:8px 18px;border:1px solid #eee;border-radius:20px;font-size:14px;cursor:pointer;font-family:inherit';
  likeBtn.style.background=_liked?'#fce4ec':'var(--bg)';
  likeBtn.style.color=_liked?'#e53935':'var(--sub)';
  likeBtn.onclick=function(){likePostFromDetail(idx);};
  var likeIcon=document.createElement('span');
  likeIcon.id='commDetailLikeIcon';
  likeIcon.textContent=_liked?'❤️':'🤍';
  likeBtn.appendChild(likeIcon);
  var likeCount=document.createElement('span');
  likeCount.id='commDetailLikeCount';
  likeCount.textContent=String(c.likes||0);
  likeBtn.appendChild(likeCount);
  actionWrap.appendChild(likeBtn);
  var helpText=document.createElement('span');
  helpText.style.cssText='font-size:12px;color:var(--sub)';
  helpText.textContent='탭해서 좋아요!';
  actionWrap.appendChild(helpText);
  panel.appendChild(actionWrap);

  overlay.appendChild(panel);
  document.body.appendChild(overlay);
  // 스와이프 다운으로 닫기
  var startY=0;
  overlay.addEventListener('touchstart',function(e){startY=e.touches[0].clientY;},{passive:true});
  overlay.addEventListener('touchend',function(e){
    if(e.changedTouches[0].clientY-startY>80)closeCommDetail();
  },{passive:true});
}
function closeCommDetail(){
  var el=document.getElementById('commDetailOverlay');
  if(el)el.remove();
}
function likePostFromDetail(idx){
  likePost(idx);
  // 팝업 내 좋아요 버튼 UI 즉시 업데이트
  setTimeout(function(){
    var c=communityPosts[idx];
    if(!c)return;
    var btn=document.getElementById('commDetailLikeBtn');
    var cnt=document.getElementById('commDetailLikeCount');
    if(btn&&cnt){
      var _liked=localStorage.getItem('nt_liked_'+(c.id||c._fbKey||('idx_'+idx)))==='1';
      btn.style.background=_liked?'#fce4ec':'var(--bg)';
      btn.style.color=_liked?'#e53935':'var(--sub)';
      var icon=document.getElementById('commDetailLikeIcon');
      if(icon)icon.textContent=_liked?'❤️':'🤍';
      cnt.textContent=String(c.likes||0);
    }
  },500);
}

// === 관리자 기능 ===

// === 관리자 사진 편집 함수 ===
// 각 이미지의 현재 회전각 저장
var _adminImgRotation={};
// 각 이미지의 편집된 데이터URL 저장 (승인 시 사용)
var _adminImgEdited={};

function adminRotateImg(pidx, deg){
  _adminImgRotation[pidx]=(_adminImgRotation[pidx]||0)+deg;
  var angle=_adminImgRotation[pidx];
  var img=document.getElementById('adminImg_'+pidx);
  if(!img)return;
  // Canvas로 실제 회전 적용하여 데이터URL 저장
  var canvas=document.createElement('canvas');
  var tmpImg=new Image();
  tmpImg.crossOrigin='anonymous';
  tmpImg.onload=function(){
    var w=tmpImg.naturalWidth, h=tmpImg.naturalHeight;
    var rad=angle*Math.PI/180;
    var sin=Math.abs(Math.sin(rad)), cos=Math.abs(Math.cos(rad));
    canvas.width=Math.round(w*cos+h*sin);
    canvas.height=Math.round(w*sin+h*cos);
    var ctx=canvas.getContext('2d');
    ctx.translate(canvas.width/2,canvas.height/2);
    ctx.rotate(rad);
    ctx.drawImage(tmpImg,-w/2,-h/2);
    var dataUrl=canvas.toDataURL('image/jpeg',0.92);
    _adminImgEdited[pidx]=dataUrl;
    img.src=dataUrl;
  };
  // 원본 또는 이전 편집본 기준으로 회전
  var pendingPosts=getPendingPosts();
  var origSrc=(pendingPosts[pidx]&&pendingPosts[pidx].photo)||img.src;
  // 누적 회전이므로 항상 원본에서 재계산
  _adminImgRotation[pidx]=angle;
  tmpImg.src=origSrc;
}

function adminCropModal(pidx){
  var img=document.getElementById('adminImg_'+pidx);
  if(!img)return;
  var src=_adminImgEdited[pidx]||(getPendingPosts()[pidx]&&getPendingPosts()[pidx].photo)||img.src;
  // 새 선택박스 크롭 모달 열기
  openCropModal(src, function(croppedDataUrl){
    _adminImgEdited[pidx]=croppedDataUrl;
    img.src=croppedDataUrl;
  });
}

function adminResetImg(pidx, origSrc){
  var img=document.getElementById('adminImg_'+pidx);
  if(!img)return;
  delete _adminImgEdited[pidx];
  delete _adminImgRotation[pidx];
  img.src=origSrc;
}
// === END 관리자 사진 편집 ===

// === 관리자 승인/거절 함수 ===
function approvePendingPost(pidx){
  if(!isAdminSession())return;
  verifyAdminPassword(false).then(function(ok){
    if(!ok)return;
  var pendingPosts=getPendingPosts();
  if(pidx<0||pidx>=pendingPosts.length)return;
  var post=pendingPosts[pidx];
  var fbKey=post._fbKey;
  // 편집된 사진이 있으면 편집본 사용, 없으면 원본 사용
  var finalPhoto=_adminImgEdited[pidx]||post.photo||'';
  var approvedPost={
    id:post.id||fbKey,
    recipe:post.recipe,
    recipeId:post.recipeId||'',
    emoji:post.emoji||'🍳',
    user:post.user||'익명',
    nickname:post.nickname||post.user||'익명',
    uid:post.uid||'',
    date:post.date,
    text:post.text||'',
    photo:finalPhoto,
    rating:post.rating||0,
    likes:0,
    approvedAt:new Date().toISOString()
  };
  // Firebase approved 노드에 저장
  fbDB.ref('community/approved/'+approvedPost.id).set(approvedPost,function(err){
    if(!err){
      // pending 노드에서 제거
      if(fbKey)fbDB.ref('community/pending/'+fbKey).remove(function(removeErr){if(removeErr)console.warn('[Firebase] pending 삭제 실패:',removeErr);});
      // 커뮤니티 평점이 있으면 Firebase recipes 노드에 집계
      if(approvedPost.recipeId && approvedPost.rating > 0){
        var recRef=fbDB.ref('recipes/'+approvedPost.recipeId);
        recRef.once('value',function(snap){
          var cur=snap.val()||{};
          var updates={
            name:approvedPost.recipe||cur.name||'',
            emoji:approvedPost.emoji||cur.emoji||'🍳',
            count:cur.count||0,
            lastDate:cur.lastDate||'',
            commTotalRating:(cur.commTotalRating||0)+approvedPost.rating,
            commRatingCount:(cur.commRatingCount||0)+1
          };
          updates.commAvgRating=updates.commRatingCount>0?Math.round((updates.commTotalRating/updates.commRatingCount)*10)/10:0;
          recRef.update(updates,function(updateErr){if(updateErr)console.warn('[Firebase] 레시피 평점 집계 실패:',updateErr);});
        });
      }
      // 구글 시트에 승인 기록 (백그라운드)
      reportCommunityApprovalToSheet(approvedPost);
      showCartPopup('✅ 승인 완료!','커뮤니티에 게시되었습니다.');
    }else{
      showCartPopup('❌ 오류','승인 중 오류가 발생했습니다.');
    }
  });
  });
}

function rejectPendingPost(pidx){
  if(!isAdminSession())return;
  verifyAdminPassword(false).then(function(ok){
    if(!ok)return;
  var pendingPosts=getPendingPosts();
  if(pidx<0||pidx>=pendingPosts.length)return;
  var fbKey=pendingPosts[pidx]._fbKey;
  if(fbKey){
    fbDB.ref('community/pending/'+fbKey).remove(function(err){
      if(!err)showCartPopup('❌ 거절 완료','해당 글이 삭제되었습니다.');
    });
  }
  });
}

function likePost(idx){
  if(!communityPosts[idx])return;
  var postId=communityPosts[idx].id||communityPosts[idx]._fbKey||('idx_'+idx);
  // localStorage 즉시 체크 — 동일 기기에서 빠른 중복 탭 방지 (비동기 완료 전 이중 호출 차단)
  if(localStorage.getItem('nt_liked_'+postId)==='1'){
    showCartPopup('❤️ 이미 좋아요!','이미 좋아요를 눌렀습니다.');
    return;
  }
  var fbKey=communityPosts[idx]._fbKey||postId;
  // Firebase uid 기반 좋아요 중복 방지 (재설치/브라우저 초기화 후에도 유지)
  var likeRef=fbDB.ref('community/likes/'+fbKey+'/'+fbUid);
  likeRef.once('value',function(snap){
    if(snap.val()===true){
      showCartPopup('❤️ 이미 좋아요!','이미 좋아요를 눌렀습니다.');
      return;
    }
    // 좋아요 표시 저장 (uid 기반)
    likeRef.set(true,function(setErr){if(setErr)console.warn('[Firebase] 좋아요 저장 실패:',setErr);});
    // 좋아요 카운트 트랜잭션 업데이트
    fbDB.ref('community/approved/'+fbKey+'/likes').transaction(function(cur){
      return (cur||0)+1;
    },function(txErr){if(txErr)console.warn('[Firebase] 좋아요 카운트 실패:',txErr);});
    // localStorage에도 동시 저장 (오프라인 빠른 체크용)
    localStorage.setItem('nt_liked_'+postId,'1');
    showCartPopup('❤️ 좋아요!','좋아요를 눌렀습니다.');
  });
}
// === END 관리자 승인/거절 ===

function deleteCookHistory(recipeId){
  if(!confirm('이 요리 기록을 삭제하시겠습니까?\n(해당 레시피의 모든 기록이 삭제됩니다)'))return;
  cookHistory=cookHistory.filter(function(ch){return ch.id!==recipeId});
  localStorage.setItem('nt_history',JSON.stringify(cookHistory));
  showCartPopup('🗑️ 삭제 완료','요리 기록이 삭제되었습니다.');
  render();
}

function deleteCommunityPost(idx){
  if(!isAdminSession())return;
  verifyAdminPassword(false).then(function(ok){
    if(!ok)return;
  if(!confirm('이 게시글을 삭제하시겠습니까?'))return;
  var fbKey=communityPosts[idx]&&(communityPosts[idx]._fbKey||communityPosts[idx].id);
  if(fbKey){
    fbDB.ref('community/approved/'+fbKey).remove(function(err){
      if(!err)showCartPopup('🗑️ 삭제 완료','게시글이 삭제되었습니다.');
    });
  }
  });
}
