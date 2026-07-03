"use client";

import { useState, type FormEvent, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false
    });

    setLoading(false);

    if (result?.error) {
      setError(result.error === "CredentialsSignin" ? "Incorrect email or password." : result.error);
      return;
    }

    // Middleware decides where pending/roleless users actually land
    // (/waiting-approval); everyone else proceeds to `next`.
    router.replace(next);
    router.refresh();
  }

  return (
    <>
      <div className="bg-layer" aria-hidden="true">
        <div className="bg-orb-2" />
      </div>

      <main className="page-wrap">
        <div className="badge-lockup">
          <div className="badge-ring" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/badge.png" alt="" className="badge-ring--img" />
          </div>
          <div className="unit-id">
            <div className="unit-designation">OH-20221 AFJROTC</div>
            <div className="unit-school">Logan High School &nbsp;·&nbsp; Logan, Ohio</div>
          </div>
        </div>

        <div className="signin-card" role="region" aria-labelledby="signin-heading">
          <div className="card-corner tl" aria-hidden="true" />
          <div className="card-corner br" aria-hidden="true" />

          <p className="card-eyebrow">Cadet Portal</p>
          <h1 className="card-title" id="signin-heading">
            Sign In
          </h1>
          <p className="card-sub">Enter your unit credentials to access the cadet portal.</p>

          <form onSubmit={handleSubmit} noValidate aria-label="Sign in to cadet portal">
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email Address
              </label>
              <input
                className="form-input"
                type="email"
                id="email"
                name="email"
                autoComplete="username email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <div className="form-row-between">
                <label className="form-label" htmlFor="password">
                  Password
                </label>
              </div>
              <div className="input-wrap">
                <input
                  className="form-input"
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="pw-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  <i className={showPassword ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"} aria-hidden="true" />
                </button>
              </div>
            </div>

            {error && (
              <div className="auth-status error">
                <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn-signin" disabled={loading}>
              {loading && <div className="btn-spinner" aria-hidden="true" />}
              <span>{loading ? "Signing in…" : "Sign In"}</span>
              {!loading && <i className="fa-solid fa-arrow-right-to-bracket" aria-hidden="true" />}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.8rem", color: "var(--text-300)" }}>
            New cadet?{" "}
            <a href="/signup" style={{ color: "var(--purple-300)", fontWeight: 600 }}>
              Create an account
            </a>
          </p>

          <div className="card-footer-link">
            <a href="/">
              <i className="fa-solid fa-chevron-left" aria-hidden="true" /> Return to the public
              website
            </a>
          </div>
        </div>

        <div className="security-note">
          <i className="fa-solid fa-shield-halved" aria-hidden="true" />
          <p>
            This portal is for authorized OH-20221 unit members only. Unauthorized access
            attempts are logged. For account issues, contact your SASI or ASI.
          </p>
        </div>
      </main>
    </>
  );
}