"use client"

// --- UI Primitives ---
import { Button } from "@/components/ui/input/tiptap/tiptap-ui-primitive/button"

// --- Icons ---
import { MoonStarIcon } from "@/components/ui/input/tiptap/tiptap-icons/moon-star-icon"
import { SunIcon } from "@/components/ui/input/tiptap/tiptap-icons/sun-icon"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode)
  }, [isDarkMode])

  const toggleDarkMode = () => setIsDarkMode((isDark) => !isDark)

  return (
    <></>
  )
}
