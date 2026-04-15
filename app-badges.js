// 뱃지 · 오늘의 미션 · 로그인 스트릭 · 레벨 시스템 모듈
// 전제: cookHistory, earnedBadges, RECIPES, getLocalDateStr, render, showCartPopup,
//        getCookStats, getLevel 등은 전역 또는 타 모듈에서 선언됨

// Badges
var BADGES=[
  // === 요리 횟수 (7개) ===
  {id:'first',xp:10,name:'첫 요리',desc:'첫 번째 요리 완성!',icon:'🎉',check:function(s){return s.total>=1}},
  {id:'cook5',xp:10,name:'요리 새내기',desc:'5번째 요리 완성!',icon:'👶',check:function(s){return s.total>=5}},
  {id:'cook10',xp:30,name:'요리 중급자',desc:'10번째 요리!',icon:'👨‍🍳',check:function(s){return s.total>=10}},
  {id:'cook30',xp:50,name:'요리 고수',desc:'30번째 요리!',icon:'🏆',check:function(s){return s.total>=30}},
  {id:'cook50',xp:50,name:'요리 마스터',desc:'50번째 요리!',icon:'👑',check:function(s){return s.total>=50}},
  {id:'cook100',xp:100,name:'전설의 요리사',desc:'100번째 요리!',icon:'🌟',check:function(s){return s.total>=100}},
  {id:'cook200',xp:100,name:'요리의 신',desc:'200번째 요리!',icon:'🔱',check:function(s){return s.total>=200}},
  // === 도전 메뉴 (5개) ===
  {id:'variety5',xp:30,name:'다양한 입맛',desc:'5가지 메뉴 도전!',icon:'🌈',check:function(s){return s.unique>=5}},
  {id:'variety15',xp:30,name:'탐험가',desc:'15가지 메뉴 도전!',icon:'🗺️',check:function(s){return s.unique>=15}},
  {id:'variety30',xp:50,name:'미식가',desc:'30가지 메뉴 도전!',icon:'🍷',check:function(s){return s.unique>=30}},
  {id:'variety50',xp:50,name:'요리 백과사전',desc:'50가지 메뉴 도전!',icon:'📚',check:function(s){return s.unique>=50}},
  {id:'variety100',xp:100,name:'레시피 정복자',desc:'100가지 메뉴 도전!',icon:'🗡️',check:function(s){return s.unique>=100}},
  // === 카테고리 (4개) ===
  {id:'cat3',xp:10,name:'장르 파괴',desc:'3개 카테고리 도전!',icon:'🎭',check:function(s){return s.cats>=3}},
  {id:'cat5',xp:30,name:'다재다능',desc:'5개 카테고리 도전!',icon:'🎪',check:function(s){return s.cats>=5}},
  {id:'cat7',xp:50,name:'올라운더',desc:'7개 카테고리 도전!',icon:'🏅',check:function(s){return s.cats>=7}},
  {id:'allcat',xp:100,name:'만능 요리사',desc:'모든 카테고리 정복!',icon:'⭐',check:function(s){return s.cats>=9}},
  // === 연속 기록 (5개) ===
  {id:'streak3',xp:10,name:'3일 연속',desc:'3일 연속 요리!',icon:'🔥',check:function(s){return s.streak>=3}},
  {id:'streak7',xp:30,name:'1주일 연속',desc:'7일 연속 요리!',icon:'💎',check:function(s){return s.streak>=7}},
  {id:'streak14',xp:50,name:'2주 연속',desc:'14일 연속 요리!',icon:'🏅',check:function(s){return s.streak>=14}},
  {id:'streak21',xp:50,name:'3주 연속',desc:'21일 연속! 습관 완성!',icon:'🧬',check:function(s){return s.streak>=21}},
  {id:'streak30',xp:100,name:'한 달 연속',desc:'30일 연속 요리!',icon:'🏰',check:function(s){return s.streak>=30}},
  // === 이번 주 (3개) ===
  {id:'week3',xp:10,name:'주간 요리사',desc:'이번 주 3번 요리!',icon:'📅',check:function(s){return s.thisWeek>=3}},
  {id:'week5',xp:30,name:'주간 요리왕',desc:'이번 주 5번 요리!',icon:'💪',check:function(s){return s.thisWeek>=5}},
  {id:'week7',xp:50,name:'매일 요리',desc:'이번 주 매일 요리!',icon:'🗓️',check:function(s){return s.thisWeek>=7}},
  // === 난이도별 (8개) ===
  {id:'veryeasy3',xp:10,name:'초간단 입문',desc:'아주 쉬운 요리 3번!',icon:'✨',check:function(s){return s.veryEasyCount>=3}},
  {id:'veryeasy10',xp:30,name:'초간단 마스터',desc:'아주 쉬운 요리 10번!',icon:'💫',check:function(s){return s.veryEasyCount>=10}},
  {id:'easy10',xp:30,name:'쉬움 정복자',desc:'쉬운 요리 10번!',icon:'🎯',check:function(s){return s.easyCount>=10}},
  {id:'med5',xp:30,name:'도전 정신',desc:'보통 난이도 5번!',icon:'💥',check:function(s){return s.medCount>=5}},
  {id:'med15',xp:50,name:'중급 마스터',desc:'보통 난이도 15번!',icon:'🎖️',check:function(s){return s.medCount>=15}},
  {id:'hard1',xp:30,name:'용감한 도전',desc:'어려운 요리 첫 완성!',icon:'🦁',check:function(s){return s.hardCount>=1}},
  {id:'hard5',xp:50,name:'난이도 정복자',desc:'어려운 요리 5번!',icon:'🐉',check:function(s){return s.hardCount>=5}},
  {id:'hard10',xp:100,name:'전설의 셰프',desc:'어려운 요리 10번!',icon:'🧑‍🍳',check:function(s){return s.hardCount>=10}},
  // === 사진 & 커뮤니티 (5개) ===
  {id:'photo1',xp:10,name:'첫 사진',desc:'요리 사진 첫 등록!',icon:'📸',check:function(s){return s.photos>=1}},
  {id:'photo5',xp:30,name:'포토그래퍼',desc:'사진 5장 등록!',icon:'🤳',check:function(s){return s.photos>=5}},
  {id:'photo20',xp:50,name:'먹스타그램',desc:'사진 20장 등록!',icon:'🎞️',check:function(s){return s.photos>=20}},
  {id:'share1',xp:10,name:'첫 공유',desc:'커뮤니티 첫 공유!',icon:'📤',check:function(s){return s.shares>=1}},
  {id:'share5',xp:30,name:'소통왕',desc:'커뮤니티 5회 공유!',icon:'📡',check:function(s){return s.shares>=5}},
  // === 특별 뱃지 (8개) ===
  {id:'speed3',xp:10,name:'스피드 요리사',desc:'5분 이하 요리 3번!',icon:'⚡',check:function(s){return s.speedCount>=3}},
  {id:'healthy5',xp:30,name:'건강 지킴이',desc:'다이어트 태그 요리 5번!',icon:'🥗',check:function(s){return s.dietCount>=5}},
  {id:'nightowl',xp:30,name:'야식의 왕',desc:'야식 태그 요리 5번!',icon:'🌙',check:function(s){return s.nightCount>=5}},
  {id:'rainy',xp:10,name:'비 오는 날 요리사',desc:'전/부침 요리 3번!',icon:'🌧️',check:function(s){return s.rainyCount>=3}},
  {id:'banchan5',xp:30,name:'밑반찬 달인',desc:'밑반찬 요리 5번!',icon:'🍱',check:function(s){return s.banchanCount>=5}},
  {id:'same3',xp:10,name:'최애 요리',desc:'같은 요리 3번 반복!',icon:'💘',check:function(s){return s.maxRepeat>=3}},
  {id:'same5',xp:30,name:'단골 메뉴',desc:'같은 요리 5번 반복!',icon:'🏠',check:function(s){return s.maxRepeat>=5}},
  {id:'weekend',xp:30,name:'주말 요리사',desc:'주말에 3번 요리!',icon:'🎊',check:function(s){return s.weekendCount>=3}},
  // === 히든 뱃지 (5개) ===
  {id:'alldiff',xp:100,name:'사방팔방',desc:'모든 난이도 도전 완료!',icon:'🌍',check:function(s){return s.veryEasyCount>0&&s.easyCount>0&&s.medCount>0&&s.hardCount>0}},
  {id:'tenday',xp:30,name:'10일의 기록',desc:'총 10일 이상 요리한 날!',icon:'📖',check:function(s){var days=new Set(cookHistory.map(function(h){return h.date}));return days.size>=10}},
  {id:'halfmenu',xp:100,name:'절반 정복',desc:'전체 레시피의 절반 도전!',icon:'🗻',check:function(s){return s.unique>=Math.floor(RECIPES.length/2)}},
  {id:'photochef',xp:100,name:'비주얼 셰프',desc:'사진 10장 + 코멘트 10개!',icon:'🎬',check:function(s){return s.photos>=10&&s.comments>=10}},
  {id:'collector',xp:100,name:'뱃지 수집가',desc:'뱃지 25개 달성!',icon:'💎',check:function(s){return earnedBadges.length>=25}},
  // === 요리 횟수 추가 (3개) ===
  {id:'cook3',xp:10,name:'세 번째 도전',desc:'3번째 요리 완성!',icon:'🌱',check:function(s){return s.total>=3}},
  {id:'cook20',xp:30,name:'꾸준한 요리사',desc:'20번째 요리!',icon:'🎗️',check:function(s){return s.total>=20}},
  {id:'cook75',xp:50,name:'요리 베테랑',desc:'75번째 요리!',icon:'🎖️',check:function(s){return s.total>=75}},
  // === 도전 메뉴 추가 (3개) ===
  {id:'variety3',xp:10,name:'세 가지 맛',desc:'3가지 메뉴 도전!',icon:'🍀',check:function(s){return s.unique>=3}},
  {id:'variety10',xp:30,name:'열 가지 맛',desc:'10가지 메뉴 도전!',icon:'🎲',check:function(s){return s.unique>=10}},
  {id:'variety20',xp:30,name:'스무 가지 맛',desc:'20가지 메뉴 도전!',icon:'🎨',check:function(s){return s.unique>=20}},
  // === 난이도 추가 (4개) ===
  {id:'veryeasy5',xp:10,name:'초간단 5회',desc:'아주 쉬운 요리 5번!',icon:'⭐',check:function(s){return s.veryEasyCount>=5}},
  {id:'easy5',xp:10,name:'쉬움 5회',desc:'쉬운 요리 5번!',icon:'🎯',check:function(s){return s.easyCount>=5}},
  {id:'easy20',xp:50,name:'쉬움의 달인',desc:'쉬운 요리 20번!',icon:'🏹',check:function(s){return s.easyCount>=20}},
  {id:'hard3',xp:50,name:'어려움 3회',desc:'어려운 요리 3번!',icon:'🐅',check:function(s){return s.hardCount>=3}},
  // === 카테고리 세부 (6개) ===
  {id:'catRice',xp:30,name:'밥의 달인',desc:'밥/덮밥 5번 요리!',icon:'🍚',check:function(s){var c=0;cookHistory.forEach(function(h){if(h.cat==='밥/덮밥')c++});return c>=5}},
  {id:'catNoodle',xp:30,name:'면 요리 달인',desc:'면류 5번 요리!',icon:'🍜',check:function(s){var c=0;cookHistory.forEach(function(h){if(h.cat==='면류')c++});return c>=5}},
  {id:'catStew',xp:30,name:'찌개 달인',desc:'찌개/국 5번 요리!',icon:'🍲',check:function(s){var c=0;cookHistory.forEach(function(h){if(h.cat==='찌개/국')c++});return c>=5}},
  {id:'catEgg',xp:30,name:'달걀 마스터',desc:'달걀요리 5번!',icon:'🥚',check:function(s){var c=0;cookHistory.forEach(function(h){if(h.cat==='달걀요리')c++});return c>=5}},
  {id:'catFry',xp:30,name:'볶음의 왕',desc:'볶음/구이 5번!',icon:'🔥',check:function(s){var c=0;cookHistory.forEach(function(h){if(h.cat==='볶음/구이')c++});return c>=5}},
  {id:'catSnack',xp:30,name:'간식 마스터',desc:'간식/분식 5번!',icon:'🍡',check:function(s){var c=0;cookHistory.forEach(function(h){if(h.cat==='간식/분식')c++});return c>=5}},
  // === 특별 추가 (7개) ===
  {id:'speed5',xp:30,name:'스피드 달인',desc:'5분 요리 5번!',icon:'💨',check:function(s){return s.speedCount>=5}},
  {id:'healthy10',xp:50,name:'건강 마니아',desc:'다이어트 요리 10번!',icon:'💚',check:function(s){return s.dietCount>=10}},
  {id:'night10',xp:50,name:'야식 마스터',desc:'야식 요리 10번!',icon:'🌃',check:function(s){return s.nightCount>=10}},
  {id:'banchan10',xp:50,name:'밑반찬의 신',desc:'밑반찬 10번!',icon:'🥡',check:function(s){return s.banchanCount>=10}},
  {id:'same10',xp:100,name:'소울푸드',desc:'같은 요리 10번!',icon:'💝',check:function(s){return s.maxRepeat>=10}},
  {id:'weekend5',xp:30,name:'주말 셰프',desc:'주말 5번 요리!',icon:'🎉',check:function(s){return s.weekendCount>=5}},
  {id:'photo10',xp:50,name:'사진 달인',desc:'사진 10장!',icon:'🖼️',check:function(s){return s.photos>=10}},
  // === 연속 기록 추가 (2개) ===
  {id:'streak5',xp:30,name:'5일 연속',desc:'5일 연속 요리!',icon:'⚡',check:function(s){return s.streak>=5}},
  {id:'streak10',xp:50,name:'10일 연속',desc:'10일 연속!',icon:'💫',check:function(s){return s.streak>=10}},
  // === 히든 뱃지 추가 (15개) — 조건 비공개 ===
  {id:'hidden_first3min',xp:30,name:'???',desc:'초고속 요리사',icon:'🚀',hidden:true,check:function(s){var c=0;cookHistory.forEach(function(h){var r=RECIPES.find(function(x){return x.id===h.id});if(r&&r.time<=3)c++});return c>=1}},
  {id:'hidden_alleasy',xp:50,name:'???',desc:'초간단만 10번',icon:'😎',hidden:true,check:function(s){return s.veryEasyCount>=10&&s.hardCount===0}},
  {id:'hidden_eggmaster',xp:50,name:'???',desc:'달걀 요리만 10번',icon:'🐣',hidden:true,check:function(s){var c=0;cookHistory.forEach(function(h){var r=RECIPES.find(function(x){return x.id===h.id});if(r&&(r.name.includes('달걀')||r.name.includes('계란')))c++});return c>=10}},
  {id:'hidden_kimchi',xp:50,name:'???',desc:'김치 요리 7번',icon:'🌶️',hidden:true,check:function(s){var c=0;cookHistory.forEach(function(h){var r=RECIPES.find(function(x){return x.id===h.id});if(r&&r.name.includes('김치'))c++});return c>=7}},
  {id:'hidden_ramen',xp:30,name:'???',desc:'라면 요리 5번',icon:'🍥',hidden:true,check:function(s){var c=0;cookHistory.forEach(function(h){var r=RECIPES.find(function(x){return x.id===h.id});if(r&&r.name.includes('라면'))c++});return c>=5}},
  {id:'hidden_tofu',xp:30,name:'???',desc:'두부 요리 5번',icon:'🧊',hidden:true,check:function(s){var c=0;cookHistory.forEach(function(h){var r=RECIPES.find(function(x){return x.id===h.id});if(r&&r.name.includes('두부'))c++});return c>=5}},
  {id:'hidden_combo',xp:100,name:'???',desc:'하루에 3번 요리',icon:'🤯',hidden:true,check:function(s){var dayMap={};cookHistory.forEach(function(h){dayMap[h.date]=(dayMap[h.date]||0)+1});return Object.values(dayMap).some(function(c){return c>=3})}},
  {id:'hidden_norepeat',xp:100,name:'???',desc:'10번 요리 중복 0',icon:'🦄',hidden:true,check:function(s){return s.total>=10&&s.unique>=10}},
  {id:'hidden_allhard',xp:100,name:'???',desc:'어려운 요리만 3연속',icon:'🐲',hidden:true,check:function(s){if(cookHistory.length<3)return false;var last3=cookHistory.slice(0,3);return last3.every(function(h){var r=RECIPES.find(function(x){return x.id===h.id});return r&&r.diff===3})}},
  {id:'hidden_balanced',xp:100,name:'???',desc:'5개 카테고리 각 3번+',icon:'⚖️',hidden:true,check:function(s){var cm={};cookHistory.forEach(function(h){cm[h.cat]=(cm[h.cat]||0)+1});var over3=Object.values(cm).filter(function(c){return c>=3}).length;return over3>=5}},
  {id:'hidden_badge40',xp:100,name:'???',desc:'뱃지 40개!',icon:'🏆',hidden:true,check:function(s){return earnedBadges.length>=40}},
  {id:'hidden_badge60',xp:100,name:'???',desc:'뱃지 60개!',icon:'👑',hidden:true,check:function(s){return earnedBadges.length>=60}},
  {id:'hidden_lv10',xp:100,name:'???',desc:'레벨 10 달성',icon:'🌟',hidden:true,check:function(s){return getLevel().lv>=10}},
  {id:'hidden_lv15',xp:100,name:'???',desc:'레벨 15 달성',icon:'💎',hidden:true,check:function(s){return getLevel().lv>=15}},
  {id:'hidden_100cook',xp:100,name:'???',desc:'100번 요리의 비밀',icon:'🔮',hidden:true,check:function(s){return s.total>=100&&s.unique>=30}},
  // 연속 접속 뱃지는 checkLoginBonus()에서 동적으로 추가됨 (중복 방지)
];

