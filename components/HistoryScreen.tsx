'use client'

import { useEffect, useState } from 'react'
import type { Conversation, Child } from '@/lib/supabase'

interface Props {
  onBack: () => void
  onChildDetail: (child: Child) => void
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

interface ConfirmState {
  ids: string[]
  message: string
}

function calcStreak(conversations: Conversation[]): { current: number; best: number } {
  const incidentDates = [
    ...new Set(
      conversations
        .filter(c => c.entry_type === 'incident')
        .map(c => c.created_at.slice(0, 10))
    ),
  ].sort()

  if (incidentDates.length === 0) {
    // incident 記録が一切ない場合
    const allDates = [...new Set(conversations.map(c => c.created_at.slice(0, 10)))].sort()
    if (allDates.length === 0) return { current: 0, best: 0 }
    const firstDate = new Date(allDates[0])
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const days = Math.floor((today.getTime() - firstDate.getTime()) / 86400000) + 1
    return { current: days, best: days }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const lastIncident = new Date(incidentDates[incidentDates.length - 1])
  lastIncident.setHours(0, 0, 0, 0)
  const current = Math.floor((today.getTime() - lastIncident.getTime()) / 86400000)

  // 最長記録: incident 間の最大空白日数
  let best = current
  for (let i = 0; i < incidentDates.length - 1; i++) {
    const a = new Date(incidentDates[i])
    const b = new Date(incidentDates[i + 1])
    const gap = Math.floor((b.getTime() - a.getTime()) / 86400000) - 1
    if (gap > best) best = gap
  }

  return { current, best }
}

export default function HistoryScreen({ onBack, onChildDetail, children }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [chartOpen, setChartOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
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

  // カレンダー用: 日付 → entry_type のセット
  const dateEntryTypes = new Map<string, Set<string>>()
  for (const c of conversations) {
    const date = c.created_at.slice(0, 10)
    if (!dateEntryTypes.has(date)) dateEntryTypes.set(date, new Set())
    dateEntryTypes.get(date)!.add(c.entry_type)
  }

  const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`

  const childCounts = children
    .map((child, i) => ({
      id: child.id,
      name: child.name,
      color: CHILD_COLORS[i % CHILD_COLORS.length],
      count: conversations.filter(c => c.child_id === child.id).length,
      child,
    }))
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count)

  const unknownCount = conversations.filter(c => !c.child_id).length
  const allChartItems = [
    ...childCounts,
    ...(unknownCount > 0 ? [{ id: '__unknown__', name: '未設定', color: UNKNOWN_COLOR, count: unknownCount, child: null }] : []),
  ]
  const maxCount = Math.max(...allChartItems.map(c => c.count), 1)

  const filtered = selectedDate
    ? conversations.filter(c => c.created_at.startsWith(selectedDate))
    : conversations

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)

  const streak = calcStreak(conversations)

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

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAll = () => setSelectedIds(new Set(filtered.map(c => c.id)))
  const clearAll = () => setSelectedIds(new Set())
  const enterEditMode = () => { setEditMode(true); setSelectedIds(new Set()) }
  const exitEditMode = () => { setEditMode(false); setSelectedIds(new Set()) }

  const requestDeleteSingle = (id: string) => {
    setConfirm({ ids: [id], message: 'この振り返りを削除しますか？' })
  }
  const requestDeleteSelected = () => {
    setConfirm({ ids: [...selectedIds], message: `${selectedIds.size}件の振り返りを削除しますか？` })
  }

  const executeDelete = async () => {
    if (!confirm) return
    setDeleting(true)
    try {
      const res = await fetch('/api/history', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: confirm.ids }),
      })
      if (!res.ok) { alert('削除に失敗しました'); return }
      const deletedSet = new Set(confirm.ids)
      setConversations(prev => prev.filter(c => !deletedSet.has(c.id)))
      setSelectedIds(prev => { const next = new Set(prev); confirm.ids.forEach(id => next.delete(id)); return next })
      setConfirm(null)
      if (confirm.ids.length > 1) exitEditMode()
    } catch {
      alert('削除に失敗しました')
    } finally {
      setDeleting(false)
    }
  }

  const allFilteredSelected = filtered.length > 0 && filtered.every(c => selectedIds.has(c.id))

  return (
    <div className="relative flex flex-col min-h-full"
         style={{ background: 'linear-gradient(160deg, #fff8f5 0%, #fce4ec 100%)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-8 pb-4 flex-shrink-0 animate-fade-in">
        <div className="flex items-center gap-3">
          {!editMode && (
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.8)', color: '#c06080' }}
            >
              ←
            </button>
          )}
          <span className="text-sm font-medium" style={{ color: '#9e7b7b' }}>振り返り</span>
        </div>
        {conversations.length > 0 && (
          editMode ? (
            <button onClick={exitEditMode} className="text-sm px-4 py-1.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.8)', color: '#c06080' }}>完了</button>
          ) : (
            <button onClick={enterEditMode} className="text-sm px-4 py-1.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.8)', color: '#9e7b7b' }}>編集</button>
          )
        )}
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
        <div className="flex flex-col gap-4 px-5 pb-32 overflow-y-auto">

          {!editMode && (
            <>
              {/* ── 連続日数ヒーロー ── */}
              <div className="rounded-2xl p-4 animate-fade-in"
                   style={{ background: 'linear-gradient(135deg, rgba(165,214,167,0.28) 0%, rgba(128,222,234,0.28) 100%)',
                            border: '1px solid rgba(165,214,167,0.45)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold tracking-widest mb-1" style={{ color: '#558b2f' }}>
                      怒らなかった日
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold" style={{ color: '#388e3c' }}>{streak.current}</span>
                      <span className="text-sm" style={{ color: '#558b2f' }}>日連続</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs" style={{ color: '#9e7b7b' }}>最長記録</p>
                    <div className="flex items-baseline gap-1 justify-end">
                      <span className="text-xl font-bold" style={{ color: '#66bb6a' }}>{streak.best}</span>
                      <span className="text-xs" style={{ color: '#9e7b7b' }}>日</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── コンパクト統計 ── */}
              <div className="grid grid-cols-2 gap-3 animate-fade-in">
                <div className="rounded-2xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.9)' }}>
                  <div className="text-xl font-bold" style={{ color: '#c06080' }}>{conversations.length}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#9e7b7b' }}>合計の記録</div>
                </div>
                <div className="rounded-2xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.9)' }}>
                  <div className="text-xl font-bold" style={{ color: '#c06080' }}>
                    {conversations.filter(c => c.created_at.startsWith(monthStr)).length}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: '#9e7b7b' }}>今月の記録</div>
                </div>
              </div>

              {/* ── 子どもごと（アコーディオン） ── */}
              {allChartItems.length > 0 && (
                <div className="rounded-2xl overflow-hidden animate-fade-in-2"
                     style={{ background: 'rgba(255,255,255,0.9)' }}>
                  <button
                    onClick={() => setChartOpen(o => !o)}
                    className="w-full flex items-center justify-between px-4 py-3 transition-opacity active:opacity-70"
                  >
                    <span className="text-xs font-bold tracking-widest" style={{ color: '#9e7b7b' }}>
                      👶 子どもごと
                    </span>
                    <span className="text-xs" style={{ color: '#c9a9a9' }}>{chartOpen ? '▲' : '▼'}</span>
                  </button>
                  {chartOpen && (
                    <div className="px-4 pb-4 flex flex-col gap-2 border-t" style={{ borderColor: '#f5e8e8' }}>
                      <div className="pt-3 flex flex-col gap-2">
                        {allChartItems.map(item => (
                          <button
                            key={item.id}
                            className="flex items-center gap-2 w-full text-left transition-opacity active:opacity-70"
                            onClick={() => item.child && onChildDetail(item.child)}
                            disabled={!item.child}
                          >
                            <span className="text-xs w-14 text-right flex-shrink-0 truncate" style={{ color: '#7b4f4f' }}>
                              {item.name}
                            </span>
                            <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: '#f5e8e8' }}>
                              <div className="h-full rounded-full transition-all duration-500"
                                   style={{ width: `${(item.count / maxCount) * 100}%`, background: item.color }} />
                            </div>
                            <span className="text-xs w-4 text-right flex-shrink-0" style={{ color: '#9e7b7b' }}>{item.count}</span>
                            {item.child && <span className="text-xs flex-shrink-0" style={{ color: '#c9a9a9' }}>›</span>}
                          </button>
                        ))}
                      </div>
                      {childCounts.length > 0 && (
                        <p className="text-xs mt-1 text-center" style={{ color: '#c9a9a9' }}>
                          名前をタップすると詳細を見られます
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── カレンダー（アコーディオン） ── */}
              <div className="rounded-2xl overflow-hidden animate-fade-in-3"
                   style={{ background: 'rgba(255,255,255,0.9)' }}>
                <button
                  onClick={() => setCalendarOpen(o => !o)}
                  className="w-full flex items-center justify-between px-4 py-3 transition-opacity active:opacity-70"
                >
                  <span className="text-xs font-bold tracking-widest" style={{ color: '#9e7b7b' }}>
                    📅 カレンダー
                    {selectedDate && <span className="ml-2 font-normal" style={{ color: '#c06080' }}>
                      {selectedDate.replace(/-/g, '/')} 絞込中
                    </span>}
                  </span>
                  <span className="text-xs" style={{ color: '#c9a9a9' }}>{calendarOpen ? '▲' : '▼'}</span>
                </button>
                {calendarOpen && (
                  <div className="px-4 pb-4 border-t" style={{ borderColor: '#f5e8e8' }}>
                    <div className="flex items-center justify-between mt-3 mb-2">
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
                        const types = dateEntryTypes.get(dateStr)
                        const hasIncident = types?.has('incident')
                        const hasGood = types?.has('good')
                        const isSelected = selectedDate === dateStr
                        const isToday = dateStr === today.toISOString().slice(0, 10)
                        let dotColor = hasIncident ? '#f48fb1' : hasGood ? '#66bb6a' : null
                        if (isSelected) dotColor = 'rgba(255,255,255,0.8)'
                        return (
                          <button key={day}
                            onClick={() => (types?.size ?? 0) > 0 && setSelectedDate(isSelected ? null : dateStr)}
                            className="flex flex-col items-center py-1 rounded-xl transition-colors"
                            style={isSelected ? { background: '#f48fb1' } : {}}>
                            <span className="text-xs font-medium" style={{
                              color: isSelected ? '#fff' : isToday ? '#c06080' : '#7b4f4f',
                              fontWeight: isToday ? '700' : undefined,
                            }}>{day}</span>
                            {dotColor && <div className="w-1.5 h-1.5 rounded-full mt-0.5" style={{ background: dotColor }} />}
                          </button>
                        )
                      })}
                    </div>
                    <div className="flex gap-4 justify-center mt-3">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ background: '#f48fb1' }} />
                        <span className="text-xs" style={{ color: '#c9a9a9' }}>怒ってしまった</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ background: '#66bb6a' }} />
                        <span className="text-xs" style={{ color: '#c9a9a9' }}>よかったこと</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Conversation List */}
          <div className="flex flex-col gap-3 animate-fade-in-4">
            {editMode && (
              <div className="flex items-center justify-between px-1">
                <button onClick={allFilteredSelected ? clearAll : selectAll}
                  className="text-xs px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.8)', color: '#c06080' }}>
                  {allFilteredSelected ? '全解除' : '全選択'}
                </button>
                <span className="text-xs" style={{ color: '#9e7b7b' }}>
                  {selectedIds.size > 0 ? `${selectedIds.size}件選択中` : '選択してください'}
                </span>
              </div>
            )}

            {!editMode && selectedDate && (
              <p className="text-xs text-center" style={{ color: '#9e7b7b' }}>
                {selectedDate.replace(/-/g, '/')} の振り返り（{filtered.length}件）
                <button onClick={() => setSelectedDate(null)} className="ml-2 underline">全件表示</button>
              </p>
            )}

            {filtered.map(conv => (
              <ConversationCard
                key={conv.id}
                conversation={conv}
                childMap={childMap}
                editMode={editMode}
                selected={selectedIds.has(conv.id)}
                onToggleSelect={() => toggleSelect(conv.id)}
                onDeleteSingle={() => requestDeleteSingle(conv.id)}
              />
            ))}
          </div>

        </div>
      )}

      {/* 編集モード：下部削除バー */}
      {editMode && (
        <div className="absolute bottom-0 left-0 right-0 px-5 py-4"
             style={{ background: 'rgba(255,248,245,0.95)', borderTop: '1px solid #f5e8e8' }}>
          <button
            onClick={requestDeleteSelected}
            disabled={selectedIds.size === 0}
            className="w-full h-12 rounded-2xl text-sm font-bold transition-all active:scale-95 disabled:opacity-40"
            style={selectedIds.size > 0 ? {
              background: 'linear-gradient(135deg, #ef9a9a 0%, #e57373 100%)',
              color: '#fff',
              boxShadow: '0 4px 16px rgba(229,115,115,0.4)',
            } : { background: '#f5e8e8', color: '#c9a9a9' }}
          >
            {selectedIds.size > 0 ? `${selectedIds.size}件を削除する` : '削除する記録を選んでください'}
          </button>
        </div>
      )}

      {/* 確認モーダル */}
      {confirm && (
        <div className="absolute inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => !deleting && setConfirm(null)} />
          <div className="relative w-full rounded-t-3xl px-6 pt-6 pb-8 flex flex-col gap-4"
               style={{ background: '#fff' }}>
            <div className="w-10 h-1 rounded-full mx-auto mb-1" style={{ background: '#e0cccc' }} />
            <p className="text-base font-bold text-center" style={{ color: '#5c2d2d' }}>
              {confirm.message}
            </p>
            <p className="text-xs text-center" style={{ color: '#9e7b7b' }}>この操作は取り消せません。</p>
            <button onClick={executeDelete} disabled={deleting}
              className="w-full h-13 rounded-2xl text-sm font-bold py-3.5 transition-all active:scale-95 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #ef9a9a 0%, #e57373 100%)', color: '#fff' }}>
              {deleting ? '削除中…' : '削除する'}
            </button>
            <button onClick={() => !deleting && setConfirm(null)}
              className="w-full h-12 rounded-2xl text-sm transition-all active:scale-95"
              style={{ background: '#f5e8e8', color: '#9e7b7b' }}>
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ConversationCard({
  conversation: c,
  childMap,
  editMode,
  selected,
  onToggleSelect,
  onDeleteSingle,
}: {
  conversation: Conversation
  childMap: Map<string, { name: string; color: string }>
  editMode: boolean
  selected: boolean
  onToggleSelect: () => void
  onDeleteSingle: () => void
}) {
  const [open, setOpen] = useState(false)
  const d = new Date(c.created_at)
  const dateStr = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  const childInfo = c.child_id ? childMap.get(c.child_id) : null
  const isGood = c.entry_type === 'good'

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-sm transition-all"
      style={{
        background: selected ? 'rgba(244,143,177,0.15)' : 'rgba(255,255,255,0.9)',
        outline: selected ? '2px solid #f48fb1' : 'none',
      }}
    >
      <button
        onClick={editMode ? onToggleSelect : () => setOpen(o => !o)}
        className="w-full p-4 text-left"
      >
        <div className="flex items-start gap-3">
          {editMode && (
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                style={{ borderColor: selected ? '#f48fb1' : '#c9a9a9', background: selected ? '#f48fb1' : 'transparent' }}>
                {selected && <span className="text-white text-xs leading-none">✓</span>}
              </div>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs mb-1" style={{ color: '#c9a9a9' }}>{dateStr}</p>
            <p className="text-sm leading-relaxed line-clamp-2" style={{ color: '#7b4f4f' }}>
              {c.user_input}
            </p>
          </div>
          {!editMode && (
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <div className="flex items-center gap-1">
                {isGood && (
                  <span className="text-xs px-2 py-0.5 rounded-full text-white"
                    style={{ background: '#66bb6a' }}>
                    よかった
                  </span>
                )}
                {childInfo && (
                  <span className="text-xs px-2 py-0.5 rounded-full text-white"
                    style={{ background: childInfo.color }}>
                    {childInfo.name}
                  </span>
                )}
              </div>
              <span className="text-xs" style={{ color: '#c9a9a9' }}>{open ? '▲' : '▼'}</span>
            </div>
          )}
        </div>
      </button>

      {!editMode && open && (
        <div className="px-4 pb-4 flex flex-col gap-3 border-t" style={{ borderColor: '#f5e8e8' }}>
          {isGood ? (
            <div className="pt-3">
              <p className="text-xs font-bold mb-1" style={{ color: '#66bb6a' }}>✨ よかったこと</p>
              <p className="text-xs leading-relaxed" style={{ color: '#5c2d2d' }}>{c.empathy}</p>
            </div>
          ) : (
            <>
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
            </>
          )}
          <button
            onClick={onDeleteSingle}
            className="mt-1 w-full py-2.5 rounded-xl text-xs font-medium transition-all active:scale-95"
            style={{ background: '#fce4ec', color: '#e57373' }}
          >
            この記録を削除する
          </button>
        </div>
      )}
    </div>
  )
}
