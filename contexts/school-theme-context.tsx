"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"

interface SchoolTheme {
  primaryColor: string
  secondaryColor: string
  schoolId: string
  schoolName: string
}

interface SchoolThemeContextType {
  theme: SchoolTheme | null
  isLoading: boolean
  setTheme: (theme: SchoolTheme) => void
}

const SchoolThemeContext = createContext<SchoolThemeContextType | undefined>(undefined)

const DEFAULT_THEME: SchoolTheme = {
  primaryColor: "#f97316",
  secondaryColor: "#16a34a",
  schoolId: "",
  schoolName: "",
}

export function SchoolThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<SchoolTheme | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load from localStorage on mount
    const cached = localStorage.getItem("school-theme")
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        setThemeState(parsed)
      } catch (error) {
        console.error("Failed to parse cached theme:", error)
        setThemeState(DEFAULT_THEME)
      }
    } else {
      setThemeState(DEFAULT_THEME)
    }
    setIsLoading(false)
  }, [])

  const setTheme = (newTheme: SchoolTheme) => {
    setThemeState(newTheme)
    // Persist to localStorage
    localStorage.setItem("school-theme", JSON.stringify(newTheme))
  }

  return (
    <SchoolThemeContext.Provider value={{ theme, isLoading, setTheme }}>
      {children}
    </SchoolThemeContext.Provider>
  )
}

export function useSchoolTheme() {
  const context = useContext(SchoolThemeContext)
  if (context === undefined) {
    throw new Error("useSchoolTheme must be used within SchoolThemeProvider")
  }
  return context
}
