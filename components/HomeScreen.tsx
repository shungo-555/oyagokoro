'use client'

interface Props {
  onStart: () => void;
  onStartGood: () => void;
  onHistory: () => void;
  onSettings: () => void;
  onLogout: () => void;
}

export default function HomeScreen({ onStart, onStartGood, onHistory, onSettings, onLogout }: Props) {
  return (
    <div className="flex flex-col items-center min-h-full px-6"
         style={{ background: 'linear-gradient(160deg, #fff0ea 0%, #fce4ec 50%, #ede7f6 100%)' }}>

      {/* 上部：設定 + さくら + ログアウト */}
      <div className="w-full flex items-center justify-between pt-10 pb-2">
        <button
          onClick={onSettings}
          className="text-xs px-3 py-1 rounded-full transition-all active:scale-95"
          style={{ background: 'rgba(255,255,255,0.6)', color: '#9e7b7b' }}
        >
          ⚙️ 設定
        </button>
        <div className="animate-fade-in text-5xl">🌸</div>
        <button
          onClick={onLogout}
          className="text-xs px-3 py-1 rounded-full transition-all active:scale-95"
          style={{ background: 'rgba(255,255,255,0.6)', color: '#9e7b7b' }}
        >
          ログアウト
        </button>
      </div>

      {/* main message */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center animate-fade-in-2 pb-4">
        <h1 className="text-4xl font-bold tracking-tight leading-tight"
            style={{ color: '#5c2d2d' }}>
          ミスったな…
        </h1>
        <p className="text-base leading-relaxed max-w-xs" style={{ color: '#7b4f4f' }}>
          子どもに強く当たってしまったとき。<br />
          一人で抱え込まなくていい。<br />
          振り返れるあなたは、十分いい親です。
        </p>

        {/* main button */}
        <button
          onClick={onStart}
          className="mt-2 w-60 h-60 rounded-full shadow-2xl flex flex-col items-center justify-center gap-3 transition-transform active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #f48fb1 0%, #ce93d8 100%)',
            boxShadow: '0 12px 40px rgba(206,147,216,0.5)',
          }}
        >
          <span className="text-4xl">💭</span>
          <span className="text-white text-lg font-bold">話してみる</span>
        </button>

        {/* good entry button */}
        <button
          onClick={onStartGood}
          className="flex items-center gap-2 px-6 py-3 rounded-full transition-all active:scale-95 shadow-sm"
          style={{
            background: 'linear-gradient(135deg, #a5d6a7 0%, #80deea 100%)',
            boxShadow: '0 4px 16px rgba(165,214,167,0.4)',
          }}
        >
          <span className="text-lg">✨</span>
          <span className="text-white text-sm font-bold">よかったことを記録</span>
        </button>
      </div>

      {/* history button */}
      <div className="pb-10 animate-fade-in-3">
        <button
          onClick={onHistory}
          className="flex items-center gap-2 px-6 py-3 rounded-full transition-all active:scale-95"
          style={{ background: 'rgba(255,255,255,0.7)', color: '#9e7b7b' }}
        >
          <span className="text-lg">📅</span>
          <span className="text-sm font-medium">振り返りを見る</span>
        </button>
      </div>

    </div>
  );
}
