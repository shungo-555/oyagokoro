'use client'

interface Props {
  onStart: () => void;
}

export default function HomeScreen({ onStart }: Props) {
  return (
    <div className="flex flex-col items-center min-h-full px-6"
         style={{ background: 'linear-gradient(160deg, #fff0ea 0%, #fce4ec 50%, #ede7f6 100%)' }}>

      {/* sakura: 上部固定 */}
      <div className="animate-fade-in pt-10 pb-2">
        <div className="text-5xl">🌸</div>
      </div>

      {/* main message: 残りスペースを中央揃えで使う */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center animate-fade-in-2 pb-12">
        <h1 className="text-4xl font-bold tracking-tight leading-tight"
            style={{ color: '#5c2d2d' }}>
          ミスったな…
        </h1>
        <p className="text-base leading-relaxed max-w-xs" style={{ color: '#7b4f4f' }}>
          子どもに強く当たってしまったとき。<br />
          一人で抱え込まなくていい。<br />
          振り返れるあなたは、十分いい親です。
        </p>

        {/* big button */}
        <button
          onClick={onStart}
          className="mt-4 w-64 h-64 rounded-full shadow-2xl flex flex-col items-center justify-center gap-3 transition-transform active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #f48fb1 0%, #ce93d8 100%)',
            boxShadow: '0 12px 40px rgba(206,147,216,0.5)',
          }}
        >
          <span className="text-4xl">💭</span>
          <span className="text-white text-lg font-bold">話してみる</span>
        </button>
      </div>

    </div>
  );
}
