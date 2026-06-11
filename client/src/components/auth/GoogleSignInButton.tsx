import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

interface GoogleSignInButtonProps {
  onSuccess?: (isNew: boolean) => void;
  onError?: (error: string) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
}

export function GoogleSignInButton({ onSuccess, onError, text = 'continue_with' }: GoogleSignInButtonProps) {
  const { googleLogin } = useAuth();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(!!window.google?.accounts);

  useEffect(() => {
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
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !window.google?.accounts || !buttonRef.current || !GOOGLE_CLIENT_ID) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
      auto_select: false,
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      type: 'standard',
      theme: 'filled_black',
      size: 'large',
      width: buttonRef.current.offsetWidth,
      text,
      shape: 'pill',
      logo_alignment: 'left',
    });
  }, [scriptLoaded]);

  async function handleCredentialResponse(response: { credential: string }) {
    setLoading(true);
    try {
      const result = await googleLogin(response.credential);
      onSuccess?.(!!result.isNew);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Google sign-in failed';
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  }

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div className="w-full">
      {loading ? (
        <div className="w-full h-[44px] rounded-full bg-bg-secondary border border-bg-tertiary flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-zinc-500 border-t-accent rounded-full animate-spin" />
        </div>
      ) : (
        <div ref={buttonRef} className="w-full flex justify-center [&>div]:!w-full" />
      )}
    </div>
  );
}
