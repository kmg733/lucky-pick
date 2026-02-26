import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

// Dialog polyfill is installed globally in src/test/setup.ts

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    title: '삭제 확인',
    message: '정말 삭제하시겠습니까?',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Rendering ────────────────────────────────────────────

  describe('렌더링', () => {
    it('open=false일 때 다이얼로그 내용이 보이지 않는다', () => {
      render(<ConfirmDialog {...defaultProps} open={false} />);

      expect(screen.queryByText('삭제 확인')).not.toBeInTheDocument();
    });

    it('open=true일 때 다이얼로그가 표시된다', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByText('삭제 확인')).toBeInTheDocument();
      expect(screen.getByText('정말 삭제하시겠습니까?')).toBeInTheDocument();
    });

    it('title과 message를 렌더링한다', () => {
      render(
        <ConfirmDialog
          {...defaultProps}
          title="커스텀 제목"
          message="커스텀 메시지"
        />,
      );

      expect(screen.getByText('커스텀 제목')).toBeInTheDocument();
      expect(screen.getByText('커스텀 메시지')).toBeInTheDocument();
    });

    it('기본 confirmLabel은 "확인"이다', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument();
    });

    it('기본 cancelLabel은 "취소"이다', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument();
    });

    it('커스텀 confirmLabel을 렌더링한다', () => {
      render(<ConfirmDialog {...defaultProps} confirmLabel="삭제" />);

      expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument();
    });

    it('커스텀 cancelLabel을 렌더링한다', () => {
      render(<ConfirmDialog {...defaultProps} cancelLabel="돌아가기" />);

      expect(screen.getByRole('button', { name: '돌아가기' })).toBeInTheDocument();
    });
  });

  // ─── Interactions ─────────────────────────────────────────

  describe('상호작용', () => {
    it('확인 버튼 클릭 시 onConfirm이 호출된다', async () => {
      const user = userEvent.setup();
      render(<ConfirmDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: '확인' }));

      expect(defaultProps.onConfirm).toHaveBeenCalledOnce();
    });

    it('취소 버튼 클릭 시 onCancel이 호출된다', async () => {
      const user = userEvent.setup();
      render(<ConfirmDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: '취소' }));

      expect(defaultProps.onCancel).toHaveBeenCalledOnce();
    });

    it('Escape 키 입력 시 onCancel이 호출된다', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape' });

      expect(defaultProps.onCancel).toHaveBeenCalledOnce();
    });
  });

  // ─── Variants ─────────────────────────────────────────────

  describe('variant', () => {
    it('variant="danger"일 때 확인 버튼에 빨간색 스타일이 적용된다', () => {
      render(<ConfirmDialog {...defaultProps} variant="danger" />);

      const confirmButton = screen.getByRole('button', { name: '확인' });
      expect(confirmButton.className).toMatch(/bg-red/);
    });

    it('variant 미지정 시 확인 버튼에 파란색 스타일이 적용된다', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const confirmButton = screen.getByRole('button', { name: '확인' });
      expect(confirmButton.className).toMatch(/bg-blue/);
    });
  });

  // ─── Accessibility ────────────────────────────────────────

  describe('접근성', () => {
    it('dialog role을 가진다', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('aria-labelledby로 제목과 연결된다', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      const titleId = dialog.getAttribute('aria-labelledby');
      expect(titleId).toBeTruthy();

      const titleElement = document.getElementById(titleId!);
      expect(titleElement).toHaveTextContent('삭제 확인');
    });

    it('aria-describedby로 메시지와 연결된다', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      const descId = dialog.getAttribute('aria-describedby');
      expect(descId).toBeTruthy();

      const descElement = document.getElementById(descId!);
      expect(descElement).toHaveTextContent('정말 삭제하시겠습니까?');
    });

    // H-1: Cancel button receives focus when dialog opens (safe default)
    it('다이얼로그가 열리면 취소 버튼에 포커스가 이동한다', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: '취소' });
      expect(document.activeElement).toBe(cancelButton);
    });

    // M-2: dialog has data-confirm attribute for CSS scoping
    it('dialog 요소에 data-confirm 속성이 있다', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('data-confirm');
    });

    // L-2: No inline backdrop Tailwind classes (use globals.css only)
    it('dialog 요소에 인라인 backdrop Tailwind 클래스가 없다', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog.className).not.toMatch(/backdrop:/);
    });
  });
});
