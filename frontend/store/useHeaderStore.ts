import { create } from 'zustand';

interface HeaderState {
  title: string;
  subtitle: string;
  isSidebarOpen: boolean;
  setHeader: (title: string, subtitle: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
}

export const useHeaderStore = create<HeaderState>((set) => ({
  title: 'Tendagon',
  subtitle: '',
  isSidebarOpen: false,
  setHeader: (title, subtitle) => set({ title, subtitle }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
}));
