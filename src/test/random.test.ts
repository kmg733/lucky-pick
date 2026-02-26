import { describe, it, expect } from 'vitest';
import {
  pickRandom,
  pickRandomMultiple,
  generateRandomNumber,
  shuffleArray,
} from '@/lib/random';

// ---------------------------------------------------------------------------
// pickRandom
// ---------------------------------------------------------------------------
describe('pickRandom', () => {
  it('빈 배열에서 null을 반환한다', () => {
    expect(pickRandom([])).toBeNull();
  });

  it('단일 요소 배열에서 해당 요소를 반환한다', () => {
    expect(pickRandom([42])).toBe(42);
  });

  it('배열 내 요소를 반환한다', () => {
    const items = [1, 2, 3, 4, 5];
    const result = pickRandom(items);
    expect(items).toContain(result);
  });

  it('원본 배열을 변경하지 않는다', () => {
    const items = [1, 2, 3];
    const copy = [...items];
    pickRandom(items);
    expect(items).toEqual(copy);
  });
});

// ---------------------------------------------------------------------------
// generateRandomNumber
// ---------------------------------------------------------------------------
describe('generateRandomNumber', () => {
  it('min과 max가 같으면 해당 값을 반환한다', () => {
    expect(generateRandomNumber(5, 5)).toBe(5);
  });

  it('반환값이 min 이상 max 이하이다', () => {
    for (let i = 0; i < 100; i++) {
      const result = generateRandomNumber(1, 10);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(10);
    }
  });

  it('정수를 반환한다', () => {
    for (let i = 0; i < 50; i++) {
      const result = generateRandomNumber(1, 100);
      expect(Number.isInteger(result)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// shuffleArray
// ---------------------------------------------------------------------------
describe('shuffleArray', () => {
  it('빈 배열을 셔플하면 빈 배열을 반환한다', () => {
    expect(shuffleArray([])).toEqual([]);
  });

  it('원본 배열을 변경하지 않는다', () => {
    const original = [1, 2, 3, 4, 5];
    const copy = [...original];
    shuffleArray(original);
    expect(original).toEqual(copy);
  });

  it('셔플된 배열의 길이가 원본과 같다', () => {
    const items = [1, 2, 3, 4, 5];
    expect(shuffleArray(items)).toHaveLength(items.length);
  });

  it('셔플된 배열이 원본과 같은 요소를 포함한다', () => {
    const items = [1, 2, 3, 4, 5];
    const shuffled = shuffleArray(items);
    expect(shuffled.sort()).toEqual([...items].sort());
  });

  it('단일 요소 배열은 동일한 배열을 반환한다', () => {
    expect(shuffleArray([99])).toEqual([99]);
  });
});

// ---------------------------------------------------------------------------
// pickRandomMultiple
// ---------------------------------------------------------------------------
describe('pickRandomMultiple', () => {
  // --- 엣지 케이스 ---
  it('빈 배열에서 빈 배열을 반환한다', () => {
    expect(pickRandomMultiple([], 3)).toEqual([]);
  });

  it('count가 0이면 빈 배열을 반환한다', () => {
    expect(pickRandomMultiple([1, 2, 3], 0)).toEqual([]);
  });

  it('count가 음수이면 빈 배열을 반환한다', () => {
    expect(pickRandomMultiple([1, 2, 3], -1)).toEqual([]);
  });

  it('원본 배열을 변경하지 않는다', () => {
    const items = [1, 2, 3, 4, 5];
    const copy = [...items];
    pickRandomMultiple(items, 3);
    expect(items).toEqual(copy);
  });

  // --- 기본 동작 ---
  it('count만큼의 요소를 반환한다', () => {
    const items = [1, 2, 3, 4, 5];
    const result = pickRandomMultiple(items, 3);
    expect(result).toHaveLength(3);
  });

  it('중복 비허용 시 중복 없는 결과를 반환한다', () => {
    const items = [1, 2, 3, 4, 5];
    for (let i = 0; i < 50; i++) {
      const result = pickRandomMultiple(items, 3, false);
      const unique = new Set(result);
      expect(unique.size).toBe(result.length);
    }
  });

  it('반환된 요소가 모두 원본 배열에 포함된다', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    const result = pickRandomMultiple(items, 3);
    result.forEach((item) => {
      expect(items).toContain(item);
    });
  });

  // --- count >= items.length ---
  it('count가 배열 길이 이상이면 모든 요소를 반환한다', () => {
    const items = [1, 2, 3];
    const result = pickRandomMultiple(items, 5);
    expect(result).toHaveLength(items.length);
    expect(result.sort()).toEqual([...items].sort());
  });

  it('count가 배열 길이와 같으면 모든 요소를 반환한다', () => {
    const items = [1, 2, 3];
    const result = pickRandomMultiple(items, 3);
    expect(result).toHaveLength(3);
    expect(result.sort()).toEqual([...items].sort());
  });

  // --- 중복 허용 ---
  it('중복 허용 시 count만큼의 요소를 반환한다', () => {
    const items = [1, 2];
    const result = pickRandomMultiple(items, 5, true);
    expect(result).toHaveLength(5);
    result.forEach((item) => {
      expect(items).toContain(item);
    });
  });

  // --- 균일 분포 검증 (핵심 테스트) ---
  it('셔플 결과가 균일 분포를 따른다 (count < items.length)', () => {
    const items = [0, 1, 2, 3, 4];
    const count = 2;
    const iterations = 5000;

    // 각 요소가 결과에 포함된 횟수를 기록
    const frequency: Record<number, number> = {};
    items.forEach((item) => (frequency[item] = 0));

    for (let i = 0; i < iterations; i++) {
      const result = pickRandomMultiple(items, count);
      result.forEach((item) => {
        frequency[item as number]++;
      });
    }

    // 기대 빈도: iterations * count / items.length = 5000 * 2 / 5 = 2000
    const expectedFrequency = (iterations * count) / items.length;

    // 각 요소의 빈도가 기대값의 +/-20% 이내인지 확인
    const tolerance = 0.20;
    const lowerBound = expectedFrequency * (1 - tolerance);
    const upperBound = expectedFrequency * (1 + tolerance);

    items.forEach((item) => {
      expect(frequency[item]).toBeGreaterThanOrEqual(lowerBound);
      expect(frequency[item]).toBeLessThanOrEqual(upperBound);
    });
  });

  it('셔플 결과가 균일 분포를 따른다 (count >= items.length, 첫 위치)', () => {
    const items = [0, 1, 2, 3, 4];
    const iterations = 5000;

    // 첫 번째 위치에 각 요소가 나타나는 횟수
    const firstPositionFreq: Record<number, number> = {};
    items.forEach((item) => (firstPositionFreq[item] = 0));

    for (let i = 0; i < iterations; i++) {
      const result = pickRandomMultiple(items, items.length);
      firstPositionFreq[result[0] as number]++;
    }

    // 기대 빈도: iterations / items.length = 5000 / 5 = 1000
    const expectedFrequency = iterations / items.length;

    // 각 요소가 첫 위치에 나타나는 빈도가 기대값의 +/-20% 이내
    const tolerance = 0.20;
    const lowerBound = expectedFrequency * (1 - tolerance);
    const upperBound = expectedFrequency * (1 + tolerance);

    items.forEach((item) => {
      expect(firstPositionFreq[item]).toBeGreaterThanOrEqual(lowerBound);
      expect(firstPositionFreq[item]).toBeLessThanOrEqual(upperBound);
    });
  });

  it('셔플 결과의 각 위치에 요소가 균일하게 분포한다', () => {
    const items = [0, 1, 2, 3];
    const iterations = 4000;

    // positionFreq[position][item] = 해당 위치에 해당 아이템이 나타난 횟수
    const positionFreq: Record<number, Record<number, number>> = {};
    items.forEach((_, pos) => {
      positionFreq[pos] = {};
      items.forEach((item) => (positionFreq[pos][item] = 0));
    });

    for (let i = 0; i < iterations; i++) {
      const result = pickRandomMultiple(items, items.length);
      result.forEach((item, pos) => {
        positionFreq[pos][item as number]++;
      });
    }

    // 기대 빈도: iterations / items.length = 4000 / 4 = 1000
    const expectedFrequency = iterations / items.length;
    const tolerance = 0.20;
    const lowerBound = expectedFrequency * (1 - tolerance);
    const upperBound = expectedFrequency * (1 + tolerance);

    items.forEach((_, pos) => {
      items.forEach((item) => {
        expect(positionFreq[pos][item]).toBeGreaterThanOrEqual(lowerBound);
        expect(positionFreq[pos][item]).toBeLessThanOrEqual(upperBound);
      });
    });
  });
});
