"use client";

import { useId } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Turnstile from "@/components/Turnstile";
import { submitContactAction, type ContactState } from "./contact-actions";

const initialState: ContactState = { ok: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="pub-btn pub-btn--primary" disabled={pending}>
      {pending ? "Sending…" : "Send message"}
    </button>
  );
}

export default function ContactForm() {
  const [state, formAction] = useFormState(submitContactAction, initialState);
  const nameId = useId();
  const emailId = useId();
  const subjectId = useId();
  const messageId = useId();

  if (state.ok) {
    return (
      <p className="pub-form__status" role="status">
        {state.message}
      </p>
    );
  }

  return (
    <form className="pub-form" action={formAction} noValidate>
      <div className="pub-form__row">
        <div className="pub-field">
          <label className="pub-field__label" htmlFor={nameId}>
            Your name
          </label>
          <input
            id={nameId}
            name="name"
            className="pub-input"
            autoComplete="name"
            required
            aria-describedby={state.fieldErrors?.name ? `${nameId}-err` : undefined}
          />
          {state.fieldErrors?.name && (
            <p className="pub-form__error" id={`${nameId}-err`}>
              {state.fieldErrors.name}
            </p>
          )}
        </div>

        <div className="pub-field">
          <label className="pub-field__label" htmlFor={emailId}>
            Email address
          </label>
          <input
            id={emailId}
            name="email"
            type="email"
            className="pub-input"
            autoComplete="email"
            required
            aria-describedby={state.fieldErrors?.email ? `${emailId}-err` : undefined}
          />
          {state.fieldErrors?.email && (
            <p className="pub-form__error" id={`${emailId}-err`}>
              {state.fieldErrors.email}
            </p>
          )}
        </div>
      </div>

      <div className="pub-field">
        <label className="pub-field__label" htmlFor={subjectId}>
          Subject <span style={{ textTransform: "none", letterSpacing: 0 }}>(optional)</span>
        </label>
        <input id={subjectId} name="subject" className="pub-input" />
      </div>

      <div className="pub-field">
        <label className="pub-field__label" htmlFor={messageId}>
          Message
        </label>
        <textarea
          id={messageId}
          name="message"
          className="pub-textarea"
          required
          aria-describedby={state.fieldErrors?.message ? `${messageId}-err` : undefined}
        />
        {state.fieldErrors?.message && (
          <p className="pub-form__error" id={`${messageId}-err`}>
            {state.fieldErrors.message}
          </p>
        )}
      </div>

      {/* Honeypot. Hidden from people and from assistive tech, but a bot
          filling every field will complete it. `tabIndex={-1}` keeps it
          out of the keyboard path. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px" }}>
        <label htmlFor="website">Leave this field empty</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <Turnstile action="contact" />

      {!state.ok && state.message && (
        <p className="pub-form__error" role="alert">
          {state.message}
        </p>
      )}

      <div>
        <SubmitButton />
      </div>

      <p style={{ fontSize: "0.8rem", lineHeight: 1.6, color: "var(--ink-faint)" }}>
        Please don&rsquo;t send sensitive personal information through this form. For anything
        involving a student record, contact the instructor staff directly.
      </p>
    </form>
  );
}
