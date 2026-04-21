// PWA install prompt module
// === PWA 설치 제어 ===
let deferredPrompt=null;
window.addEventListener('beforeinstallprompt',function(e){
  e.preventDefault();
  deferredPrompt=e;
  updateInstallButtonVisibility();
});
window.addEventListener('appinstalled',function(){
  console.log('[PWA] 앱이 설치되었습니다.');
  deferredPrompt=null;
  updateInstallButtonVisibility();
});
function updateInstallButtonVisibility(){
  var btn=document.getElementById('myPageInstallBtn');
  if(!btn)return;
  if(deferredPrompt&&!isAppInstalled()){
    btn.style.display='block';
  }else{
    btn.style.display='none';
  }
}
function isAppInstalled(){
  if(window.matchMedia('(display-mode: standalone)').matches)return true;
  if(navigator.standalone===true)return true;
  return false;
}
function triggerInstallPrompt(){
  if(!deferredPrompt){
    showCartPopup('⚠️ 설치 불가','이 브라우저에서는 설치가 지원되지 않습니다.\n\n브라우저 메뉴에서 "홈 화면에 추가" 옵션을 찾아주세요.');
    return;
  }
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(function(choiceResult){
    if(choiceResult.outcome==='accepted'){
      console.log('[PWA] 사용자가 설치를 수락했습니다.');
      showCartPopup('✅ 설치 완료!','냉털이 홈 화면에 추가되었어요!\n\n언제든 쉽게 앱을 실행할 수 있습니다. 🍳');
    }else{
      console.log('[PWA] 사용자가 설치를 거절했습니다.');
    }
    deferredPrompt=null;
    updateInstallButtonVisibility();
  });
}

// === PWA UI HELPERS: moved from index.html ===
function launchConfetti(){
  var colors=['#E8652A','#FF8C42','#FFD700','#4CAF50','#2196F3','#E91E63','#9C27B0','#FF5722'];
  var container=document.createElement('div');
  container.id='confetti-container';
  container.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:9999;overflow:hidden';
  document.body.appendChild(container);
  for(var i=0;i<80;i++){
    (function(idx){
      var piece=document.createElement('div');
      var size=Math.random()*10+6;
      var color=colors[Math.floor(Math.random()*colors.length)];
      var left=Math.random()*100;
      var delay=Math.random()*0.8;
      var duration=Math.random()*1.5+1.5;
      var shape=Math.random()>0.5?'50%':'2px';
      piece.style.cssText='position:absolute;width:'+size+'px;height:'+size+'px;background:'+color+';border-radius:'+shape+';left:'+left+'%;top:-20px;animation:confettiFall '+duration+'s '+delay+'s ease-in forwards;opacity:1';
      container.appendChild(piece);
    })(i);
  }
  setTimeout(function(){var c=document.getElementById('confetti-container');if(c)c.remove();},3500);
}
// === 탭 아이콘 통통 튀기기 ===
function bnavTap(btn,cb){
  var ico=btn.querySelector('.ico');
  if(ico){
    ico.style.animation='none';
    // reflow 강제 발생 (애니메이션 재시작)
    void ico.offsetWidth;
    ico.style.animation='tabBounce .45s cubic-bezier(.34,1.56,.64,1)';
    setTimeout(function(){ico.style.animation='';},500);
  }
  cb();
}
function toggleSearchBar(){
  showSearch = !showSearch;
  if(!showSearch){ searchQ=''; }
  render();
  if(showSearch){
    setTimeout(function(){
      var inp = document.getElementById('searchInput');
      if(inp) inp.focus();
    }, 100);
  }
}
function goHome(forceRefresh){
  tab='cook';mode='ing';showSearch=false;searchQ='';
  window.scrollTo(0,0);
  render();
  if(forceRefresh&&typeof loadData==='function'){
    loadData({forceRefresh:true});
  }
}
