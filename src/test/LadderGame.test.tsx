import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// --- Mocks ---

vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() }),
}));

vi.mock('@/lib/random', () => ({
  shuffleArray: <T,>(arr: T[]): T[] => [...arr],
  generateRandomNumber: (min: number, max: number): number => min,
}));

function createMockCanvas2DContext(): Record<string, ReturnType<typeof vi.fn>> {
  return {
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    save: vi.fn(),
    restore: vi.fn(),
    setTransform: vi.fn(),
    resetTransform: vi.fn(),
    scale: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    getImageData: vi.fn(() => ({
      data: new Uint8ClampedArray(4),
      width: 1,
      height: 1,
    })),
    putImageData: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createPattern: vi.fn(),
    drawImage: vi.fn(),
    clip: vi.fn(),
    closePath: vi.fn(),
    rect: vi.fn(),
    quadraticCurveTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    isPointInPath: vi.fn(),
    isPointInStroke: vi.fn(),
    setLineDash: vi.fn(),
    getLineDash: vi.fn(() => []),
  };
}

// --- Setup ---

let mockCtx: Record<string, ReturnType<typeof vi.fn>>;
let rafIdCounter: number;

beforeEach(() => {
  mockCtx = createMockCanvas2DContext();
  rafIdCounter = 0;

  HTMLCanvasElement.prototype.getContext = vi.fn(function (
    this: HTMLCanvasElement,
    contextId: string,
  ) {
    if (contextId === '2d') return mockCtx as unknown as CanvasRenderingContext2D;
    return null;
  }) as unknown as typeof HTMLCanvasElement.prototype.getContext;

  vi.stubGlobal('requestAnimationFrame', vi.fn((cb: FrameRequestCallback): number => {
    return ++rafIdCounter;
  }));

  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// =================================================================
// Issue H-1: Math.random() 잔존 - CSPRNG 적용 누락
// =================================================================
describe('Issue H-1: LadderGame에서 Math.random() 직접 사용 금지', () => {
  it('LadderGame 소스코드에 Math.random()이 직접 사용되지 않아야 한다', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      '/Users/kmg733/project/lucky-pick/src/components/games/LadderGame.tsx',
      'utf-8',
    );

    // Math.random() 직접 호출이 없어야 한다
    const mathRandomUsages = source.match(/Math\.random\s*\(\s*\)/g);
    expect(mathRandomUsages).toBeNull();
  });

  it('generateRandomNumber를 import하여 사용해야 한다', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      '/Users/kmg733/project/lucky-pick/src/components/games/LadderGame.tsx',
      'utf-8',
    );

    // generateRandomNumber가 import 되어 있어야 한다
    const hasImport = /import\s*\{[^}]*generateRandomNumber[^}]*\}\s*from\s*['"]@\/lib\/random['"]/.test(source);
    expect(hasImport).toBe(true);
  });
});

// =================================================================
// Issue #2: animationFrameRef 미정리 (메모리 누수)
// =================================================================
describe('Issue #2: animationFrameRef cleanup on unmount', () => {
  it('컴포넌트 언마운트 시 cancelAnimationFrame이 호출된다', async () => {
    const LadderGame = (await import('@/components/games/LadderGame')).default;
    const { unmount } = render(<LadderGame />);

    // 참가자 버튼 클릭하여 애니메이션 시작
    const participantButtons = screen.getAllByRole('button').filter(
      (btn) => btn.textContent && btn.textContent.includes('참가자'),
    );
    expect(participantButtons.length).toBeGreaterThan(0);

    participantButtons[0].click();

    // requestAnimationFrame이 호출되었는지 확인 (애니메이션 진행 중)
    expect(requestAnimationFrame).toHaveBeenCalled();

    const cancelCallsBefore = (cancelAnimationFrame as ReturnType<typeof vi.fn>).mock.calls.length;

    // 컴포넌트 언마운트
    unmount();

    // 언마운트 후 cancelAnimationFrame이 호출되어야 함
    const cancelCallsAfter = (cancelAnimationFrame as ReturnType<typeof vi.fn>).mock.calls.length;
    expect(cancelCallsAfter).toBeGreaterThan(cancelCallsBefore);
  });
});

// =================================================================
// Issue #3: useEffect 의존성 배열에 generateLadder 누락
// =================================================================
describe('Issue #3: useEffect dependency - generateLadder', () => {
  it('generateLadder가 useEffect 의존성 배열에 포함되어 있어야 한다', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      '/Users/kmg733/project/lucky-pick/src/components/games/LadderGame.tsx',
      'utf-8',
    );

    // generateLadder(participantCount)를 호출하는 useEffect의 의존성 배열에
    // generateLadder가 포함되어야 React exhaustive-deps 규칙 준수
    const hasGenerateLadderInDeps = /\}\s*,\s*\[participantCount\s*,\s*generateLadder\s*\]/.test(source);
    expect(hasGenerateLadderInDeps).toBe(true);
  });
});

// =================================================================
// Issue #4: calculatePath에서 미사용 변수 ladderHeight
// =================================================================
describe('Issue #4: unused variable ladderHeight in calculatePath', () => {
  it('calculatePath 함수 내에 미사용 변수 ladderHeight가 없어야 한다', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      '/Users/kmg733/project/lucky-pick/src/components/games/LadderGame.tsx',
      'utf-8',
    );

    const calcPathStart = source.indexOf('const calculatePath = useCallback');
    expect(calcPathStart).toBeGreaterThan(-1);

    const drawLadderStart = source.indexOf('const drawLadder = useCallback');
    expect(drawLadderStart).toBeGreaterThan(calcPathStart);

    const calculatePathBody = source.slice(calcPathStart, drawLadderStart);

    const hasUnusedLadderHeight = /const\s+ladderHeight\s*=/.test(calculatePathBody);
    expect(hasUnusedLadderHeight).toBe(false);
  });
});
