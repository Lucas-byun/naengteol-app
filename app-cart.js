// 장바구니·팝업·장보기 리스트 모듈
// 전제: RECIPES, INGS, sel, ingMatch(), matchRecipe(), getLocalDateStr(),
//       esc(), save(), render(), pushState() 는 다른 파일에서 선언됨

var showShopList=false;
// Shopping Cart
var cart=[];try{var ct=localStorage.getItem('nt_cart');if(ct)cart=JSON.parse(ct);}catch(e){}
function saveCart(){localStorage.setItem('nt_cart',JSON.stringify(cart));}

function addToCart(recipeId){
  var r=RECIPES.find(function(x){return x.id===recipeId});if(!r)return;
  // Find missing required ingredients
  var missing=r.ings.filter(function(i){
    if(i.t!=='req')return false;
    return![...sel].some(function(s){return ingMatch(i.v,s)});
  }).map(function(i){return{v:i.v,name:i.v.split(/\s/)[0].replace(/[()]/g,''),checked:false}});
  if(missing.length===0){
    showCartPopup('이미 모든 재료가 있어요! 🎉','바로 요리를 시작하세요');return;
  }
  // Remove existing entry for same recipe
  cart=cart.filter(function(c){return c.recipeId!==recipeId});
  cart.push({recipeId:recipeId,name:r.name,emoji:r.emoji,items:missing,date:getLocalDateStr()});
  saveCart();
  showCartPopup('🛒 장바구니에 담았어요!',r.name+'의 부족 재료 '+missing.length+'개');
}
function showCartPopup(title,sub){
  var h='<div style="position:fixed;top:0;left:0;right:0;bottom:0;z-index:999;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center" onclick="this.remove()">';
  h+='<div style="background:var(--bg);border-radius:16px;padding:24px;text-align:center;max-width:280px">';
  h+='<div style="font-size:15px;font-weight:700;margin-bottom:8px">'+title+'</div>';
  h+='<div style="font-size:13px;color:var(--sub);margin-bottom:12px">'+sub+'</div>';
  h+='<div style="font-size:12px;color:var(--sub)">탭하면 닫힘</div></div></div>';
  document.body.insertAdjacentHTML('beforeend',h);
}
function toggleCartItem(recipeIdx,itemIdx){
  if(cart[recipeIdx]&&cart[recipeIdx].items[itemIdx]){
    cart[recipeIdx].items[itemIdx].checked=!cart[recipeIdx].items[itemIdx].checked;
    saveCart();openCartModal();
  }
}
function removeCartRecipe(recipeIdx){
  cart.splice(recipeIdx,1);saveCart();
  if(cart.length===0)closeCartModal();
  else openCartModal();
}
function cartToFridge(){
  // Move checked items to fridge (sel)
  var added=0;
  cart.forEach(function(c){
    c.items.forEach(function(item){
      if(item.checked){
        var ig=INGS.find(function(i){return item.name.includes(i.n)||i.n.includes(item.name)});
        if(ig){sel.add(ig.n);added++;}
      }
    });
  });
  // Remove fully checked recipes from cart
  cart=cart.filter(function(c){return c.items.some(function(i){return!i.checked})});
  saveCart();save();closeCartModal();render();
  if(added>0)showCartPopup('🧊 냉장고에 추가 완료!',added+'개 재료가 추가되었어요');
}
function openCartModal(){
  closeCartModal();
  var totalItems=0;cart.forEach(function(c){totalItems+=c.items.length});
  var checkedItems=0;cart.forEach(function(c){c.items.forEach(function(i){if(i.checked)checkedItems++})});
  var h='<div class="shop-overlay show" onclick="closeCartModal()"></div>';
  h+='<div class="shop-modal show" style="max-height:80vh">';
  h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><h3 style="font-size:16px">🛒 장바구니</h3><button onclick="closeCartModal()" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text)">✕</button></div>';
  if(cart.length===0){
    h+='<div style="text-align:center;padding:24px;color:var(--sub)"><div style="font-size:40px;margin-bottom:8px">🛒</div>장바구니가 비어있어요<br><span style="font-size:12px">레시피에서 부족 재료를 담아보세요!</span></div>';
  }else{
    h+='<div style="font-size:12px;color:var(--sub);margin-bottom:12px">총 '+totalItems+'개 재료 · '+checkedItems+'개 체크됨</div>';
    cart.forEach(function(c,ci){
      var done=c.items.filter(function(i){return i.checked}).length;
      h+='<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px;margin-bottom:10px">';
      h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">';
      h+='<div style="display:flex;align-items:center;gap:6px"><span style="font-size:20px">'+c.emoji+'</span><span style="font-size:14px;font-weight:700">'+c.name+'</span><span style="font-size:11px;color:var(--sub)">'+done+'/'+c.items.length+'</span></div>';
      h+='<span style="font-size:12px;color:#d84315;cursor:pointer" onclick="event.stopPropagation();removeCartRecipe('+ci+')">삭제</span>';
      h+='</div>';
      c.items.forEach(function(item,ii){
        h+='<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px solid var(--border);cursor:pointer" onclick="toggleCartItem('+ci+','+ii+')">';
        h+='<span style="font-size:16px">'+(item.checked?'✅':'⬜')+'</span>';
        h+='<span style="font-size:13px;'+(item.checked?'text-decoration:line-through;color:var(--sub)':'color:var(--text)')+'">'+item.v+'</span>';
        h+='</div>';
      });
      h+='</div>';
    });
    h+='<div style="display:flex;gap:8px;margin-top:8px">';
    h+='<button onclick="cart=[];saveCart();openCartModal()" style="flex:1;padding:10px;border:1px solid var(--border);border-radius:10px;background:var(--bg);font-size:13px;cursor:pointer;font-family:inherit;color:var(--text)">전체 비우기</button>';
    if(checkedItems>0)h+='<button onclick="cartToFridge()" style="flex:1;padding:10px;border:none;border-radius:10px;background:var(--primary);color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">🧊 장본 재료 냉장고에 추가</button>';
    h+='</div>';
  }
  h+='</div>';
  var _existingModal=document.querySelector('.fs-modal');
  if(_existingModal){
    _existingModal.outerHTML=h;
  } else {
    document.getElementById('app').insertAdjacentHTML('beforeend',h);
  }
}
function closeCartModal(){
  var o=document.querySelector('.shop-overlay');if(o)o.remove();
  var m=document.querySelector('.shop-modal');if(m)m.remove();
}
function addIngToCart(ingName){
  // Find recipes that need this ingredient
  var recipes=RECIPES.filter(function(r){
    return r.ings.some(function(i){return i.t==='req'&&i.v.includes(ingName)&&![...sel].some(function(s){return ingMatch(i.v,s)})});
  }).slice(0,3);
  if(recipes.length===0){showCartPopup('이미 보유 중!',ingName+'은(는) 이미 냉장고에 있어요');return;}
  // Add as a "장보기" cart entry
  var existing=cart.find(function(c){return c.recipeId==='shop_'+ingName});
  if(!existing){
    var recipeNames=recipes.map(function(r){return r.name}).join(', ');
    cart.push({recipeId:'shop_'+ingName,name:'장보기: '+ingName,emoji:'🛒',items:[{v:ingName,name:ingName,checked:false}],date:getLocalDateStr()});
    saveCart();
  }
  // Refresh shop list
  closeShopList();openShopList();
}

