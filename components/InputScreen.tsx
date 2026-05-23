'use client'

import { useState } from 'react'

interface Props {
  onBack: () => void;
  onSubmit: (text: string) => void;
}

const MAX_LENGTH = 500;

const PLACEHOLDER = `例：8歳の男の子に、宿題のことでついきつい言い方をしてしまいました…`;

export default function InputScreen({ onBack, onSubmit }: Props) {
  const [text, setText] = useState('');
  const remaining = MAX_LENGTH - text.length;

  return (
    <div className="flex flex-col min-h-full px-5 py-8"
         style={{ background: 'linear-gradient(160deg, #fff8f5 0%, #fce4ec 100%)' }}>

      {/* nav */}
      <div className="flex items-center gap-3 mb-8 animate-fade-in">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
          style={{ background: 'rgba(255,255,255,0.8)', color: '#c06080' }}
        >
          ←
        </button>
        <span className="text-sm font-medium" style={{ color: '#9e7b7b' }}>ミスったな…</span>
      </div>

      {/* question */}
      <div className="mb-6 animate-fade-in-2">
        <h2 className="text-2xl font-bold leading-snug" style={{ color: '#5c2d2d' }}>
          何があったか、<br />話してください
        </h2>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: '#9e7b7b' }}>
          どんな小さなことでも構いません。<br />
          あなたの言葉のまま、教えてください。
        </p>
      </div>

      {/* textarea */}
      <div className="flex-1 flex flex-col animate-fade-in-3">
        <div className="relative flex-1">
          <textarea
            value={text}
            onChange={e => setText(e.target.value.slice(0, MAX_LENGTH))}
            placeholder={PLACEHOLDER}
            className="w-full h-full min-h-48 rounded-3xl p-5 text-base leading-relaxed resize-none border-0 shadow-md"
            style={{
              background: 'rgba(255,255,255,0.9)',
              color: '#5c2d2d',
            }}
          />
          <span className="absolute bottom-4 right-5 text-xs" style={{ color: remaining < 50 ? '#e57373' : '#c9a9a9' }}>
            {remaining}
          </span>
        </div>
      </div>

      {/* submit */}
      <div className="mt-6 animate-fade-in-4">
        <button
          onClick={() => text.trim().length > 0 && onSubmit(text.trim())}
          disabled={text.trim().length === 0}
          className="w-full h-14 rounded-2xl text-base font-bold transition-all active:scale-95 disabled:opacity-40"
          style={text.trim().length > 0 ? {
            background: 'linear-gradient(135deg, #f48fb1 0%, #ce93d8 100%)',
            color: '#fff',
            boxShadow: '0 6px 24px rgba(206,147,216,0.45)',
          } : {
            background: '#e0cccc',
            color: '#fff',
          }}
        >
          AIに相談する →
        </button>
      </div>

    </div>
  );
}
