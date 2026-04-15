// Shared security helpers (global)
function esc(s){
  return String(s===undefined||s===null?'':s)
    .replace(/\\/g,'\\\\')
    .replace(/'/g,"\\'")
    .replace(/\r?\n/g,' ');
}

function ehtml(s){
  return String(s===undefined||s===null?'':s).replace(/[&<>"']/g,function(c){
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]);
  });
}

function eattr(s){
  return ehtml(s);
}

function safeUrl(u){
  var v=String(u===undefined||u===null?'':u).trim();
  if(!v)return '';
  if(/^https?:\/\//i.test(v)||/^data:image\//i.test(v)||/^blob:/i.test(v))return v;
  return '';
}

// Admin re-auth helpers (global)
var ADMIN_REAUTH_TTL_MS=10*60*1000;
var _adminReauthUntil=0;
var _adminUidVerified=false;

function isAdminSession(){
  return localStorage.getItem('nt_admin')==='1'&&_adminUidVerified===true;
}

async function refreshAdminUidFlag(){
  try{
    if(!fbDB||!fbUid){_adminUidVerified=false;return false;}
    var snap=await fbDB.ref('adminUids/'+fbUid).once('value');
    _adminUidVerified=snap&&snap.val()===true;
    return _adminUidVerified;
  }catch(e){
    _adminUidVerified=false;
    return false;
  }
}

async function verifyAdminPassword(forcePrompt){
  var okAdminUid=await refreshAdminUidFlag();
  if(!okAdminUid){
    if(typeof showCartPopup==='function'){
      showCartPopup('🚫 권한 없음','관리자 UID 계정에서만 이 작업을 할 수 있어요.');
    }else{
      alert('🚫 관리자 권한이 없습니다.');
    }
    return false;
  }
  if(!forcePrompt&&Date.now()<_adminReauthUntil)return true;
  var ok=confirm('관리자 작업을 진행할까요?');
  if(ok){
    _adminReauthUntil=Date.now()+ADMIN_REAUTH_TTL_MS;
    return true;
  }
  if(typeof showCartPopup==='function')showCartPopup('취소됨','관리자 작업이 취소되었습니다.');
  return false;
}
