#!/usr/bin/env node
const fs=require('fs');
const vm=require('vm');

const code=fs.readFileSync('app-community.js','utf8');
const sandbox={
  console,
  window:{},
  document:{documentElement:{}},
  getComputedStyle(){return{getPropertyValue(){return '#123456';}}},
};
vm.createContext(sandbox);
vm.runInContext(code,sandbox);

function assert(cond,msg){if(!cond){throw new Error(msg);}}

assert(typeof sandbox.getCommunityFallbackThumb==='function','getCommunityFallbackThumb 없음');
assert(typeof sandbox.getCommunityTitleLines==='function','getCommunityTitleLines 없음');

const lines=sandbox.getCommunityTitleLines('아주긴레시피이름테스트문자열입니다');
assert(Array.isArray(lines)&&lines.length===2,'title lines 형식 오류');
assert(lines[0].length<=8,'첫 줄 길이 초과');
assert((lines[0]+lines[1]).length<=16,'총 길이 초과');

const post={recipe:'김치찌개 특선',emoji:'🍲',user:'tester',text:'얼큰해요'};
const a=sandbox.getCommunityFallbackThumb(post,'grid');
const b=sandbox.getCommunityFallbackThumb(post,'grid');
assert(typeof a==='string'&&a.startsWith('data:image/svg+xml'),'fallback data uri 아님');
assert(a===b,'같은 입력 캐시 재사용 실패');

const detail=sandbox.getCommunityFallbackThumb(post,'detail');
assert(detail!==a,'mode 별 결과가 달라야 함');

console.log('comm fallback tests passed');
