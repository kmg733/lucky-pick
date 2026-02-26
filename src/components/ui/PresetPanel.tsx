'use client';

import { useState, useCallback } from 'react';
import type { GameType } from '@/types/index';
import type { PresetData } from '@/types/preset';
import { usePreset } from '@/hooks/usePreset';
import { MAX_PRESET_NAME_LENGTH } from '@/lib/presetStorage';
import { MESSAGES } from '@/lib/messages';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface PresetPanelProps<T extends PresetData> {
  gameType: GameType;
  getCurrentData: () => T;
  onLoad: (data: T) => void;
  disabled?: boolean;
}

interface DeleteTarget {
  id: string;
  name: string;
}

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}/${dd}`;
}

export default function PresetPanel<T extends PresetData>({
  gameType,
  getCurrentData,
  onLoad,
  disabled = false,
}: PresetPanelProps<T>) {
  const { presets, savePreset, loadPreset, deletePreset } = usePreset<T>(gameType);
  const [isSaving, setIsSaving] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [nameError, setNameError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const handleSaveClick = () => {
    setIsSaving(true);
    setNameInput('');
    setNameError('');
  };

  const handleCancelSave = () => {
    setIsSaving(false);
    setNameInput('');
    setNameError('');
  };

  const handleConfirmSave = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameError(MESSAGES.preset.errors.nameRequired);
      return;
    }
    const data = getCurrentData();
    savePreset(trimmed, data);
    setIsSaving(false);
    setNameInput('');
    setNameError('');
  };

  const handleLoad = (id: string) => {
    const data = loadPreset(id);
    if (data) {
      onLoad(data);
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteTarget({ id, name });
  };

  const handleDeleteConfirm = useCallback(() => {
    if (deleteTarget) {
      deletePreset(deleteTarget.id);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deletePreset]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleConfirmSave();
    } else if (e.key === 'Escape') {
      handleCancelSave();
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">{MESSAGES.preset.title}</h3>
        {!isSaving && (
          <button
            onClick={handleSaveClick}
            disabled={disabled}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {MESSAGES.preset.saveButton}
          </button>
        )}
      </div>

      {/* 이름 입력 폼 */}
      {isSaving && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs font-medium text-blue-700 mb-2">{MESSAGES.preset.nameInputLabel}</p>
          <input
            type="text"
            value={nameInput}
            maxLength={MAX_PRESET_NAME_LENGTH}
            onChange={(e) => {
              setNameInput(e.target.value);
              if (nameError) setNameError('');
            }}
            onKeyDown={handleKeyDown}
            placeholder={MESSAGES.preset.nameInputPlaceholder}
            autoFocus
            className="w-full px-2 py-1.5 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
          {nameError && (
            <p className="mt-1 text-xs text-red-500">{nameError}</p>
          )}
          <div className="mt-2 flex gap-2">
            <button
              onClick={handleConfirmSave}
              className="flex-1 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              {MESSAGES.common.save}
            </button>
            <button
              onClick={handleCancelSave}
              className="flex-1 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 rounded transition-colors"
            >
              {MESSAGES.common.cancel}
            </button>
          </div>
        </div>
      )}

      {/* 프리셋 목록 */}
      {presets.length > 0 ? (
        <div className="space-y-1.5">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{preset.name}</p>
                <p className="text-xs text-gray-400">{formatDate(preset.createdAt)}</p>
              </div>
              <button
                onClick={() => handleLoad(preset.id)}
                disabled={disabled}
                className="flex-shrink-0 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {MESSAGES.common.load}
              </button>
              <button
                onClick={() => handleDeleteClick(preset.id, preset.name)}
                disabled={disabled}
                className="flex-shrink-0 px-2 py-1 text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {MESSAGES.common.delete}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 text-center py-3">{MESSAGES.preset.emptyState}</p>
      )}

      {/* 삭제 확인 다이얼로그 */}
      {deleteTarget && (
        <ConfirmDialog
          open
          title={MESSAGES.confirmDialog.deleteTitle}
          message={MESSAGES.confirmDialog.deleteMessage(deleteTarget.name)}
          confirmLabel={MESSAGES.common.delete}
          cancelLabel={MESSAGES.common.cancel}
          variant="danger"
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </div>
  );
}
