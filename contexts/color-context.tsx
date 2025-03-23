"use client"

import { createContext, useContext, useEffect, useState } from "react"

type SchoolColors = {
    primaryColor: string
    secondaryColor: string
}

type ColorContextType = {
    colors: SchoolColors
    setColors: (colors: SchoolColors) => void
}

const ColorContext = createContext<ColorContextType | undefined>(undefined)

export function ColorProvider({ children }: { children: React.ReactNode }) {
    const [colors, setColors] = useState<SchoolColors>({
        primaryColor: "#3b82f6", // Default blue
        secondaryColor: "#1f2937", // Default gray
    })

    useEffect(() => {
        // Fetch school colors when the provider mounts
        async function fetchSchoolColors() {
            try {
                const response = await fetch("/api/schools/current")
                if (!response.ok) throw new Error("Failed to fetch school colors")
                const data = await response.json()

                if (data.school?.primaryColor && data.school?.secondaryColor) {
                    setColors({
                        primaryColor: data.school.primaryColor,
                        secondaryColor: data.school.secondaryColor,
                    })

                    // Set CSS variables
                    document.documentElement.style.setProperty('--primary-color', data.school.primaryColor)
                    document.documentElement.style.setProperty('--secondary-color', data.school.secondaryColor)
                }
            } catch (error) {
                console.error("Error fetching school colors:", error)
            }
        }

        fetchSchoolColors()
    }, [])

    return (
        <ColorContext.Provider value={{ colors, setColors }}>
            {children}
        </ColorContext.Provider>
    )
}

export function useColors() {
    const context = useContext(ColorContext)
    if (context === undefined) {
        throw new Error("useColors must be used within a ColorProvider")
    }
    return context
} 