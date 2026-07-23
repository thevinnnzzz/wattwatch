// App store for global UI state
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  // Sidebar/drawer
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Modals
  modals: Record<string, boolean>;
  openModal: (id: string) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;

  // Toasts
  toasts: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
  }>;
  showToast: (toast: Omit<AppState['toasts'][0], 'id'>) => void;
  hideToast: (id: string) => void;

  // Theme
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  // Loading states
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;

  // Network status
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),

      modals: {},
      openModal: (id) => set({ modals: { ...get().modals, [id]: true } }),
      closeModal: (id) => {
        const modals = { ...get().modals };
        delete modals[id];
        set({ modals });
      },
      closeAllModals: () => set({ modals: {} }),

      toasts: [],
      showToast: (toast) => {
        const id = Math.random().toString(36).substring(7);
        const newToast = { ...toast, id };
        set({ toasts: [...get().toasts, newToast] });

        // Auto-hide
        setTimeout(() => {
          get().hideToast(id);
        }, toast.duration || 4000);
      },
      hideToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),

      theme: 'system',
      setTheme: (theme) => set({ theme }),

      globalLoading: false,
      setGlobalLoading: (loading) => set({ globalLoading: loading }),

      isOnline: true,
      setIsOnline: (online) => set({ isOnline: online }),
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);