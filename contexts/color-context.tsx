"use client"

import { createContext, useContext, useEffect, useState } from "react"

type SchoolColors = {
    primaryColor: string
    secondaryColor: string
}
type ColorContextType = {
    primaryColor?: string
    colors: SchoolColors
    setColors: (colors: SchoolColors) => void
}

const DEFAULT_COLORS = {
    primaryColor: "#3b82f6", // Default blue
    secondaryColor: "#1f2937", // Default gray
}

const ColorContext = createContext<ColorContextType | undefined>(undefined)

export function ColorProvider({ children }: { children: React.ReactNode }) {
    const [colors, setColors] = useState<SchoolColors>(DEFAULT_COLORS)

    // Function to fetch colors from current school
    const fetchCurrentSchoolColors = async () => {
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

    // Function to fetch colors from subdomain
    const fetchSubdomainColors = async () => {
        try {
            const host = window.location.host
            const subdomain = host.split('.')[0]

            if (!subdomain || subdomain === 'localhost:3000') {
                return // Don't fetch for localhost
            }

            const response = await fetch(`/api/public/schools/${subdomain}`)
            if (!response.ok) throw new Error("Failed to fetch subdomain colors")

            const data = await response.json()
            if (data.school?.primaryColor) {
                setColors({
                    primaryColor: data.school.primaryColor,
                    secondaryColor: data.school.secondaryColor || DEFAULT_COLORS.secondaryColor,
                })

                // Set CSS variables
                document.documentElement.style.setProperty('--primary-color', data.school.primaryColor)
                document.documentElement.style.setProperty('--secondary-color', data.school.secondaryColor || DEFAULT_COLORS.secondaryColor)
            }
        } catch (error) {
            console.error("Error fetching subdomain colors:", error)
        }
    }

    useEffect(() => {
        // First try to fetch current school colors
        fetchCurrentSchoolColors()

        // Then try to fetch subdomain colors
        fetchSubdomainColors()
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