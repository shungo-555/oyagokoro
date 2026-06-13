'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Child } from '@/lib/supabase'
import LoginScreen from '@/components/LoginScreen'
import HomeScreen from '@/components/HomeScreen'
import ChildSelectScreen from '@/components/ChildSelectScreen'
import InputScreen from '@/components/InputScreen'
import ResponseScreen from '@/components/ResponseScreen'
import HistoryScreen from '@/components/HistoryScreen'
import SettingsScreen from '@/components/SettingsScreen'

type Screen = 'home' | 'child-select' | 'input' | 'response' | 'history' | 'settings'

interface Props {
  supabaseUrl: string
  supabaseAnonKey: string
}

export default function ClientApp({ supabaseUrl, supabaseAnonKey }: Props) {
  const [screen, setScreen] = useState<Screen>('home')
  const [userInput, setUserInput] = useState('')
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [children, setChildren] = useState<Child[]>([])

  useEffect(() => {
    if (!supabaseUrl || !supabaseAnonKey) {
      setAuthLoading(false)
      return
    }

    const client = createBrowserClient(supabaseUrl, supabaseAnonKey)
    setSupabase(client)

    client.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null)
      setAuthLoading(false)
    })

    const { data: { subscription } } = client.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabaseUrl, supabaseAnonKey])

  // 子供リストを取得（ログイン後）
  useEffect(() => {
    if (!userId) { setChildren([]); return }
    fetch('/api/children')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setChildren(data) })
      .catch(() => {})
  }, [userId])

  const handleStartTalk = () => {
    setSelectedChildId(null)
    if (children.length > 0) {
      setScreen('child-select')
    } else {
      setScreen('input')
    }
  }

  const handleChildSelected = (childId: string | null) => {
    setSelectedChildId(childId)
    setScreen('input')
  }

  const handleSubmit = (text: string) => {
    setUserInput(text)
    setScreen('response')
  }

  const handleBackToHome = () => {
    setScreen('home')
    setSelectedChildId(null)
    setUserInput('')
  }

  if (authLoading) {
    return (
      <div className="app-wrapper min-h-[100svh] sm:flex sm:items-center sm:justify-center sm:p-8">
        <div className="phone-frame flex items-center justify-center"
             style={{ background: 'linear-gradient(160deg, #fff0ea 0%, #fce4ec 50%, #ede7f6 100%)' }}>
          <div className="text-4xl animate-pulse">🌸</div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-wrapper min-h-[100svh] sm:flex sm:items-center sm:justify-center sm:p-8">
      <div className="phone-frame">
        {!userId || !supabase ? (
          <LoginScreen
            supabaseUrl={supabaseUrl}
            supabaseAnonKey={supabaseAnonKey}
            onLogin={() => {}}
          />
        ) : (
          <>
            {screen === 'home' && (
              <HomeScreen
                onStart={handleStartTalk}
                onHistory={() => setScreen('history')}
                onSettings={() => setScreen('settings')}
                onLogout={() => supabase?.auth.signOut()}
              />
            )}
            {screen === 'child-select' && (
              <ChildSelectScreen
                children={children}
                onSelect={handleChildSelected}
                onBack={() => setScreen('home')}
              />
            )}
            {screen === 'input' && (
              <InputScreen
                onBack={() => children.length > 0 ? setScreen('child-select') : setScreen('home')}
                onSubmit={handleSubmit}
              />
            )}
            {screen === 'response' && (
              <ResponseScreen
                userInput={userInput}
                childId={selectedChildId}
                onBack={handleBackToHome}
                onRetry={() => setScreen('input')}
              />
            )}
            {screen === 'history' && (
              <HistoryScreen
                onBack={() => setScreen('home')}
                children={children}
              />
            )}
            {screen === 'settings' && (
              <SettingsScreen
                children={children}
                onBack={() => setScreen('home')}
                onChildrenChange={setChildren}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
