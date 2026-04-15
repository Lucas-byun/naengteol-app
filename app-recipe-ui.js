// Recipe detail/fullscreen module
// === DETAIL ===
function openDetail(id){detailR=RECIPES.find(function(r){return r.id===id});servMul=1;pushState('detail');renderDetail();}
function renderDetail(){
  if(!detailR)return;var r=detailR;
  var h='<div class="detail show">';
  h+='<div class="det-hdr"><button class="det-back" onclick="closeDetail()">←</button><span style="font-weight:700">'+r.name+'</span>';
  h+='<div style="display:flex;gap:8px"><button onclick="openFS(\''+r.id+'\')" style="padding:4px 12px;border:1.5px solid var(--primary);border-radius:8px;background:none;color:var(--primary);font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">🍳 요리시작</button><button class="det-back" onclick="toggleFav(\''+r.id+'\');renderDetail()">'+(favs.has(r.id)?'❤️':'🤍')+'</button></div></div>';
  var _detBestPhoto=getRecipeBestPhoto(r.id);
  var _detBestPhotoUrl=_detBestPhoto?safeUrl(_detBestPhoto.photo||_detBestPhoto):'';
  var _detBestPhotoBy=_detBestPhoto?ehtml(_detBestPhoto.author||'유저'):'유저';
  h+='<div class="det-hero">'+(getRecipeMedal(r.id)?'<div style="text-align:center;font-size:13px;font-weight:700;color:#ff6f00;margin-bottom:4px">'+getRecipeMedal(r.id)+' 인기 TOP 요리</div>':'')+(_detBestPhotoUrl?'<div style="position:relative;margin-bottom:12px;width:100%;aspect-ratio:1/1;overflow:hidden;border-radius:12px"><img src="'+eattr(_detBestPhotoUrl)+'" alt="'+eattr(r.name+' 대표 요리 사진')+'" decoding="async" style="width:100%;height:100%;object-fit:cover;display:block" onerror="this.parentNode.style.display=\'none\'"><div style="position:absolute;bottom:6px;right:8px;background:rgba(0,0,0,.6);color:#fff;font-size:10px;padding:3px 8px;border-radius:8px">📸 '+_detBestPhotoBy+'님의 요리</div></div>':'')+'<div class="emoji">'+r.emoji+'</div><h2>'+r.name+'</h2>';
  h+='<div class="meta"><span>'+(['⭐ 쉬움','⭐ 쉬움','⭐⭐ 보통','⭐⭐⭐ 어려움'][r.diff]||'⭐ 쉬움')+'</span><span>⏱'+r.time+'분</span><span>'+r.serving+'인분</span></div>';
  h+='<div class="desc">'+ehtml(r.desc)+'</div>';
  var dTags=RECIPE_TAGS[r.id]||[];if(dTags.length>0){h+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:8px;justify-content:center">';var dtC=TAG_COLORS;dTags.forEach(function(t){var c=dtC[t]||['#555','#eee'];h+='<button type="button" aria-label="'+eattr(t)+' 태그 레시피 보기" onclick="closeDetail();activeTag=\''+t+'\';tab=\'cook\';render()" style="font-size:11px;padding:3px 10px;border-radius:12px;background:'+c[1]+';color:'+c[0]+';font-weight:600;cursor:pointer;border:none;font-family:inherit">#'+t+'</button>';});h+='</div>';}
  h+='</div>';
  // 커뮤니티 평균 별점 계산
  var _commRated=communityPosts.filter(function(c){return c.recipeId===r.id&&c.rating&&c.rating>0;});
  var _commAvgRating=_commRated.length>0?(_commRated.reduce(function(s,c){return s+Number(c.rating);},0)/_commRated.length):0;
  var _commRatingCard=_commRated.length>0?('<div class="info-card" style="background:linear-gradient(135deg,#fff8e1,#fffde7);border:1px solid #ffe082"><div class="val" style="color:#f57f17">'+(function(){var s='';var avg=Math.round(_commAvgRating);for(var i=1;i<=5;i++)s+=(i<=avg?'★':'☆');return s;})()+'</div><div class="lbl">커뮤니티 '+_commRated.length+'명</div></div>'):'';
  h+='<div class="det-info-cards"><div class="info-card"><div class="val">'+r.serving+'인분</div><div class="lbl">기준</div></div><div class="info-card"><div class="val">'+r.time+'분</div><div class="lbl">조리시간</div></div><div class="info-card"><div class="val">'+r.kcal+'</div><div class="lbl">칼로리</div></div>'+_commRatingCard+'</div>';
  // 보관법 표시 제거됨
  h+='<div class="serving-ctrl"><button class="sv-btn" onclick="if(servMul>1){servMul--;renderDetail()}">−</button><span class="sv-val">'+Math.round(r.serving*servMul)+'인분</span><button class="sv-btn" onclick="if(servMul<10){servMul++;renderDetail()}">＋</button></div>';
  h+='<div class="det-section"><h3>📝 재료</h3><div class="det-legend">● 필수 / ○ 선택' + (sel.size>0 ? ' · <span style="color:var(--green)">✔ 보유</span> / <span style="color:#d84315">✘ 부족</span>' : '') + '</div>';
  r.ings.forEach(function(i){
    var isReq=i.t==='req';
    var have=sel.size>0 && [...sel].some(function(s){return ingMatch(i.v,s)});
    var miss=sel.size>0 && isReq && !have;
    var dotCls=isReq?(have?'req':miss?'miss':'req'):(have?'opt-have':'opt');
    var txtStyle='';
    if(miss)txtStyle=' style="color:#d84315"';
    else if(have)txtStyle=' style="color:var(--green)"';
    h+='<div class="det-ing-item">';
    h+='<span class="det-ing-dot '+dotCls+'"></span>';
    h+='<span'+txtStyle+'>'+convertGUnit(scaleVal(i.v,servMul))+'</span>';
    if(miss&&isReq)h+='<span style="margin-left:auto;font-size:11px;color:#b85450;background:#fdf5f5;padding:1px 6px;border-radius:8px">부족</span>';
    else if(have)h+='<span style="margin-left:auto;font-size:11px;color:var(--green);background:#e8f5e9;padding:1px 6px;border-radius:8px">보유</span>';
    h+='</div>';
  });
  if(servMul>1){
    h+='<div style="margin-top:8px;padding:8px 10px;background:#fff8e1;border-radius:8px;border:1px solid #ffe082;font-size:12px;color:#795548;line-height:1.5">';
    h+='⚠️ <b>'+Math.round(r.serving*servMul)+'인분 기준</b>으로 자동 계산된 양입니다.<br>양념은 실제 요리 시 맛을 보며 조절하세요.';
    h+='</div>';
  }
  h+='</div>';
  // Cart button for missing ingredients
  if(sel.size>0){
    var missingCount=r.ings.filter(function(i){return i.t==='req'&&![...sel].some(function(s){return ingMatch(i.v,s)})}).length;
    if(missingCount>0){
      h+='<div style="padding:0 16px 8px"><button onclick="addToCart(\''+r.id+'\')" style="width:100%;padding:12px;border:none;border-radius:10px;background:#1976d2;color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">🛒 부족 재료 '+missingCount+'개 장바구니에 담기</button></div>';
    }
  }
  // Substitute ingredients info
  var subs=getSubstitutes(r);
  if(subs.length>0){
    h+='<div class="det-section"><div style="background:#f0f4ff;border:1px solid #c5cae9;border-radius:10px;padding:10px 12px">';
    h+='<div style="font-size:12px;font-weight:700;color:#3949ab;margin-bottom:6px">🔄 대체 가능 재료</div>';
    subs.forEach(function(s){
      h+='<div style="font-size:12px;color:#555;padding:2px 0">• <b>'+s.name+'</b> → '+s.alt+'</div>';
    });
    h+='</div></div>';
  }
  // 선택재료 보유 여부 확인
  var ownedOptNames = [];
  r.ings.forEach(function(i){
    if(i.t==='opt' && sel.size>0 && [...sel].some(function(s){return ingMatch(i.v,s)})){
      ownedOptNames.push(i.v.split(/[\s\d]/)[0].replace(/[•·()]/g,''));
    }
  });
  var ownedOptCount = ownedOptNames.length;
  var totalOptCount = r.ings.filter(function(i){return i.t==='opt';}).length;
  h+='<div class="det-section"><h3>👨‍🍳 요리 순서</h3>';
  if(totalOptCount>0){
    if(ownedOptCount===0){
      h+='<div style="font-size:12px;color:var(--sub);background:#f5f5f5;padding:6px 10px;border-radius:8px;margin-bottom:8px">📌 기본 버전 (선택재료 없이)</div>';
    } else {
      h+='<div style="font-size:12px;color:var(--primary);background:#f0f7ff;padding:6px 10px;border-radius:8px;margin-bottom:8px">✨ 선택재료 '+ownedOptCount+'개 반영 버전</div>';
    }
  }
  var stepNum = 1;
  r.steps.forEach(function(s,i){
    var optIng = s.optIng || '';
    // 선택재료 태그가 있는 단계: 보유 여부에 따라 표시/숨김
    if(optIng){
      var ingOwned = sel.size===0 || ownedOptNames.some(function(n){return optIng.includes(n)||n.includes(optIng);});
      if(!ingOwned){
        // 선택재료 없으면 해당 단계 회색으로 표시 (힌트용)
        h+='<div class="step" style="opacity:0.4">';
        h+='<div class="step-num" style="background:#ccc">'+stepNum+'</div>';
        h+='<div class="step-txt"><span style="font-size:11px;color:#999;display:block;margin-bottom:2px">['+optIng+' 있으면]</span>'+scaleVal(getStepText(s),servMul,true)+'</div>';
        h+='</div>';
      } else {
        h+='<div class="step" style="border-left:3px solid var(--primary)">';
        h+='<div class="step-num" style="background:var(--primary);color:#fff">'+stepNum+'</div>';
        h+='<div class="step-txt"><span style="font-size:11px;color:var(--primary);display:block;margin-bottom:2px">✨ '+optIng+'</span>'+scaleVal(getStepText(s),servMul,true)+'</div>';
        h+='</div>';
      }
    } else {
      h+='<div class="step"><div class="step-num">'+stepNum+'</div>';
      h+='<div class="step-txt">'+scaleVal(getStepText(s),servMul,true)+'</div>';
      h+='</div>';
    }
    stepNum++;
  });
  h+='<div style="margin-top:8px;padding:10px 14px;background:var(--card);border-radius:10px;border:1px dashed var(--border);text-align:center;font-size:13px;color:var(--sub)">💡 팁과 상세 설명은 <strong style="color:var(--primary)">요리모드</strong>에서 확인하세요</div>';
  h+='</div>';
  // 꿀팁은 요리모드에서만 표시 (레시피 상세에서는 제거)
  // Cook complete button in regular detail
  h+='<div style="padding:16px" id="det-cook-btn-'+r.id+'"><button onclick="openFS(\''+r.id+'\')" style="width:100%;padding:14px;border:none;border-radius:12px;background:var(--primary);color:#fff;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit">🍳 요리모드로 가기</button></div>';
  h+='<div style="height:40px"></div></div>';
  document.getElementById('app').insertAdjacentHTML('beforeend',h);
}
function closeDetail(){detailR=null;var d=document.querySelector('.detail');if(d)d.remove();}

