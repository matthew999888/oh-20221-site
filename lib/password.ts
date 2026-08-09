/* =====================================================================
   Password hashing
   ---------------------------------------------------------------------
   Two formats are supported, on purpose:

   1. PBKDF2-HMAC-SHA256 (current)  "pbkdf2$sha256$<iters>$<salt>$<hash>"
   2. bcrypt (legacy)               "$2a$..." / "$2b$..." / "$2y$..."

   Why the change: the app targets Cloudflare Workers, where CPU time per
   request is metered. `bcryptjs` is a pure-JavaScript bcrypt — roughly an
   order of magnitude slower than a native build — and a cost-12 hash can
   burn over a second of CPU. PBKDF2 through WebCrypto runs as a native
   primitive in both Node and Workers, so it costs a fraction of that at
   an equivalent (OWASP-recommended) work factor.

   Existing accounts are NOT invalidated. `verifyPassword` still accepts
   bcrypt hashes, and `needsRehash` reports when a stored hash should be
   upgraded — the sign-in path re-hashes transparently on the next
   successful login. bcryptjs stays in package.json purely to verify those
   legacy hashes and can be dropped once none remain (see the query in
   README, "Retiring bcrypt").
===================================================================== */

import bcrypt from "bcryptjs";

/** OWASP's 2023+ floor for PBKDF2-HMAC-SHA256. Raise, never lower. */
const ITERATIONS = 600_000;
const SALT_BYTES = 16;
const KEY_BITS = 256;
const PREFIX = "pbkdf2$sha256";

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function deriveBits(
  password: string,
  salt: Uint8Array,
  iterations: number
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    // Copied into a fresh view so the type is ArrayBuffer-backed:
    // `getRandomValues` returns a SharedArrayBuffer-compatible type that
    // WebCrypto's BufferSource signature rejects under strict TS.
    { name: "PBKDF2", hash: "SHA-256", salt: new Uint8Array(salt), iterations },
    key,
    KEY_BITS
  );
  return new Uint8Array(bits);
}

/**
 * Constant-time comparison.
 *
 * A plain `===` on the derived hashes leaks, through timing, how many
 * leading bytes matched — enough to reconstruct a hash byte by byte.
 * This always walks the full length and accumulates differences.
 * (`crypto.timingSafeEqual` is Node-only and unavailable on Workers.)
 */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function isBcryptHash(stored: string): boolean {
  return /^\$2[aby]?\$/.test(stored);
}

/** Hash a plaintext password for storage. Always produces PBKDF2. */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await deriveBits(password, salt, ITERATIONS);
  return `${PREFIX}$${ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

/**
 * Verify a plaintext password against a stored hash of either format.
 * Never throws on a malformed hash — a corrupt row must read as "wrong
 * password", not as a 500 that reveals the row exists.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored) return false;

  if (isBcryptHash(stored)) {
    try {
      return await bcrypt.compare(password, stored);
    } catch {
      return false;
    }
  }

  const parts = stored.split("$");
  // Expected: ["pbkdf2", "sha256", iterations, salt, hash]
  if (parts.length !== 5 || parts[0] !== "pbkdf2" || parts[1] !== "sha256") return false;

  const iterations = Number.parseInt(parts[2], 10);
  if (!Number.isInteger(iterations) || iterations <= 0) return false;

  try {
    const salt = fromBase64(parts[3]);
    const expected = fromBase64(parts[4]);
    const actual = await deriveBits(password, salt, iterations);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/**
 * True when a stored hash should be replaced after a successful sign-in:
 * either it is a legacy bcrypt hash, or it uses fewer iterations than we
 * now require. Callers should re-hash and update the row.
 */
export function needsRehash(stored: string): boolean {
  if (!stored) return false;
  if (isBcryptHash(stored)) return true;

  const parts = stored.split("$");
  if (parts.length !== 5) return true;

  const iterations = Number.parseInt(parts[2], 10);
  return !Number.isInteger(iterations) || iterations < ITERATIONS;
}
