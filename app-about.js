// About/settings modal module
// === ABOUT PAGE ===
function showAboutPage(){
  var h='<div id="about-modal" style="position:fixed;top:0;left:0;right:0;bottom:0;z-index:999;background:var(--bg);overflow-y:auto;animation:splashIn .3s ease-out">';
  h+='<div style="max-width:480px;margin:0 auto;padding:20px">';
  
  // 헤더
  h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">';
  h+='<button onclick="document.getElementById(\'about-modal\').remove()" style="background:none;border:none;font-size:24px;cursor:pointer;color:var(--text)">←</button>';
  h+='<span style="font-size:16px;font-weight:700;color:var(--text)">앱 정보</span>';
  h+='<div style="width:24px"></div>';
  h+='</div>';
  
  // 앱 로고
  h+='<div style="text-align:center;margin-bottom:24px">';
  h+='<img src="icons/app_icon_192.png" alt="냉털 아이콘" style="width:80px;height:80px;border-radius:20px;margin-bottom:8px;box-shadow:0 2px 12px rgba(0,0,0,.12)">';
  h+='<div style="font-size:22px;font-weight:800;color:var(--primary)">냉장고를 털자!</div>';
  h+='<div style="font-size:14px;color:var(--sub);margin-top:2px">냉털 Ver. 0.8</div>';
  h+='</div>';
  
  // 앱 소개
  h+='<div style="background:var(--card);border-radius:14px;padding:16px;margin-bottom:12px;border:1px solid var(--border)">';
  h+='<div style="font-size:14px;font-weight:700;margin-bottom:8px;color:var(--text)">📱 냉털이란?</div>';
  h+='<div style="font-size:13px;color:var(--sub);line-height:1.8">';
  h+='냉장고에 있는 재료를 선택하면, 만들 수 있는 요리와 초보자도 따라할 수 있는 쉬운 레시피를 알려주는 앱이에요.<br><br>';
  h+='• '+RECIPES.length+'개 레시피 · 55개 재료<br>';
  h+='• 초보자 친화 단계별 가이드<br>';
  h+='• 타이머 · 불세기 · 안전 경고 자동 감지<br>';
  h+='• 뱃지 · 레벨 · 오늘의 미션';
  h+='</div></div>';
  
  // 개발 정보

  h+='<div style="background:var(--card);border-radius:14px;padding:16px;margin-bottom:12px;border:1px solid var(--border)">';
  h+='<div style="font-size:14px;font-weight:700;margin-bottom:8px;color:var(--text)">👨‍💻 개발 정보</div>';
  h+='<div style="font-size:13px;color:var(--sub);line-height:1.8">';
  h+='개발: Lucas<br>';
  h+='문의: rookiesmart1031@gmail.com<br>';
  h+='버전: Ver. 0.8 (2026.04)<br>';
  h+='기술: HTML5 · Firebase · PWA';
  h+='</div></div>';
  
  // 개인정보 처리방침
  h+='<div style="background:var(--card);border-radius:14px;padding:16px;margin-bottom:12px;border:1px solid var(--border)">';
  h+='<div style="font-size:14px;font-weight:700;margin-bottom:8px;color:var(--text)">🔒 개인정보 처리방침</div>';
  h+='<div style="font-size:12px;color:var(--sub);line-height:1.8">';
  h+='<b>1. 수집하는 개인정보</b><br>';
  h+='냉털은 별도의 회원가입 없이 이용 가능하며, 개인을 식별할 수 있는 정보를 수집하지 않습니다.<br><br>';
  h+='<b>2. 기기 내 저장 데이터</b><br>';
  h+='아래 데이터는 사용자 기기(브라우저)에만 저장되며, 외부 서버로 전송되지 않습니다.<br>';
  h+='• 선택한 재료, 요리 기록, 뱃지, 레벨 정보<br>';
  h+='• 즐겨찾기, 냉장고 저장 목록<br>';
  h+='• 요리 사진 및 코멘트 (기기 내 저장)<br>';
  h+='';
  h+='<b>3. 외부 전송 데이터</b><br>';
  h+='레시피 인기 랭킹 집계를 위해 아래 정보만 Firebase에 전송됩니다.<br>';
  h+='• 요리 완성 시: 레시피 ID, 익명 기기 ID<br>';
  h+='• 개인 식별 정보는 포함되지 않습니다.<br><br>';
  h+='<b>4. 제3자 제공</b><br>';
  h+='수집된 정보를 제3자에게 제공하지 않습니다.<br><br>';
  h+='<b>5. 데이터 삭제</b><br>';
  h+='브라우저의 사이트 데이터 삭제 또는 앱 삭제 시 모든 데이터가 삭제됩니다.<br><br>';
  h+='<b>6. 문의</b><br>';
  h+='개인정보 관련 문의: rookiesmart1031@gmail.com';
  h+='</div></div>';
  
  // 데이터 저장 안내
  h+='<div style="background:#fff8e1;border-radius:14px;padding:16px;margin-bottom:12px;border:1px solid #ffe082">';
  h+='<div style="font-size:14px;font-weight:700;margin-bottom:8px;color:#f57f17">📦 데이터 저장 안내</div>';
  h+='<div style="font-size:12px;color:#795548;line-height:1.8">';
  h+='요리 기록(텍스트, 날짜, 별점)은 서버에 자동 백업됩니다.<br>';
  h+='단, <b>요리 사진은 이 기기에만 저장</b>되어 앱 삭제 시 사라질 수 있어요.<br><br>';
  h+='<span style="color:#1976d2;font-weight:600">🔜 추후 업데이트 예정</span><br>';
  h+='구글 계정 연동 기능이 추가되면 사진 포함 전체 기록을 안전하게 보관할 수 있습니다.';
  h+='</div></div>';

  // 오픈소스 / 크레딧
  h+='<div style="background:var(--card);border-radius:14px;padding:16px;margin-bottom:24px;border:1px solid var(--border)">';
  h+='<div style="font-size:14px;font-weight:700;margin-bottom:8px;color:var(--text)">📝 크레딧</div>';
  h+='<div style="font-size:12px;color:var(--sub);line-height:1.8">';
  h+='• 재료 아이콘: Icons8<br>';
  h+='• 호스팅: Cloudflare Pages<br>';
  h+='• 데이터베이스: Firebase<br>';
  h+='• 레시피 데이터: 자체 제작 (AI 생성)';
  h+='</div></div>';
  
  // 하단 닫기
  h+='<div style="text-align:center;padding-bottom:40px">';
  h+='<div style="margin-bottom:12px"><button onclick="document.getElementById(\'about-modal\').remove();render()" style="padding:12px 32px;border:none;border-radius:12px;background:var(--primary);color:#fff;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit">닫기</button>';
  h+='</div>';
  
  h+='</div></div></div>';
  document.body.insertAdjacentHTML('beforeend',h);
}
