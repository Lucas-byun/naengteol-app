with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 정확한 시작/끝 마커로 블록 교체
start_marker = '// === ⭐ 내가 가장 맛있었던 요리 TOP3 (평점 기반) ==='
end_marker = '// === 내 즐겨찾기 목록 ==='

start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx)

if start_idx < 0 or end_idx < 0:
    print("❌ 마커 찾기 실패!")
    exit(1)

# 교체할 새 코드
new_block = """// === 🏆 유저 Best 요리 TOP3 (커뮤니티 평점 기반) ===
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
      h+='<div style="font-size:13px;font-weight:700;color:#fbc02d;margin-bottom:4px">🏆 유저 Best 요리 TOP'+userBestList.length+'</div>';
      h+='<div style="font-size:10px;color:rgba(255,255,255,.4);margin-bottom:10px">커뮤니티 평점 높은 순 · 동점 시 평가 많은 순</div>';
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
    }
    """

# 기존 블록 교체 (end_marker 직전까지)
old_block = content[start_idx:end_idx]
content = content[:start_idx] + new_block + content[end_idx:]

print("✅ 홈 섹션 교체 완료!")
print(f"   교체된 블록 길이: {len(old_block)} → {len(new_block)}")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("저장 완료!")
