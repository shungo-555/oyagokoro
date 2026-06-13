'use client'

import { useEffect, useState } from 'react'
import type { Conversation, Child } from '@/lib/supabase'

interface Props {
  onBack: () => void
  children: Child[]
}

const CHILD_COLORS = ['#f48fb1', '#ce93d8', '#90caf9', '#a5d6a7', '#ffcc80', '#80deea']
const UNKNOWN_COLOR = '#bcaaa4'

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export default function HistoryScreen({ onBack, children }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  useEffect(() => {
    fetch('/api/history')
      .then(r => r.json())
      .then(data => {
        setConversations(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const childMap = new Map(children.map((c, i) => [c.id, { name: c.name, color: CHILD_COLORS[i % CHILD_COLORS.length] }]))

  const daysWithEntries = new Set(conversations.map(c => c.created_at.slice(0, 10)))
  const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`

  // 子どもごとのカウント
  const childCounts = children
    .map((child, i) => ({
      id: child.id,
      name: child.name,
      color: CHILD_COLORS[i % CHILD_COLORS.length],
      count: conversations.filter(c => c.child_id === child.id).length,
    }))
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count)

  const unknownCount = conversations.filter(c => !c.child_id).length
  const allChartItems = [
    ...childCounts,
    ...(unknownCount > 0 ? [{ id: '__unknown__', name: '未設定', color: UNKNOWN_COLOR, count: unknownCount }] : []),
  ]
  const maxCount = Math.max(...allChartItems.map(c => c.count), 1)

  const filtered = selectedDate
    ? conversations.filter(c => c.created_at.startsWith(selectedDate))
    : conversations

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
    setSelectedDate(null)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
    setSelectedDate(null)
  }

  return (
    <div className="flex flex-col min-h-full"
         style={{ background: 'linear-gradient(160deg, #fff8f5 0%, #fce4ec 100%)' }}>

      <div className="flex items-center gap-3 px-5 pt-8 pb-4 flex-shrink-0 animate-fade-in">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.8)', color: '#c06080' }}
        >
          ←
        </button>
        <span className="text-sm font-medium" style={{ color: '#9e7b7b' }}>振り返り</span>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm" style={{ color: '#9e7b7b' }}>読み込み中…</p>
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="text-5xl">🌱</div>
          <p className="text-sm leading-relaxed" style={{ color: '#9e7b7b' }}>
            まだ記録がありません。<br />「話してみる」から始めてみましょう。
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 px-5 pb-8 overflow-y-auto">

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 animate-fade-in">
            <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.9)' }}>
              <div className="text-2xl font-bold" style={{ color: '#c06080' }}>{conversations.length}</div>
              <div className="text-xs mt-1" style={{ color: '#9e7b7b' }}>合計の振り返り</div>
            </div>
            <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.9)' }}>
              <div className="text-2xl font-bold" style={{ color: '#c06080' }}>
                {conversations.filter(c => c.created_at.startsWith(monthStr)).length}
              </div>
              <div className="text-xs mt-1" style={{ color: '#9e7b7b' }}>今月の振り返り</div>
            </div>
          </div>

          {/* 子どもごとのチャート */}
          {allChartItems.length > 0 && (
            <div className="rounded-2xl p-4 animate-fade-in-2" style={{ background: 'rgba(255,255,255,0.9)' }}>
              <p className="text-xs font-bold tracking-widest mb-3" style={{ color: '#9e7b7b' }}>
                👶 子どもごと
              </p>
              <div className="flex flex-col gap-2">
                {allChartItems.map(item => (
                  <div key={item.id} className="flex items-center gap-2">
                    <span className="text-xs w-14 text-right flex-shrink-0 truncate" style={{ color: '#7b4f4f' }}>
                      {item.name}
                    </span>
                    <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: '#f5e8e8' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${(item.count / maxCount) * 100}%`, background: item.color }}
                      />
                    </div>
                    <span className="text-xs w-4 text-right flex-shrink-0" style={{ color: '#9e7b7b' }}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Calendar */}
          <div className="rounded-2xl p-4 animate-fade-in-3" style={{ background: 'rgba(255,255,255,0.9)' }}>
            <div className="flex items-center justify-between mb-3">
              <button onClick={prevMonth}
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                style={{ background: '#f5e8e8', color: '#c06080' }}>‹</button>
              <p className="text-xs font-bold" style={{ color: '#9e7b7b' }}>
                {viewYear}年{viewMonth + 1}月
              </p>
              <button onClick={nextMonth}
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                style={{ background: '#f5e8e8', color: '#c06080' }}>›</button>
            </div>
            <div className="grid grid-cols-7 mb-1">
              {['日', '月', '火', '水', '木', '金', '土'].map(d => (
                <div key={d} className="text-center text-xs" style={{ color: '#c9a9a9' }}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const hasEntry = daysWithEntries.has(dateStr)
                const isSelected = selectedDate === dateStr
                const isToday = dateStr === today.toISOString().slice(0, 10)
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                    className="flex flex-col items-center py-1 rounded-xl transition-colors"
                    style={isSelected ? { background: '#f48fb1' } : {}}
                  >
                    <span className="text-xs font-medium" style={{
                      color: isSelected ? '#fff' : isToday ? '#c06080' : '#7b4f4f',
                      fontWeight: isToday ? '700' : undefined,
                    }}>{day}</span>
                    {hasEntry && (
                      <div className="w-1.5 h-1.5 rounded-full mt-0.5"
                        style={{ background: isSelected ? 'rgba(255,255,255,0.8)' : '#f48fb1' }} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex flex-col gap-3 animate-fade-in-4">
            {selectedDate && (
              <p className="text-xs text-center" style={{ color: '#9e7b7b' }}>
                {selectedDate.replace(/-/g, '/')} の振り返り（{filtered.length}件）
                <button onClick={() => setSelectedDate(null)} className="ml-2 underline">全件表示</button>
              </p>
            )}
            {filtered.map(conv => (
              <ConversationCard key={conv.id} conversation={conv} childMap={childMap} />
            ))}
          </div>

        </div>
      )}
    </div>
  )
}

function ConversationCard({
  conversation: c,
  childMap,
}: {
  conversation: Conversation
  childMap: Map<string, { name: string; color: string }>
}) {
  const [open, setOpen] = useState(false)
  const d = new Date(c.created_at)
  const dateStr = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  const childInfo = c.child_id ? childMap.get(c.child_id) : null

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: 'rgba(255,255,255,0.9)' }}>
      <button onClick={() => setOpen(o => !o)} className="w-full p-4 text-left">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs mb-1" style={{ color: '#c9a9a9' }}>{dateStr}</p>
            <p className="text-sm leading-relaxed line-clamp-2" style={{ color: '#7b4f4f' }}>
              {c.user_input}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {childInfo && (
              <span className="text-xs px-2 py-0.5 rounded-full text-white"
                style={{ background: childInfo.color }}>
                {childInfo.name}
              </span>
            )}
            <span className="text-xs" style={{ color: '#c9a9a9' }}>{open ? '▲' : '▼'}</span>
          </div>
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 flex flex-col gap-3 border-t" style={{ borderColor: '#f5e8e8' }}>
          <div className="pt-3">
            <p className="text-xs font-bold mb-1" style={{ color: '#64b5f6' }}>💙 AIの共感</p>
            <p className="text-xs leading-relaxed" style={{ color: '#5c2d2d' }}>{c.empathy}</p>
          </div>
          <div>
            <p className="text-xs font-bold mb-1" style={{ color: '#ab47bc' }}>💬 こう言えばよかったかも</p>
            {(c.alternatives as string[]).map((alt, i) => (
              <p key={i} className="text-xs leading-relaxed" style={{ color: '#5c2d2d' }}>・{alt}</p>
            ))}
          </div>
          <div>
            <p className="text-xs font-bold mb-1" style={{ color: '#ff8a65' }}>✨ なぜそうなったか</p>
            <p className="text-xs leading-relaxed" style={{ color: '#5c2d2d' }}>{c.insight}</p>
          </div>
          <div>
            <p className="text-xs font-bold mb-1" style={{ color: '#66bb6a' }}>🌱 次のために</p>
            <p className="text-xs leading-relaxed" style={{ color: '#5c2d2d' }}>{c.tip}</p>
          </div>
        </div>
      )}
    </div>
  )
}
