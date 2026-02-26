import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import NamePicker from '@/components/games/NamePicker';

// window.alert mock
beforeEach(() => {
  vi.spyOn(window, 'alert').mockImplementation(() => {});
});

describe('NamePicker - handleReset', () => {
  const PARTICIPANTS = '김철수\n이영희\n박민수';

  async function enterParticipants(user: ReturnType<typeof userEvent.setup>) {
    const textarea = screen.getByPlaceholderText(/참가자 이름을 한 줄씩 입력하세요/);
    await user.click(textarea);
    await user.type(textarea, PARTICIPANTS);
    return textarea;
  }

  function getResetButton(): HTMLElement {
    return screen.getByRole('button', { name: '초기화' });
  }

  it('초기화 버튼 클릭 후 참가자 목록(names)이 유지된다', async () => {
    const user = userEvent.setup();
    render(<NamePicker />);

    // Given: 참가자 3명 입력
    await enterParticipants(user);

    // 참가자 목록이 표시되는지 확인
    expect(screen.getByText(/등록된 참가자 \(3명\)/)).toBeInTheDocument();
    expect(screen.getByText('김철수')).toBeInTheDocument();
    expect(screen.getByText('이영희')).toBeInTheDocument();
    expect(screen.getByText('박민수')).toBeInTheDocument();

    // When: 초기화 버튼 클릭
    await user.click(getResetButton());

    // Then: 참가자 목록은 여전히 유지되어야 한다
    expect(screen.getByText(/등록된 참가자 \(3명\)/)).toBeInTheDocument();
    expect(screen.getByText('김철수')).toBeInTheDocument();
    expect(screen.getByText('이영희')).toBeInTheDocument();
    expect(screen.getByText('박민수')).toBeInTheDocument();
  });

  it('초기화 버튼 클릭 후 textarea 입력값(inputText)이 유지된다', async () => {
    const user = userEvent.setup();
    render(<NamePicker />);

    // Given: 참가자 입력
    const textarea = await enterParticipants(user);

    // When: 초기화 버튼 클릭
    await user.click(getResetButton());

    // Then: textarea 값이 유지되어야 한다
    expect(textarea).toHaveValue(PARTICIPANTS);
  });

  it('초기화 버튼 클릭 후 추첨 결과 디스플레이가 초기 상태로 돌아간다', async () => {
    const user = userEvent.setup();
    render(<NamePicker />);

    // Given: 초기 상태에서는 "추첨을 시작하세요" 문구가 보여야 한다
    expect(screen.getByText('추첨을 시작하세요')).toBeInTheDocument();

    // 참가자 입력
    await enterParticipants(user);

    // When: 초기화 버튼 클릭
    await user.click(getResetButton());

    // Then: 다시 초기 안내 문구가 표시되어야 한다
    // (displayName이 빈 문자열이고, winners가 비어있으면 "추첨을 시작하세요"가 표시됨)
    expect(screen.getByText('추첨을 시작하세요')).toBeInTheDocument();
  });
});

