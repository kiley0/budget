import { create } from "zustand";

interface SessionState {
  key: CryptoKey | null;
  setKey: (key: CryptoKey) => void;
  clearKey: () => void;
  isUnlocked: () => boolean;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  key: null,
  setKey: (key) => set({ key }),
  clearKey: () => set({ key: null }),
  isUnlocked: () => get().key != null,
}));
