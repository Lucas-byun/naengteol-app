import subprocess
import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 새로 추가된 두 블록 추출
blocks = {
    'userBestMap (홈 화면)': ('// === 🏆 유저 Best 요리 TOP3', '// === 내 즐겨찾기 목록 ==='),
    'myBestMap (내기록 탭)': ('// === ⭐ 내 Best 요리 TOP3 (내 평점 기반) ===', '// 레벨 카드'),
}

for name, (start_marker, end_marker) in blocks.items():
    start_idx = content.find(start_marker)
    end_idx = content.find(end_marker, start_idx)
    if start_idx < 0:
        print(f"❌ {name}: 시작 마커 없음")
        continue
    if end_idx < 0:
        print(f"❌ {name}: 끝 마커 없음")
        continue
    
    block = content[start_idx:end_idx]
    print(f"\n=== {name} ===")
    print(f"길이: {len(block)}")
    
    # 따옴표 패턴 검사 - h+= 라인에서 문자열 내 이스케이프 안된 따옴표 확인
    lines = block.split('\n')
    for i, line in enumerate(lines):
        # 백슬래시 없이 나오는 큰따옴표 패턴 체크
        if "h+='" in line:
            # 작은따옴표로 감싼 문자열 내에 이스케이프 안된 작은따옴표가 있는지
            # 간단히 홀수 개 작은따옴표 체크
            single_quotes = line.count("'") - line.count("\\'")
            if single_quotes % 2 != 0:
                print(f"  ⚠️  줄 {i+1}: 홀수 따옴표 - {line[:100]}")

    # 전체 블록을 node로 문법 검사
    test_code = f"(function(){{\n{block}\n}})()"
    result = subprocess.run(
        ['node', '-e', f'try {{ eval({repr(test_code)}); console.log("OK"); }} catch(e) {{ console.log("ERR: " + e.message); }}'],
        capture_output=True, text=True, timeout=10
    )
    print(f"Node 검사: {result.stdout.strip()} {result.stderr.strip()[:100]}")

# myBestMap 블록 직접 출력
print("\n\n=== myBestMap 블록 전체 ===")
start_idx = content.find('// === ⭐ 내 Best 요리 TOP3 (내 평점 기반) ===')
end_idx = content.find('// 레벨 카드', start_idx)
if start_idx > 0 and end_idx > 0:
    print(content[start_idx:end_idx])
