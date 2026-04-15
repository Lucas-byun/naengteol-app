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
