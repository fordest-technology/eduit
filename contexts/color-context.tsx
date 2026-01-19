"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { logger } from "@/lib/logger"

type SchoolColors = {
    primaryColor: string
    secondaryColor: string
}

type ColorContextType = {
    primaryColor?: string
    colors: SchoolColors
    setColors: (colors: SchoolColors) => void
    refreshColors: () => Promise<void>
    isLoading: boolean
}

const DEFAULT_COLORS = {
    primaryColor: "#3b82f6", // Default blue
    secondaryColor: "#1f2937", // Default gray
}

// Color conversion helpers
function hexToHSL(hex: string): string {
    let c = hex.substring(1).split('');
    if (c.length === 3) {
        c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    const rCr = parseInt(c.slice(0, 2).join(''), 16) / 255;
    const gCr = parseInt(c.slice(2, 4).join(''), 16) / 255;
    const bCr = parseInt(c.slice(4, 6).join(''), 16) / 255;

    const max = Math.max(rCr, gCr, bCr), min = Math.min(rCr, gCr, bCr);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case rCr: h = (gCr - bCr) / d + (gCr < bCr ? 6 : 0); break;
            case gCr: h = (bCr - rCr) / d + 2; break;
            case bCr: h = (rCr - gCr) / d + 4; break;
        }
        h /= 6;
    }
    s = s * 100;
    s = Math.round(s * 10) / 10;
    l = l * 100;
    l = Math.round(l * 10) / 10;
    h = Math.round(h * 360);

    return `${h} ${s}% ${l}%`;
}

function getContrastYIQ(hexcolor: string) {
    hexcolor = hexcolor.replace("#", "");
    if (hexcolor.length === 3) {
        hexcolor = hexcolor.split('').map(c => c + c).join('');
    }
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '222.2 84% 4.9%' : '210 40% 98%'; // Foreground: Dark or Light (matching globals.css defaults)
}

// Cache configuration
const CACHE_CONFIG = {
    LOCAL_STORAGE_KEY: 'eduit_school_colors',
    SESSION_STORAGE_KEY: 'eduit_session_colors',
    CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    SESSION_CACHE_DURATION: 60 * 60 * 1000, // 1 hour in milliseconds
}

interface CachedColors {
    colors: SchoolColors
    timestamp: number
    schoolId?: string
    subdomain?: string
}

const ColorContext = createContext<ColorContextType | undefined>(undefined)

