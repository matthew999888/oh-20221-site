/**
 * Connection string doctor.
 *
 *   node scripts/check-db.mjs
 *
 * Reads DATABASE_URL / DIRECT_URL from .env, shows exactly how each one
 * PARSES (username, host, port — never the password), flags the mistakes
 * that actually happen with Supabase, and then tries to connect.
 *
 * Safe to paste the output anywhere: the password is never printed, only
 * its length and character classes.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const env = {};
  let raw;
  try {
    raw = readFileSync(path.join(root, ".env"), "utf8");
  } catch {
    console.error("No .env file found at", path.join(root, ".env"));
    process.exit(1);
  }
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    env[m[1]] = v;
  }
  return env;
}

const RISKY = ["@", ":", "/", "?", "#", "&", "+", "%", " "];

function describe(name, value) {
  console.log(`\n${"=".repeat(60)}\n${name}\n${"=".repeat(60)}`);

  if (!value) {
    console.log("  ✗ NOT SET");
    return null;
  }
  if (value.includes("[YOUR-DB-PASSWORD]") || value.includes("[YOUR-PASSWORD]")) {
    console.log("  ✗ Still contains the placeholder — replace it with the real password.");
    return null;
  }

  let u;
  try {
    u = new URL(value);
  } catch (err) {
    console.log("  ✗ Not a parseable URL:", err.message);
    console.log("    An unencoded special character in the password will do this.");
    return null;
  }

  const user = decodeURIComponent(u.username);
  const pass = decodeURIComponent(u.password);

  console.log(`  username : ${user}`);
  console.log(`  host     : ${u.hostname}`);
  console.log(`  port     : ${u.port}`);
  console.log(`  database : ${u.pathname.replace(/^\//, "")}`);
  console.log(`  password : ${pass.length} chars`);

  const risky = RISKY.filter((c) => pass.includes(c));
  if (risky.length) {
    console.log(`             ⚠ contains ${risky.map((c) => `"${c}"`).join(" ")} — must be percent-encoded`);
  }

  // The mistake that has actually been happening.
  const isPooler = u.hostname.includes("pooler.supabase.com");
  if (isPooler && !user.includes(".")) {
    console.log("\n  ✗ WRONG USERNAME FOR THE POOLER");
    console.log(`      you have : ${user}`);
    console.log(`      needs    : ${user}.<project-ref>   e.g. ${user}.ebdoiwwfvudeawcfncmd`);
    console.log("      The pooler uses the suffix to route to your project.");
    console.log("      A username without it fails auth no matter the password.");
  } else if (isPooler) {
    console.log("  ✓ username has a project-ref suffix (correct for the pooler)");
  }

  if (!isPooler && u.hostname.startsWith("db.")) {
    console.log("\n  ⚠ This is the DIRECT host, which is IPv6-only on newer projects");
    console.log("    and usually unreachable from home/school networks.");
    console.log("    Prefer the pooler host with a  user.projectref  username.");
  }

  return value;
}

async function tryConnect(label, connectionString) {
  if (!connectionString) return;
  const { default: pg } = await import("pg");

  // Pass the parts explicitly rather than the raw string. Newer
  // pg-connection-string promotes `sslmode=require` to `verify-full`,
  // which then rejects Supabase's chain with "self-signed certificate"
  // and overrides the ssl option below — producing a scary failure for
  // a connection string that is actually fine. Prisma does not behave
  // this way, so the raw string is correct to use in DATABASE_URL.
  const u = new URL(connectionString);
  const client = new pg.Client({
    host: u.hostname,
    port: Number(u.port) || 5432,
    database: u.pathname.replace(/^\//, "") || "postgres",
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000
  });
  process.stdout.write(`\n  connecting (${label}) … `);
  try {
    await client.connect();
    const r = await client.query(
      'SELECT current_user, (SELECT count(*) FROM "Role")::int AS roles'
    );
    console.log("✓ CONNECTED");
    console.log(`    authenticated as : ${r.rows[0].current_user}`);
    console.log(`    Role rows        : ${r.rows[0].roles}  (expect 36)`);
    await client.end();
  } catch (err) {
    console.log("✗ FAILED");
    console.log(`    ${err.message}`);
    if (/password authentication failed|not valid/i.test(err.message)) {
      console.log("    → wrong password, or wrong username for the pooler (see above)");
    } else if (/ENOTFOUND|EAI_AGAIN/i.test(err.message)) {
      console.log("    → hostname is wrong or DNS cannot resolve it");
    } else if (/ETIMEDOUT|ECONNREFUSED/i.test(err.message)) {
      console.log("    → unreachable: wrong port, or IPv6-only direct host");
    } else if (/does not exist/i.test(err.message)) {
      console.log("    → connected fine, but the schema is missing: run migrations");
    }
  }
}

const env = loadEnv();
const db = describe("DATABASE_URL   (app runtime, pooled, port 6543)", env.DATABASE_URL);
const direct = describe("DIRECT_URL     (migrations, session mode, port 5432)", env.DIRECT_URL);

await tryConnect("DATABASE_URL", db);
await tryConnect("DIRECT_URL", direct);

console.log(
  "\nThis reads .env only. Vercel has its own copy — fixing one does not fix the other.\n"
);
