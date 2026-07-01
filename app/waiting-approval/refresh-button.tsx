"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function RefreshButton() {
  const { update } = useSession();
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  async function handleCheckAgain() {
    setChecking(true);
    await update(); // re-runs the jwt() callback with trigger "update", re-reading status/roles from the DB
    router.refresh();
    setChecking(false);
  }

  return (
    <div style={{ marginTop: "1.75rem", display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "center" }}>
      <button type="button" className="btn-signin" style={{ width: "auto", padding: "0.75rem 1.75rem" }} onClick={handleCheckAgain} disabled={checking}>
        {checking && <div className="btn-spinner" aria-hidden="true" />}
        <span>{checking ? "Checking…" : "Check again"}</span>
      </button>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        style={{ background: "none", border: "none", color: "var(--text-400)", fontSize: "0.78rem", cursor: "pointer" }}
      >
        Sign out
      </button>
    </div>
  );
}
