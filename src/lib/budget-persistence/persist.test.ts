/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import {
  persistToStoresInOrder,
  preparePersistPayloads,
  type PersistPayloads,
} from "./persist";
import { deriveKeyWithSalt } from "@/lib/crypto";

const SALT = new Uint8Array(16);
SALT.fill(1);

async function getTestKey() {
  return deriveKeyWithSalt("test-passphrase", SALT);
}

describe("persistToStoresInOrder", () => {
  it("calls adapters in order: session → local → sync", async () => {
    const callOrder: string[] = [];
    const adapters = {
      writeSession: vi.fn().mockImplementation(async () => {
        callOrder.push("session");
      }),
      writeLocal: vi.fn().mockImplementation(() => {
        callOrder.push("local");
      }),
      writeSync: vi.fn().mockImplementation(async () => {
        callOrder.push("sync");
      }),
    } as import("./persist").PersistenceAdapters;

    const payloads: PersistPayloads = {
      decrypted: '{"budgetId":"x"}',
      encrypted: "encrypted",
      syncPayload: "sync",
      updatedAt: "2025-01-01T00:00:00Z",
    };
    const key = await getTestKey();

    await persistToStoresInOrder("budget-1", payloads, adapters, key);

    expect(callOrder).toEqual(["session", "local", "sync"]);
    expect(adapters.writeSession).toHaveBeenCalledWith(
      "budget-1",
      '{"budgetId":"x"}',
      key,
    );
    expect(adapters.writeLocal).toHaveBeenCalledWith("budget-1", "encrypted");
    expect(adapters.writeSync).toHaveBeenCalledWith(
      "budget-1",
      "sync",
      "2025-01-01T00:00:00Z",
    );
  });

  it("skips sync when skipSync is true", async () => {
    const adapters = {
      writeSession: vi.fn().mockResolvedValue(undefined),
      writeLocal: vi.fn(),
      writeSync: vi.fn().mockResolvedValue(undefined),
    } as import("./persist").PersistenceAdapters;

    const payloads: PersistPayloads = {
      decrypted: "{}",
      encrypted: "x",
      syncPayload: "y",
      updatedAt: "",
    };
    const key = await getTestKey();

    await persistToStoresInOrder("id", payloads, adapters, key, {
      skipSync: true,
    });

    expect(adapters.writeSession).toHaveBeenCalled();
    expect(adapters.writeLocal).toHaveBeenCalled();
    expect(adapters.writeSync).not.toHaveBeenCalled();
  });

  it("awaits session before local, and local before sync", async () => {
    let sessionDone = false;
    let localDone = false;
    const adapters = {
      writeSession: vi.fn().mockImplementation(async () => {
        await new Promise((r) => setTimeout(r, 10));
        sessionDone = true;
      }),
      writeLocal: vi.fn().mockImplementation(() => {
        expect(sessionDone).toBe(true);
        localDone = true;
      }),
      writeSync: vi.fn().mockImplementation(async () => {
        expect(localDone).toBe(true);
      }),
    } as import("./persist").PersistenceAdapters;

    const payloads: PersistPayloads = {
      decrypted: "{}",
      encrypted: "x",
      syncPayload: "y",
      updatedAt: "",
    };
    const key = await getTestKey();

    await persistToStoresInOrder("id", payloads, adapters, key);
  });
});

describe("preparePersistPayloads", () => {
  it("returns decrypted, encrypted, syncPayload, and updatedAt", async () => {
    const plaintext = JSON.stringify({
      budgetId: "test",
      updatedAt: new Date().toISOString(),
    });
    const key = await getTestKey();

    const result = await preparePersistPayloads(plaintext, key);

    expect(result.decrypted).toBe(plaintext);
    expect(result.encrypted).toBeTruthy();
    expect(typeof result.encrypted).toBe("string");
    expect(result.syncPayload).toBeTruthy();
    expect(result.syncPayload).not.toBe(result.encrypted);
    expect(result.updatedAt).toBeDefined();
    expect(typeof result.updatedAt).toBe("string");
  });

  it("encrypted can be decrypted with same key", async () => {
    const { decrypt } = await import("@/lib/crypto");
    const plaintext = '{"budgetId":"x","incomeEvents":[]}';
    const key = await getTestKey();

    const result = await preparePersistPayloads(plaintext, key);
    const decrypted = await decrypt(result.encrypted, key);
    expect(decrypted).toBe(plaintext);
  });
});
