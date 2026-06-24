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

const FLOWERS = ['🌱', '🌿', '🌸', '🌺']

const LOADING_MESSAGES_INCIDENT = [
  'あなたの気持ちを整理しています…',
  '深呼吸してください',
  '振り返れるあなたは、十分いい親です',
  '一人で抱え込まなくていい',
  'ゆっくりでいいですよ',
]

const LOADING_MESSAGES_GOOD = [
  '記録しています…',
  'その気持ち、大切に残します',
  '小さな積み重ねが力になります',
  'よかったこと、増やしていきましょう',
]

function LoadingFlower({ isGood }: { isGood: boolean }) {
  const [flowerIdx, setFlowerIdx] = useState(0)
  const [msgIdx, setMsgIdx] = useState(0)
  const [msgKey, setMsgKey] = useState(0)
  const messages = isGood ? LOADING_MESSAGES_GOOD : LOADING_MESSAGES_INCIDENT

  useEffect(() => {
    const flowerTimer = setInterval(() => {
      setFlowerIdx(i => (i + 1) % FLOWERS.length)
    }, 900)
    const msgTimer = setInterval(() => {
      setMsgIdx(i => (i + 1) % messages.length)
      setMsgKey(k => k + 1)
    }, 2800)
    return () => { clearInterval(flowerTimer); clearInterval(msgTimer) }
  }, [messages.length])

  const dotColor = isGood ? '#a5d6a7' : '#f48fb1'
  const dotColor2 = isGood ? '#80deea' : '#ce93d8'

  return (
    <div className="flex flex-col items-center gap-6 py-16">
      <div className="text-6xl animate-flower select-none">{FLOWERS[flowerIdx]}</div>
      <div className="flex gap-2">
        <span className="w-2.5 h-2.5 rounded-full dot-1" style={{ background: dotColor }} />
        <span className="w-2.5 h-2.5 rounded-full dot-2" style={{ background: dotColor2 }} />
        <span className="w-2.5 h-2.5 rounded-full dot-3" style={{ background: '#90caf9' }} />
      </div>
      <p key={msgKey} className="animate-msg text-sm text-center leading-relaxed px-4" style={{ color: '#9e7b7b' }}>
        {messages[msgIdx]}
      </p>
    </div>
  )
}

