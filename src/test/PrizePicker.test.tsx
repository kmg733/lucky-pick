import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PrizePicker from '@/components/games/PrizePicker';

describe('PrizePicker - handleReset', () => {
  const PRIZES = '아이패드\n에어팟\n스타벅스 쿠폰';

  async function enterPrizes(user: ReturnType<typeof userEvent.setup>) {
    const textarea = screen.getByPlaceholderText(/경품을 한 줄씩 입력하세요/);
    await user.click(textarea);
    await user.type(textarea, PRIZES);
    return textarea;
  }

  function getResetButton(): HTMLElement {
    return screen.getByRole('button', { name: '초기화' });
  }

  it('초기화 버튼 클릭 후 경품 목록(items)이 유지된다', async () => {
    const user = userEvent.setup();
    render(<PrizePicker />);

    await enterPrizes(user);

    expect(screen.getByText((_content, element) =>
      element?.tagName === 'H3' && element?.textContent === '등록된 경품 (3개)'
    )).toBeInTheDocument();
    expect(screen.getByText(/1\.\s*아이패드/)).toBeInTheDocument();
    expect(screen.getByText(/2\.\s*에어팟/)).toBeInTheDocument();
    expect(screen.getByText(/3\.\s*스타벅스 쿠폰/)).toBeInTheDocument();

    await user.click(getResetButton());

    expect(screen.getByText((_content, element) =>
      element?.tagName === 'H3' && element?.textContent === '등록된 경품 (3개)'
    )).toBeInTheDocument();
    expect(screen.getByText(/1\.\s*아이패드/)).toBeInTheDocument();
    expect(screen.getByText(/2\.\s*에어팟/)).toBeInTheDocument();
    expect(screen.getByText(/3\.\s*스타벅스 쿠폰/)).toBeInTheDocument();
  });

  it('초기화 버튼 클릭 후 textarea 입력값(inputText)이 유지된다', async () => {
    const user = userEvent.setup();
    render(<PrizePicker />);

    const textarea = await enterPrizes(user);

    await user.click(getResetButton());

    expect(textarea).toHaveValue(PRIZES);
  });

  it('초기화 버튼 클릭 후 추첨 결과 디스플레이가 초기 상태로 돌아간다', async () => {
    const user = userEvent.setup();
    render(<PrizePicker />);

    expect(screen.getByText('추첨을 시작하세요')).toBeInTheDocument();

    await enterPrizes(user);

    await user.click(getResetButton());

    expect(screen.getByText('추첨을 시작하세요')).toBeInTheDocument();
  });
});

describe('PrizePicker - 검증 메시지 (이슈 #4)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('alert()가 호출되지 않는다 (인라인 검증으로 대체)', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<PrizePicker />);

    // 경품 입력 후 추첨 완료 - removeAfterPick으로 모두 제거
    const textarea = screen.getByPlaceholderText(/경품을 한 줄씩 입력하세요/);
    fireEvent.change(textarea, { target: { value: '아이패드' } });

    const checkbox = screen.getByLabelText(/당첨된 경품은 목록에서 제거/);
    fireEvent.click(checkbox);

    const spinButton = screen.getByRole('button', { name: /추첨하기/ });
    fireEvent.click(spinButton);
    act(() => { vi.advanceTimersByTime(15000); });

    // alert가 호출되지 않았음을 확인
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('초기화하면 검증 메시지도 함께 사라진다', () => {
    render(<PrizePicker />);

    const textarea = screen.getByPlaceholderText(/경품을 한 줄씩 입력하세요/);
    fireEvent.change(textarea, { target: { value: '아이패드' } });

    const resetButton = screen.getByRole('button', { name: '초기화' });
    fireEvent.click(resetButton);

    expect(screen.queryByText('경품을 입력해주세요!')).not.toBeInTheDocument();
  });
});

