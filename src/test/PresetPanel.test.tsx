import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import PresetPanel from '@/components/ui/PresetPanel';
import { savePreset } from '@/lib/presetStorage';
import { MESSAGES } from '@/lib/messages';
import type { NumberPresetData } from '@/types/preset';

// Dialog polyfill is installed globally in src/test/setup.ts

const testData: NumberPresetData = {
  minValue: 1,
  maxValue: 45,
  pickCount: 6,
  allowDuplicates: false,
  sortResults: true,
};

function renderPanel(overrides = {}) {
  const defaultProps = {
    gameType: 'number' as const,
    getCurrentData: () => testData,
    onLoad: vi.fn(),
    ...overrides,
  };

  return {
    ...render(<PresetPanel<NumberPresetData> {...defaultProps} />),
    props: defaultProps,
  };
}

describe('PresetPanel 삭제 확인 다이얼로그', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ─── ConfirmDialog Integration ────────────────────────────

  describe('삭제 버튼 클릭 시 ConfirmDialog 표시', () => {
    it('삭제 버튼 클릭 시 window.confirm 대신 ConfirmDialog가 표시된다', async () => {
      // Given: 프리셋이 하나 저장되어 있다
      savePreset<NumberPresetData>('number', 'Test Preset', testData);
      const user = userEvent.setup();

      renderPanel();

      // When: 삭제 버튼 클릭
      const deleteButton = screen.getByRole('button', { name: '삭제' });
      await user.click(deleteButton);

      // Then: ConfirmDialog가 표시된다
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(within(dialog).getByText(/Test Preset/)).toBeInTheDocument();
    });

    it('ConfirmDialog에 프리셋 이름이 포함된 메시지가 표시된다', async () => {
      savePreset<NumberPresetData>('number', 'My Config', testData);
      const user = userEvent.setup();

      renderPanel();

      const deleteButton = screen.getByRole('button', { name: '삭제' });
      await user.click(deleteButton);

      // 다이얼로그 메시지에 프리셋 이름이 포함
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText(/My Config/)).toBeInTheDocument();
    });
  });

  describe('ConfirmDialog 확인/취소 동작', () => {
    it('확인 버튼 클릭 시 프리셋이 삭제된다', async () => {
      savePreset<NumberPresetData>('number', 'Delete Me', testData);
      const user = userEvent.setup();

      renderPanel();

      // 프리셋이 표시된다
      expect(screen.getByText('Delete Me')).toBeInTheDocument();

      // 삭제 버튼 클릭 -> 다이얼로그 표시
      const deleteButton = screen.getByRole('button', { name: '삭제' });
      await user.click(deleteButton);

      // 다이얼로그의 확인 버튼 클릭
      const dialog = screen.getByRole('dialog');
      const confirmButton = within(dialog).getByRole('button', { name: '삭제' });
      await user.click(confirmButton);

      // 프리셋이 삭제된다
      expect(screen.queryByText('Delete Me')).not.toBeInTheDocument();
      // 다이얼로그가 닫힌다
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('취소 버튼 클릭 시 프리셋이 유지된다', async () => {
      savePreset<NumberPresetData>('number', 'Keep Me', testData);
      const user = userEvent.setup();

      renderPanel();

      // 삭제 버튼 클릭 -> 다이얼로그 표시
      const deleteButton = screen.getByRole('button', { name: '삭제' });
      await user.click(deleteButton);

      // 다이얼로그의 취소 버튼 클릭
      const dialog = screen.getByRole('dialog');
      const cancelButton = within(dialog).getByRole('button', { name: '취소' });
      await user.click(cancelButton);

      // 프리셋이 유지된다
      expect(screen.getByText('Keep Me')).toBeInTheDocument();
      // 다이얼로그가 닫힌다
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('Escape 키 입력 시 다이얼로그가 닫히고 프리셋이 유지된다', async () => {
      savePreset<NumberPresetData>('number', 'Stay Here', testData);
      const user = userEvent.setup();

      renderPanel();

      // 삭제 버튼 클릭
      const deleteButton = screen.getByRole('button', { name: '삭제' });
      await user.click(deleteButton);

      // Escape 키 입력
      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape' });

      // 프리셋이 유지된다
      expect(screen.getByText('Stay Here')).toBeInTheDocument();
      // 다이얼로그가 닫힌다
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('ConfirmDialog 스타일', () => {
    it('삭제 다이얼로그의 확인 버튼이 danger variant (빨간색) 스타일이다', async () => {
      savePreset<NumberPresetData>('number', 'Danger Style', testData);
      const user = userEvent.setup();

      renderPanel();

      const deleteButton = screen.getByRole('button', { name: '삭제' });
      await user.click(deleteButton);

      const dialog = screen.getByRole('dialog');
      const confirmButton = within(dialog).getByRole('button', { name: '삭제' });
      expect(confirmButton.className).toMatch(/bg-red/);
    });
  });

  describe('window.confirm 미사용 검증', () => {
    it('삭제 시 window.confirm이 호출되지 않는다', async () => {
      savePreset<NumberPresetData>('number', 'No Confirm', testData);
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const user = userEvent.setup();

      renderPanel();

      const deleteButton = screen.getByRole('button', { name: '삭제' });
      await user.click(deleteButton);

      expect(confirmSpy).not.toHaveBeenCalled();
      confirmSpy.mockRestore();
    });
  });

  // ─── M-1 / M-3: UI text from constants ────────────────────

  describe('UI 텍스트 상수 사용', () => {
    it('프리셋 제목이 MESSAGES.preset.title 값과 일치한다', () => {
      renderPanel();

      expect(screen.getByText(MESSAGES.preset.title)).toBeInTheDocument();
    });

    it('빈 상태 메시지가 MESSAGES.preset.emptyState 값과 일치한다', () => {
      renderPanel();

      expect(screen.getByText(MESSAGES.preset.emptyState)).toBeInTheDocument();
    });

    it('저장 시 빈 이름 에러가 MESSAGES.preset.errors.nameRequired 값과 일치한다', async () => {
      const user = userEvent.setup();
      renderPanel();

      // 저장 모드 활성화
      await user.click(screen.getByText(MESSAGES.preset.saveButton));
      // 빈 이름으로 저장 시도
      await user.click(screen.getByRole('button', { name: MESSAGES.common.save }));

      expect(screen.getByText(MESSAGES.preset.errors.nameRequired)).toBeInTheDocument();
    });

    it('삭제 다이얼로그 제목이 MESSAGES.confirmDialog.deleteTitle 값과 일치한다', async () => {
      savePreset<NumberPresetData>('number', 'Const Check', testData);
      const user = userEvent.setup();
      renderPanel();

      const deleteButton = screen.getByRole('button', { name: MESSAGES.common.delete });
      await user.click(deleteButton);

      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText(MESSAGES.confirmDialog.deleteTitle)).toBeInTheDocument();
    });
  });

  // ─── L-4: Conditional rendering of ConfirmDialog ───────────

  describe('조건부 렌더링', () => {
    it('deleteTarget이 없을 때 ConfirmDialog가 DOM에 존재하지 않는다', () => {
      renderPanel();

      // 삭제 버튼을 클릭하지 않은 상태에서는 dialog가 없어야 한다
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('삭제 버튼 클릭 후 ConfirmDialog가 DOM에 존재한다', async () => {
      savePreset<NumberPresetData>('number', 'Render Check', testData);
      const user = userEvent.setup();
      renderPanel();

      const deleteButton = screen.getByRole('button', { name: MESSAGES.common.delete });
      await user.click(deleteButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
