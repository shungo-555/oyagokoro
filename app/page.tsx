'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import LoginScreen from '@/components/LoginScreen'
import HomeScreen from '@/components/HomeScreen'
import InputScreen from '@/components/InputScreen'
import ResponseScreen from '@/components/ResponseScreen'
import HistoryScreen from '@/components/HistoryScreen'

type Screen = 'home' | 'input' | 'response' | 'history'

export default function Page() {
  const [screen, setScreen] = useState<Screen>('home')
  const [userInput, setUserInput] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    // クライアントサイドのみで実行（SSR 時は呼ばない）
    const supabase = createSupabaseBrowserClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null)
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = (text: string) => {
    setUserInput(text)
    setScreen('response')
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
        {!userId ? (
          <LoginScreen onLogin={() => {}} />
        ) : (
          <>
            {screen === 'home' && (
              <HomeScreen
                onStart={() => setScreen('input')}
                onHistory={() => setScreen('history')}
              />
            )}
            {screen === 'input' && (
              <InputScreen
                onBack={() => setScreen('home')}
                onSubmit={handleSubmit}
              />
            )}
            {screen === 'response' && (
              <ResponseScreen
                userInput={userInput}
                onBack={() => setScreen('home')}
                onRetry={() => setScreen('input')}
              />
            )}
            {screen === 'history' && (
              <HistoryScreen
                onBack={() => setScreen('home')}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
