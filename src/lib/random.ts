/**
 * 배열에서 랜덤 요소를 선택합니다.
 */
export function pickRandom<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * items.length);
  return items[randomIndex];
}

/**
 * 배열에서 여러 랜덤 요소를 선택합니다.
 * @param items - 대상 배열
 * @param count - 선택할 개수
 * @param allowDuplicates - 중복 허용 여부 (기본값: false)
 */
export function pickRandomMultiple<T>(
  items: T[],
  count: number,
  allowDuplicates: boolean = false
): T[] {
  if (items.length === 0 || count <= 0) return [];

  if (allowDuplicates) {
    return Array.from({ length: count }, () => pickRandom(items)!);
  }

  if (count >= items.length) {
    return [...items].sort(() => Math.random() - 0.5);
  }

  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * 지정된 범위 내에서 랜덤 정수를 생성합니다.
 * @param min - 최소값 (포함)
 * @param max - 최대값 (포함)
 */
export function generateRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 배열을 무작위로 섞습니다 (Fisher-Yates 알고리즘).
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