// 조리 단계 텍스트 추출 헬퍼 (구글 시트 컬럼명 변경에 유연하게 대응)
function getStepText(s){
  var t=s.x||s.txt||s.text||'';
  // 텍스트 내에 잔존하는 [재료명] 태그 제거 (파싱 후 남은 경우 대비)
  t=t.replace(/^\[[^\]]+\]\s*/,'').replace(/\s*\[[^\]]+\]\s*/g,' ').trim();
  return t;
}
function getStepTip(s){return s.p||s.tip||'';}
// 선택재료 태그 매칭 공통 함수 (visibleSteps 필터링 + 렌더링 루프 양쪽에서 사용)
function stepOptVisible(optIng, checkedOptNames){
  if(!optIng) return true;
  var tagNames=optIng.split(',').map(function(t){return t.trim();}).filter(Boolean);
  return tagNames.some(function(tag){
    return checkedOptNames.some(function(n){
      var short=n.length>=2?n.substring(0,2):n;
      return tag===n||tag.includes(n)||n.includes(tag)||(short.length>=2&&tag.startsWith(short));
    });
  });
}

// === FULLSCREEN COOK MODE ===
var fsChecked=new Set();
var fsFirstOpen=true;
var wakeLock=null;
async function requestWakeLock(){try{if('wakeLock' in navigator){wakeLock=await navigator.wakeLock.request('screen');}}catch(e){}}
function releaseWakeLock(){if(wakeLock){wakeLock.release();wakeLock=null;}}
function openFS(id){var found=RECIPES.find(function(r){return r.id===id});if(!found){alert('레시피를 찾을 수 없어요. 잠시 후 다시 시도해주세요.');return;}closeDetail();fsR=found;fsServMul=servMul||1;fsChecked=new Set();fsFirstOpen=true;pushState('fs');requestWakeLock();renderFS();}

