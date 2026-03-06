/**
 * Budget persistence module: orchestration and storage adapters for saving
 * budget data to session storage, local storage, and the sync API (Vercel Blob).
 *
 * Design: pure orchestration + swappable adapters for testability.
 */

export {
  persistToStoresInOrder,
  preparePersistPayloads,
  serializeAndPreparePayloads,
  createDefaultPersistenceAdapters,
  type PersistPayloads,
  type PersistenceAdapters,
} from "./persist";
export {
  serializeBudgetForPersistence,
  type SerializableBudgetState,
} from "./serialize";
