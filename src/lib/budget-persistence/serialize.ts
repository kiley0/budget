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
