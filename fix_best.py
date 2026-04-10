with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# ============================================================
# 1. 홈 화면: "내가 가장 맛있었던 요리 TOP3" → "유저 Best 요리 TOP3" (커뮤니티 평점 기반)
# ============================================================
old_home_best = """    // === ⭐ 내가 가장 맛있었던 요리 TOP3 (평점 기반) ===
    var favRatedMap={};
    cookHistory.forEach(function(ch){
      if(!ch.rating||ch.rating<1)return;
      if(!favRatedMap[ch.id])favRatedMap[ch.id]={id:ch.id,totalRating:0,count:0,cookCount:0,lastRating:0};
      favRatedMap[ch.id].totalRating+=ch.rating;
      favRatedMap[ch.id].count++;
      favRatedMap[ch.id].lastRating=Math.max(favRatedMap[ch.id].lastRating,ch.rating);
    });
    cookHistory.forEach(function(ch){
      if(!favRatedMap[ch.id])return;
      favRatedMap[ch.id].cookCount=(favRatedMap[ch.id].cookCount||0)+1;
    });
    var bestList=Object.values(favRatedMap).map(function(v){
      return Object.assign({},v,{avgRating:v.totalRating/v.count});
    }).sort(function(a,b){
      // 1순위: 평균 평점 높은 순, 동점 시 요리 횟수 많은 순
      if(b.avgRating!==a.avgRating)return b.avgRating-a.avgRating;
      return b.cookCount-a.cookCount;
    }).slice(0,3);
    if(bestList.length>0){
      h+='<div style="padding:0 16px 0">';
      h+='<div style="background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:16px;padding:16px;margin-bottom:14px">';
      h+='<div style="font-size:13px;font-weight:700;color:#fbc02d;margin-bottom:12px">⭐ 내가 가장 맛있었던 요리 TOP'+bestList.length+'</div>';
      h+='<div style="font-size:10px;color:rgba(255,255,255,.4);margin-top:-8px;margin-bottom:10px">⭐ 평점 높은 순 · 동점 시 요리 횟수 많은 순</div>';
      var bestMedals=['🥇','🥈','🥉'];
      bestList.forEach(function(b,i){
        var recipe=RECIPES.find(function(rr){return rr.id===b.id});
        if(!recipe)return;
        var stars='';
        var avgR=Math.round(b.avgRating);
        for(var si=1;si<=5;si++)stars+=(si<=avgR?'★':'☆');
        h+='<div onclick="openDetail(\''+b.id+'\')" style="display:flex;align-items:center;gap:10px;padding:8px 0;cursor:pointer'+(i<bestList.length-1?';border-bottom:1px solid rgba(255,255,255,.08)':'')+'">'
        h+='<span style="font-size:16px;min-width:22px">'+bestMedals[i]+'</span>';
        h+='<span style="font-size:24px">'+recipe.emoji+'</span>';
        h+='<div style="flex:1;min-width:0">';
        h+='<div style="font-size:12px;font-weight:600;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+recipe.name+'</div>';
        h+='<div style="font-size:11px;color:#fbc02d;margin-top:2px">'+stars+' <span style="color:rgba(255,255,255,.5);font-size:10px">('+b.avgRating.toFixed(1)+'점 · '+b.cookCount+'회)</span></div>';
        h+='</div>';
        h+='</div>';
      });
      h+='</div>';
      h+='</div>';
    }"""

new_home_best = """    // === 🏆 유저 Best 요리 TOP3 (커뮤니티 평점 기반) ===
    var userBestMap={};
    communityPosts.forEach(function(c){
      if(!c.recipeId||!c.rating||c.rating<1)return;
      if(!userBestMap[c.recipeId])userBestMap[c.recipeId]={id:c.recipeId,name:c.recipe||'',emoji:c.emoji||'🍳',total:0,count:0};
      userBestMap[c.recipeId].total+=Number(c.rating);
      userBestMap[c.recipeId].count++;
    });
    var userBestList=Object.values(userBestMap).map(function(v){
      return Object.assign({},v,{avgRating:v.total/v.count});
    }).sort(function(a,b){
      if(b.avgRating!==a.avgRating)return b.avgRating-a.avgRating;
      return b.count-a.count;
    }).slice(0,3);
    if(userBestList.length>0){
      h+='<div style="padding:0 16px 0">';
      h+='<div style="background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:16px;padding:16px;margin-bottom:14px">';
      h+='<div style="font-size:13px;font-weight:700;color:#fbc02d;margin-bottom:12px">🏆 유저 Best 요리 TOP'+userBestList.length+'</div>';
      h+='<div style="font-size:10px;color:rgba(255,255,255,.4);margin-top:-8px;margin-bottom:10px">커뮤니티 평점 높은 순 · 동점 시 평가 많은 순</div>';
      var userBestMedals=['🥇','🥈','🥉'];
      userBestList.forEach(function(b,i){
        var recipe=RECIPES.find(function(rr){return rr.id===b.id});
        var emoji=recipe?recipe.emoji:(b.emoji||'🍳');
        var name=recipe?recipe.name:b.name;
        var stars='';
        var avgR=Math.round(b.avgRating);
        for(var si=1;si<=5;si++)stars+=(si<=avgR?'★':'☆');
        h+='<div onclick="openDetail(\''+b.id+'\')" style="display:flex;align-items:center;gap:10px;padding:8px 0;cursor:pointer'+(i<userBestList.length-1?';border-bottom:1px solid rgba(255,255,255,.08)':'')+'">'
        h+='<span style="font-size:16px;min-width:22px">'+userBestMedals[i]+'</span>';
        h+='<span style="font-size:24px">'+emoji+'</span>';
        h+='<div style="flex:1;min-width:0">';
        h+='<div style="font-size:12px;font-weight:600;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+name+'</div>';
        h+='<div style="font-size:11px;color:#fbc02d;margin-top:2px">'+stars+' <span style="color:rgba(255,255,255,.5);font-size:10px">('+b.avgRating.toFixed(1)+'점 · '+b.count+'명 평가)</span></div>';
        h+='</div>';
        h+='</div>';
      });
      h+='</div>';
      h+='</div>';
    }"""

