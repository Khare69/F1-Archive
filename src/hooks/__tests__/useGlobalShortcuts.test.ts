import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGlobalShortcuts, isEditableTarget } from '../useGlobalShortcuts';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('useGlobalShortcuts hook (C-21)', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    document.body.innerHTML = '';
  });

  describe('isEditableTarget', () => {
    it('returns true for inputs, textareas, selects, and contenteditable', () => {
      const input = document.createElement('input');
      const textarea = document.createElement('textarea');
      const select = document.createElement('select');
      const editableDiv = document.createElement('div');
      editableDiv.setAttribute('contenteditable', 'true');

      expect(isEditableTarget(input)).toBe(true);
      expect(isEditableTarget(textarea)).toBe(true);
      expect(isEditableTarget(select)).toBe(true);
      expect(isEditableTarget(editableDiv)).toBe(true);
    });

    it('returns true for elements inside CodeMirror 6 editors', () => {
      const cmEditor = document.createElement('div');
      cmEditor.className = 'cm-editor';
      const cmContent = document.createElement('div');
      cmContent.className = 'cm-content';
      const cmSpan = document.createElement('span');
      cmContent.appendChild(cmSpan);
      cmEditor.appendChild(cmContent);

      expect(isEditableTarget(cmContent)).toBe(true);
      expect(isEditableTarget(cmSpan)).toBe(true);
    });

    it('returns false for normal buttons, divs, and document.body', () => {
      const div = document.createElement('div');
      const btn = document.createElement('button');

      expect(isEditableTarget(div)).toBe(false);
      expect(isEditableTarget(btn)).toBe(false);
      expect(isEditableTarget(document.body)).toBe(false);
      expect(isEditableTarget(null)).toBe(false);
    });
  });

  describe('Global keyboard shortcuts', () => {
    it('calls onToggleSearch when Ctrl+K or Cmd+K is pressed', () => {
      const onToggleSearch = vi.fn();
      const onOpenShortcuts = vi.fn();

      renderHook(() =>
        useGlobalShortcuts({ onToggleSearch, onOpenShortcuts })
      );

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      expect(onToggleSearch).toHaveBeenCalledTimes(1);
      expect(onOpenShortcuts).not.toHaveBeenCalled();
    });

    it('calls onOpenShortcuts when "?" is pressed on non-editable target', () => {
      const onToggleSearch = vi.fn();
      const onOpenShortcuts = vi.fn();

      renderHook(() =>
        useGlobalShortcuts({ onToggleSearch, onOpenShortcuts })
      );

      const event = new KeyboardEvent('keydown', {
        key: '?',
        bubbles: true,
      });
      document.body.dispatchEvent(event);

      expect(onOpenShortcuts).toHaveBeenCalledTimes(1);
    });

    it('ignores "?" and number keys when focus is inside an input', () => {
      const onToggleSearch = vi.fn();
      const onOpenShortcuts = vi.fn();

      renderHook(() =>
        useGlobalShortcuts({ onToggleSearch, onOpenShortcuts })
      );

      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      const questionEvent = new KeyboardEvent('keydown', {
        key: '?',
        bubbles: true,
      });
      input.dispatchEvent(questionEvent);

      expect(onOpenShortcuts).not.toHaveBeenCalled();

      const numEvent = new KeyboardEvent('keydown', {
        key: '2',
        bubbles: true,
      });
      input.dispatchEvent(numEvent);

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('navigates to hubs on number keys 1-5 when no modal is open', () => {
      const onToggleSearch = vi.fn();
      const onOpenShortcuts = vi.fn();

      renderHook(() =>
        useGlobalShortcuts({
          onToggleSearch,
          onOpenShortcuts,
          isModalOpen: false,
        })
      );

      const key3Event = new KeyboardEvent('keydown', {
        key: '3',
        bubbles: true,
      });
      document.body.dispatchEvent(key3Event);

      expect(mockNavigate).toHaveBeenCalledWith('/telemetry');
    });

    it('does NOT navigate on number keys when a modal is open', () => {
      const onToggleSearch = vi.fn();
      const onOpenShortcuts = vi.fn();

      renderHook(() =>
        useGlobalShortcuts({
          onToggleSearch,
          onOpenShortcuts,
          isModalOpen: true,
        })
      );

      const key2Event = new KeyboardEvent('keydown', {
        key: '2',
        bubbles: true,
      });
      document.body.dispatchEvent(key2Event);

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
