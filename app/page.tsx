'use client'

import { useState } from 'react'
import HomeScreen from '@/components/HomeScreen'
import InputScreen from '@/components/InputScreen'
import ResponseScreen from '@/components/ResponseScreen'

type Screen = 'home' | 'input' | 'response'

export default function Page() {
  const [screen, setScreen] = useState<Screen>('home')
  const [userInput, setUserInput] = useState('')

  const handleSubmit = (text: string) => {
    setUserInput(text)
    setScreen('response')
  }

  return (
    /* PC: 中央にスマホフレーム / スマホ: 全画面 */
    <div className="app-wrapper min-h-[100svh] sm:flex sm:items-center sm:justify-center sm:p-8">
      <div className="phone-frame">
        {screen === 'home' && (
          <HomeScreen onStart={() => setScreen('input')} />
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
      </div>
    </div>
  )
}
