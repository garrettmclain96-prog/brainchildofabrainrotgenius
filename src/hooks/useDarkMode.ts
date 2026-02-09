import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DarkModeStore {
  isDark: boolean;
  toggle: () => void;
  setDark: (dark: boolean) => void;
}

function applyDarkClass(isDark: boolean) {
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export const useDarkMode = create<DarkModeStore>()(
  persist(
    (set, get) => ({
      isDark: false,

      toggle: () => {
        const next = !get().isDark;
        applyDarkClass(next);
        set({ isDark: next });
      },

      setDark: (dark: boolean) => {
        applyDarkClass(dark);
        set({ isDark: dark });
      },
    }),
    {
      name: 'brainchild-dark-mode',
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyDarkClass(state.isDark);
        }
      },
    }
  )
);
