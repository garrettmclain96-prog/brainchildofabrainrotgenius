import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppMode } from '@/types/thought';

interface AppModeStore {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
}

export const useAppMode = create<AppModeStore>()(
  persist(
    (set, get) => ({
      mode: 'prune',
      
      setMode: (mode) => {
        set({ mode });
        // Apply CSS class to document
        document.documentElement.classList.remove('mode-prune', 'mode-rot');
        document.documentElement.classList.add(`mode-${mode}`);
      },
      
      toggleMode: () => {
        const newMode = get().mode === 'prune' ? 'rot' : 'prune';
        get().setMode(newMode);
      },
    }),
    {
      name: 'brainchild-mode',
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Apply mode class on rehydration
          document.documentElement.classList.remove('mode-prune', 'mode-rot');
          document.documentElement.classList.add(`mode-${state.mode}`);
        }
      },
    }
  )
);
