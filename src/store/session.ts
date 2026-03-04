import { create } from "zustand";

interface SessionState {
  key: CryptoKey | null;
  setKey: (key: CryptoKey) => void;
  clearKey: () => void;
  isUnlocked: () => boolean;
  /** Last selected income source in add expected income modal (in-memory only). */
  lastUsedIncomeSourceId: string | null;
  /** Last selected expense destination in add expected expense modal (in-memory only). */
  lastUsedExpenseDestinationId: string | null;
  setLastUsedIncomeSourceId: (id: string | null) => void;
  setLastUsedExpenseDestinationId: (id: string | null) => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  key: null,
  setKey: (key) => set({ key }),
  clearKey: () => set({ key: null }),
  isUnlocked: () => get().key != null,
  lastUsedIncomeSourceId: null,
  lastUsedExpenseDestinationId: null,
  setLastUsedIncomeSourceId: (id) => set({ lastUsedIncomeSourceId: id }),
  setLastUsedExpenseDestinationId: (id) =>
    set({ lastUsedExpenseDestinationId: id }),
}));