// === DAILY MISSION SYSTEM ===
var MISSION_POOL=[
  {id:'m_egg',desc:'🥚 달걀 요리 해보기',check:function(id){var r=RECIPES.find(function(x){return x.id===id});return r&&(r.name.includes('달걀')||r.name.includes('계란')||r.cat==='달걀요리')}},
  {id:'m_5min',desc:'⚡ 5분 레시피 도전',check:function(id){var r=RECIPES.find(function(x){return x.id===id});return r&&r.time<=5}},
  {id:'m_10min',desc:'⏱️ 10분 레시피 도전',check:function(id){var r=RECIPES.find(function(x){return x.id===id});return r&&r.time<=10}},
  {id:'m_rice',desc:'🍚 밥/덮밥 요리 해보기',check:function(id){var r=RECIPES.find(function(x){return x.id===id});return r&&r.cat==='밥/덮밥'}},
  {id:'m_noodle',desc:'🍜 면 요리 해보기',check:function(id){var r=RECIPES.find(function(x){return x.id===id});return r&&r.cat==='면류'}},
  {id:'m_stew',desc:'🍲 찌개/국 끓여보기',check:function(id){var r=RECIPES.find(function(x){return x.id===id});return r&&r.cat==='찌개/국'}},
  {id:'m_fry',desc:'🔥 볶음/구이 해보기',check:function(id){var r=RECIPES.find(function(x){return x.id===id});return r&&r.cat==='볶음/구이'}},
  {id:'m_easy',desc:'⭐ 아주 쉬운 요리 도전',check:function(id){var r=RECIPES.find(function(x){return x.id===id});return r&&r.diff===0}},
  {id:'m_hard',desc:'🔥 어려운 요리 도전!',check:function(id){var r=RECIPES.find(function(x){return x.id===id});return r&&r.diff===3}},
  {id:'m_new',desc:'🆕 안 해본 요리 도전',check:function(id){return!cookHistory.some(function(h){return h.id===id})}},
  {id:'m_banchan',desc:'🍱 밑반찬 만들어보기',check:function(id){var r=RECIPES.find(function(x){return x.id===id});return r&&(r.cat==='나물/반찬'||r.cat==='조림')}},
  {id:'m_snack',desc:'🍡 간식/분식 만들기',check:function(id){var r=RECIPES.find(function(x){return x.id===id});return r&&r.cat==='간식/분식'}},
  {id:'m_photo',desc:'📸 요리 사진 찍기',check:function(id,hasPhoto){return hasPhoto}},
  {id:'m_kimchi',desc:'🌶️ 김치 요리 해보기',check:function(id){var r=RECIPES.find(function(x){return x.id===id});return r&&r.name.includes('김치')}},
  {id:'m_jeon',desc:'🥞 전/부침 해보기',check:function(id){var r=RECIPES.find(function(x){return x.id===id});return r&&r.cat==='전/부침'}}
];