// Utility functions for cache management
const cacheUtils = {
    // Get cached colors from localStorage
    getCachedColors: (): CachedColors | null => {
        try {
            if (typeof window === 'undefined') return null

            const cached = localStorage.getItem(CACHE_CONFIG.LOCAL_STORAGE_KEY)
            if (!cached) return null

            const parsed: CachedColors = JSON.parse(cached)
            const now = Date.now()

            // Check if cache is still valid
            if (now - parsed.timestamp > CACHE_CONFIG.CACHE_DURATION) {
                localStorage.removeItem(CACHE_CONFIG.LOCAL_STORAGE_KEY)
                return null
            }

            return parsed
        } catch (error) {
            logger.error("Error reading cached colors", error)
            return null
        }
    },

    // Get session cached colors
    getSessionCachedColors: (): CachedColors | null => {
        try {
            if (typeof window === 'undefined') return null

            const cached = sessionStorage.getItem(CACHE_CONFIG.SESSION_STORAGE_KEY)
            if (!cached) return null

            const parsed: CachedColors = JSON.parse(cached)
            const now = Date.now()

            // Check if session cache is still valid
            if (now - parsed.timestamp > CACHE_CONFIG.SESSION_CACHE_DURATION) {
                sessionStorage.removeItem(CACHE_CONFIG.SESSION_STORAGE_KEY)
                return null
            }

            return parsed
        } catch (error) {
            logger.error("Error reading session cached colors", error)
            return null
        }
    },

    // Cache colors in localStorage
    cacheColors: (colors: SchoolColors, schoolId?: string, subdomain?: string): void => {
        try {
            if (typeof window === 'undefined') return

            const cachedData: CachedColors = {
                colors,
                timestamp: Date.now(),
                schoolId,
                subdomain
            }

            localStorage.setItem(CACHE_CONFIG.LOCAL_STORAGE_KEY, JSON.stringify(cachedData))
            logger.info("Colors cached successfully", { schoolId, subdomain })
        } catch (error) {
            logger.error("Error caching colors", error)
        }
    },

    // Cache colors in sessionStorage
    cacheSessionColors: (colors: SchoolColors, schoolId?: string, subdomain?: string): void => {
        try {
            if (typeof window === 'undefined') return

            const cachedData: CachedColors = {
                colors,
                timestamp: Date.now(),
                schoolId,
                subdomain
            }

            sessionStorage.setItem(CACHE_CONFIG.SESSION_STORAGE_KEY, JSON.stringify(cachedData))
            logger.info("Session colors cached successfully", { schoolId, subdomain })
        } catch (error) {
            logger.error("Error caching session colors", error)
        }
    },

    // Clear all color caches
    clearCaches: (): void => {
        try {
            if (typeof window === 'undefined') return

            localStorage.removeItem(CACHE_CONFIG.LOCAL_STORAGE_KEY)
            sessionStorage.removeItem(CACHE_CONFIG.SESSION_STORAGE_KEY)
            logger.info("Color caches cleared")
        } catch (error) {
            logger.error("Error clearing color caches", error)
        }
    },

    // Apply colors to CSS variables
    applyColors: (colors: SchoolColors): void => {
        try {
            if (typeof document === 'undefined') return

            const primaryHSL = hexToHSL(colors.primaryColor)
            const primaryForegroundHSL = getContrastYIQ(colors.primaryColor)
            const secondaryHSL = hexToHSL(colors.secondaryColor)
            const secondaryForegroundHSL = getContrastYIQ(colors.secondaryColor)

            // Update standard ShadCN variables
            document.documentElement.style.setProperty('--primary', primaryHSL)
            document.documentElement.style.setProperty('--primary-foreground', primaryForegroundHSL)
            document.documentElement.style.setProperty('--ring', primaryHSL)
            
            document.documentElement.style.setProperty('--secondary', secondaryHSL)
            document.documentElement.style.setProperty('--secondary-foreground', secondaryForegroundHSL)

            // Update custom variables
            document.documentElement.style.setProperty('--primary-color', colors.primaryColor)
            document.documentElement.style.setProperty('--secondary-color', colors.secondaryColor)

            logger.info("Colors applied to CSS variables", {
                primary: colors.primaryColor,
                secondary: colors.secondaryColor
            })
        } catch (error) {
            logger.error("Error applying colors to CSS variables", error)
        }
    }
}

