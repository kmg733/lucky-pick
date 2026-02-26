/**
 * UI text constants.
 *
 * All user-facing strings are centralised here so they can be
 * swapped for a full i18n solution later without a scattered diff.
 */

export const MESSAGES = {
  // ── Common ────────────────────────────────────────────────
  common: {
    confirm: '확인',
    cancel: '취소',
    save: '저장',
    delete: '삭제',
    load: '불러오기',
  },

  // ── PresetPanel ───────────────────────────────────────────
  preset: {
    title: '저장된 설정',
    saveButton: '+ 현재 설정 저장',
    nameInputLabel: '설정 이름 입력',
    nameInputPlaceholder: '예: 로또 기본 설정',
    emptyState: '저장된 설정이 없습니다',
    errors: {
      nameRequired: '설정 이름을 입력해주세요.',
    },
  },

  // ── ConfirmDialog ─────────────────────────────────────────
  confirmDialog: {
    deleteTitle: '설정 삭제',
    deleteMessage: (name: string) => `"${name}" 설정을 삭제하시겠습니까?`,
  },
} as const;
