import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { isNative, NATIVE_DEFAULT_API } from '../../lib/native';
import api from '../../lib/api';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (element: HTMLElement, config: Record<string, unknown>) => void;
          prompt: () => void;
        };
      };
    };
  }
}

/** Deep-link scheme the native shells listen for after web Google auth. */
export const NATIVE_AUTH_SCHEME = 'in.sprintsociety.app';

/**
 * Hosted bridge page (same origin as production web) where Google Identity
 * Services works reliably. Used by the APK because GIS often fails inside the
 * Capacitor WebView (third-party cookie / iframe restrictions).
 */
function nativeAuthBridgeUrl(mode: 'signin' | 'signup'): string {
  // Derive the web origin from the API base (…/api → origin).
  let webOrigin = 'https://app.sprintsociety.in';
  try {
    const apiBase = NATIVE_DEFAULT_API.replace(/\/api\/?$/, '');
    if (apiBase.startsWith('http')) webOrigin = apiBase;
  } catch { /* keep default */ }
  const redirect = encodeURIComponent(`${NATIVE_AUTH_SCHEME}://auth`);
  return `${webOrigin}/native-auth?mode=${mode}&redirect=${redirect}`;
}

interface GoogleSignInButtonProps {
  onSuccess?: (isNew: boolean) => void;
  onError?: (error: string) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
}

export function GoogleSignInButton({ onSuccess, onError, text = 'continue_with' }: GoogleSignInButtonProps) {
  const { googleLogin } = useAuth();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState(import.meta.env.VITE_GOOGLE_CLIENT_ID || '');
  const [scriptLoaded, setScriptLoaded] = useState(!!window.google?.accounts);
  const [gisReady, setGisReady] = useState(false);
  const [available, setAvailable] = useState(!!import.meta.env.VITE_GOOGLE_CLIENT_ID);

  // True only while the SPA is still served from the Capacitor shell origin.
  // Once we navigate the WebView to app.sprintsociety.in/native-auth, GIS works
  // and we must NOT redirect to the bridge again (infinite loop).
  const useNativeBridge =
    isNative &&
    (window.location.hostname === 'localhost' ||
      window.location.protocol.startsWith('capacitor'));

  // Resolve client ID: bake-time env, else public server config (works for APK builds).
  useEffect(() => {
    if (clientId) {
      setAvailable(true);
      return;
    }
    api.get('/auth/google-config')
      .then((r) => {
        const id = r.data?.clientId as string | null;
        if (id) {
          setClientId(id);
          setAvailable(true);
        } else {
          setAvailable(false);
        }
      })
      .catch(() => setAvailable(false));
  }, [clientId]);

  useEffect(() => {
    if (!available || !clientId) return;
    // Capacitor shell origin: skip GIS — open the hosted bridge instead.
    if (useNativeBridge) return;

    if (window.google?.accounts) {
      setScriptLoaded(true);
      return;
    }

    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => setScriptLoaded(true));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => setGisReady(false);
    document.head.appendChild(script);
  }, [available, clientId]);

  useEffect(() => {
    if (useNativeBridge || !scriptLoaded || !window.google?.accounts || !buttonRef.current || !clientId) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredentialResponse,
      auto_select: false,
    });

    buttonRef.current.innerHTML = '';
    window.google.accounts.id.renderButton(buttonRef.current, {
      type: 'standard',
      theme: 'filled_black',
      size: 'large',
      width: buttonRef.current.offsetWidth || 320,
      text,
      shape: 'pill',
      logo_alignment: 'center',
    });
    setGisReady(true);
  }, [scriptLoaded, clientId, text]);

  async function handleCredentialResponse(response: { credential: string }) {
    setLoading(true);
    try {
      const result = await googleLogin(response.credential);
      onSuccess?.(!!result.isNew);
    } catch (err: unknown) {
      console.error('[GoogleSignIn] sign-in failed:', err);
      const msg = err instanceof Error ? err.message : 'Google sign-in failed';
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  }

  function openNativeBridge() {
    const mode = text === 'signup_with' ? 'signup' : 'signin';
    // Full navigation so Google sees a real https origin (app.sprintsociety.in).
    window.location.href = nativeAuthBridgeUrl(mode);
  }

  // Hide the button whenever the backend reports Google sign-in isn't configured.
  // This also covers the native bridge: /auth/google-config and the hosted
  // /native-auth page ship together, so a 404 here means tapping the button would
  // navigate the WebView to a page that doesn't exist yet and strand the user
  // outside the app shell.
  if (!available) return null;

  // Capacitor shell: always show a real button (GIS iframes usually don't render).
  if (useNativeBridge) {
    return (
      <div className="w-full">
        <button
          type="button"
          onClick={openNativeBridge}
          disabled={loading}
          className="ss-btn ss-btn-soft"
          style={{
            width: '100%', height: 48, flex: 'none', gap: 10,
            font: '600 14px var(--body)', color: 'var(--fg)',
          }}
          data-testid="google-signin-native"
        >
          <GoogleGlyph />
          {text === 'signup_with' ? 'Sign up with Google' : text === 'signin_with' ? 'Sign in with Google' : 'Continue with Google'}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {loading ? (
        <div className="w-full h-[44px] rounded-full bg-bg-secondary border border-bg-tertiary flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-zinc-500 border-t-accent rounded-full animate-spin" />
        </div>
      ) : (
        <div ref={buttonRef} className="w-full flex justify-center [&>div]:!w-full" />
      )}
      {!gisReady && scriptLoaded === false && (
        <p style={{ font: '500 11px var(--body)', color: 'var(--muted-2)', textAlign: 'center', marginTop: 6 }}>
          Loading Google sign-in…
        </p>
      )}
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
