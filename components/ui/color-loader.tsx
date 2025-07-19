"use client"

import { useColors } from "@/contexts/color-context"
import { useEffect, useState } from "react"

interface ColorLoaderProps {
    children: React.ReactNode
    fallback?: React.ReactNode
}

export function ColorLoader({ children, fallback }: ColorLoaderProps) {
    const { isLoading } = useColors()
    const [showContent, setShowContent] = useState(false)

    useEffect(() => {
        // Small delay to ensure smooth transition
        const timer = setTimeout(() => {
            setShowContent(true)
        }, 100)

        return () => clearTimeout(timer)
    }, [])

    // Show fallback while loading
    if (isLoading && !showContent) {
        return (
            <div className="min-h-screen bg-background">
                {fallback || (
                    <div className="flex items-center justify-center min-h-screen">
                        <div className="animate-pulse">
                            <div className="w-8 h-8 bg-muted rounded-full"></div>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    return <>{children}</>
}

// Hook for components that need to wait for colors
export function useColorLoading() {
    const { isLoading } = useColors()
    return { isLoading }
} 