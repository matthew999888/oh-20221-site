"use client";

import { useFormState, useFormStatus } from "react-dom";
import { signUpAction, type SignUpState } from "./actions";

const initialState: SignUpState = { ok: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-signin" disabled={pending}>
      {pending && <div className="btn-spinner" aria-hidden="true" />}
      <span>{pending ? "Creating account…" : "Create Account"}</span>
    </button>
  );
}

export default function SignUpPage() {
  const [state, formAction] = useFormState(signUpAction, initialState);

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

        <div className="signin-card" role="region" aria-labelledby="signup-heading">
          <div className="card-corner tl" aria-hidden="true" />
          <div className="card-corner br" aria-hidden="true" />

          <p className="card-eyebrow">New Cadet</p>
          <h1 className="card-title" id="signup-heading">
            Create Account
          </h1>
          <p className="card-sub">
            Sign up for portal access. Your account will be reviewed by staff and a
            role assigned before you can use the portal.
          </p>

          {state.ok ? (
            <div className="auth-status success">
              <i className="fa-solid fa-circle-check" aria-hidden="true" />
              <span>{state.message}</span>
            </div>
          ) : (
            <form action={formAction} noValidate>
              <div className={`form-group ${state.fieldErrors?.name ? "has-error" : ""}`}>
                <label className="form-label" htmlFor="name">
                  Full Name
                </label>
                <input
                  className="form-input"
                  type="text"
                  id="name"
                  name="name"
                  autoComplete="name"
                  placeholder="Cadet First Last"
                  required
                />
                {state.fieldErrors?.name && (
                  <div className="field-error">{state.fieldErrors.name}</div>
                )}
              </div>

              <div className={`form-group ${state.fieldErrors?.email ? "has-error" : ""}`}>
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
                />
                {state.fieldErrors?.email && (
                  <div className="field-error">{state.fieldErrors.email}</div>
                )}
              </div>

              <div className={`form-group ${state.fieldErrors?.password ? "has-error" : ""}`}>
                <label className="form-label" htmlFor="password">
                  Password
                </label>
                <input
                  className="form-input"
                  type="password"
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  required
                />
                {state.fieldErrors?.password && (
                  <div className="field-error">{state.fieldErrors.password}</div>
                )}
              </div>

              {!state.ok && state.message && (
                <div className="auth-status error">
                  <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
                  <span>{state.message}</span>
                </div>
              )}

              <SubmitButton />
            </form>
          )}

          <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.8rem", color: "var(--text-300)" }}>
            Already have an account?{" "}
            <a href="/login" style={{ color: "var(--purple-300)", fontWeight: 600 }}>
              Sign in
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
            This portal is for authorized OH-20221 unit members only. New accounts require
            staff approval before access is granted.
          </p>
        </div>
      </main>
    </>
  );
}
