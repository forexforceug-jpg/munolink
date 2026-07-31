import { create } from 'zustand';
import { Opportunity } from '../services/feed.service';

interface FeedState {
  opportunities: Opportunity[];
  currentIndex: number;
  isLoading: boolean;
  error: string | null;
  filters: {
    categoryId?: string;
    maxPrice?: number;
    search?: string;
  };
  
  // Actions
  setOpportunities: (opportunities: Opportunity[]) => void;
  setCurrentIndex: (index: number) => void;
  nextOpportunity: () => void;
  previousOpportunity: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: FeedState['filters']) => void;
  reset: () => void;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  opportunities: [],
  currentIndex: 0,
  isLoading: false,
  error: null,
  filters: {},
  
  setOpportunities: (opportunities) => set({ opportunities, currentIndex: 0 }),
  
  setCurrentIndex: (index) => set({ currentIndex: index }),
  
  nextOpportunity: () => {
    const { currentIndex, opportunities } = get();
    if (currentIndex < opportunities.length - 1) {
      set({ currentIndex: currentIndex + 1 });
    }
  },
  
  previousOpportunity: () => {
    const { currentIndex } = get();
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1 });
    }
  },
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  setFilters: (filters) => set({ filters }),
  
  reset: () => set({
    opportunities: [],
    currentIndex: 0,
    isLoading: false,
    error: null,
    filters: {},
  }),
}));