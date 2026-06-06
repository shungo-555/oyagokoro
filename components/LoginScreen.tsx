'use client'

import { useRef, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase';

interface Props {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin: _onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'sent'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const supabaseRef = useRef<ReturnType<typeof createSupabaseBrowserClient> | null>(null);
  const getClient = () => {
    if (!supabaseRef.current) {
      supabaseRef.current = createSupabaseBrowserClient();
    }
    return supabaseRef.current;
  };

  const sendLink = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    const { error } = await getClient().auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      setError('メール送信に失敗しました。アドレスを確認してください。');
    } else {
      setStep('sent');
    }
    setLoading(false);
  };

  return (
    <div
      className="flex flex-col items-center min-h-full px-6"
      style={{ background: 'linear-gradient(160deg, #fff0ea 0%, #fce4ec 50%, #ede7f6 100%)' }}
    >
      <div className="pt-10 pb-2">
        <div className="text-5xl">🌸</div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 w-full max-w-xs pb-10">
        {step === 'email' ? (
          <>
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#5c2d2d' }}>
                はじめましょう
              </h1>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: '#9e7b7b' }}>
                メールアドレスを入力すると<br />
                ログイン用のリンクが届きます
              </p>
            </div>

            <div className="w-full flex flex-col gap-3">
              <input
                type="email"
                placeholder="メールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendLink()}
                className="w-full px-4 py-3 rounded-2xl text-sm outline-none border-none"
                style={{
                  background: 'rgba(255,255,255,0.8)',
                  color: '#5c2d2d',
                  boxShadow: '0 2px 12px rgba(206,147,216,0.2)',
                }}
                autoFocus
              />
              <button
                onClick={sendLink}
                disabled={loading || !email.trim()}
                className="w-full py-3 rounded-2xl font-bold text-sm text-white transition-all active:scale-95 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #f48fb1 0%, #ce93d8 100%)' }}
              >
                {loading ? '送信中…' : 'リンクを送る'}
              </button>
            </div>

            {error && (
              <p className="text-xs text-center" style={{ color: '#c0392b' }}>
                {error}
              </p>
            )}
          </>
        ) : (
          <>
            <div className="text-center flex flex-col items-center gap-4">
              <div className="text-5xl">📬</div>
              <h1 className="text-xl font-bold tracking-tight" style={{ color: '#5c2d2d' }}>
                メールを確認してください
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: '#9e7b7b' }}>
                <span style={{ color: '#5c2d2d', fontWeight: 600 }}>{email}</span> に<br />
                ログイン用のリンクを送りました。<br />
                メールのリンクをクリックすると<br />
                ログインできます。
              </p>
            </div>

            <button
              onClick={() => { setStep('email'); setError(''); }}
              className="text-xs py-2"
              style={{ color: '#9e7b7b' }}
            >
              メールアドレスを変更する
            </button>
          </>
        )}
      </div>
    </div>
  );
}
