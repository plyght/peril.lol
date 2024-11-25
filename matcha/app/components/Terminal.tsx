'use client'

import { useState, useEffect } from 'react'

export function Terminal() {
  const [text, setText] = useState('')
  const fullText = `
Welcome to Matcha 🍵

$ ls -la
total 32
drwxr-xr-x   5 user  group   160 May 15 14:30 .
drwxr-xr-x  15 user  group   480 May 15 14:28 ..
-rw-r--r--   1 user  group   492 May 15 14:30 .gitignore
-rw-r--r--   1 user  group  1462 May 15 14:30 README.md
drwxr-xr-x   4 user  group   128 May 15 14:30 src

$ cat README.md
# Matcha Theme

An earthy, minimal Ghostty theme with soft pastel vibes.

## Installation

1. Clone this repository
2. Copy the theme file to your Ghostty config directory
3. Enjoy your new Matcha theme!

$ echo "Enjoy your Matcha theme!"
Enjoy your Matcha theme!

$`

  useEffect(() => {
    let i = 0
    const timer = setInterval(() => {
      setText(fullText.slice(0, i))
      i++
      if (i > fullText.length) clearInterval(timer)
    }, 50)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="bg-[#2e322d] text-[#e1ddcf] p-4 rounded-lg shadow-lg font-mono text-sm md:text-base overflow-hidden" style={{ height: '400px' }}>
      <div className="flex space-x-2 mb-4">
        <div className="w-3 h-3 rounded-full bg-[#b85c5c]"></div>
        <div className="w-3 h-3 rounded-full bg-[#97b572]"></div>
        <div className="w-3 h-3 rounded-full bg-[#c3b37c]"></div>
      </div>
      <pre className="whitespace-pre-wrap break-all">
        {text}
        <span className="animate-pulse">▊</span>
      </pre>
    </div>
  )
}

