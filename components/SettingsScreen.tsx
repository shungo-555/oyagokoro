'use client'

import { useState } from 'react'
import type { Child } from '@/lib/supabase'

interface Props {
  children: Child[]
  onBack: () => void
  onChildrenChange: (children: Child[]) => void
}

interface FormState {
  name: string
  birth_year: string
  gender: string
}

const EMPTY_FORM: FormState = { name: '', birth_year: '', gender: '' }

export default function SettingsScreen({ children, onBack, onChildrenChange }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openAdd = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError(null)
    setShowForm(true)
  }

  const openEdit = (child: Child) => {
    setEditingId(child.id)
    setForm({
      name: child.name,
      birth_year: child.birth_year?.toString() ?? '',
      gender: child.gender ?? '',
    })
    setError(null)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setError('名前を入力してください'); return }
    setSaving(true)
    setError(null)
    try {
      const body = {
        name: form.name.trim(),
        birth_year: form.birth_year ? parseInt(form.birth_year) : null,
        gender: form.gender || null,
      }

      let updated: Child[]
      if (editingId) {
        const res = await fetch(`/api/children/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? '保存に失敗しました')
        updated = children.map(c => c.id === editingId ? data : c)
      } else {
        const res = await fetch('/api/children', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? '保存に失敗しました')
        updated = [...children, data]
      }

      onChildrenChange(updated)
      setShowForm(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('削除しますか？この子どもとの紐づきも解除されます。')) return
    try {
      const res = await fetch(`/api/children/${id}`, { method: 'DELETE' })
      if (!res.ok) { alert('削除に失敗しました'); return }
      onChildrenChange(children.filter(c => c.id !== id))
    } catch {
      alert('削除に失敗しました')
    }
  }

  const currentYear = new Date().getFullYear()

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
        <span className="text-sm font-medium" style={{ color: '#9e7b7b' }}>子どもの管理</span>
      </div>

      {!showForm ? (
        <>
          <div className="flex flex-col gap-3 flex-1 animate-fade-in-2">
            {children.length === 0 ? (
              <div className="rounded-3xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.8)' }}>
                <p className="text-sm leading-relaxed" style={{ color: '#9e7b7b' }}>
                  まだ登録されていません。<br />「＋ 追加する」から始めましょう。
                </p>
              </div>
            ) : (
              children.map(child => {
                const ageText = child.birth_year ? `${currentYear - child.birth_year}歳` : null
                const genderText = child.gender === 'boy' ? '男の子' : child.gender === 'girl' ? '女の子' : child.gender === 'other' ? 'その他' : null
                const sub = [ageText, genderText].filter(Boolean).join('・')
                return (
                  <div key={child.id}
                    className="rounded-3xl p-4 flex items-center justify-between shadow-sm"
                    style={{ background: 'rgba(255,255,255,0.9)' }}>
                    <div>
                      <p className="font-bold text-base" style={{ color: '#5c2d2d' }}>{child.name}</p>
                      {sub && <p className="text-xs mt-0.5" style={{ color: '#c9a9a9' }}>{sub}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(child)}
                        className="text-xs px-3 py-1.5 rounded-full transition-all active:scale-95"
                        style={{ background: '#f5e8e8', color: '#c06080' }}
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDelete(child.id)}
                        className="text-xs px-3 py-1.5 rounded-full transition-all active:scale-95"
                        style={{ background: '#fce4ec', color: '#e57373' }}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <button
            onClick={openAdd}
            className="mt-6 w-full h-14 rounded-2xl text-base font-bold transition-all active:scale-95 animate-fade-in-3"
            style={{
              background: 'linear-gradient(135deg, #f48fb1 0%, #ce93d8 100%)',
              color: '#fff',
              boxShadow: '0 6px 24px rgba(206,147,216,0.45)',
            }}
          >
            ＋ 追加する
          </button>
        </>
      ) : (
        <div className="flex flex-col gap-5 animate-fade-in-2">
          <h2 className="text-lg font-bold" style={{ color: '#5c2d2d' }}>
            {editingId ? '子どもを編集' : '子どもを追加'}
          </h2>

          <div className="flex flex-col gap-4 rounded-3xl p-5" style={{ background: 'rgba(255,255,255,0.9)' }}>
            <div>
              <label className="text-xs font-bold mb-1.5 block" style={{ color: '#9e7b7b' }}>
                名前・ニックネーム <span style={{ color: '#e57373' }}>*</span>
              </label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="例：太郎、ちゃん、くん"
                className="w-full rounded-2xl px-4 py-3 text-sm border-0 shadow-sm outline-none"
                style={{ background: '#fff8f5', color: '#5c2d2d' }}
              />
            </div>

            <div>
              <label className="text-xs font-bold mb-1.5 block" style={{ color: '#9e7b7b' }}>
                生まれた年（任意）
              </label>
              <input
                value={form.birth_year}
                onChange={e => setForm(f => ({ ...f, birth_year: e.target.value }))}
                placeholder={`例：${currentYear - 8}`}
                type="number"
                min="2000"
                max={currentYear}
                className="w-full rounded-2xl px-4 py-3 text-sm border-0 shadow-sm outline-none"
                style={{ background: '#fff8f5', color: '#5c2d2d' }}
              />
            </div>

            <div>
              <label className="text-xs font-bold mb-2 block" style={{ color: '#9e7b7b' }}>
                性別（任意）
              </label>
              <div className="flex gap-2">
                {(['boy', 'girl', 'other'] as const).map(val => {
                  const label = val === 'boy' ? '男の子' : val === 'girl' ? '女の子' : 'その他'
                  const selected = form.gender === val
                  return (
                    <button
                      key={val}
                      onClick={() => setForm(f => ({ ...f, gender: f.gender === val ? '' : val }))}
                      className="flex-1 py-2.5 rounded-full text-sm transition-all active:scale-95"
                      style={selected ? {
                        background: 'linear-gradient(135deg, #f48fb1 0%, #ce93d8 100%)',
                        color: '#fff',
                      } : {
                        background: '#f5e8e8',
                        color: '#9e7b7b',
                      }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {error && (
            <p className="text-xs text-center" style={{ color: '#e57373' }}>{error}</p>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-14 rounded-2xl text-base font-bold transition-all active:scale-95 disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #f48fb1 0%, #ce93d8 100%)',
              color: '#fff',
              boxShadow: '0 6px 24px rgba(206,147,216,0.45)',
            }}
          >
            {saving ? '保存中…' : '保存する'}
          </button>

          <button
            onClick={() => setShowForm(false)}
            className="w-full h-12 rounded-2xl text-sm transition-all active:scale-95"
            style={{ background: 'rgba(255,255,255,0.8)', color: '#9e7b7b' }}
          >
            キャンセル
          </button>
        </div>
      )}
    </div>
  )
}