describe('PrizePicker - handleReset (리소스 정리)', () => {
  const PRIZES = '아이패드\n에어팟\n스타벅스 쿠폰';

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('추첨 중 초기화하면 타이머가 정리되고 spinning이 중단된다', () => {
    render(<PrizePicker />);

    const textarea = screen.getByPlaceholderText(/경품을 한 줄씩 입력하세요/);
    fireEvent.change(textarea, { target: { value: PRIZES } });

    const spinButton = screen.getByRole('button', { name: /추첨하기/ });
    fireEvent.click(spinButton);

    // 추첨 중간 상태 (500ms만 경과 - 아직 진행 중)
    act(() => { vi.advanceTimersByTime(500); });

    // spinning 중에도 초기화 가능
    const resetButton = screen.getByRole('button', { name: '초기화' });
    fireEvent.click(resetButton);

    // 추가 시간이 지나도 상태 변경 없음
    act(() => { vi.advanceTimersByTime(15000); });

    expect(screen.getByText('추첨을 시작하세요')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /추첨하기/ })).not.toBeDisabled();
  });

  it('초기화 후 추가 타이머 콜백이 실행되지 않아 상태가 변경되지 않는다', () => {
    render(<PrizePicker />);

    const textarea = screen.getByPlaceholderText(/경품을 한 줄씩 입력하세요/);
    fireEvent.change(textarea, { target: { value: PRIZES } });

    const spinButton = screen.getByRole('button', { name: /추첨하기/ });
    fireEvent.click(spinButton);
    act(() => { vi.advanceTimersByTime(15000); });

    const resetButton = screen.getByRole('button', { name: '초기화' });
    fireEvent.click(resetButton);

    act(() => { vi.advanceTimersByTime(5000); });

    expect(screen.getByText('추첨을 시작하세요')).toBeInTheDocument();
    expect(screen.queryByText(/축하합니다/)).not.toBeInTheDocument();
  });
});

describe('PrizePicker - 추첨 실행 후 초기화', () => {
  const PRIZES = '아이패드\n에어팟\n스타벅스 쿠폰';

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function setupAndCompleteSpin() {
    render(<PrizePicker />);

    const textarea = screen.getByPlaceholderText(/경품을 한 줄씩 입력하세요/);
    fireEvent.change(textarea, { target: { value: PRIZES } });

    const spinButton = screen.getByRole('button', { name: /추첨하기/ });
    fireEvent.click(spinButton);

    act(() => { vi.advanceTimersByTime(15000); });
  }

  it('추첨 완료 후 초기화하면 경품 목록(items)이 유지된다', () => {
    setupAndCompleteSpin();

    expect(screen.getByText(/축하합니다/)).toBeInTheDocument();

    const resetButton = screen.getByRole('button', { name: '초기화' });
    fireEvent.click(resetButton);

    expect(screen.getByText((_content, element) =>
      element?.tagName === 'H3' && element?.textContent === '등록된 경품 (3개)'
    )).toBeInTheDocument();
    expect(screen.getByText(/1\.\s*아이패드/)).toBeInTheDocument();
    expect(screen.getByText(/2\.\s*에어팟/)).toBeInTheDocument();
    expect(screen.getByText(/3\.\s*스타벅스 쿠폰/)).toBeInTheDocument();
  });

  it('추첨 완료 후 초기화하면 추첨 이력(history) 섹션이 사라진다', () => {
    setupAndCompleteSpin();

    expect(screen.getByText(/축하합니다/)).toBeInTheDocument();
    expect(screen.getByText(/추첨 이력/)).toBeInTheDocument();

    const resetButton = screen.getByRole('button', { name: '초기화' });
    fireEvent.click(resetButton);

    expect(screen.queryByText(/추첨 이력/)).not.toBeInTheDocument();
  });
});

