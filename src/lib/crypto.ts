import {
  SESSION_KEY_STORAGE_KEY,
  SESSION_DECRYPTED_KEY_PREFIX,
  getStoredBudgetIds,
} from "./constants";

const SALT_KEY = "budget_salt";
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const PBKDF2_ITERATIONS = 100_000;
const KEY_LENGTH = 256;

function getSalt(): Uint8Array {
  if (typeof window === "undefined") return new Uint8Array(SALT_LENGTH);
  const raw = localStorage.getItem(SALT_KEY);
  if (raw) {
    const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
    if (bytes.length === SALT_LENGTH) return bytes;
  }
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  localStorage.setItem(SALT_KEY, btoa(String.fromCharCode(...salt)));
  return salt;
}

export async function deriveKey(passphrase: string): Promise<CryptoKey> {
  const salt = getSalt();
  return deriveKeyWithSalt(passphrase, salt);
}

/** Derive encryption key from passphrase and explicit salt. Used for portable sync payloads. */
export async function deriveKeyWithSalt(
  passphrase: string,
  salt: Uint8Array | ArrayBuffer,
): Promise<CryptoKey> {
  const saltBytes = salt instanceof ArrayBuffer ? new Uint8Array(salt) : salt;
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: KEY_LENGTH },
    true,
    ["encrypt", "decrypt"],
  );
}

export async function encrypt(
  plaintext: string,
  key: CryptoKey,
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    key,
    encoded,
  );
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

export async function decrypt(
  payload: string,
  key: CryptoKey,
): Promise<string> {
  const combined = Uint8Array.from(atob(payload), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, IV_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    key,
    ciphertext,
  );
  return new TextDecoder().decode(decrypted);
}

export function hasStoredSalt(): boolean {
  if (typeof window === "undefined") return false;
  const raw = localStorage.getItem(SALT_KEY);
  return raw != null && raw.length > 0;
}

/** Persist salt to localStorage. Use after decrypting portable payload on a new device. */
export function setStoredSalt(salt: Uint8Array): void {
  if (typeof window === "undefined") return;
  if (salt.length !== SALT_LENGTH) return;
  localStorage.setItem(SALT_KEY, btoa(String.fromCharCode(...salt)));
}

/** Removes stored salt so the next deriveKey() will create a new one. Use when user chooses to create a new budget. */
export function clearStoredSalt(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SALT_KEY);
}

const PORTABLE_PREFIX_LEN = SALT_LENGTH;

/**
 * Portable format for sync: base64(salt (16) + iv (12) + ciphertext).
 * Allows decrypting on any device with just the passphrase.
 */
export function prepareSyncPayload(encryptedBase64: string): string {
  if (typeof window === "undefined") return encryptedBase64;
  const salt = getSalt();
  const encryptedRaw = Uint8Array.from(atob(encryptedBase64), (c) =>
    c.charCodeAt(0),
  );
  const combined = new Uint8Array(salt.length + encryptedRaw.length);
  combined.set(salt, 0);
  combined.set(encryptedRaw, salt.length);
  return btoa(String.fromCharCode(...combined));
}

/**
 * If payload is portable format (salt+iv+ct), returns base64 of (iv+ct).
 * Otherwise returns payload as-is for legacy format.
 */
export function stripSaltForDecrypt(payload: string): string {
  const combined = Uint8Array.from(atob(payload), (c) => c.charCodeAt(0));
  if (combined.length >= PORTABLE_PREFIX_LEN + IV_LENGTH) {
    const withoutSalt = combined.slice(PORTABLE_PREFIX_LEN);
    return btoa(String.fromCharCode(...withoutSalt));
  }
  return payload;
}

/**
 * Decrypt portable sync payload with passphrase.
 * Returns plaintext and the derived key (for setting session).
 */
export async function decryptSyncPayloadWithPassphrase(
  portablePayload: string,
  passphrase: string,
): Promise<{ plaintext: string; key: CryptoKey }> {
  const combined = Uint8Array.from(atob(portablePayload), (c) =>
    c.charCodeAt(0),
  );
  if (combined.length < PORTABLE_PREFIX_LEN + IV_LENGTH) {
    throw new Error("Invalid portable format");
  }
  const salt = combined.slice(0, PORTABLE_PREFIX_LEN);
  const ivAndCt = combined.slice(PORTABLE_PREFIX_LEN);
  const key = await deriveKeyWithSalt(passphrase, salt);
  const iv = ivAndCt.slice(0, IV_LENGTH);
  const ciphertext = ivAndCt.slice(IV_LENGTH);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    key,
    ciphertext,
  );
  const plaintext = new TextDecoder().decode(decrypted);
  if (typeof window !== "undefined") setStoredSalt(salt);
  return { plaintext, key };
}

/** Returns true if payload appears to be portable format (salt+iv+ct). */
export function isPortableFormat(payload: string): boolean {
  const combined = Uint8Array.from(atob(payload), (c) => c.charCodeAt(0));
  return combined.length >= PORTABLE_PREFIX_LEN + IV_LENGTH;
}

/** Export key to sessionStorage so it persists across page reloads within the same tab. */
export async function persistKeyToSession(key: CryptoKey): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const raw = await crypto.subtle.exportKey("raw", key);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(raw)));
    sessionStorage.setItem(SESSION_KEY_STORAGE_KEY, base64);
  } catch {
    // Ignore export failures
  }
}

/** Import key from sessionStorage. Returns null if not present or import fails. */
export async function importKeyFromSession(): Promise<CryptoKey | null> {
  if (typeof window === "undefined") return null;
  try {
    const base64 = sessionStorage.getItem(SESSION_KEY_STORAGE_KEY);
    if (!base64) return null;
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    return crypto.subtle.importKey(
      "raw",
      bytes,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );
  } catch {
    return null;
  }
}

/** Clear the session key from sessionStorage. Call when user locks/logs out. */
export function clearSessionKey(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEY_STORAGE_KEY);
}

/** Clear all session budget data (key + decrypted). Call when user logs out. */
export function clearAllSessionBudgetData(): void {
  if (typeof window === "undefined") return;
  clearSessionKey();
  const ids = getStoredBudgetIds();
  for (const id of ids) {
    sessionStorage.removeItem(`${SESSION_DECRYPTED_KEY_PREFIX}${id}`);
  }
}

/** Returns true if passphrase is correct for the given budget (or no data exists yet). If budgetId is omitted, uses current budget id from localStorage. */
export async function verifyPassphrase(
  passphrase: string,
  budgetId?: string,
): Promise<boolean> {
  try {
    const key = await deriveKey(passphrase);
    if (typeof window === "undefined") return true;
    const { BUDGET_ID_STORAGE_KEY, ENCRYPTED_STORAGE_KEY_PREFIX } =
      await import("@/lib/constants");
    const id = budgetId ?? localStorage.getItem(BUDGET_ID_STORAGE_KEY);
    const storageKey = id ? `${ENCRYPTED_STORAGE_KEY_PREFIX}${id}` : null;
    const raw = storageKey ? localStorage.getItem(storageKey) : null;
    if (!raw) return true;
    await decrypt(raw, key);
    return true;
  } catch {
    return false;
  }
}