var todayMission=null;
function getTodayMission(){
  var today=getLocalDateStr();
  var saved=localStorage.getItem('nt_mission_date');
  var savedId=localStorage.getItem('nt_mission_id');
  var done=localStorage.getItem('nt_mission_done')==='true';
  
  // 날짜 바뀌면 미션 완료 상태 리셋
  if(saved!==today){localStorage.removeItem('nt_random_hide');localStorage.removeItem('nt_mission_hidden_date');localStorage.removeItem('nt_mission_hide');}
  if(saved===today&&savedId){
    todayMission=MISSION_POOL.find(function(m){return m.id===savedId})||MISSION_POOL[0];
    todayMission._done=done;
    return todayMission;
  }
  
  // 새 날 → 새 미션 (시드 기반 랜덤)
  var seed=0;for(var i=0;i<today.length;i++)seed+=today.charCodeAt(i);
  var idx=seed%MISSION_POOL.length;
  todayMission=MISSION_POOL[idx];
  todayMission._done=false;
  localStorage.setItem('nt_mission_date',today);
  localStorage.setItem('nt_mission_id',todayMission.id);
  localStorage.setItem('nt_mission_done','false');
  return todayMission;
}

function completeMission(){
  if(!todayMission||todayMission._done)return;
  todayMission._done=true;
  localStorage.setItem('nt_mission_done','true');
  // 미션 완료 팝업 표시
  setTimeout(function(){
    var h='<div id="mission-popup" style="position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:900;background:linear-gradient(135deg,#E8652A,#FF8C42);color:#fff;padding:12px 20px;border-radius:14px;font-size:13px;box-shadow:0 4px 20px rgba(0,0,0,.3);animation:slideDown .4s ease-out;display:flex;align-items:center;gap:10px;max-width:320px">';
    h+='<div style="font-size:28px">🎯</div>';
    h+='<div><div style="font-weight:700">미션 완료!</div>';
    h+='<div style="font-size:11px;opacity:.8">'+todayMission.desc+'</div></div>';
    h+='</div>';
    document.body.insertAdjacentHTML('beforeend',h);
    setTimeout(function(){var p=document.getElementById('mission-popup');if(p)p.remove();},3000);
    checkLevelUp();
    // 메인 화면 미션 카드 업데이트 (완료 상태로 표시)
    setTimeout(function(){if(dataLoaded)render();},700);
    // 3초 후 미션 카드 애니메이션으로 숨김
    setTimeout(function(){
      var card=document.getElementById('missionCard');
      if(card){
        card.style.transition='opacity .6s ease, max-height .6s ease, padding .6s ease';
        card.style.opacity='0';
        card.style.maxHeight='0';
        card.style.padding='0';
        // 애니메이션 완료 후 localStorage에 숨김 날짜 저장
        setTimeout(function(){
          var today=getLocalDateStr();
          localStorage.setItem('nt_mission_hidden_date',today);
          if(card)card.remove();
        },650);
      }
    },3500);
   },600);
}
// === LOGIN BONUS SYSTEM ===
var loginStreak=0;var lastLoginDate='';
try{loginStreak=parseInt(localStorage.getItem('nt_login_streak'))||0;lastLoginDate=localStorage.getItem('nt_last_login')||'';}catch(e){}

