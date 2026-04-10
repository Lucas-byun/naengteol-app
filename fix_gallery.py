with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

old_section = """  // Add photo section
  if(histIdx>=0){
    h+='<div id="photoAddSection" style="margin-bottom:16px">';
    h+='<label style="display:flex;align-items:center;justify-content:center;gap:6px;padding:12px;border:2px dashed rgba(255,255,255,.3);border-radius:12px;color:#fff;font-size:14px;font-weight:700;cursor:pointer">';
    h+='<input type="file" accept="image/*" style="display:none" onchange="previewPhotoInGallery('+histIdx+',this)">';
    h+='📸 사진 추가하기</label>';
    // Preview area (hidden initially)
    h+='<div id="photoPreviewArea" style="display:none;margin-top:12px">';
    h+='<img id="galleryPreviewImg" style="width:100%;border-radius:12px;margin-bottom:10px">';
    h+='<input type="text" id="galleryCommentInput" placeholder="한줄 코멘트 (선택)" style="width:100%;padding:10px 14px;border:1px solid rgba(255,255,255,.2);border-radius:10px;font-size:13px;font-family:inherit;outline:none;background:rgba(255,255,255,.1);color:#fff;box-sizing:border-box;margin-bottom:10px">';
    h+='<div style="display:flex;gap:8px">';
    h+='<button onclick="cancelPhotoPreview()" style="flex:1;padding:10px;border:1px solid rgba(255,255,255,.3);border-radius:10px;background:none;color:#fff;font-size:13px;cursor:pointer;font-family:inherit">취소</button>';
    h+='<button onclick="savePhotoWithComment('+histIdx+')" style="flex:1;padding:10px;border:none;border-radius:10px;background:var(--primary);color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">저장</button>';
    h+='</div></div>';
    h+='</div>';
  }"""

new_section = """  // Add photo section - 사진 없는 기록이 여러 개면 선택 UI 표시
  if(noPhotoEntries.length>0){
    h+='<div id="photoAddSection" style="margin-bottom:16px">';
    if(noPhotoEntries.length===1){
      // 사진 없는 기록이 1개: 기존 방식대로 바로 추가
      h+='<label style="display:flex;align-items:center;justify-content:center;gap:6px;padding:12px;border:2px dashed rgba(255,255,255,.3);border-radius:12px;color:#fff;font-size:14px;font-weight:700;cursor:pointer">';
      h+='<input type="file" accept="image/*" style="display:none" onchange="previewPhotoInGallery('+noPhotoEntries[0].idx+',this)">';
      h+='📸 사진 추가하기</label>';
    }else{
      // 사진 없는 기록이 여러 개: 어느 기록에 붙일지 선택
      h+='<div style="border:2px dashed rgba(255,255,255,.3);border-radius:12px;padding:12px">';
      h+='<div style="color:#fff;font-size:13px;font-weight:700;margin-bottom:8px;text-align:center">📸 어느 요리 기록에 사진을 추가할까요?</div>';
      h+='<div style="display:flex;flex-direction:column;gap:6px">';
      noPhotoEntries.forEach(function(o){
        var label=o.ch.date+(o.ch.rating?' · '+getRatingStars(o.ch.rating):'')+(o.ch.comment?' · \\"'+o.ch.comment.substring(0,15)+(o.ch.comment.length>15?'…':'')+'\\"':'');
        h+='<label style="display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.1);border-radius:8px;padding:10px 12px;cursor:pointer">';
        h+='<input type="file" accept="image/*" style="display:none" onchange="previewPhotoInGallery('+o.idx+',this)">';
        h+='<span style="font-size:18px">'+(r?r.emoji:'🍳')+'</span>';
        h+='<span style="color:#fff;font-size:12px;flex:1">'+label+'</span>';
        h+='<span style="color:#fbc02d;font-size:11px">📸 추가</span>';
        h+='</label>';
      });
      h+='</div></div>';
    }
    // Preview area (hidden initially)
    h+='<div id="photoPreviewArea" style="display:none;margin-top:12px">';
    h+='<div id="photoTargetInfo" style="color:#fbc02d;font-size:11px;margin-bottom:6px;text-align:center"></div>';
    h+='<img id="galleryPreviewImg" style="width:100%;border-radius:12px;margin-bottom:10px">';
    h+='<input type="text" id="galleryCommentInput" placeholder="한줄 코멘트 (선택)" style="width:100%;padding:10px 14px;border:1px solid rgba(255,255,255,.2);border-radius:10px;font-size:13px;font-family:inherit;outline:none;background:rgba(255,255,255,.1);color:#fff;box-sizing:border-box;margin-bottom:10px">';
    h+='<div style="display:flex;gap:8px">';
    h+='<button onclick="cancelPhotoPreview()" style="flex:1;padding:10px;border:1px solid rgba(255,255,255,.3);border-radius:10px;background:none;color:#fff;font-size:13px;cursor:pointer;font-family:inherit">취소</button>';
    h+='<button onclick="savePhotoWithComment(_pendingPhotoIdx)" style="flex:1;padding:10px;border:none;border-radius:10px;background:var(--primary);color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">저장</button>';
    h+='</div></div>';
    h+='</div>';
  }"""

if old_section in content:
    content = content.replace(old_section, new_section, 1)
    print("Add photo section 수정 완료!")
else:
    print("찾기 실패!")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
