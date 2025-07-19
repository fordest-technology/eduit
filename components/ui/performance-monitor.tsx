"use client"

import { useEffect, useRef } from "react"
import { logger } from "@/lib/logger"

interface PerformanceMonitorProps {
    pageName: string
    children: React.ReactNode
}

export function PerformanceMonitor({ pageName, children }: PerformanceMonitorProps) {
    const startTime = useRef<number>(Date.now())
    const mounted = useRef<boolean>(false)

    useEffect(() => {
        if (!mounted.current) {
            mounted.current = true
            const loadTime = Date.now() - startTime.current

            logger.api(`${pageName} page render`, loadTime, {
                pageName,
                renderTime: `${loadTime}ms`
            })
        }
    }, [pageName])

    return <>{children}</>
}

// Hook for monitoring API calls
export function useApiMonitor() {
    const startTime = useRef<number>(0)

    const startMonitoring = () => {
        startTime.current = Date.now()
    }

    const endMonitoring = (operation: string, context?: Record<string, any>) => {
        const duration = Date.now() - startTime.current
        logger.api(operation, duration, context)
    }

    return { startMonitoring, endMonitoring }
} 