describe('PrizePicker - cancelledRef 타이머 경쟁 조건 방어 (이슈 H-2)', () => {
  it('cancelledRef가 선언되어 있어야 한다', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      '/Users/kmg733/project/lucky-pick-fix-review/src/components/games/PrizePicker.tsx',
      'utf-8',
    );
    const hasCancelledRef = /const\s+cancelledRef\s*=\s*useRef/.test(source);
    expect(hasCancelledRef).toBe(true);
  });

  it('spin 함수 내에서 cancelledRef.current 체크가 있어야 한다', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      '/Users/kmg733/project/lucky-pick-fix-review/src/components/games/PrizePicker.tsx',
      'utf-8',
    );
    const hasGuardInSpin = /const\s+spin\s*=\s*\(\s*\)\s*=>\s*\{[\s\S]*?cancelledRef\.current/.test(source);
    expect(hasGuardInSpin).toBe(true);
  });

  it('handleReset에서 cancelledRef.current를 true로 설정해야 한다', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      '/Users/kmg733/project/lucky-pick-fix-review/src/components/games/PrizePicker.tsx',
      'utf-8',
    );
    const hasResetCancel = /handleReset[\s\S]*?cancelledRef\.current\s*=\s*true/.test(source);
    expect(hasResetCancel).toBe(true);
  });

  it('startSpin에서 cancelledRef.current를 false로 초기화해야 한다', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      '/Users/kmg733/project/lucky-pick-fix-review/src/components/games/PrizePicker.tsx',
      'utf-8',
    );
    const hasStartInit = /startSpin[\s\S]*?cancelledRef\.current\s*=\s*false/.test(source);
    expect(hasStartInit).toBe(true);
  });

  it('추첨 중 초기화하면 cancelledRef로 인해 spin 콜백 체인이 중단된다', () => {
    vi.useFakeTimers();
    render(<PrizePicker />);

    const textarea = screen.getByPlaceholderText(/경품을 한 줄씩 입력하세요/);
    fireEvent.change(textarea, { target: { value: '아이패드\n에어팟\n스타벅스 쿠폰' } });

    const spinButton = screen.getByRole('button', { name: /추첨하기/ });
    fireEvent.click(spinButton);

    // 100ms만 진행 (spin 아직 진행 중)
    act(() => { vi.advanceTimersByTime(100); });

    // 초기화 (cancelledRef.current = true)
    const resetButton = screen.getByRole('button', { name: '초기화' });
    fireEvent.click(resetButton);

    // 추가 타이머 실행해도 상태 변경 없음 (spin이 cancelledRef로 중단됨)
    act(() => { vi.advanceTimersByTime(20000); });

    // spinning이 false이고 초기 상태로 유지
    expect(screen.getByText('추첨을 시작하세요')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /추첨하기/ })).not.toBeDisabled();

    vi.useRealTimers();
  });
});

describe('PrizePicker - 중복 항목 제거 (이슈 #5)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('removeAfterPick 활성 시 동일 이름의 경품이 여러 개 있으면 당첨된 첫 번째만 제거한다', async () => {
    // pickRandom을 모듈 mock으로 덮어씌워 항상 첫 번째 요소 반환
    const randomModule = await import('@/lib/random');
    const pickRandomSpy = vi.spyOn(randomModule, 'pickRandom').mockImplementation(
      (items: any[]) => items[0]
    );

    render(<PrizePicker />);

    // 중복 경품 입력 (아이패드가 2개)
    const textarea = screen.getByPlaceholderText(/경품을 한 줄씩 입력하세요/);
    fireEvent.change(textarea, { target: { value: '아이패드\n에어팟\n아이패드' } });

    const checkbox = screen.getByLabelText(/당첨된 경품은 목록에서 제거/);
    fireEvent.click(checkbox);

    const spinButton = screen.getByRole('button', { name: /추첨하기/ });
    fireEvent.click(spinButton);
    act(() => { vi.advanceTimersByTime(15000); });

    // 아이패드 하나만 제거되어 2개 경품이 남아야 한다
    expect(screen.getByText((_content, element) =>
      element?.tagName === 'H3' && element?.textContent === '등록된 경품 (2개)'
    )).toBeInTheDocument();

    pickRandomSpy.mockRestore();
  });
});