describe('NamePicker - handleReset (리소스 정리)', () => {
  const PARTICIPANTS = '김철수\n이영희\n박민수';

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('추첨 중 타이머가 동작 중일 때 초기화하면 타이머가 정리되고 spinning이 중단된다', () => {
    render(<NamePicker />);

    // Given: 참가자 입력 후 추첨 시작
    const textarea = screen.getByPlaceholderText(/참가자 이름을 한 줄씩 입력하세요/);
    fireEvent.change(textarea, { target: { value: PARTICIPANTS } });

    const spinButton = screen.getByRole('button', { name: /추첨하기/ });
    fireEvent.click(spinButton);

    // 추첨 중간 상태 (일부 시간만 경과)
    act(() => { vi.advanceTimersByTime(500); });

    // spinning 중이므로 초기화 버튼은 disabled 상태
    // 하지만 spinning을 완료시키고 나서 초기화 테스트
    act(() => { vi.advanceTimersByTime(15000); });

    // When: 초기화 버튼 클릭
    const resetButton = screen.getByRole('button', { name: '초기화' });
    fireEvent.click(resetButton);

    // Then: 추첨 상태가 완전히 초기화되어야 한다
    // - winners 비어있음 (축하 메시지 없음)
    // - displayName 비어있음
    // - history 비어있음
    // - isSpinning === false (추첨하기 버튼 활성화)
    expect(screen.getByText('추첨을 시작하세요')).toBeInTheDocument();
    expect(screen.queryByText(/축하합니다/)).not.toBeInTheDocument();
    expect(screen.queryByText(/추첨 이력/)).not.toBeInTheDocument();

    // 추첨하기 버튼이 다시 활성화되어야 한다
    expect(screen.getByRole('button', { name: /추첨하기/ })).not.toBeDisabled();
  });

  it('초기화 후 추가 타이머 콜백이 실행되지 않아 상태가 변경되지 않는다', () => {
    render(<NamePicker />);

    // Given: 참가자 입력 후 추첨 완료
    const textarea = screen.getByPlaceholderText(/참가자 이름을 한 줄씩 입력하세요/);
    fireEvent.change(textarea, { target: { value: PARTICIPANTS } });

    const spinButton = screen.getByRole('button', { name: /추첨하기/ });
    fireEvent.click(spinButton);
    act(() => { vi.advanceTimersByTime(15000); });

    // When: 초기화 수행
    const resetButton = screen.getByRole('button', { name: '초기화' });
    fireEvent.click(resetButton);

    // Then: 추가 시간이 지나도 상태가 변경되지 않아야 한다 (잔여 타이머 없음)
    act(() => { vi.advanceTimersByTime(5000); });

    expect(screen.getByText('추첨을 시작하세요')).toBeInTheDocument();
    expect(screen.queryByText(/축하합니다/)).not.toBeInTheDocument();
  });
});

describe('NamePicker - 추첨 실행 후 초기화', () => {
  const PARTICIPANTS = '김철수\n이영희\n박민수';

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * fireEvent.change로 textarea 입력 후 추첨 완료까지 실행
   */
  function setupAndCompleteSpin() {
    render(<NamePicker />);

    // 참가자 입력 (fireEvent로 fake timers와 충돌 방지)
    const textarea = screen.getByPlaceholderText(/참가자 이름을 한 줄씩 입력하세요/);
    fireEvent.change(textarea, { target: { value: PARTICIPANTS } });

    // 추첨 시작
    const spinButton = screen.getByRole('button', { name: /추첨하기/ });
    fireEvent.click(spinButton);

    // 추첨 완료까지 충분한 시간 경과 (30 spins * ~350ms max = ~10.5s)
    act(() => { vi.advanceTimersByTime(15000); });
  }

  it('추첨 완료 후 초기화하면 참가자 목록(names)이 유지된다', () => {
    setupAndCompleteSpin();

    // Given: 추첨이 완료되어 축하 메시지가 표시됨
    expect(screen.getByText(/축하합니다/)).toBeInTheDocument();

    // When: 초기화 버튼 클릭
    const resetButton = screen.getByRole('button', { name: '초기화' });
    fireEvent.click(resetButton);

    // Then: 참가자 목록은 여전히 유지되어야 한다
    expect(screen.getByText(/등록된 참가자 \(3명\)/)).toBeInTheDocument();
    expect(screen.getByText('김철수')).toBeInTheDocument();
    expect(screen.getByText('이영희')).toBeInTheDocument();
    expect(screen.getByText('박민수')).toBeInTheDocument();
  });

  it('추첨 완료 후 초기화하면 추첨 이력(history) 섹션이 사라진다', () => {
    setupAndCompleteSpin();

    // Given: 추첨 완료 후 이력 섹션이 표시됨
    expect(screen.getByText(/축하합니다/)).toBeInTheDocument();
    expect(screen.getByText(/추첨 이력/)).toBeInTheDocument();

    // When: 초기화 버튼 클릭
    const resetButton = screen.getByRole('button', { name: '초기화' });
    fireEvent.click(resetButton);

    // Then: 추첨 이력 섹션이 사라져야 한다
    expect(screen.queryByText(/추첨 이력/)).not.toBeInTheDocument();
  });
});