if old_home_best in content:
    content = content.replace(old_home_best, new_home_best, 1)
    print("✅ 홈 섹션 수정 완료 (유저 Best 요리 TOP3)")
else:
    print("❌ 홈 섹션 찾기 실패!")

# ============================================================
# 2. 내기록 탭(renderMyPage): 레벨 카드 이후에 "내 Best 요리" 섹션 추가
#    기존 내 평점 기반 Best 요리를 내기록 탭에 배치
# ============================================================
# renderMyPage 내 레벨 카드 끝 부분 찾기 (h+='</div>'; 이후 뱃지 섹션 시작 전)
old_mypage_marker = """  h+='<h2 style="color:var(--text)">📊 내 요리 기록</h2>';"""

new_mypage_marker = """  h+='<h2 style="color:var(--text)">📊 내 요리 기록</h2>';
  // === ⭐ 내 Best 요리 TOP3 (내 평점 기반) ===
  (function(){
    var myBestMap={};
    cookHistory.forEach(function(ch){
      if(!ch.rating||ch.rating<1)return;
      if(!myBestMap[ch.id])myBestMap[ch.id]={id:ch.id,totalRating:0,count:0,cookCount:0};
      myBestMap[ch.id].totalRating+=ch.rating;
      myBestMap[ch.id].count++;
    });
    cookHistory.forEach(function(ch){
      if(!myBestMap[ch.id])return;
      myBestMap[ch.id].cookCount=(myBestMap[ch.id].cookCount||0)+1;
    });
    var myBestList=Object.values(myBestMap).map(function(v){
      return Object.assign({},v,{avgRating:v.totalRating/v.count});
    }).sort(function(a,b){
      if(b.avgRating!==a.avgRating)return b.avgRating-a.avgRating;
      return b.cookCount-a.cookCount;
    }).slice(0,3);
    if(myBestList.length>0){
      h+='<div style="background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:16px;padding:16px;margin-bottom:16px">';
      h+='<div style="font-size:13px;font-weight:700;color:#fbc02d;margin-bottom:4px">⭐ 내 Best 요리 TOP'+myBestList.length+'</div>';
      h+='<div style="font-size:10px;color:rgba(255,255,255,.4);margin-bottom:10px">내 평점 높은 순 · 동점 시 요리 횟수 많은 순</div>';
      var myBestMedals=['🥇','🥈','🥉'];
      myBestList.forEach(function(b,i){
        var recipe=RECIPES.find(function(rr){return rr.id===b.id});
        if(!recipe)return;
        var stars='';
        var avgR=Math.round(b.avgRating);
        for(var si=1;si<=5;si++)stars+=(si<=avgR?'★':'☆');
        h+='<div onclick="openDetail(\''+b.id+'\')" style="display:flex;align-items:center;gap:10px;padding:8px 0;cursor:pointer'+(i<myBestList.length-1?';border-bottom:1px solid rgba(255,255,255,.08)':'')+'">';
        h+='<span style="font-size:16px;min-width:22px">'+myBestMedals[i]+'</span>';
        h+='<span style="font-size:24px">'+recipe.emoji+'</span>';
        h+='<div style="flex:1;min-width:0">';
        h+='<div style="font-size:12px;font-weight:600;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+recipe.name+'</div>';
        h+='<div style="font-size:11px;color:#fbc02d;margin-top:2px">'+stars+' <span style="color:rgba(255,255,255,.5);font-size:10px">('+b.avgRating.toFixed(1)+'점 · '+b.cookCount+'회)</span></div>';
        h+='</div>';
        h+='</div>';
      });
      h+='</div>';
    }
  })();"""

if old_mypage_marker in content:
    content = content.replace(old_mypage_marker, new_mypage_marker, 1)
    print("✅ 내기록 탭 내 Best 요리 섹션 추가 완료")
else:
    print("❌ 내기록 탭 마커 찾기 실패!")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("\n저장 완료!")