function checkLoginBonus(){
  var today=getLocalDateStr();
  if(lastLoginDate===today)return; // 오늘 이미 체크함
  
  var yesterday=getLocalDateStr(new Date(Date.now()-86400000));
  if(lastLoginDate===yesterday){
    loginStreak++;
  }else if(lastLoginDate!==today){
    loginStreak=1; // 연속 끊김, 리셋
  }
  
  lastLoginDate=today;
  localStorage.setItem('nt_login_streak',loginStreak);
  localStorage.setItem('nt_last_login',today);
  
  // 보상 체크
  var bonusBadge=null;
  
  if(loginStreak===3){
    bonusBadge={id:'login3',name:'3일 연속 접속',icon:'📱',xp:30};
  }else if(loginStreak===7){
    bonusBadge={id:'login7',name:'1주일 연속 접속',icon:'🗓️',xp:50};
  }else if(loginStreak===14){
    bonusBadge={id:'login14',name:'2주 연속 접속',icon:'⚡',xp:100};
  }else if(loginStreak===30){
    bonusBadge={id:'login30',name:'한 달 연속 접속',icon:'🏰',xp:100};
  }
  

  
  // 뱃지 부여
  if(bonusBadge&&earnedBadges.indexOf(bonusBadge.id)===-1){
    earnedBadges.push(bonusBadge.id);
    localStorage.setItem('nt_badges',JSON.stringify(earnedBadges));
    // 뱃지가 BADGES 배열에 있는지 확인 (동적 추가)
    if(!BADGES.find(function(b){return b.id===bonusBadge.id})){
      BADGES.push({id:bonusBadge.id,xp:bonusBadge.xp,name:bonusBadge.name,desc:loginStreak+'일 연속 접속!',icon:bonusBadge.icon,check:function(){return true}});
    }
    setTimeout(function(){showBadgePopup(bonusBadge);checkLevelUp();},1500);
  }
  
  // 접속 보너스 팝업 (간단하게)
  setTimeout(function(){showLoginPopup(loginStreak)},800);
}

