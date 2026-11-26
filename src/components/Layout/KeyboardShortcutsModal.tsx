import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/dialog';

export interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  category: string;
}

const SHORTCUTS: ShortcutItem[] = [
  { category: 'GLOBAL', keys: ['Ctrl', 'K'], description: 'Open Search Command Palette' },
  { category: 'GLOBAL', keys: ['?'], description: 'Open Keyboard Shortcuts Help' },
  { category: 'GLOBAL', keys: ['Esc'], description: 'Close modal or active overlay' },
  { category: 'NAVIGATION', keys: ['1'], description: 'Jump to Home Hub' },
  { category: 'NAVIGATION', keys: ['2'], description: 'Jump to Archive Hub' },
  { category: 'NAVIGATION', keys: ['3'], description: 'Jump to Telemetry & Strategy Hub' },
  { category: 'NAVIGATION', keys: ['4'], description: 'Jump to 3D Lab Hub' },
  { category: 'NAVIGATION', keys: ['5'], description: 'Jump to SQL Historian Hub' },
  { category: 'VIEWPORTS', keys: ['2', '/', '3'], description: 'Toggle 2D Map vs 3D Track Elevation (Circuits)' },
  { category: 'VIEWPORTS', keys: ['Space'], description: 'Play / Pause Telemetry Replay (Telemetry)' },
  { category: 'DEVELOPER', keys: ['Shift', 'P'], description: 'Toggle Real-Time GPU & Memory Profiler' },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-xl p-6 bg-[#11151E] border border-white/10 rounded-md shadow-2xl"
        data-testid="keyboard-shortcuts-dialog"
      >
        <DialogTitle className="text-base font-mono font-bold uppercase tracking-wider text-white">
          KEYBOARD SHORTCUTS // F1 ARCHIVE
        </DialogTitle>
        <DialogDescription className="text-xs font-mono text-neutral-400">
          Global hotkeys and contextual controls across telemetry and 3D viewports.
        </DialogDescription>

        <div className="mt-4 max-h-[360px] overflow-y-auto space-y-4 pr-1 scrollbar-thin">
          {['GLOBAL', 'NAVIGATION', 'VIEWPORTS', 'DEVELOPER'].map((cat) => (
            <div key={cat}>
              <div className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 mb-2 border-b border-white/5 pb-1">
                // {cat}
              </div>
              <div className="space-y-2">
                {SHORTCUTS.filter((s) => s.category === cat).map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs py-1 px-1 rounded hover:bg-white/[0.02]"
                  >
                    <span className="text-neutral-300">{s.description}</span>
                    <div className="flex items-center gap-1 font-mono text-[11px]">
                      {s.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-1.5 py-0.5 rounded bg-white/5 border border-white/15 text-white shadow-sm"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-neutral-500">
          <span>Shortcuts disabled inside code editor &amp; inputs</span>
          <span>Press ESC to dismiss</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KeyboardShortcutsModal;