function toggleMeasure(btn){
  var el=btn.nextElementSibling;
  el.style.display=el.style.display==='none'?'block':'none';
}
function renderFS(){
  if(!fsR)return;var r=fsR;
  // Save scroll position before re-render
  var oldModal=document.querySelector('.fs-modal');
  var savedScroll=oldModal?oldModal.scrollTop:0;
  // (oldModal 재사용 여부는 아래 innerHTML 교체 로직에서 직접 판단)
  // Ingredients - checkable, split by req/opt
  var reqIngs=[];var optIngs=[];
  r.ings.forEach(function(i,idx){if(i.t==='req')reqIngs.push({i:i,idx:idx});else optIngs.push({i:i,idx:idx});});
  
  // 선택재료 체크 기반 표시 단계 필터링 (optIngs 선언 후에 실행)
  var checkedOptNames=[];
  optIngs.forEach(function(x){if(fsChecked.has('ing'+x.idx))checkedOptNames.push(x.i.v.split(/\s/)[0].replace(/[()]/g,''));});
  
  var visibleSteps=r.steps.filter(function(s){
    return stepOptVisible(s.optIng||'', checkedOptNames);
  });

  var totalSteps=visibleSteps.length;
  var doneSteps=0;
  visibleSteps.forEach(function(s){
    var originalIdx = r.steps.indexOf(s);
    if(fsChecked.has('step'+originalIdx)) doneSteps++;
  });
  var pct=totalSteps?Math.min(Math.round(doneSteps/totalSteps*100),100):0;
  var h='<div class="fs-modal show">';
  // Header
  h+='<div class="det-hdr"><button class="det-back" onclick="closeFS()">←</button><span style="font-weight:700">'+r.name+' <span class="cook-badge">🍳 요리 중</span></span>';
  h+='<div><button class="det-back" onclick="toggleFav(\''+r.id+'\');renderFS()">'+(favs.has(r.id)?'❤️':'🤍')+'</button></div></div>';
  // Progress bar
  h+='<div style="padding:0 16px;margin-top:8px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="font-size:13px;font-weight:700;color:var(--primary)">'+pct+'%</span><span style="font-size:12px;color:var(--sub)">'+doneSteps+'/'+totalSteps+' 단계</span></div>';
  h+='<div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:var(--primary);border-radius:3px;transition:width .3s"></div></div></div>';
  // Serving
  h+='<div class="serving-ctrl"><button class="sv-btn" onclick="if(fsServMul>1){fsServMul--;renderFS()}">−</button><span class="sv-val">'+Math.round(r.serving*fsServMul)+'인분</span><button class="sv-btn" onclick="if(fsServMul<10){fsServMul++;renderFS()}">＋</button></div>';
  h+='<div class="det-section"><h3>📝 재료 준비</h3>';
  h+='<div style="margin-bottom:10px"><button onclick="toggleMeasure(this)" style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:6px 12px;font-size:12px;color:#795548;cursor:pointer;font-family:inherit;width:100%">📏 계량 단위 안내 (탭하여 펼치기)</button><div style="display:none;background:#fff8e1;border:1px solid #ffe082;border-radius:0 0 8px 8px;padding:10px 14px;font-size:12px;color:#5d4037"><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px"><div style="background:#fff;border-radius:8px;padding:8px 10px;border:1px solid #ffe082"><div style="font-size:16px;margin-bottom:2px">🥄</div><div style="font-weight:700;font-size:13px">1큰술</div><div style="color:#795548;font-size:11px;line-height:1.5">밥숟가락 1개 가득<br><span style="color:#d84315">≈ 15ml</span></div></div><div style="background:#fff;border-radius:8px;padding:8px 10px;border:1px solid #ffe082"><div style="font-size:16px;margin-bottom:2px">🍵</div><div style="font-weight:700;font-size:13px">1작은술</div><div style="color:#795548;font-size:11px;line-height:1.5">티스푼 1개 가득<br><span style="color:#d84315">≈ 5ml (큰술의 1/3)</span></div></div><div style="background:#fff;border-radius:8px;padding:8px 10px;border:1px solid #ffe082"><div style="font-size:16px;margin-bottom:2px">🥤</div><div style="font-weight:700;font-size:13px">1컵</div><div style="color:#795548;font-size:11px;line-height:1.5">종이컵 1컵<br><span style="color:#d84315">≈ 200ml</span></div></div><div style="background:#fff;border-radius:8px;padding:8px 10px;border:1px solid #ffe082"><div style="font-size:16px;margin-bottom:2px">🍚</div><div style="font-weight:700;font-size:13px">1공기</div><div style="color:#795548;font-size:11px;line-height:1.5">밥공기 1그릇 가득<br><span style="color:#d84315">≈ 200g</span></div></div><div style="background:#fff;border-radius:8px;padding:8px 10px;border:1px solid #ffe082"><div style="font-size:16px;margin-bottom:2px">🌿</div><div style="font-weight:700;font-size:13px">1줌</div><div style="color:#795548;font-size:11px;line-height:1.5">한 손 가볍게 쥔 양<br><span style="color:#d84315">≈ 30~50g</span></div></div><div style="background:#fff;border-radius:8px;padding:8px 10px;border:1px solid #ffe082"><div style="font-size:16px;margin-bottom:2px">🧂</div><div style="font-weight:700;font-size:13px">적당량</div><div style="color:#795548;font-size:11px;line-height:1.5">맛을 보며<br>조금씩 추가</div></div></div><div style="font-size:11px;color:#8d6e63;background:#fffde7;border-radius:6px;padding:6px 8px">💡 계량스푼 없을 땐 밥숟가락(큰술)·티스푼(작은술)으로 대체하세요</div></div></div>';
  h+='<div style="font-size:12px;color:var(--sub);margin-bottom:8px">● 필수 재료 ('+reqIngs.length+'개) / ○ 선택 재료 ('+optIngs.length+'개)' + (sel.size>0 ? ' · <span style="color:var(--green)">보유</span> / <span style="color:#d84315">부족</span>' : '') + '</div>';
  // Required
  h+='<div style="font-size:12px;font-weight:700;color:var(--green);padding:8px 0 4px;border-bottom:2px solid var(--green)">● 필수 재료</div>';
  reqIngs.forEach(function(x){
    var checked=fsChecked.has('ing'+x.idx);
    var have=sel.size>0 && [...sel].some(function(s){return ingMatch(x.i.v,s)});
    var miss=sel.size>0 && !have;
    h+='<div class="fs-ing-item'+(checked?' done':'')+'" onclick="fsChecked.has(\'ing'+x.idx+'\')?fsChecked.delete(\'ing'+x.idx+'\'):fsChecked.add(\'ing'+x.idx+'\');renderFS()">';
    h+='<span class="fs-check">'+(checked?'☑️':'⬜')+'</span>';
    h+='<span class="fs-ing-dot-'+(miss?'miss':'req')+'"></span>';
    var txtStyle=checked?' style="text-decoration:line-through;color:#aaa"':miss?' style="color:#d84315"':have?' style="color:var(--green)"':'';
    h+='<span'+txtStyle+'>'+convertGUnit(scaleVal(x.i.v,fsServMul))+'</span>';
    if(!checked&&miss)h+='<span style="margin-left:auto;font-size:10px;color:#b85450;background:#fdf5f5;padding:1px 6px;border-radius:8px">부족</span>';
    else if(!checked&&have)h+='<span style="margin-left:auto;font-size:10px;color:var(--green);background:#e8f5e9;padding:1px 6px;border-radius:8px">보유</span>';
    h+='</div>';
  });
  // Optional
  if(optIngs.length>0){
    h+='<div style="font-size:12px;font-weight:700;color:var(--sub);padding:8px 0 4px;margin-top:8px;border-bottom:2px solid #ccc">○ 선택 재료 (있으면 더 맛있어요)</div>';
    optIngs.forEach(function(x){
      var checked=fsChecked.has('ing'+x.idx);
      var have=sel.size>0 && [...sel].some(function(s){return ingMatch(x.i.v,s)});
      h+='<div class="fs-ing-item'+(checked?' done':'')+'" onclick="fsChecked.has(\'ing'+x.idx+'\')?fsChecked.delete(\'ing'+x.idx+'\'):fsChecked.add(\'ing'+x.idx+'\');renderFS()">';
      h+='<span class="fs-check">'+(checked?'☑️':'⬜')+'</span>';
      h+='<span class="fs-ing-dot-'+(have?'opt-have':'opt')+'"></span>';
      var txtStyle=checked?' style="text-decoration:line-through;color:#aaa"':have?' style="color:var(--green)"':'style="color:var(--sub)"';
      h+='<span '+txtStyle+'>'+convertGUnit(scaleVal(x.i.v,fsServMul))+'</span>';
      if(!checked&&have)h+='<span style="margin-left:auto;font-size:10px;color:var(--green);background:#e8f5e9;padding:1px 6px;border-radius:8px">보유</span>';
      h+='</div>';
    });
  }
  h+='</div>';
  // NO substitute info in fullscreen (only in basic detail)
  // Steps - COOK MODE: large current step, compact completed, timer
  // checkedOptNames 는 위에서 이미 계산됨 - 중복 선언 제거
  
  // 요리 설명 표시 (요리모드 전용)
  if(r.desc){
    h+='<div style="margin:0 16px 8px;padding:12px 14px;background:linear-gradient(135deg,#fff8f0,#fff3e0);border-radius:12px;border-left:4px solid var(--primary)">';
    h+='<div style="font-size:12px;font-weight:700;color:var(--primary);margin-bottom:4px">📖 요리 소개</div>';
    h+='<div style="font-size:13px;line-height:1.6;color:#555">'+ehtml(r.desc)+'</div>';
    h+='</div>';
  }
  h+='<div class="det-section"><h3>👨‍🍳 요리 순서</h3>';
  if(checkedOptNames.length>0){
    h+='<div style="font-size:11px;color:var(--primary);background:#f0f7ff;padding:6px 10px;border-radius:8px;margin-bottom:10px">✨ 선택 재료 반영: '+checkedOptNames.join(', ')+'</div>';
  } else if(optIngs.length>0){
    h+='<div style="font-size:11px;color:var(--sub);background:#f5f5f5;padding:6px 10px;border-radius:8px;margin-bottom:10px">📌 기본 버전 — 선택재료를 체크하면 단계가 추가됩니다</div>';
  }
  var firstUnchecked=-1;
  // 표시될 단계들 중 첫 번째 미완료 단계 찾기
  visibleSteps.forEach(function(s){
    var originalIdx = r.steps.indexOf(s);
    if(!fsChecked.has('step'+originalIdx) && firstUnchecked===-1) firstUnchecked=originalIdx;
  });
  
  var stepDisplayIdx=0;
  r.steps.forEach(function(s,i){
    var checked=fsChecked.has('step'+i);
    var optIng=s.optIng||'';
    // 공통 함수로 통일된 매칭 로직 사용
    if(!stepOptVisible(optIng, checkedOptNames)) return; 
    
    stepDisplayIdx++;
    var isCurrent=(!checked&&i===firstUnchecked);
    var tipText=getStepTip(s);
    var tipMatchesOpt=checkedOptNames.some(function(name){return tipText.includes(name)||getStepText(s).includes(name);});
    var hasUncheckedOptMention=false;
    if(tipText){
      var allOptNames=optIngs.map(function(x){return x.i.v.split(/\s/)[0].replace(/[()]/g,'')});
      hasUncheckedOptMention=allOptNames.some(function(name){return tipText.includes(name)})&&!tipMatchesOpt;
    }
    
    if(checked){
      // COMPLETED: compact, one line
      h+='<div style="display:flex;align-items:center;gap:8px;padding:8px 16px;opacity:.4;cursor:pointer" onclick="fsChecked.delete(\'step'+i+'\');renderFS()">';
      h+='<span style="font-size:16px">☑️</span>';
      h+='<span style="font-size:13px;text-decoration:line-through;color:#aaa">STEP '+stepDisplayIdx+' '+getStepText(s).substring(0,25)+(getStepText(s).length>25?'...':'')+'</span>';
      h+='</div>';
    }else if(isCurrent){
      // CURRENT: BIG, prominent, with timer + next step preview
      h+='<div class="fs-step current" id="fs-step-'+i+'" style="margin:12px 16px;padding:20px;border-width:3px">';
      h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">';
      h+='<div class="fs-step-num" style="font-size:14px;letter-spacing:2px">🔥 STEP '+stepDisplayIdx+' / '+totalSteps+'</div>';
      h+='<button onclick="fsNextStep('+i+')" style="padding:6px 16px;border:none;border-radius:8px;background:var(--primary);color:#fff;font-size:12px;font-weight:700;cursor:pointer">완료 ✓</button>';
      h+='</div>';
      h+='<div style="font-size:18px;line-height:1.7;font-weight:500;margin-bottom:12px">'+scaleVal(getStepText(s),fsServMul,true)+'</div>';
      // Auto-detect and show extra info badges
      var extras=[];
      var fireLevel='';
      if(getStepText(s).includes('센불')||getStepText(s).includes('강불')){extras.push({t:'🔥🔥🔥 센불',bg:'#fafafa',c:'#d84315',b:'#ef9a9a'});fireLevel='high';}
      else if(getStepText(s).includes('중불')||getStepText(s).includes('중간불')||getStepText(s).includes('중약불')){extras.push({t:'🔥🔥 중불',bg:'#f5f5f5',c:'#ff6f00',b:'#ffcc80'});fireLevel='mid';}
      else if(getStepText(s).includes('약불')||getStepText(s).includes('약한불')){extras.push({t:'🔥 약불',bg:'#e3f2fd',c:'#1976d2',b:'#90caf9'});fireLevel='low';}

      var isMicrowaveStep=r.sheetTags&&r.sheetTags.some(function(t){return t==='전자레인지';});
      var timeM=getStepText(s).match(/(\d+)분/);if(timeM&&!isMicrowaveStep)extras.push({t:'⏱ '+timeM[1]+'분',bg:'var(--card)',c:'var(--text)',b:'var(--border)'});
      var secM=getStepText(s).match(/(\d+)초/);if(secM&&!isMicrowaveStep)extras.push({t:'⏱ '+secM[1]+'초',bg:'var(--card)',c:'var(--text)',b:'var(--border)'});
      if(extras.length>0){
        h+='<div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap">';
        extras.forEach(function(ex){h+='<span style="font-size:13px;padding:6px 12px;border-radius:10px;background:'+ex.bg+';border:1.5px solid '+ex.b+';font-weight:700;color:'+ex.c+'">'+ex.t+'</span>';});
        h+='</div>';
      }
      // Timer: detect time mentions like "3분", "5분" etc
      var timeMatch=getStepText(s).match(/(\d+)분/);
      var isMicrowave=isMicrowaveStep;
      if(timeMatch&&!isMicrowave){
        var mins=parseInt(timeMatch[1]);
        h+='<button onclick="startTimer('+mins+',this)" style="display:flex;align-items:center;gap:8px;padding:10px 16px;border:2px solid var(--primary);border-radius:10px;background:#f5f5f5;cursor:pointer;font-size:14px;font-weight:700;color:var(--primary);width:100%;justify-content:center;font-family:inherit">⏱ '+mins+'분 타이머 시작</button>';
        // Waiting tip
        if(i<r.steps.length-1){
          var nextStep=r.steps[i+1];
          var _nsTxt=getStepText(nextStep);
          var nextIngMention=_nsTxt.match(/([\uAC00-\uD7A3]+을|[\uAC00-\uD7A3]+를|[\uAC00-\uD7A3]+를)/);
          h+='<div style="margin-top:8px;font-size:12px;color:#1976d2;background:#e3f2fd;padding:8px 10px;border-radius:8px">⏳ 기다리는 동안: 다음 단계 재료를 미리 준비하세요!</div>';
        }
      }
      // Tip
      if(tipText){
        if(tipMatchesOpt) h+='<div class="step-tip" style="margin-top:12px;border-left:3px solid var(--primary);background:#f5f5f5;font-size:14px">✨ '+tipText+'</div>';
        else if(!hasUncheckedOptMention) h+='<div class="step-tip" style="margin-top:12px;font-size:14px">💡 '+tipText+'</div>';
      }
      // Safety warning for fire/oil related steps
      var _st=getStepText(s);
      var _hasOil=['기름','식용유','올리브유','들기름','버터'].some(function(o){return _st.includes(o)});
      var _hasHeat=['볶','튀','달구','두르','가열'].some(function(h){return _st.includes(h)});
      var _hasBoil=_st.includes('끓');
      var _hasHighHeat=_st.includes('센불');
      if(_hasOil&&_hasHeat)
        h+='<div style="margin-top:8px;font-size:12px;color:#b85450;background:#fdf5f5;padding:8px 10px;border-radius:8px">⚠️ 화상 주의! 기름이 튈 수 있어요</div>';
      else if(_hasBoil)
        h+='<div style="margin-top:8px;font-size:12px;color:#b85450;background:#fdf5f5;padding:8px 10px;border-radius:8px">⚠️ 화상 주의! 끓는 물에 조심하세요</div>';
      else if(_hasHighHeat)
        h+='<div style="margin-top:8px;font-size:12px;color:#b85450;background:#fdf5f5;padding:8px 10px;border-radius:8px">⚠️ 화상 주의! 센 불에 조심하세요</div>';
      // Next step preview - visibleSteps 기준으로 다음 표시 단계 찾기
      var curVisIdx = visibleSteps.indexOf(s);
      var nextVisSt = curVisIdx>=0 ? visibleSteps[curVisIdx+1] : null;
      if(nextVisSt){
        h+='<div style="margin-top:16px;padding-top:12px;border-top:1px dashed var(--border)">';
        h+='<div style="font-size:11px;color:var(--sub);margin-bottom:4px">👉 다음 단계 미리보기</div>';
        h+='<div style="font-size:13px;color:var(--sub)">STEP '+(stepDisplayIdx+1)+': '+getStepText(nextVisSt).substring(0,40)+(getStepText(nextVisSt).length>40?'...':'')+'</div>';
        h+='</div>';
      }
      h+='</div>';
    }else{
      // UPCOMING: medium, not yet active
      h+='<div class="fs-step" id="fs-step-'+i+'" style="margin:4px 16px;padding:12px;opacity:.6" onclick="fsChecked.add(\'step'+i+'\');renderFS()">';
      h+='<div style="display:flex;align-items:center;gap:8px">';
      h+='<span style="font-size:14px">⬜</span>';
      h+='<div><div style="font-size:11px;color:var(--sub)">STEP '+stepDisplayIdx+'</div>';
      if(optIng)h+='<div style="font-size:10px;color:var(--primary);margin-bottom:2px">✨ '+optIng+'</div>';
      h+='<div style="font-size:14px">'+scaleVal(getStepText(s),fsServMul,true)+'</div>';
      var _upTip=getStepTip(s);if(_upTip)h+='<div style="font-size:13px;color:#2e7d32;background:#e8f5e9;border-radius:8px;padding:8px 12px;margin-top:8px;font-weight:500">💡 '+_upTip+'</div>';
      h+='</div></div></div>';
    }
  });
  h+='</div>';
  // Completion - doneSteps는 위에서 이미 계산됨
  if(doneSteps===totalSteps && totalSteps>0){
    // Auto-register to history (only once per session)
    if(!fsChecked.has('_recorded')){fsChecked.add('_recorded');launchConfetti();}
    h+='<div data-complete-section="1" style="text-align:center;padding:24px 16px"><div style="font-size:64px;margin-bottom:12px">🎉</div><div style="font-size:20px;font-weight:700;color:var(--primary)">요리 완성!</div>';
    h+='<div style="font-size:14px;color:var(--sub);margin-top:8px">아래 버튼을 눌러 기록을 저장하세요 📝</div></div>';
    // Photo capture section
    h+='<div style="margin:0 16px 12px;background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">';
    h+='<div style="font-size:14px;font-weight:700;margin-bottom:12px">📸 기념 사진 남기기</div>';
    h+='<div id="photoPreview" style="display:none;margin-bottom:12px;text-align:center"><img id="photoImg" style="max-width:100%;max-height:200px;border-radius:10px;object-fit:cover"/></div>';
    h+='<input type="file" accept="image/*" capture="environment" id="photoInput" style="display:none" onchange="handlePhoto(this)">';
    h+='<input type="file" accept="image/*" id="photoGalleryInput" style="display:none" onchange="handlePhoto(this)">';
    h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
    h+='<button onclick="document.getElementById(\'photoInput\').click()" id="photoBtn" style="padding:12px 8px;border:2px dashed var(--primary);border-radius:10px;background:none;color:var(--primary);font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;text-align:center">📸<br>요리 사진 찍기</button>';
    h+='<button onclick="document.getElementById(\'photoGalleryInput\').click()" id="photoGalleryBtn" style="padding:12px 8px;border:2px dashed #888;border-radius:10px;background:none;color:#555;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;text-align:center">🖼️<br>갤러리에서 찾기</button>';
    h+='</div>';
    // 별점
    h+='<div style="margin-top:10px">';
    h+='<div style="font-size:12px;color:var(--sub);margin-bottom:6px;font-weight:600">⭐ 오늘 요리 만족도</div>';
    h+='<div id="ratingStars" style="display:flex;gap:4px">';
    for(var si=1;si<=5;si++){
      h+='<span onclick="setRating('+si+')" data-star="'+si+'" style="font-size:28px;cursor:pointer;transition:transform .1s;user-select:none" onmouseover="hoverRating('+si+')" onmouseout="hoverRating(0)">☆</span>';
    }
    h+='</div></div>';
    h+='<input type="hidden" id="ratingInput" value="0">';
    // 코멘트 + 글자수 카운터
    h+='<div style="position:relative;margin-top:10px">';
    h+='<input type="text" id="commentInput" maxlength="20" placeholder="한줄 코멘트 (최대 20자)" style="width:100%;padding:10px 14px;padding-right:44px;border:1px solid var(--border);border-radius:10px;font-size:13px;font-family:inherit;outline:none;background:var(--bg);color:var(--text);box-sizing:border-box" oninput="updateCommentCount(this,\'commentCount\')">';
    h+='<span id="commentCount" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:11px;color:#aaa">0/20</span>';
    h+='</div>';
    // 템플릿 태그
    var TAGS=['😋 맛있어요','🎉 첫 성공!','👨‍👩‍👧 가족이 좋아해','궁금해서 도전','🔄 다음엔 더 잘할게','간단하고 맛있어','반찬으로 제격','실패했지만 맛있어'];
    h+='<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">';
    TAGS.forEach(function(tag){
      h+='<span onclick="applyCommentTag(\''+tag+'\')" style="padding:4px 10px;background:var(--card);border:1px solid var(--border);border-radius:20px;font-size:11px;color:var(--text);cursor:pointer">'+ tag+'</span>';
    });
    h+='</div>';
    h+='<div style="display:flex;gap:8px;margin-top:10px">';
    h+='<button onclick="completeCookSave(\''+r.id+'\',false)" style="flex:1;padding:10px;border:1px solid var(--border);border-radius:10px;background:var(--bg);font-size:13px;cursor:pointer;font-family:inherit;color:var(--text)">내기록에만 저장</button>';
    h+='<button onclick="completeCookSave(\''+r.id+'\',true)" style="flex:1;padding:10px;border:none;border-radius:10px;background:var(--primary);color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">커뮤니티에 자랑!</button>';
    h+='</div>';
    h+='<div style="margin-top:8px;padding:8px 10px;background:#fff8e1;border-radius:8px;border-left:3px solid #ffc107;font-size:11px;color:#795548;line-height:1.5">⏳ 커뮤니티 게시글은 <b>관리자 승인 후</b> 등록됩니다. 승인 전까지 커뮤니티 탭에서 "⏳ 대기중" 표시가 보입니다.</div>';
    h+='<div style="text-align:center;margin-top:8px"><span onclick="closeFS()" style="font-size:12px;color:var(--sub);cursor:pointer;text-decoration:underline">사진 없이 닫기</span></div>';
    h+='</div>';
    // Plating guide
    h+='<div style="margin:0 16px 12px;background:linear-gradient(135deg,#f5f5f5,#fff);border:1px solid #f0e6d2;border-radius:12px;padding:16px">';
    h+='<div style="font-size:14px;font-weight:700;margin-bottom:8px;color:#333">🍽️ 맛있게 먹는 법</div>';
    h+='<div style="font-size:13px;line-height:1.6;color:#555">';
    if(r.pair)h+='• <b>곁들이면 좋아요:</b> '+ehtml(r.pair)+'<br>';
    r.tips.forEach(function(t){
      if(t.includes('뿌리')||t.includes('올리')||t.includes('곁들')||t.includes('접시')||t.includes('담'))
        h+='• '+ehtml(t)+'<br>';
    });
    h+='</div></div>';
  }
  // Tips in fullscreen - always visible
  h+='<div class="det-section"><h3>💡 꿀팁</h3>';
  r.tips.forEach(function(t){h+='<div class="tip-card">'+ehtml(t)+'</div>'});
  h+='</div>';
  h+='<div style="height:60px"></div></div>';
  // innerHTML 교체 방식으로 popstate 트리거 방지
  var _existingFS=document.querySelector('.fs-modal');
  if(_existingFS){
    // 기존 modal의 innerHTML만 교체 (DOM에서 제거하지 않음)
    // h에서 fs-modal div 내부 내용만 추출
    var _innerStart=h.indexOf('>')+1;
    var _innerEnd=h.lastIndexOf('</div>');
    _existingFS.innerHTML=h.substring(_innerStart,_innerEnd);
  } else {
    document.getElementById('app').insertAdjacentHTML('beforeend',h);
  }
  // Restore scroll position (only auto-scroll on very first open)
  var newModal=document.querySelector('.fs-modal');
  if(newModal){
    if(fsFirstOpen){newModal.scrollTop=0;fsFirstOpen=false;}
    else{newModal.scrollTop=savedScroll;}
  }
}
// === TIMER ===
var timerInterval=null;
function startTimer(mins,btn){
  if(timerInterval){clearInterval(timerInterval);timerInterval=null;}
  var secs=mins*60;
  btn.style.background='var(--primary)';btn.style.color='#fff';btn.style.borderColor='var(--primary)';
  function update(){
    var m=Math.floor(secs/60);var s=secs%60;
    btn.innerHTML='⏱ '+m+':'+(s<10?'0':'')+s+(secs>0?' (탭하면 취소)':'');
    if(secs<=0){clearInterval(timerInterval);timerInterval=null;btn.innerHTML='✅ 시간 완료!';btn.style.background='var(--green)';btn.style.borderColor='var(--green)';try{if(navigator.vibrate)navigator.vibrate([200,100,200]);}catch(e){}}
    secs--;
  }
  update();timerInterval=setInterval(update,1000);
  btn.onclick=function(){clearInterval(timerInterval);timerInterval=null;btn.innerHTML='⏱ '+mins+'분 타이머 시작';btn.style.background='#f5f5f5';btn.style.color='var(--primary)';btn.style.borderColor='var(--primary)';btn.onclick=function(){startTimer(mins,btn)};};
}

