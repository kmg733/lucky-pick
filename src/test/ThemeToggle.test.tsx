import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ThemeToggle from '@/components/ui/ThemeToggle';
import {
  createLocalStorageMock,
  installLocalStorageMock,
  mockMatchMedia,
} from './helpers/mockLocalStorage';

const localStorageMock = createLocalStorageMock();

function renderWithTheme(initialTheme?: string) {
  if (initialTheme) {
    localStorageMock.getItem.mockReturnValue(initialTheme);
  }

  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    installLocalStorageMock(localStorageMock);
    document.documentElement.classList.remove('dark');
    mockMatchMedia(false);
  });

  describe('아이콘 표시', () => {
    it('라이트 모드에서 해 아이콘이 표시된다', () => {
      renderWithTheme('light');

      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('☀️');
    });

    it('다크 모드에서 달 아이콘이 표시된다', () => {
      renderWithTheme('dark');

      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('🌙');
    });
  });

  describe('토글 동작', () => {
    it('클릭 시 라이트에서 다크로 토글된다', async () => {
      const user = userEvent.setup();
      renderWithTheme('light');

      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('☀️');

      await user.click(button);

      expect(button).toHaveTextContent('🌙');
    });

    it('클릭 시 다크에서 라이트로 토글된다', async () => {
      const user = userEvent.setup();
      renderWithTheme('dark');

      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('🌙');

      await user.click(button);

      expect(button).toHaveTextContent('☀️');
    });
  });

  describe('접근성', () => {
    it('라이트 모드에서 적절한 aria-label이 있다', () => {
      renderWithTheme('light');

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', '다크 모드로 전환');
    });

    it('다크 모드에서 적절한 aria-label이 있다', () => {
      renderWithTheme('dark');

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', '라이트 모드로 전환');
    });

    it('토글 후 aria-label이 변경된다', async () => {
      const user = userEvent.setup();
      renderWithTheme('light');

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', '다크 모드로 전환');

      await user.click(button);

      expect(button).toHaveAttribute('aria-label', '라이트 모드로 전환');
    });
  });
});
