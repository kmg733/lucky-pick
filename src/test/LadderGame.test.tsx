import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// --- Mocks ---

vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() }),
}));

vi.mock('@/lib/random', () => ({
  shuffleArray: <T,>(arr: T[]): T[] => [...arr],
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
