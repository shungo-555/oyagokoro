'use client'

import { useRef, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase';

interface Props {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // useRef でクライアント側のみ生成（SSR では呼ばれない）
  const supabaseRef = useRef<ReturnType<typeof createSupabaseBrowserClient> | null>(null);
  const getClient = () => {
    if (!supabaseRef.current) {
      supabaseRef.current = createSupabaseBrowserClient();
    }
    return supabaseRef.current;
  };

  const sendOtp = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    const { error } = await getClient().auth.signInWithOtp({ email: email.trim() });
    if (error) {
      setError('メール送信に失敗しました。アドレスを確認してください。');
    } else {
      setStep('otp');
    }
    setLoading(false);
  };

  const verifyOtp = async () => {
    if (!token.trim()) return;
    setLoading(true);
    setError('');
    const { error } = await getClient().auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: 'email',
    });
    if (error) {
      setError('コードが正しくありません。もう一度確認してください。');
    } else {
      onLogin();
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
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#5c2d2d' }}>
            はじめましょう
          </h1>
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-line" style={{ color: '#9e7b7b' }}>
            {step === 'email'
              ? 'メールアドレスを入力すると\n認証コードが届きます'
              : `${email} に\n6桁のコードを送りました`}
          </p>
        </div>

        {step === 'email' ? (
          <div className="w-full flex flex-col gap-3">
            <input
              type="email"
              placeholder="メールアドレス"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendOtp()}
              className="w-full px-4 py-3 rounded-2xl text-sm outline-none border-none"
              style={{
                background: 'rgba(255,255,255,0.8)',
                color: '#5c2d2d',
                boxShadow: '0 2px 12px rgba(206,147,216,0.2)',
              }}
              autoFocus
            />
            <button
              onClick={sendOtp}
              disabled={loading || !email.trim()}
              className="w-full py-3 rounded-2xl font-bold text-sm text-white transition-all active:scale-95 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #f48fb1 0%, #ce93d8 100%)' }}
            >
              {loading ? '送信中…' : 'コードを送る'}
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-3">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="6桁のコード"
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => e.key === 'Enter' && verifyOtp()}
              className="w-full px-4 py-3 rounded-2xl text-center tracking-widest outline-none border-none"
              style={{
                background: 'rgba(255,255,255,0.8)',
                color: '#5c2d2d',
                boxShadow: '0 2px 12px rgba(206,147,216,0.2)',
                fontSize: '1.25rem',
                letterSpacing: '0.3em',
              }}
              autoFocus
            />
            <button
              onClick={verifyOtp}
              disabled={loading || token.length < 6}
              className="w-full py-3 rounded-2xl font-bold text-sm text-white transition-all active:scale-95 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #f48fb1 0%, #ce93d8 100%)' }}
            >
              {loading ? '確認中…' : 'ログイン'}
            </button>
            <button
              onClick={() => { setStep('email'); setToken(''); setError(''); }}
              className="text-xs py-2"
              style={{ color: '#9e7b7b' }}
            >
              メールアドレスを変更する
            </button>
          </div>
        )}

        {error && (
          <p className="text-xs text-center" style={{ color: '#c0392b' }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
