import { create } from 'zustand';
import { Production } from '@/features/projects/types';


interface ProductionState {
  productions: Production[];
  selectedProduction: Production | null;
  setProductions: (productions: Production[]) => void;
  setSelectedProduction: (production: Production | null) => void;
}

export const useProductionStore = create<ProductionState>((set) => ({
  productions: [],
  selectedProduction: null,
  setProductions: (productions) => set({ productions }),
  setSelectedProduction: (production) => {
    set({ selectedProduction: production });
    if (typeof window !== 'undefined') {
      if (production) {
        localStorage.setItem('selectedProductionId', production._id);
      } else {
        localStorage.removeItem('selectedProductionId');
      }
    }
  },
}));