// === SHOPPING LIST (OPTIMIZED) ===
function openShopList(){
  // Find all recipes and what's missing
  var selArr=[...sel];
  var allRecipes=RECIPES.map(function(r){return Object.assign({},r,{match:matchRecipe(r,selArr)})});
  var missingMap=new Map();
  allRecipes.filter(function(r){return r.match.pct>=20&&r.match.pct<100}).forEach(function(r){
    r.ings.filter(function(i){return i.t==='req'}).forEach(function(i){
      if(!selArr.some(function(s){return ingMatch(i.v,s)})){
        var nm=i.v.split(/\s/)[0].replace(/[()]/g,'');
        if(!missingMap.has(nm))missingMap.set(nm,{name:nm,recipes:[],unlocks:0});
        missingMap.get(nm).recipes.push(r.name);
      }
    });
  });
  // Calculate "unlocks" — if I buy this one ingredient, how many new 100% recipes?
  missingMap.forEach(function(item){
    var extSel=new Set([...sel,item.name]);
    item.unlocks=allRecipes.filter(function(r){
      if(r.match.pct===100)return false;
      var req=r.ings.filter(function(i){return i.t==='req'});
      var hv=req.filter(function(i){return[...extSel].some(function(s){return ingMatch(i.v,s)})});
      return hv.length===req.length;
    }).length;
  });
  var items=[...missingMap.values()].sort(function(a,b){return b.unlocks-a.unlocks||b.recipes.length-a.recipes.length});
  var h='<div class="shop-overlay show" onclick="closeShopList()"></div>';
  h+='<div class="shop-modal show">';
  h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><h3 style="font-size:16px">🛒 장보기 리스트</h3><button onclick="closeShopList()" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text)">✕</button></div>';
  // Top recommendation
  var topUnlock=items.find(function(it){return it.unlocks>0});
  if(topUnlock)h+='<div style="background:#e3f2fd;border-radius:10px;padding:12px;margin-bottom:12px;font-size:13px;color:#333">💡 <b>'+topUnlock.name+'</b>만 사면 <b style="color:#1976d2">'+topUnlock.unlocks+'개 요리</b>를 바로 만들 수 있어요!</div>';
  h+='<div style="font-size:12px;color:var(--sub);margin-bottom:8px">재료별 추가 가능 요리 수 기준 정렬</div>';
  items.forEach(function(it){
    var ig=INGS.find(function(i){return i.n===it.name});
    var inCart=cart.some(function(c){return c.items.some(function(ci){return ci.name===it.name&&!ci.checked})});
    h+='<div class="shop-item">';
    h+='<span style="font-size:18px">'+(ig?ig.e:'🥄')+'</span>';
    h+='<div style="flex:1"><div style="font-weight:700;display:flex;align-items:center;gap:6px">'+it.name;
    if(it.unlocks>0)h+=' <span style="font-size:10px;background:#e3f2fd;color:#1976d2;padding:1px 6px;border-radius:8px;font-weight:700">+'+it.unlocks+'개 요리</span>';
    h+='</div><div style="font-size:11px;color:var(--sub)">→ '+it.recipes.slice(0,3).join(', ')+(it.recipes.length>3?' 외 '+(it.recipes.length-3)+'개':'')+'</div></div>';
    h+='<button onclick="event.stopPropagation();addIngToCart(\''+esc(it.name)+'\')" style="padding:4px 8px;border:'+(inCart?'1.5px solid var(--green)':'1.5px solid #1976d2')+';border-radius:8px;background:'+(inCart?'#e8f5e9':'none')+';font-size:12px;cursor:pointer;font-family:inherit;color:'+(inCart?'var(--green)':'#1976d2')+';white-space:nowrap">'+(inCart?'✅ 담김':'🛒 담기')+'</button>';
    h+='</div>';
  });
  var copyTxt='🛒 냉털 장보기 리스트\n'+items.map(function(it){return '☐ '+it.name+(it.unlocks>0?' (+'+it.unlocks+'요리)':'')}).join('\n');
  h+='<button class="shop-copy" onclick="copyShopList()">📋 장보기 리스트 복사</button>';
  h+='<input type="hidden" id="shopCopyTxt" value="'+copyTxt.replace(/"/g,'&quot;')+'">';
  h+='</div>';
  document.getElementById('app').insertAdjacentHTML('beforeend',h);
  pushState('shop');
}
function closeShopList(){
  var o=document.querySelector('.shop-overlay');if(o)o.remove();
  var m=document.querySelector('.shop-modal');if(m)m.remove();
}
function copyShopList(){
  var txt=document.getElementById('shopCopyTxt').value;
  if(navigator.clipboard){navigator.clipboard.writeText(txt).then(function(){alert('장보기 리스트가 복사되었어요! 📋')});}
  else{var ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);alert('장보기 리스트가 복사되었어요! 📋');}
}


