import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

scripts = re.findall(r'<script[^>]*>(.*?)</script>', content, re.DOTALL)
js_code = '\n'.join(scripts)

# 소괄호 불균형 위치 찾기
def find_imbalance(code, open_ch, close_ch):
    count = 0
    last_open_positions = []
    for i, ch in enumerate(code):
        if ch == open_ch:
            count += 1
            last_open_positions.append(i)
        elif ch == close_ch:
            count -= 1
            if last_open_positions:
                last_open_positions.pop()
            if count < 0:
                line = code[:i].count('\n') + 1
                ctx_start = max(0, i-100)
                ctx_end = min(len(code), i+100)
                return i, line, code[ctx_start:ctx_end]
    # 닫히지 않은 열린 괄호
    if count > 0 and last_open_positions:
        pos = last_open_positions[-1]
        line = code[:pos].count('\n') + 1
        ctx_start = max(0, pos-100)
        ctx_end = min(len(code), pos+100)
        return pos, line, code[ctx_start:ctx_end]
    return -1, -1, ''

pos_p, line_p, ctx_p = find_imbalance(js_code, '(', ')')
pos_b, line_b, ctx_b = find_imbalance(js_code, '[', ']')

print(f"소괄호 불균형 위치: JS 코드 {pos_p}번째 문자, 약 {line_p}번째 줄")
print(f"컨텍스트:\n{repr(ctx_p)}\n")

print(f"대괄호 불균형 위치: JS 코드 {pos_b}번째 문자, 약 {line_b}번째 줄")
print(f"컨텍스트:\n{repr(ctx_b)}\n")

# HTML 파일에서의 실제 줄 번호 찾기 (JS 코드 위치 기반)
# 첫 번째 script 태그 시작 위치 찾기
script_starts = [m.start() for m in re.finditer(r'<script[^>]*>', content)]
print(f"script 태그 시작 위치들: {script_starts[:5]}")
