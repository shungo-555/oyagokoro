'use client'

import { useEffect, useState } from 'react'
import type { Conversation, Child } from '@/lib/supabase'

interface Props {
  child: Child
  conversations: Conversation[]
  onBack: () => void
}

const CHILD_COLORS = ['#f48fb1', '#ce93d8', '#90caf9', '#a5d6a7', '#ffcc80', '#80deea']

function calcAge(birthDate: string): string {
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return `${age}歳`
}

export default function ChildDetailScreen({ child, conversations, onBack }: Props) {
  const [trend, setTrend] = useState<string | null>(null)
  const [trendLoading, setTrendLoading] = useState(true)

  const childConvs = conversations.filter(c => c.child_id === child.id)
  const incidentCount = childConvs.filter(c => c.entry_type === 'incident').length
  const goodCount = childConvs.filter(c => c.entry_type === 'good').length
  const total = childConvs.length

  const colorIndex = 0 // 呼び出し元で index を渡す方法もあるが、単純化のため固定
  const childColor = CHILD_COLORS[colorIndex]

  useEffect(() => {
    if (incidentCount === 0) { setTrendLoading(false); return }
    fetch(`/api/child-trend?child_id=${child.id}`)
      .then(r => r.json())
      .then(data => { setTrend(data.trend || null) })
      .catch(() => {})
      .finally(() => setTrendLoading(false))
  }, [child.id, incidentCount])

  const ageText = child.birth_date ? calcAge(child.birth_date) : ''
  const genderText = child.gender === 'boy' ? '男の子' : child.gender === 'girl' ? '女の子' : child.gender === 'other' ? 'その他' : ''
  const subText = [ageText, genderText].filter(Boolean).join('・')

  return (
    <div className="flex flex-col min-h-full"
         style={{ background: 'linear-gradient(160deg, #fff8f5 0%, #fce4ec 100%)' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-8 pb-4 flex-shrink-0 animate-fade-in">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.8)', color: '#c06080' }}
        >
          ←
        </button>
        <span className="text-sm font-medium" style={{ color: '#9e7b7b' }}>子どもの記録</span>
      </div>

      <div className="flex flex-col gap-4 px-5 pb-12 overflow-y-auto">

        {/* Child Profile */}
        <div className="rounded-3xl p-5 flex items-center gap-4 animate-fade-in"
             style={{ background: 'rgba(255,255,255,0.9)' }}>
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
            style={{ background: childColor }}
          >
            {child.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: '#5c2d2d' }}>{child.name}</h2>
            {subText && <p className="text-sm mt-0.5" style={{ color: '#c9a9a9' }}>{subText}</p>}
            <p className="text-xs mt-1" style={{ color: '#9e7b7b' }}>合計 {total} 件の記録</p>
          </div>
        </div>

        {/* 比率グラフ */}
        {total > 0 && (
          <div className="rounded-3xl p-5 animate-fade-in-2" style={{ background: 'rgba(255,255,255,0.9)' }}>
            <p className="text-xs font-bold tracking-widest mb-4" style={{ color: '#9e7b7b' }}>
              記録の内訳
            </p>
            <div className="flex flex-col gap-3">
              {incidentCount > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs w-20 flex-shrink-0" style={{ color: '#7b4f4f' }}>
                    怒ってしまった
                  </span>
                  <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: '#fce4ec' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(incidentCount / total) * 100}%`,
                        background: 'linear-gradient(90deg, #f48fb1, #ce93d8)',
                      }}
                    />
                  </div>
                  <span className="text-xs w-8 text-right flex-shrink-0" style={{ color: '#9e7b7b' }}>
                    {incidentCount}
                  </span>
                </div>
              )}
              {goodCount > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs w-20 flex-shrink-0" style={{ color: '#7b4f4f' }}>
                    よかったこと
                  </span>
                  <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: '#f1f8e9' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(goodCount / total) * 100}%`,
                        background: 'linear-gradient(90deg, #a5d6a7, #80deea)',
                      }}
                    />
                  </div>
                  <span className="text-xs w-8 text-right flex-shrink-0" style={{ color: '#9e7b7b' }}>
                    {goodCount}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI 傾向コメント */}
        {incidentCount > 0 && (
          <div className="rounded-3xl p-5 animate-fade-in-3"
               style={{ background: 'rgba(255,255,255,0.9)' }}>
            <p className="text-xs font-bold tracking-widest mb-3" style={{ color: '#9e7b7b' }}>
              🤖 最近の傾向
            </p>
            {trendLoading ? (
              <p className="text-xs" style={{ color: '#c9a9a9' }}>分析中…</p>
            ) : trend ? (
              <p className="text-sm leading-relaxed" style={{ color: '#5c2d2d' }}>{trend}</p>
            ) : (
              <p className="text-xs" style={{ color: '#c9a9a9' }}>記録が増えると傾向が分かります</p>
            )}
          </div>
        )}

        {/* 会話一覧 */}
        {childConvs.length > 0 ? (
          <div className="flex flex-col gap-3 animate-fade-in-4">
            <p className="text-xs font-bold tracking-widest px-1" style={{ color: '#9e7b7b' }}>
              記録一覧
            </p>
            {childConvs.map(conv => (
              <ChildConvCard key={conv.id} conv={conv} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center animate-fade-in-2">
            <div className="text-4xl">🌱</div>
            <p className="text-sm" style={{ color: '#9e7b7b' }}>まだこの子の記録がありません</p>
          </div>
        )}

      </div>
    </div>
  )
}

function ChildConvCard({ conv }: { conv: Conversation }) {
  const [open, setOpen] = useState(false)
  const d = new Date(conv.created_at)
  const dateStr = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  const isGood = conv.entry_type === 'good'

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-sm"
      style={{ background: 'rgba(255,255,255,0.9)' }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full p-4 text-left"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: isGood ? '#66bb6a' : '#f48fb1' }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs mb-1" style={{ color: '#c9a9a9' }}>{dateStr}</p>
            <p className="text-sm leading-relaxed line-clamp-2" style={{ color: '#7b4f4f' }}>
              {conv.user_input}
            </p>
          </div>
          <span className="text-xs flex-shrink-0" style={{ color: '#c9a9a9' }}>{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 flex flex-col gap-3 border-t" style={{ borderColor: '#f5e8e8' }}>
          {isGood ? (
            <div className="pt-3">
              <p className="text-xs font-bold mb-1" style={{ color: '#66bb6a' }}>✨ よかったこと</p>
              <p className="text-xs leading-relaxed" style={{ color: '#5c2d2d' }}>{conv.empathy}</p>
            </div>
          ) : (
            <>
              <div className="pt-3">
                <p className="text-xs font-bold mb-1" style={{ color: '#64b5f6' }}>💙 AIの共感</p>
                <p className="text-xs leading-relaxed" style={{ color: '#5c2d2d' }}>{conv.empathy}</p>
              </div>
              {conv.insight && (
                <div>
                  <p className="text-xs font-bold mb-1" style={{ color: '#ff8a65' }}>✨ なぜそうなったか</p>
                  <p className="text-xs leading-relaxed" style={{ color: '#5c2d2d' }}>{conv.insight}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
