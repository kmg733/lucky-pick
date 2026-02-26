import { describe, it, expect } from 'vitest';

// =================================================================
// Issue M-2: NumberPicker do-while 무한 루프 방어
// =================================================================
describe('Issue M-2: NumberPicker do-while 무한 루프 방어', () => {
  it('do-while 루프가 제거되고 가용 번호 배열 방식으로 전환되어야 한다', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      '/Users/kmg733/project/lucky-pick-fix-review/src/components/games/NumberPicker.tsx',
      'utf-8',
    );
    // do-while 루프가 없어야 한다
    const hasDoWhile = /do\s*\{[\s\S]*?\}\s*while/.test(source);
    expect(hasDoWhile).toBe(false);
  });

  it('pickRandom을 import하여 사용해야 한다', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      '/Users/kmg733/project/lucky-pick-fix-review/src/components/games/NumberPicker.tsx',
      'utf-8',
    );
    const hasPickRandomImport = /import\s*\{[^}]*pickRandom[^}]*\}\s*from\s*['"]@\/lib\/random['"]/.test(source);
    expect(hasPickRandomImport).toBe(true);
  });

  it('가용 번호 배열을 필터링하여 선택하는 패턴이 있어야 한다', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      '/Users/kmg733/project/lucky-pick-fix-review/src/components/games/NumberPicker.tsx',
      'utf-8',
    );
    // .filter(n => !usedNumbers.includes(n)) 패턴이 있어야 한다
    const hasFilterPattern = /\.filter\s*\(\s*\w+\s*=>\s*!usedNumbers\.includes\s*\(\s*\w+\s*\)/.test(source);
    expect(hasFilterPattern).toBe(true);
  });
});

// =================================================================
// Issue M-4: useEffect cleanup에서 stale ref 패턴 사용
// =================================================================
describe('Issue M-4: NumberPicker useEffect cleanup - stale ref 방지', () => {
  it('useEffect cleanup에서 timeoutRef.current를 직접 참조해야 한다 (stale ref 금지)', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      '/Users/kmg733/project/lucky-pick-fix-review/src/components/games/NumberPicker.tsx',
      'utf-8',
    );

    // stale ref 패턴: 마운트 시점에 `const timeout = timeoutRef.current` 캡처 후 cleanup에서 사용
    // 이 패턴은 마운트 시점의 값(undefined)을 캡처하므로 cleanup이 동작하지 않음
    const hasStaleRefPattern = /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?const\s+timeout\s*=\s*timeoutRef\.current[\s\S]*?return\s*\(\s*\)\s*=>\s*\{[\s\S]*?if\s*\(\s*timeout\s*\)[\s\S]*?\}\s*;?\s*\}\s*,\s*\[\s*\]\s*\)/.test(source);
    expect(hasStaleRefPattern).toBe(false);
  });

  it('useEffect cleanup 내부에서 timeoutRef.current를 직접 접근해야 한다', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      '/Users/kmg733/project/lucky-pick-fix-review/src/components/games/NumberPicker.tsx',
      'utf-8',
    );

    // cleanup 함수 내에서 직접 timeoutRef.current를 참조하는 패턴이 있어야 한다
    // return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
    const hasDirectRefAccess = /return\s*\(\s*\)\s*=>\s*\{[\s\S]*?if\s*\(\s*timeoutRef\.current\s*\)\s*clearTimeout\s*\(\s*timeoutRef\.current\s*\)/.test(source);
    expect(hasDirectRefAccess).toBe(true);
  });
});