function showLoginPopup(streak){
  var h='<div id="login-popup" style="position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:900;background:linear-gradient(135deg,#1a1a2e,#16213e);color:#fff;padding:12px 20px;border-radius:14px;font-size:13px;box-shadow:0 4px 20px rgba(0,0,0,.3);animation:slideDown .4s ease-out;display:flex;align-items:center;gap:10px;max-width:320px">';
  h+='<div style="font-size:28px">'+(streak>=7?'🔥':streak>=3?'⚡':'📱')+'</div>';
  h+='<div><div style="font-weight:700;color:#fbc02d">'+streak+'일 연속 접속!</div>';
    h+='<div style="font-size:11px;color:rgba(255,255,255,.6)">승급 보너스 획득!</div></div>';
  h+='</div>';
  document.body.insertAdjacentHTML('beforeend',h);
  setTimeout(function(){var p=document.getElementById('login-popup');if(p)p.remove();},3000);
}

// === LEVEL SYSTEM (뱃지/횟수 기반) ===
// 레벨 시스템 (15단계) — 요리 횟수 + 뱃지 개수 기반
// 뱃지 90개 전부 모아야 최고 레벨 달성 가능
var LEVEL_TABLE=[
  {lv:1, name:'냉장고 탐험가',   icon:'🥄', req:'기본'},
  {lv:2, name:'초보 요리사',     icon:'🥢', req:'요리 3회 + 뱃지 2개'},
  {lv:3, name:'부엌 입문자',     icon:'🍳', req:'요리 7회 + 뱃지 5개'},
  {lv:4, name:'냉털 꿈나무',     icon:'🌱', req:'요리 15회 + 뱃지 8개'},
  {lv:5, name:'레시피 수집가',   icon:'📖', req:'요리 25회 + 뱃지 12개'},
  {lv:6, name:'냉장고 정복자',   icon:'🧊', req:'요리 35회 + 뱃지 17개'},
  {lv:7, name:'냉털 고수',       icon:'🔥', req:'요리 50회 + 뱃지 23개'},
  {lv:8, name:'요리 연구가',     icon:'🔬', req:'요리 65회 + 뱃지 30개'},
  {lv:9, name:'냉털 마스터',     icon:'🏅', req:'요리 80회 + 뱃지 38개'},
  {lv:10,name:'주방의 달인',     icon:'⚡', req:'요리 100회 + 뱃지 47개'},
  {lv:11,name:'요리 장인',       icon:'🏰', req:'요리 120회 + 뱃지 56개'},
  {lv:12,name:'냉털 그랜드마스터',icon:'💎', req:'요리 150회 + 뱃지 65개'},
  {lv:13,name:'전설의 셰프',     icon:'🔱', req:'요리 200회 + 뱃지 75개'},
  {lv:14,name:'요리의 신',       icon:'👑', req:'요리 250회 + 뱃지 83개'},
  {lv:15,name:'냉털 레전드',     icon:'🌟', req:'요리 300회 + 뱃지 90개'}
];

