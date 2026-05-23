'use client'

import { useEffect, useState } from 'react'
import { getMockResponse, type AIResponse } from '@/lib/mockAI'

interface Props {
  userInput: string;
  onBack: () => void;
  onRetry: () => void;
}

function LoadingDots() {
  return (
    <div className="flex flex-col items-center gap-6 py-16">
      <div className="text-5xl animate-pulse-soft" style={{ animationName: 'pulse-dot' }}>🌸</div>
      <div className="flex gap-2">
        <span className="w-3 h-3 rounded-full dot-1" style={{ background: '#f48fb1' }} />
        <span className="w-3 h-3 rounded-full dot-2" style={{ background: '#ce93d8' }} />
        <span className="w-3 h-3 rounded-full dot-3" style={{ background: '#90caf9' }} />
      </div>
      <p className="text-sm text-center leading-relaxed" style={{ color: '#9e7b7b' }}>
        あなたの気持ちを整理しています…
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

export default function ResponseScreen({ userInput, onBack, onRetry }: Props) {
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState<AIResponse | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setResponse(getMockResponse(userInput));
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [userInput]);

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
        <span className="text-sm font-medium" style={{ color: '#9e7b7b' }}>結果</span>
      </div>

      {loading ? (
        <LoadingDots />
      ) : response && (
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
              {response.empathy}
            </p>
          </Card>

          {/* alternatives */}
          <Card delay="animate-fade-in-2">
            <SectionLabel emoji="💬" label="こう言えばよかったかも" color="#ab47bc" />
            <div className="flex flex-col gap-3">
              {response.alternatives.map((alt, i) => (
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
              {response.insight}
            </p>
          </Card>

          {/* tip */}
          <Card delay="animate-fade-in-4">
            <SectionLabel emoji="🌱" label="次のために" color="#66bb6a" />
            <p className="text-sm leading-relaxed" style={{ color: '#5c2d2d' }}>
              {response.tip}
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