// === MY FRIDGE MODAL: moved from index.html ===
function openFridge(){
  var h='<div class="shop-overlay show" onclick="closeFridge()"></div>';
  h+='<div class="shop-modal show" style="max-height:75vh">';
  h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"><h3 style="font-size:16px">🧊 내 냉장고</h3><button onclick="closeFridge()" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text)">✕</button></div>';
  h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><span style="font-size:12px;color:var(--sub)">현재 '+sel.size+'개 재료 보유 중</span><span style="font-size:11px;color:#d84315;cursor:pointer" onclick="closeFridge();resetIngs()">전체 비우기</span></div>';
  // Group by category
  var cats={};
  [...sel].forEach(function(s){
    var ig=INGS.find(function(i){return i.n===s});
    var cat=ig?ig.c:'기타';
    if(!cats[cat])cats[cat]=[];
    // Count recipes this ingredient is used in
    var recipeCount=RECIPES.filter(function(r){return r.ings.some(function(i){return ingMatch(i.v,s)})}).length;
    cats[cat].push({name:s,emoji:ig?ig.e:'',ic:ig?ig.ic:'',count:recipeCount});
  });
  Object.keys(cats).forEach(function(cat){
    h+='<div style="font-size:12px;font-weight:700;color:var(--primary);padding:8px 0 4px;border-bottom:1px solid var(--border)">'+cat+' ('+cats[cat].length+')</div>';
    cats[cat].forEach(function(item){
      h+='<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border)">';
      if(item.ic)h+='<img src="'+item.ic+'" width="24" height="24" onerror="this.outerHTML=\'<span style=font-size:20px>'+item.emoji+'</span>\'">';
      else h+='<span style="font-size:20px">'+item.emoji+'</span>';
      h+='<span style="flex:1;font-size:14px;font-weight:500">'+item.name+'</span>';
      h+='<span style="font-size:11px;color:var(--sub);background:var(--card);padding:2px 8px;border-radius:8px">'+item.count+'개 요리</span>';
      h+='<span style="font-size:16px;cursor:pointer;color:#d84315;padding:0 4px" onclick="sel.delete(\''+esc(item.name)+'\');save();closeFridge();openFridge()">✕</span>';
      h+='</div>';
    });
  });
  // Smart quick add — suggest ingredients that unlock the most recipes
  h+='<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">';
  h+='<div style="font-size:12px;font-weight:700;color:var(--sub);margin-bottom:8px">💡 추가하면 좋은 재료</div>';
  h+='<div style="display:flex;flex-wrap:wrap;gap:4px">';
  var topSuggestions=INGS.filter(function(i){return!sel.has(i.n)}).map(function(ig){
    var cnt=RECIPES.filter(function(r){return r.ings.some(function(i2){return ingMatch(i2.v,ig.n)})}).length;
    return{n:ig.n,e:ig.e,cnt:cnt};
  }).sort(function(a,b){return b.cnt-a.cnt}).slice(0,8);
  topSuggestions.forEach(function(ig){
    h+='<span style="display:inline-flex;align-items:center;gap:2px;border:1px dashed #90caf9;border-radius:16px;padding:3px 8px;font-size:11px;cursor:pointer;color:#1976d2;background:#e3f2fd" onclick="sel.add(\''+esc(ig.n)+'\');save();closeFridge();openFridge()">+ '+ig.e+' '+ig.n+' <span style="font-size:9px;color:#666">('+ig.cnt+')</span></span>';
  });
  h+='</div></div>';
  h+='<button onclick="closeFridge();tab=\'cook\';mode=\'ing\';render()" style="display:block;width:100%;margin-top:12px;padding:12px;border:none;border-radius:10px;background:var(--primary);color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">재료 더 추가하기</button>';
  h+='</div>';
  document.getElementById('app').insertAdjacentHTML('beforeend',h);
  pushState('fridge');
}
function closeFridge(){
  var o=document.querySelector('.shop-overlay');if(o)o.remove();
  var m=document.querySelector('.shop-modal');if(m)m.remove();
}
