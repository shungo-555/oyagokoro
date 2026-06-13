'use client'

import type { Child } from '@/lib/supabase'

interface Props {
  children: Child[]
  onSelect: (childId: string | null) => void
  onBack: () => void
}

const CHILD_COLORS = ['#f48fb1', '#ce93d8', '#90caf9', '#a5d6a7', '#ffcc80', '#80deea']

export default function ChildSelectScreen({ children, onSelect, onBack }: Props) {
  function calcAge(birthDate: string): number {
    const birth = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age
  }

  return (
    <div className="flex flex-col min-h-full px-5 py-8"
         style={{ background: 'linear-gradient(160deg, #fff8f5 0%, #fce4ec 100%)' }}>

      <div className="flex items-center gap-3 mb-8 animate-fade-in">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
          style={{ background: 'rgba(255,255,255,0.8)', color: '#c06080' }}
        >
          ←
        </button>
      </div>

      <div className="mb-8 animate-fade-in-2">
        <h2 className="text-2xl font-bold leading-snug" style={{ color: '#5c2d2d' }}>
          誰のことについて<br />話しますか？
        </h2>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: '#9e7b7b' }}>
          スキップしても、会話から自動で判断します。
        </p>
      </div>

      <div className="flex flex-col gap-3 flex-1 animate-fade-in-3">
        {children.map((child, i) => {
          const color = CHILD_COLORS[i % CHILD_COLORS.length]
          const ageText = child.birth_date ? `${calcAge(child.birth_date)}歳` : ''
          const genderText = child.gender === 'boy' ? '男の子' : child.gender === 'girl' ? '女の子' : child.gender === 'other' ? 'その他' : ''
          const sub = [ageText, genderText].filter(Boolean).join('・')

          return (
            <button
              key={child.id}
              onClick={() => onSelect(child.id)}
              className="w-full py-4 rounded-3xl text-left px-5 shadow-sm transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.9)' }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
                  style={{ background: color }}
                >
                  {child.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-base" style={{ color: '#5c2d2d' }}>{child.name}</p>
                  {sub && <p className="text-xs mt-0.5" style={{ color: '#c9a9a9' }}>{sub}</p>}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="mt-6 pb-2 text-center animate-fade-in-4">
        <button
          onClick={() => onSelect(null)}
          className="text-sm px-6 py-3 rounded-full transition-all active:scale-95"
          style={{ background: 'rgba(255,255,255,0.7)', color: '#9e7b7b' }}
        >
          スキップ（会話から自動で判断）
        </button>
      </div>
    </div>
  )
}
