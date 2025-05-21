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
            // Check if we're on localhost - don't attempt to fetch subdomain colors in development
            const host = window.location.host
            
            // Skip for localhost to avoid 404 errors
            if (host.includes('localhost') || !host.includes('.')) {
                console.log("Skipping subdomain color fetch for localhost")
                return
            }
            
            // Extract subdomain properly (first part before first period)
            const subdomain = host.split('.')[0]
            
            const response = await fetch(`/api/public/schools/${subdomain}`)
            if (!response.ok) throw new Error("Failed to fetch subdomain colors")

            const data = await response.json()
            
            // Make sure we get valid data with the expected structure
            if (data.success && data.data?.primaryColor) {
                setColors({
                    primaryColor: data.data.primaryColor,
                    secondaryColor: data.data.secondaryColor || DEFAULT_COLORS.secondaryColor,
                })

                // Set CSS variables
                document.documentElement.style.setProperty('--primary-color', data.data.primaryColor)
                document.documentElement.style.setProperty('--secondary-color', data.data.secondaryColor || DEFAULT_COLORS.secondaryColor)
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