export default function ResponseScreen({ userInput, childId, entryType = 'incident', onBack, onRetry }: Props) {
  const [loading, setLoading] = useState(true)
  const [response, setResponse] = useState<IncidentResponse | GoodResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [adviceOpen, setAdviceOpen] = useState(false)

  const isGood = entryType === 'good'

  useEffect(() => {
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userInput, child_id: childId, entry_type: entryType }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setResponse(data)
        setLoading(false)
      })
      .catch(() => {
        setError('ネットワークエラーが発生しました')
        setLoading(false)
      })
  }, [userInput, childId, entryType])

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
        <LoadingFlower isGood={isGood} />
      ) : error ? (
        <div className="flex flex-col items-center gap-6 py-16 text-center">
          <div className="text-4xl">😔</div>
          <p className="text-sm leading-relaxed" style={{ color: '#9e7b7b' }}>{error}</p>
          <button onClick={onRetry} className="w-full h-12 rounded-2xl text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #f48fb1 0%, #ce93d8 100%)', color: '#fff' }}>
            もう一度試す
          </button>
        </div>
      ) : response && isGood ? (
        /* ── good entry ── */
        <div className="flex flex-col gap-4 pb-8">
          <div className="animate-fade-in rounded-3xl p-4"
               style={{ background: 'rgba(165,214,167,0.15)', border: '1px solid rgba(165,214,167,0.4)' }}>
            <p className="text-xs mb-1" style={{ color: '#558b2f' }}>記録したこと</p>
            <p className="text-sm leading-relaxed line-clamp-3" style={{ color: '#5c2d2d' }}>{userInput}</p>
          </div>

          <div className="animate-fade-in rounded-3xl p-5 shadow-sm"
               style={{ background: 'rgba(255,255,255,0.9)' }}>
            <div className="flex items-center gap-2 mb-3">
              <span>✨</span>
              <span className="text-xs font-bold tracking-widest" style={{ color: '#66bb6a' }}>よくできました</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: '#5c2d2d' }}>
              {(response as GoodResponse).message}
            </p>
          </div>

          <button onClick={onBack}
            className="w-full h-14 rounded-2xl text-base font-bold transition-all active:scale-95 mt-4 animate-fade-in-2"
            style={{ background: 'linear-gradient(135deg, #a5d6a7 0%, #80deea 100%)', color: '#fff',
                     boxShadow: '0 4px 16px rgba(165,214,167,0.4)' }}>
            トップに戻る
          </button>
        </div>
      ) : response && (
        /* ── incident entry ── */
        <div className="flex flex-col gap-4 pb-8">

          {/* user input summary */}
          <div className="animate-fade-in rounded-3xl p-4"
               style={{ background: 'rgba(244,143,177,0.12)', border: '1px solid rgba(244,143,177,0.3)' }}>
            <p className="text-xs mb-1" style={{ color: '#c06080' }}>あなたが話してくれたこと</p>
            <p className="text-sm leading-relaxed line-clamp-3" style={{ color: '#7b4f4f' }}>{userInput}</p>
          </div>

          {/* ── HERO: empathy ── */}
          <div className="animate-fade-in rounded-3xl p-6 shadow-md"
               style={{ background: 'linear-gradient(135deg, rgba(100,181,246,0.18) 0%, rgba(206,147,216,0.18) 100%)',
                        border: '1px solid rgba(206,147,216,0.3)' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">💙</span>
              <span className="text-sm font-bold" style={{ color: '#5575a0' }}>あなたの気持ち</span>
            </div>
            <p className="text-base leading-relaxed" style={{ color: '#3a2d4a' }}>
              {(response as IncidentResponse).empathy}
            </p>
          </div>

          {/* アドバイス展開ボタン */}
          {!adviceOpen && (
            <button
              onClick={() => setAdviceOpen(true)}
              className="animate-fade-in-2 w-full py-4 rounded-2xl text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
              style={{ background: 'rgba(255,255,255,0.85)', color: '#9e7b7b',
                       border: '1.5px dashed #e0cccc' }}
            >
              <span>💬 アドバイスを見る</span>
              <span style={{ color: '#c9a9a9' }}>▾</span>
            </button>
          )}

          {/* アドバイス 3枚（展開後） */}
          {adviceOpen && (
            <>
              {/* alternatives */}
              <div className="animate-fade-in rounded-3xl p-5 shadow-sm"
                   style={{ background: 'rgba(255,255,255,0.9)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span>💬</span>
                  <span className="text-xs font-bold tracking-widest" style={{ color: '#ab47bc' }}>
                    こう言えばよかったかも
                  </span>
                </div>
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
              </div>

              {/* insight */}
              <div className="animate-fade-in-2 rounded-3xl p-5 shadow-sm"
                   style={{ background: 'rgba(255,255,255,0.9)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span>✨</span>
                  <span className="text-xs font-bold tracking-widest" style={{ color: '#ff8a65' }}>
                    なぜそうなったか
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#5c2d2d' }}>
                  {(response as IncidentResponse).insight}
                </p>
              </div>

              {/* tip */}
              <div className="animate-fade-in-3 rounded-3xl p-5 shadow-sm"
                   style={{ background: 'rgba(255,255,255,0.9)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span>🌱</span>
                  <span className="text-xs font-bold tracking-widest" style={{ color: '#66bb6a' }}>
                    次のために
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#5c2d2d' }}>
                  {(response as IncidentResponse).tip}
                </p>
              </div>
            </>
          )}

          {/* actions */}
          <div className="flex flex-col gap-3 mt-2 animate-fade-in-4">
            <button onClick={onRetry}
              className="w-full h-12 rounded-2xl text-sm font-bold transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #f48fb1 0%, #ce93d8 100%)', color: '#fff',
                       boxShadow: '0 4px 16px rgba(206,147,216,0.4)' }}>
              もう一度話す
            </button>
            <button onClick={onBack}
              className="w-full h-12 rounded-2xl text-sm font-medium transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.8)', color: '#9e7b7b' }}>
              トップに戻る
            </button>
          </div>

        </div>
      )}
    </div>
  )
}