function detCookDone(id){
  // 콘페티 효과!
  launchConfetti();
  var el=document.getElementById('det-cook-btn-'+id);
  if(!el)return;
  var h='<div style="padding:12px;text-align:center;font-size:14px;color:var(--primary);font-weight:700;margin-bottom:8px">🎉 요리 완성! 아래 버튼으로 기록을 저장하세요</div>';
  h+='<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">';
  h+='<div style="font-size:14px;font-weight:700;margin-bottom:12px">📸 기념 사진 남기기</div>';
  h+='<div id="detPhotoPreview" style="display:none;margin-bottom:12px;text-align:center"><img id="detPhotoImg" style="max-width:100%;max-height:200px;border-radius:10px;object-fit:cover"/></div>';
  h+='<input type="file" accept="image/*" capture="environment" id="detPhotoInput" style="display:none" onchange="handleDetPhoto(this)">';
  h+='<button onclick="document.getElementById(\'detPhotoInput\').click()" id="detPhotoBtn" style="width:100%;padding:12px;border:2px dashed var(--primary);border-radius:10px;background:none;color:var(--primary);font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">📸 요리 사진 올리기</button>';
  h+='<input type="text" id="detCommentInput" placeholder="한줄 코멘트 (예: 처음 만들었는데 성공!)" style="width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:10px;font-size:13px;font-family:inherit;margin-top:10px;outline:none;background:var(--bg);color:var(--text);box-sizing:border-box">';
  h+='<div style="display:flex;gap:8px;margin-top:10px">';
  h+='<button onclick="addCookHistory(\''+id+'\',false);saveDetPhoto(\''+id+'\',false);closeDetail()" style="flex:1;padding:10px;border:1px solid var(--border);border-radius:10px;background:var(--bg);font-size:13px;cursor:pointer;font-family:inherit;color:var(--text)">내기록에만 저장</button>';
  h+='<button onclick="addCookHistory(\''+id+'\',false);saveDetPhoto(\''+id+'\',true);closeDetail()" style="flex:1;padding:10px;border:none;border-radius:10px;background:var(--primary);color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">커뮤니티에 자랑!</button>';
  h+='</div></div>';
  el.innerHTML=h;
}
var detPhotoData=null;
function handleDetPhoto(input){
  if(!input.files[0])return;
  var reader=new FileReader();
  reader.onload=function(e){
    // 크롭 모달 열기 (드래그/핀치로 원하는 부분 선택 가능)
    openCropModal(e.target.result, function(croppedDataUrl){
      detPhotoData=croppedDataUrl;
      document.getElementById('detPhotoImg').src=detPhotoData;
      document.getElementById('detPhotoPreview').style.display='block';
      document.getElementById('detPhotoBtn').textContent='📸 사진 변경';
    });
  };
  reader.readAsDataURL(input.files[0]);
}
function saveDetPhoto(id,share){
  var comment=(document.getElementById('detCommentInput')||{}).value||'';
  if(detPhotoData||comment){
    var entry=cookHistory.find(function(h){return h.id===id&&!h.photo&&!h.comment});
    if(!entry)entry=cookHistory.find(function(h){return h.id===id});
    if(entry){
      if(detPhotoData)entry.photo=detPhotoData;
      if(comment)entry.comment=comment;
      localStorage.setItem('nt_history',JSON.stringify(cookHistory));
      if(share){
        var r=RECIPES.find(function(x){return x.id===id});
        if(!detPhotoData){
          showCartPopup('📸 사진이 없어요!','커뮤니티에 자랑하려면 사진이 필수입니다.');
          return;
        }
        var pendingPosts2=getPendingPosts();
        var newPost2={
          id:'p_'+Date.now(),
          recipe:r?r.name:'',
          recipeId:id,
          emoji:r?r.emoji:'🍳',
          user:getDisplayName(),
          nickname:getDisplayName(),
          uid:fbUid||'',
          date:getLocalDateStr(),
          text:comment,
          photo:detPhotoData,
          rating:entry?entry.rating||0:0,
          likes:0,
          status:'pending',
          submittedAt:new Date().toISOString()
        };
        // Firebase pending 노드에 저장
        fbDB.ref('community/pending').push(newPost2).catch(function(e){console.warn('[Firebase] 커뮤니티 게시 실패:',e);showCartPopup('❌ 게시 실패','네트워크 오류로 자랑 신청에 실패했습니다. 잠시 후 다시 시도해주세요.');});
      }
    }
  }
  detPhotoData=null;
  checkBadges();
  // 디테일 화면 유지 — render()를 호출하면 디테일이 닫히므로
  // 저장 완료 팝업만 표시
  var dmsg=share?'자랑 신청 완료! ⏳':'내기록에 저장되었어요! ✅';
  var dmsg2=share?'관리자 승인 후 커뮤니티에 등록됩니다.':'탭하면 닫혀요';
  var dpopup='<div style="position:fixed;top:0;left:0;right:0;bottom:0;z-index:999;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center" onclick="this.remove()">';
  dpopup+='<div style="background:var(--bg);border-radius:16px;padding:24px;text-align:center;max-width:280px">';
  dpopup+='<div style="font-size:48px;margin-bottom:12px">'+(share?'⏳':'✅')+'</div>';
  dpopup+='<div style="font-size:15px;font-weight:700;margin-bottom:8px">'+dmsg+'</div>';
  dpopup+='<div style="font-size:12px;color:var(--sub)">'+dmsg2+'</div></div></div>';
  document.body.insertAdjacentHTML('beforeend',dpopup);
}
function fsNextStep(stepIdx){
  window._fsRendering=true;
  fsChecked.add('step'+stepIdx);
  renderFS();
  setTimeout(function(){window._fsRendering=false;},100);
  // 다음 스텝으로 스크롤
  setTimeout(function(){
    var nextEl=document.getElementById('fs-step-'+(stepIdx+1));
    if(nextEl){nextEl.scrollIntoView({behavior:'smooth',block:'center'});}
    else{
      // 마지막 스텝 완료 - 완성 섹션으로 스크롤
      var modal=document.querySelector('.fs-modal');
      if(modal){
        // 완성 섹션(🎉 요리 완성!)으로 스크롤
        setTimeout(function(){
          var completeSection=modal.querySelector('[data-complete-section]');
          if(completeSection){completeSection.scrollIntoView({behavior:'smooth',block:'start'});}
          else{modal.scrollTo({top:modal.scrollHeight,behavior:'smooth'});}
        },200);
      }
    }
  },300);
}
function closeFS(){fsR=null;releaseWakeLock();if(timerInterval){clearInterval(timerInterval);timerInterval=null;}var m=document.querySelector('.fs-modal');if(m)m.remove();tab='cook';render();}

function toggleFav(id){
  var adding=!favs.has(id);
  if(adding)favs.add(id);else favs.delete(id);
  save();
  // Firebase 즐겨찾기 카운트 업데이트
  try{
    var recipe=RECIPES.find(function(r){return r.id===id});
    var rname=recipe?recipe.name:'';
    if(adding){
      fbDB.ref('favs/'+id+'/count').transaction(function(c){return(c||0)+1;});
      fbDB.ref('favs/'+id+'/name').set(rname);
    }else{
      fbDB.ref('favs/'+id+'/count').transaction(function(c){return Math.max((c||1)-1,0);});
    }
  }catch(e){}
}
