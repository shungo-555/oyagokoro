'use client'

import { useEffect, useState } from 'react'

interface IncidentResponse {
  empathy: string;
  alternatives: string[];
  insight: string;
  tip: string;
}

interface GoodResponse {
  message: string;
}

interface Props {
  userInput: string;
  childId: string | null;
  entryType?: 'incident' | 'good';
  onBack: () => void;
  onRetry: () => void;
}

function LoadingDots({ isGood }: { isGood: boolean }) {
  return (
    <div className="flex flex-col items-center gap-6 py-16">
      <div className="text-5xl" style={{ animation: 'pulse 2s infinite' }}>
        {isGood ? '🌿' : '🌸'}
      </div>
      <div className="flex gap-2">
        <span className="w-3 h-3 rounded-full dot-1" style={{ background: isGood ? '#a5d6a7' : '#f48fb1' }} />
        <span className="w-3 h-3 rounded-full dot-2" style={{ background: isGood ? '#80deea' : '#ce93d8' }} />
        <span className="w-3 h-3 rounded-full dot-3" style={{ background: isGood ? '#90caf9' : '#90caf9' }} />
      </div>
      <p className="text-sm text-center leading-relaxed" style={{ color: '#9e7b7b' }}>
        {isGood ? '記録しています…' : 'あなたの気持ちを整理しています…'}
      </p>
    </div>
  );
}

function Card({ children, delay = 'animate-fade-in' }: { children: React.ReactNode; delay?: string }) {
  return (
    <div className={`rounded-3xl p-5 shadow-sm ${delay}`}
         style={{ background: 'rgba(255,255,255,0.9)' }}>
      {children}
    </div>
  );
}

function SectionLabel({ emoji, label, color }: { emoji: string; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span>{emoji}</span>
      <span className="text-xs font-bold tracking-widest" style={{ color }}>{label}</span>
    </div>
  );
}

export default function ResponseScreen({ userInput, childId, entryType = 'incident', onBack, onRetry }: Props) {
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState<IncidentResponse | GoodResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isGood = entryType === 'good';

  useEffect(() => {
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userInput, child_id: childId, entry_type: entryType }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setResponse(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('ネットワークエラーが発生しました');
        setLoading(false);
      });
  }, [userInput, childId, entryType]);

  return (
    <div className="flex flex-col min-h-full px-5 py-8"
         style={{ background: 'linear-gradient(160deg, #fff8f5 0%, #fce4ec 100%)' }}>

      {/* nav */}
      <div className="flex items-center gap-3 mb-6 animate-fade-in">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.8)', color: '#c06080' }}
        >
          ←
        </button>
        <span className="text-sm font-medium" style={{ color: '#9e7b7b' }}>
          {isGood ? '記録完了' : '結果'}
        </span>
      </div>

      {loading ? (
        <LoadingDots isGood={isGood} />
      ) : error ? (
        <div className="flex flex-col items-center gap-6 py-16 text-center">
          <div className="text-4xl">😔</div>
          <p className="text-sm leading-relaxed" style={{ color: '#9e7b7b' }}>{error}</p>
          <button
            onClick={onRetry}
            className="w-full h-12 rounded-2xl text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #f48fb1 0%, #ce93d8 100%)', color: '#fff' }}
          >
            もう一度試す
          </button>
        </div>
      ) : response && isGood ? (
        // good entry の表示
        <div className="flex flex-col gap-4 pb-8">
          {/* 記録した内容 */}
          <div className="animate-fade-in rounded-3xl p-4"
               style={{ background: 'rgba(165,214,167,0.15)', border: '1px solid rgba(165,214,167,0.4)' }}>
            <p className="text-xs mb-1" style={{ color: '#558b2f' }}>記録したこと</p>
            <p className="text-sm leading-relaxed line-clamp-3" style={{ color: '#5c2d2d' }}>
              {userInput}
            </p>
          </div>

          {/* AIのメッセージ */}
          <Card delay="animate-fade-in">
            <SectionLabel emoji="✨" label="よくできました" color="#66bb6a" />
            <p className="text-sm leading-relaxed" style={{ color: '#5c2d2d' }}>
              {(response as GoodResponse).message}
            </p>
          </Card>

          {/* actions */}
          <div className="flex flex-col gap-3 mt-4 animate-fade-in-2">
            <button
              onClick={onBack}
              className="w-full h-14 rounded-2xl text-base font-bold transition-all active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #a5d6a7 0%, #80deea 100%)',
                color: '#fff',
                boxShadow: '0 4px 16px rgba(165,214,167,0.4)',
              }}
            >
              トップに戻る
            </button>
          </div>
        </div>
      ) : response && (
        // incident entry の表示
        <div className="flex flex-col gap-4 pb-8">

          {/* user input summary */}
          <div className="animate-fade-in rounded-3xl p-4"
               style={{ background: 'rgba(244,143,177,0.12)', border: '1px solid rgba(244,143,177,0.3)' }}>
            <p className="text-xs mb-1" style={{ color: '#c06080' }}>あなたが話してくれたこと</p>
            <p className="text-sm leading-relaxed line-clamp-3" style={{ color: '#7b4f4f' }}>
              {userInput}
            </p>
          </div>

          {/* empathy */}
          <Card delay="animate-fade-in">
            <SectionLabel emoji="💙" label="あなたの気持ち" color="#64b5f6" />
            <p className="text-sm leading-relaxed" style={{ color: '#5c2d2d' }}>
              {(response as IncidentResponse).empathy}
            </p>
          </Card>

          {/* alternatives */}
          <Card delay="animate-fade-in-2">
            <SectionLabel emoji="💬" label="こう言えばよかったかも" color="#ab47bc" />
            <div className="flex flex-col gap-3">
              {(response as IncidentResponse).alternatives.map((alt, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="mt-0.5 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0"
                        style={{ background: '#f3e5f5', color: '#ab47bc' }}>
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed" style={{ color: '#5c2d2d' }}>{alt}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* insight */}
          <Card delay="animate-fade-in-3">
            <SectionLabel emoji="✨" label="なぜそうなったか" color="#ff8a65" />
            <p className="text-sm leading-relaxed" style={{ color: '#5c2d2d' }}>
              {(response as IncidentResponse).insight}
            </p>
          </Card>

          {/* tip */}
          <Card delay="animate-fade-in-4">
            <SectionLabel emoji="🌱" label="次のために" color="#66bb6a" />
            <p className="text-sm leading-relaxed" style={{ color: '#5c2d2d' }}>
              {(response as IncidentResponse).tip}
            </p>
          </Card>

          {/* actions */}
          <div className="flex flex-col gap-3 mt-2 animate-fade-in-4">
            <button
              onClick={onRetry}
              className="w-full h-12 rounded-2xl text-sm font-bold transition-all active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #f48fb1 0%, #ce93d8 100%)',
                color: '#fff',
                boxShadow: '0 4px 16px rgba(206,147,216,0.4)',
              }}
            >
              もう一度話す
            </button>
            <button
              onClick={onBack}
              className="w-full h-12 rounded-2xl text-sm font-medium transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.8)', color: '#9e7b7b' }}
            >
              トップに戻る
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
