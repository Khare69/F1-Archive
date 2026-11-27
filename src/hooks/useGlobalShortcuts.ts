import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExperienceMode } from '../contexts/ExperienceModeContext';

export interface UseGlobalShortcutsOptions {
  onToggleSearch: () => void;
  onOpenShortcuts: () => void;
  isModalOpen?: boolean;
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toUpperCase();
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName)) return true;
  if (target.isContentEditable) return true;
  if (target.closest('input, textarea, select, [contenteditable="true"], .cm-content, .cm-editor')) {
    return true;
  }
  return false;
}

export function useGlobalShortcuts({
  onToggleSearch,
  onOpenShortcuts,
  isModalOpen = false,
}: UseGlobalShortcutsOptions): void {
  const navigate = useNavigate();
  const { mode, setMode } = useExperienceMode();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Ctrl+K or Cmd+K always toggles Search Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onToggleSearch();
        return;
      }

      // Check if typing inside form field or CodeMirror editor
      if (isEditableTarget(e.target)) {
        return;
      }

      // 2. '?' opens keyboard shortcuts modal (Shift + / is often ?)
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        onOpenShortcuts();
        return;
      }

      // 3. Shift+D toggles Developer Depth Mode
      if (e.shiftKey && e.key.toUpperCase() === 'D' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setMode(mode === 'developer' ? 'enthusiast' : 'developer');
        return;
      }

      // 4. Navigation hotkeys 1-5 when no modal is open and no modifiers held
      if (!isModalOpen && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        // On circuits routes, 2 and 3 are reserved for 2D/3D track view toggles (C-28, C-29)
        const isCircuitsRoute = window.location.pathname.startsWith('/circuits');

        switch (e.key) {
          case '1':
            e.preventDefault();
            navigate('/');
            break;
          case '2':
            if (isCircuitsRoute) break;
            e.preventDefault();
            navigate('/seasons');
            break;
          case '3':
            if (isCircuitsRoute) break;
            e.preventDefault();
            navigate('/telemetry');
            break;
          case '4':
            e.preventDefault();
            navigate('/lab');
            break;
          case '5':
            e.preventDefault();
            navigate('/historian');
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, onToggleSearch, onOpenShortcuts, isModalOpen, mode, setMode]);
}

export default useGlobalShortcuts;