export function ColorProvider({ children }: { children: React.ReactNode }) {
    const [colors, setColors] = useState<SchoolColors>(DEFAULT_COLORS)
    const [isLoading, setIsLoading] = useState(true)

    // Function to fetch colors from current school
    const fetchCurrentSchoolColors = useCallback(async (): Promise<SchoolColors | null> => {
        try {
            const response = await fetch("/api/schools/current")
            
            // Handle 401 Unauthorized gracefully - expected for non-logged in users
            if (response.status === 401) {
                logger.info("No current school session found (public page)")
                return null
            }

            if (!response.ok) throw new Error(`Failed to fetch school colors: ${response.statusText}`)
            
            const data = await response.json()

            if (data.school?.primaryColor && data.school?.secondaryColor) {
                const schoolColors = {
                    primaryColor: data.school.primaryColor,
                    secondaryColor: data.school.secondaryColor,
                }

                // Cache the colors
                cacheUtils.cacheColors(schoolColors, data.school.id)
                cacheUtils.cacheSessionColors(schoolColors, data.school.id)

                return schoolColors
            }
            return null
        } catch (error) {
            // Only log actual unexpected errors
            logger.error("Unexpected error fetching school colors", error)
            return null
        }
    }, [])

    // Function to fetch colors from subdomain
    const fetchSubdomainColors = useCallback(async (): Promise<SchoolColors | null> => {
        try {
            // Check if we're on localhost - don't attempt to fetch subdomain colors in development
            const host = window.location.host

            // Skip for localhost to avoid 404 errors
            if (host.includes('localhost') || !host.includes('.')) {
                logger.info("Skipping subdomain color fetch for localhost")
                return null
            }

            // Extract subdomain properly (first part before first period)
            const subdomain = host.split('.')[0]

            const response = await fetch(`/api/public/schools/${subdomain}`)
            
            // Handle 404 gracefully - subdomain might not match a school
            if (response.status === 404) {
                logger.info("No matching school found for subdomain", { subdomain })
                return null
            }

            if (!response.ok) throw new Error(`Failed to fetch subdomain colors: ${response.statusText}`)

            const data = await response.json()

            // Make sure we get valid data with the expected structure
            if (data.success && data.data?.primaryColor) {
                const subdomainColors = {
                    primaryColor: data.data.primaryColor,
                    secondaryColor: data.data.secondaryColor || DEFAULT_COLORS.secondaryColor,
                }

                // Cache the colors
                cacheUtils.cacheColors(subdomainColors, undefined, subdomain)
                cacheUtils.cacheSessionColors(subdomainColors, undefined, subdomain)

                return subdomainColors
            }
            return null
        } catch (error) {
            // Only log actual unexpected errors
            logger.error("Unexpected error fetching subdomain colors", error)
            return null
        }
    }, [])

    // Function to load colors with caching strategy
    const loadColors = useCallback(async () => {
        setIsLoading(true)

        try {
            // 1. First, try to load from session cache (fastest)
            const sessionCached = cacheUtils.getSessionCachedColors()
            if (sessionCached) {
                setColors(sessionCached.colors)
                cacheUtils.applyColors(sessionCached.colors)
                setIsLoading(false)
                logger.info("Colors loaded from session cache")
                return
            }

            // 2. Then, try to load from localStorage cache
            const cached = cacheUtils.getCachedColors()
            if (cached) {
                setColors(cached.colors)
                cacheUtils.applyColors(cached.colors)
                // Also cache in session for faster subsequent loads
                cacheUtils.cacheSessionColors(cached.colors, cached.schoolId, cached.subdomain)
                setIsLoading(false)
                logger.info("Colors loaded from localStorage cache")
                return
            }

            // 3. If no cache, fetch fresh colors
            logger.info("No cached colors found, fetching fresh colors")

            // Try current school colors first
            let fetchedColors = await fetchCurrentSchoolColors()

            // If no current school colors, try subdomain colors
            if (!fetchedColors) {
                fetchedColors = await fetchSubdomainColors()
            }

            // If we got colors, apply them
            if (fetchedColors) {
                setColors(fetchedColors)
                cacheUtils.applyColors(fetchedColors)
                logger.info("Fresh colors fetched and applied")
            } else {
                // Fallback to default colors
                setColors(DEFAULT_COLORS)
                cacheUtils.applyColors(DEFAULT_COLORS)
                logger.info("Using default colors as fallback")
            }
        } catch (error) {
            logger.error("Error loading colors", error)
            // Fallback to default colors
            setColors(DEFAULT_COLORS)
            cacheUtils.applyColors(DEFAULT_COLORS)
        } finally {
            setIsLoading(false)
        }
    }, [fetchCurrentSchoolColors, fetchSubdomainColors])

    // Function to refresh colors (force fetch)
    const refreshColors = useCallback(async () => {
        logger.info("Refreshing colors")
        cacheUtils.clearCaches()
        await loadColors()
    }, [loadColors])

    useEffect(() => {
        loadColors()
    }, [loadColors])

    // Listen for storage events to sync colors across tabs
    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === CACHE_CONFIG.LOCAL_STORAGE_KEY && event.newValue) {
                try {
                    const newCached: CachedColors = JSON.parse(event.newValue)
                    setColors(newCached.colors)
                    cacheUtils.applyColors(newCached.colors)
                    logger.info("Colors synced from other tab")
                } catch (error) {
                    logger.error("Error syncing colors from storage event", error)
                }
            }
        }

        if (typeof window !== 'undefined') {
            window.addEventListener('storage', handleStorageChange)
            return () => window.removeEventListener('storage', handleStorageChange)
        }
    }, [])

    return (
        <ColorContext.Provider value={{ colors, setColors, refreshColors, isLoading }}>
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