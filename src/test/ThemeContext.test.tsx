import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { useTheme } from '@/hooks/useTheme';
import {
  createLocalStorageMock,
  installLocalStorageMock,
  mockMatchMedia,
} from './helpers/mockLocalStorage';

const localStorageMock = createLocalStorageMock();

// useTheme 테스트용 컴포넌트
function TestConsumer() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <button data-testid="toggle-btn" onClick={toggleTheme}>
        Toggle
      </button>
    </div>
  );
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    installLocalStorageMock(localStorageMock);
    document.documentElement.classList.remove('dark');
    mockMatchMedia(false);
  });

  describe('ThemeProvider - 기본 동작', () => {
    it('기본 테마(light)를 제공한다', () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>,
      );

      expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
    });

    it('toggleTheme 호출 시 테마가 light에서 dark로 변경된다', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>,
      );

      expect(screen.getByTestId('theme-value')).toHaveTextContent('light');

      await user.click(screen.getByTestId('toggle-btn'));

      expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
    });

    it('toggleTheme 두 번 호출 시 원래 테마로 복원된다', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>,
      );

      await user.click(screen.getByTestId('toggle-btn'));
      expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');

      await user.click(screen.getByTestId('toggle-btn'));
      expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
    });
  });

  describe('ThemeProvider - localStorage 연동', () => {
    it('테마 변경 시 localStorage에 저장된다', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>,
      );

      await user.click(screen.getByTestId('toggle-btn'));

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'lucky-pick-theme',
        'dark',
      );
    });

    it('localStorage에 저장된 테마(dark)를 복원한다', () => {
      localStorageMock.getItem.mockReturnValue('dark');

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>,
      );

      expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
    });

    it('localStorage에 저장된 테마(light)를 복원한다', () => {
      localStorageMock.getItem.mockReturnValue('light');

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>,
      );

      expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
    });

    it('localStorage에 잘못된 값이 있으면 기본값(light)을 사용한다', () => {
      localStorageMock.getItem.mockReturnValue('invalid-theme');

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>,
      );

      expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
    });
  });

  describe('ThemeProvider - document.documentElement 클래스 토글', () => {
    it('dark 테마일 때 documentElement에 dark 클래스가 추가된다', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>,
      );

      await user.click(screen.getByTestId('toggle-btn'));

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('light 테마일 때 documentElement에서 dark 클래스가 제거된다', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>,
      );

      await user.click(screen.getByTestId('toggle-btn'));
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      await user.click(screen.getByTestId('toggle-btn'));
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('localStorage에서 dark 테마를 복원하면 dark 클래스가 추가된다', () => {
      localStorageMock.getItem.mockReturnValue('dark');

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>,
      );

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  describe('ThemeProvider - 시스템 설정 폴백', () => {
    it('localStorage가 비어있고 시스템이 다크모드면 dark 테마를 사용한다', () => {
      localStorageMock.getItem.mockReturnValue(null);
      mockMatchMedia(true);

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>,
      );

      expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
    });

    it('localStorage가 비어있고 시스템이 라이트모드면 light 테마를 사용한다', () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>,
      );

      expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
    });
  });
});

describe('useTheme', () => {
  it('ThemeProvider 없이 사용하면 에러를 throw한다', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    function BadConsumer() {
      useTheme();
      return <div />;
    }

    expect(() => render(<BadConsumer />)).toThrow();

    consoleSpy.mockRestore();
  });
});