function getLevel(){
  var stats=getCookStats();
  var ec=earnedBadges.length;
  var t=stats.total;
  if(t>=300 && ec>=90) return LEVEL_TABLE[14];
  if(t>=250 && ec>=83) return LEVEL_TABLE[13];
  if(t>=200 && ec>=75) return LEVEL_TABLE[12];
  if(t>=150 && ec>=65) return LEVEL_TABLE[11];
  if(t>=120 && ec>=56) return LEVEL_TABLE[10];
  if(t>=100 && ec>=47) return LEVEL_TABLE[9];
  if(t>=80  && ec>=38) return LEVEL_TABLE[8];
  if(t>=65  && ec>=30) return LEVEL_TABLE[7];
  if(t>=50  && ec>=23) return LEVEL_TABLE[6];
  if(t>=35  && ec>=17) return LEVEL_TABLE[5];
  if(t>=25  && ec>=12) return LEVEL_TABLE[4];
  if(t>=15  && ec>=8)  return LEVEL_TABLE[3];
  if(t>=7   && ec>=5)  return LEVEL_TABLE[2];
  if(t>=3   && ec>=2)  return LEVEL_TABLE[1];
  return LEVEL_TABLE[0];
}

var prevLevel=0;
function checkLevelUp(){
  var lvl=getLevel();
  if(prevLevel>0&&lvl.lv>prevLevel){
    setTimeout(function(){showLevelUpPopup(lvl)},1200);
  }
  prevLevel=lvl.lv;
}
var earnedBadges=[];try{var eb=localStorage.getItem('nt_badges');if(eb)earnedBadges=JSON.parse(eb);}catch(e){}
// prevLevel 초기화는 렌더링 시작 후 첫 checkLevelUp() 호출 시 자동 설정됨 (RECIPES 의존성 회피)
function checkBadges(){
  var stats=getCookStats();var newBadge=null;
  BADGES.forEach(function(b){
    if(earnedBadges.indexOf(b.id)===-1&&b.check(stats)){earnedBadges.push(b.id);newBadge=b;}
  });
  localStorage.setItem('nt_badges',JSON.stringify(earnedBadges));
  if(newBadge){setTimeout(function(){showBadgePopup(newBadge)},1500);checkLevelUp();}
}

