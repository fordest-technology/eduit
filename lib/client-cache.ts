/**
 * Client-side cache utility for frequently accessed data
 * Stores in localStorage with TTL (time-to-live)
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // milliseconds
}

class AppCache {
  private static instance: AppCache

  private constructor() {}

  static getInstance(): AppCache {
    if (!AppCache.instance) {
      AppCache.instance = new AppCache()
    }
    return AppCache.instance
  }

  /**
   * Get cached data if valid, otherwise return null
   */
  get<T>(key: string): T | null {
    if (typeof window === "undefined") return null

    try {
      const cached = localStorage.getItem(`cache:${key}`)
      if (!cached) return null

      const entry: CacheEntry<T> = JSON.parse(cached)
      const now = Date.now()

      // Check if expired
      if (now - entry.timestamp > entry.ttl) {
        this.remove(key)
        return null
      }

      return entry.data
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error)
      return null
    }
  }

  /**
   * Set cached data with TTL (default: 5 minutes)
   */
  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    if (typeof window === "undefined") return

    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttlMs,
      }
      localStorage.setItem(`cache:${key}`, JSON.stringify(entry))
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error)
    }
  }

  /**
   * Remove cached data
   */
  remove(key: string): void {
    if (typeof window === "undefined") return
    localStorage.removeItem(`cache:${key}`)
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    if (typeof window === "undefined") return

    const keys = Object.keys(localStorage)
    keys.forEach((key) => {
      if (key.startsWith("cache:")) {
        localStorage.removeItem(key)
      }
    })
  }

  /**
   * Get or fetch pattern - returns cached data or fetches new
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number = 5 * 60 * 1000
  ): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const data = await fetcher()
    this.set(key, data, ttlMs)
    return data
  }
}

// Export singleton instance
export const appCache = AppCache.getInstance()

// Common cache keys
export const CACHE_KEYS = {
  SCHOOL_THEME: (schoolId: string) => `school-theme:${schoolId}`,
  SCHOOL_INFO: (schoolId: string) => `school-info:${schoolId}`,
  USER_PERMISSIONS: (userId: string) => `user-permissions:${userId}`,
  ACADEMIC_LEVELS: (schoolId: string) => `levels:${schoolId}`,
  SUBJECTS: (schoolId: string) => `subjects:${schoolId}`,
  TEACHERS: (schoolId: string) => `teachers:${schoolId}`,
}

// Common TTLs
export const CACHE_TTL = {
  SHORT: 1 * 60 * 1000, // 1 minute
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 30 * 60 * 1000, // 30 minutes
  HOUR: 60 * 60 * 1000, // 1 hour
  DAY: 24 * 60 * 60 * 1000, // 24 hours
}
