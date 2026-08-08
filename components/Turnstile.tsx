"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      remove: (id: string) => void;
      reset: (id?: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onloadTurnstileCallback";

/**
 * Cloudflare Turnstile widget.
 *
 * Rendered explicitly rather than via the automatic `.cf-turnstile` class
 * scan, because React re-renders and client-side navigation can leave the
 * auto-mode script with a stale DOM node and a widget that never appears.
 *
 * On success the token is written into a hidden input named
 * `cf-turnstile-response`, which is what the server action reads.
 *
 * Renders nothing when NEXT_PUBLIC_TURNSTILE_SITE_KEY is unset, so local
 * development works without Cloudflare keys. `lib/turnstile.ts` makes the
 * matching decision on the server.
 */
export default function Turnstile({ action }: { action?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey) return;

    let cancelled = false;

    const render = () => {
      if (cancelled || !containerRef.current || !window.turnstile) return;
      // Guard against double-render in React strict mode.
      if (widgetIdRef.current !== null) return;

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        action,
        theme: "dark",
        // Keeps the widget legible next to the auth card's own copy.
        size: "flexible",
        "response-field-name": "cf-turnstile-response",
        "error-callback": () => {
          console.error("[turnstile] widget reported an error");
        },
        "expired-callback": () => {
          // Tokens live ~5 minutes. Refresh so a slow form fill doesn't
          // submit a token the server will reject as expired.
          if (widgetIdRef.current) window.turnstile?.reset(widgetIdRef.current);
        }
      });
    };

    if (window.turnstile) {
      render();
    } else {
      // The script's onload fires this global; set it before injecting.
      window.onloadTurnstileCallback = render;
      if (!document.getElementById(SCRIPT_ID)) {
        const script = document.createElement("script");
        script.id = SCRIPT_ID;
        script.src = SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, action]);

  if (!siteKey) return null;

  return <div className="pub-turnstile" ref={containerRef} />;
}
