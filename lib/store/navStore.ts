import { create } from 'zustand';

export type AppRoute = 'landing' | 'sessions' | 'report';

interface NavState {
  route: AppRoute;
  /** True once the initial IndexedDB session check has completed. */
  bootstrapped: boolean;
  setRoute: (route: AppRoute) => void;
  setBootstrapped: (value: boolean) => void;
}

export const useNavStore = create<NavState>((set) => ({
  route: 'landing',
  bootstrapped: false,
  setRoute: (route) => set({ route }),
  setBootstrapped: (bootstrapped) => set({ bootstrapped }),
}));