function showLevelUpPopup(lvl){
  var h='<div id="levelup-popup" style="position:fixed;top:0;left:0;right:0;bottom:0;z-index:1000;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center" onclick="this.remove()">';
  h+='<div style="background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:24px;padding:36px 28px;text-align:center;max-width:300px;animation:logoBounce .6s ease-out;border:2px solid rgba(255,215,0,.3)">';
  h+='<div style="font-size:14px;color:rgba(255,255,255,.5);margin-bottom:8px">⬆️ LEVEL UP!</div>';
  h+='<div style="font-size:56px;margin-bottom:8px">'+lvl.icon+'</div>';
  h+='<div style="font-size:28px;font-weight:800;color:#fbc02d;margin-bottom:4px">Lv.'+lvl.lv+'</div>';
  h+='<div style="font-size:18px;font-weight:700;color:#fff;margin-bottom:12px">'+lvl.name+'</div>';
  h+='<div style="font-size:13px;color:rgba(255,255,255,.5);margin-bottom:16px">축하해요! 한 단계 성장했어요 🎉</div>';
  h+='<button onclick="this.parentElement.parentElement.remove()" style="padding:12px 32px;border:none;border-radius:12px;background:linear-gradient(135deg,#fbc02d,#ffab00);color:#1a1a2e;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit">대단해요! 🔥</button>';
  h+='</div></div>';
  document.body.insertAdjacentHTML('beforeend',h);
}
function showBadgePopup(b){
  var h='<div id="badge-popup-overlay" style="position:fixed;top:0;left:0;right:0;bottom:0;z-index:999;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;animation:splashIn .3s ease-out" onclick="event.stopPropagation();this.remove()">';
  h+='<div style="background:var(--bg);border-radius:24px;padding:36px 28px;text-align:center;max-width:300px;animation:logoBounce .5s cubic-bezier(.34,1.56,.64,1);position:relative;overflow:hidden">';
  // 배경 반짝이는 원
  h+='<div style="position:absolute;top:-30px;right:-30px;width:120px;height:120px;border-radius:50%;background:radial-gradient(circle,rgba(232,101,42,.15),transparent);pointer-events:none"></div>';
  h+='<div style="position:absolute;bottom:-20px;left:-20px;width:80px;height:80px;border-radius:50%;background:radial-gradient(circle,rgba(232,101,42,.1),transparent);pointer-events:none"></div>';
  // 뇱지 아이콘 (빙글 돌며 등장)
  h+='<div style="font-size:72px;margin-bottom:8px;display:inline-block;animation:badgeSpin .7s cubic-bezier(.34,1.56,.64,1)">'+b.icon+'</div>';
  h+='<div style="font-size:11px;font-weight:700;color:var(--primary);letter-spacing:1px;margin-bottom:6px;text-transform:uppercase">🎉 NEW BADGE!</div>';
  h+='<div style="font-size:20px;font-weight:800;color:var(--text);margin-bottom:4px">'+b.name+'</div>';
  h+='<div style="font-size:13px;color:var(--sub);margin-bottom:12px">'+b.desc+'</div>';
  if(b.xp)h+='<div style="display:inline-block;background:linear-gradient(135deg,#fff8f3,#f0e6d2);border:1.5px solid var(--primary);border-radius:20px;padding:4px 14px;font-size:13px;font-weight:700;color:var(--primary);margin-bottom:16px">+'+b.xp+' XP 획득!</div>';
  h+='<br>';
  h+='<button onclick="document.getElementById(\'badge-popup-overlay\').remove()" style="padding:12px 28px;border:none;border-radius:12px;background:var(--primary);color:#fff;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit">멋져요! 🎉</button>';
  h+='</div></div>';
  document.body.insertAdjacentHTML('beforeend',h);
}
