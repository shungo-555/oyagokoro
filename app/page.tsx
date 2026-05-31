'use client'

import { useState } from 'react'
import HomeScreen from '@/components/HomeScreen'
import InputScreen from '@/components/InputScreen'
import ResponseScreen from '@/components/ResponseScreen'
import HistoryScreen from '@/components/HistoryScreen'

type Screen = 'home' | 'input' | 'response' | 'history'

export default function Page() {
  const [screen, setScreen] = useState<Screen>('home')
  const [userInput, setUserInput] = useState('')

  const handleSubmit = (text: string) => {
    setUserInput(text)
    setScreen('response')
  }

  return (
    <div className="app-wrapper min-h-[100svh] sm:flex sm:items-center sm:justify-center sm:p-8">
      <div className="phone-frame">
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
      </div>
    </div>
  )
}
