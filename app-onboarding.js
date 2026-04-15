// Onboarding module
// === ONBOARDING ===
function renderOnboard(){
  var h='<div class="onboard"><button class="ob-skip" onclick="finishOnboard()">건너뛰기</button><div class="ob-content">';
  if(onboardStep===0){
    h+='<div class="ob-center">';
    h+='<div style="font-size:72px;margin-bottom:8px">🍳</div>';
    h+='<div style="font-size:26px;font-weight:800;margin-bottom:4px;color:var(--primary)">냉털</div>';
    h+='<div style="font-size:14px;color:var(--sub);margin-bottom:24px">냉장고를 털자!</div>';
    h+='<div style="font-size:18px;font-weight:700;line-height:1.6;margin-bottom:16px">장보기 없이,<br>지금 냉장고에 있는 것만으로<br><span style="color:var(--primary)">한 끼 뚝딱!</span></div>';
    h+='<div style="display:flex;flex-direction:column;gap:10px;width:100%;max-width:280px;margin-top:16px">';
    h+='<div style="display:flex;align-items:center;gap:12px;background:linear-gradient(135deg,var(--primary-light),#fff);border:1.5px solid rgba(232,101,42,.15);border-radius:14px;padding:14px 16px"><span style="font-size:28px">🥕</span><div><div style="font-size:13px;font-weight:700;color:var(--primary)">재료 선택</div><div style="font-size:11px;color:var(--sub)">냉장고에 있는 재료를 터치!</div></div></div>';
    h+='<div style="display:flex;align-items:center;gap:12px;background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px 16px"><span style="font-size:28px">🍽️</span><div><div style="font-size:13px;font-weight:700;color:#333">레시피 추천</div><div style="font-size:11px;color:#666">만들 수 있는 요리를 자동 매칭</div></div></div>';
    h+='<div style="display:flex;align-items:center;gap:12px;background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px 16px"><span style="font-size:28px">👨‍🍳</span><div><div style="font-size:13px;font-weight:700;color:#333">단계별 가이드</div><div style="font-size:11px;color:#666">초보도 따라 할 수 있는 상세 설명</div></div></div>';
    h+='</div>';
    h+='<div style="margin-top:20px;display:flex;gap:8px;flex-wrap:wrap;justify-content:center">';
    h+='<span style="font-size:11px;padding:4px 10px;border-radius:20px;background:#e8f5e9;color:#388e3c">✅ 요리 초보도 실패 없이</span>';
    h+='<span style="font-size:11px;padding:4px 10px;border-radius:20px;background:#e3f2fd;color:#1976d2">✅ '+RECIPES.length+'개 레시피</span>';
    h+='<span style="font-size:11px;padding:4px 10px;border-radius:20px;background:#f5f5f5;color:#ff6f00">✅ 단계별 가이드</span>';
    h+='</div>';
    h+='</div>';
  }else if(onboardStep===1){
    h+='<h3 style="margin-bottom:4px">냉장고에 있는 재료를 골라보세요!</h3>';
    h+='<div style="font-size:12px;color:var(--sub);margin-bottom:12px">나중에 언제든 변경할 수 있어요</div>';
    h+='<div class="cat-tabs">';CATS.forEach(function(c){var label=c==='자주'?'⭐'+c:c;h+='<button class="cat-tab '+(cat===c?'on':'')+'" onclick="cat=\''+esc(c)+'\';render()">'+label+'</button>';});h+='</div>';
    var fl=cat==='전체'?INGS:cat==='자주'?INGS.filter(function(i){return FAV_INGS.indexOf(i.n)!==-1}):INGS.filter(function(i){return i.c===cat});
    h+='<div class="ing-grid">';fl.forEach(function(i){h+=ingBtn(i.n,sel.has(i.n))});h+='</div>';
    if(sel.size>0){h+='<div style="padding:12px 0"><b>선택한 재료 ('+sel.size+'개)</b></div><div class="my-ings-bar" style="display:flex;flex-wrap:wrap">';[...sel].forEach(function(s){h+=ingTag(s)});h+='</div>';}
  }else{
    var matchCount=sel.size>0?getMatched().length:0;
    h+='<div class="ob-center"><div style="font-size:60px;margin-bottom:16px">🎉</div>';
    h+='<div style="font-size:22px;font-weight:700;margin-bottom:8px">준비 완료!</div>';
    if(sel.size>0){h+='<div style="font-size:15px;color:var(--primary);font-weight:700;margin-bottom:4px">'+sel.size+'개 재료로 '+matchCount+'개 요리 가능!</div>';}
    else{h+='<div style="font-size:15px;color:var(--primary);font-weight:700;margin-bottom:4px">'+RECIPES.length+'개 레시피가 기다리고 있어요!</div>';}
    h+='<div style="font-size:13px;color:var(--sub);line-height:1.6">홈 화면에서 재료를 선택하면<br>만들 수 있는 요리가 바로 나타나요</div>';
    h+='</div>';
  }
  h+='</div><div class="ob-dots">';[0,1,2].forEach(function(i){h+='<div class="ob-dot '+(onboardStep===i?'on':'')+'"></div>'});
  h+='</div><button class="ob-btn" onclick="nextOnboard()">'+['재료 고르러 가기 →','다음','요리 시작! 🍳'][onboardStep]+'</button></div>';
  return h;
}
function nextOnboard(){if(onboardStep<2){onboardStep++;render();}else finishOnboard();}
function finishOnboard(){showOnboard=false;localStorage.setItem('nt_done','1');render();}
