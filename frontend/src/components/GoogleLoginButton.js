import React, { useEffect, useRef } from 'react';

export default function GoogleLoginButton({ onSuccess }) {
  const btnRef = useRef(null);

  // KEY FIX: Store the callback in a ref.
  // This prevents re-initializing GSI on every render (which causes
  // "next is not a function" because Google's internal state machine
  // gets called twice and its internal `next` variable is already consumed).
  const callbackRef = useRef(null);
  callbackRef.current = onSuccess;

  useEffect(() => {
    let initialized = false;

    const initGSI = () => {
      if (initialized) return;
      if (!window.google?.accounts?.id) return;
      if (!btnRef.current) return;
      if (!process.env.REACT_APP_GOOGLE_CLIENT_ID) return;

      initialized = true;

      // Cancel any pending prompts first to avoid state conflicts
      try {
        window.google.accounts.id.cancel();
      } catch (_) {}

      window.google.accounts.id.initialize({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        callback: (response) => {
          // Always read from ref — never captures stale closure
          if (callbackRef.current && response?.credential) {
            callbackRef.current(response.credential);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        itp_support: true,
      });

      window.google.accounts.id.renderButton(btnRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: Math.min(btnRef.current.offsetWidth || 380, 400),
      });
    };

    // If GSI already loaded, initialize immediately
    if (window.google?.accounts?.id) {
      initGSI();
    } else {
      // Poll until GSI script loads
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initGSI();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []); // Empty deps = run ONCE on mount only. Callback changes handled via ref.

  if (!process.env.REACT_APP_GOOGLE_CLIENT_ID) {
    return (
      <div style={{
        width: '100%', padding: '0.75rem', textAlign: 'center',
        background: '#fef9c3', border: '1px solid #fde68a',
        borderRadius: '8px', fontSize: '0.8rem', color: '#92400e',
        marginBottom: '0.5rem'
      }}>
        ⚠ Add <strong>REACT_APP_GOOGLE_CLIENT_ID</strong> to frontend/.env to enable Google Sign-In
      </div>
    );
  }

  return (
    <div style={{ width: '100%', marginBottom: '0.5rem' }}>
      <div ref={btnRef} style={{ width: '100%', minHeight: 44 }} />
    </div>
  );
}