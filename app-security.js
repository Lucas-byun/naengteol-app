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
var ADMIN_PW_HASH='be43e68df297ba8d0500c65de953a3b74d6254525096fbc6a6b552bc66bfdf7e';
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
  if(!await refreshAdminUidFlag())return false;
  if(!forcePrompt&&Date.now()<_adminReauthUntil)return true;
  var pw=prompt('관리자 비밀번호를 입력하세요:');
  if(!pw)return false;
  try{
    var enc=new TextEncoder();
    var hashBuf=await crypto.subtle.digest('SHA-256',enc.encode(pw));
    var hashArr=Array.from(new Uint8Array(hashBuf));
    var hashHex=hashArr.map(function(b){return b.toString(16).padStart(2,'0');}).join('');
    if(hashHex===ADMIN_PW_HASH){
      _adminReauthUntil=Date.now()+ADMIN_REAUTH_TTL_MS;
      return true;
    }
  }catch(e){}
  if(typeof showCartPopup==='function'){
    showCartPopup('❌ 인증 실패','관리자 비밀번호가 일치하지 않습니다.');
  }else{
    alert('❌ 관리자 인증 실패');
  }
  return false;
}
