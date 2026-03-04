/**
 * Pure serialization for budget persistence. No side effects.
 */

/** Minimal shape required for serialization. BudgetState extends this. */
export interface SerializableBudgetState {
  budgetId: string;
  updatedAt: string;
  [key: string]: unknown;
}

/**
 * Serialize budget state for persistence with a fresh updatedAt timestamp.
 * Pure function; safe to unit test.
 */
export function serializeBudgetForPersistence(
  state: SerializableBudgetState,
): string {
  const toSave = {
    ...state,
    updatedAt: new Date().toISOString(),
  };
  return JSON.stringify(toSave);
}

/**
 * Content fingerprint for change detection: state without updatedAt, keys sorted for determinism.
 * Used to skip sync when the budget content hasn't changed.
 */
export function getContentFingerprint(state: SerializableBudgetState): string {
  const rest = { ...(state as Record<string, unknown>) };
  delete rest.updatedAt;
  const sorted = Object.keys(rest)
    .sort()
    .reduce(
      (acc, k) => {
        acc[k] = rest[k];
        return acc;
      },
      {} as Record<string, unknown>,
    );
  return JSON.stringify(sorted);
}
