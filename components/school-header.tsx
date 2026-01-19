"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { appCache, CACHE_KEYS, CACHE_TTL } from "@/lib/client-cache"

interface SchoolBranding {
  logo: string | null
  name: string
  primaryColor: string
  secondaryColor: string
}

export function useSchoolBranding(schoolId: string) {
  const [branding, setBranding] = useState<SchoolBranding>({
    logo: null,
    name: "",
    primaryColor: "#f97316",
    secondaryColor: "#16a34a",
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBranding() {
      try {
        const cached = appCache.get<SchoolBranding>(CACHE_KEYS.SCHOOL_INFO(schoolId))
        
        if (cached) {
          setBranding(cached)
          setLoading(false)
          return
        }

        // Fetch from API
        const response = await fetch(`/api/schools/${schoolId}/branding`)
        if (response.ok) {
          const data = await response.json()
          const brandingData: SchoolBranding = {
            logo: data.logo,
            name: data.name,
            primaryColor: data.primaryColor || "#f97316",
            secondaryColor: data.secondaryColor || "#16a34a",
          }
          
          setBranding(brandingData)
          appCache.set(CACHE_KEYS.SCHOOL_INFO(schoolId), brandingData, CACHE_TTL.HOUR)
        }
      } catch (error) {
        console.error("Failed to load school branding:", error)
      } finally {
        setLoading(false)
      }
    }

    if (schoolId) {
      fetchBranding()
    }
  }, [schoolId])

  return { branding, loading }
}

interface SchoolHeaderProps {
  schoolId: string
  title: string
  description?: string
  icon?: React.ReactNode
}

export function SchoolHeader({ schoolId, title, description, icon }: SchoolHeaderProps) {
  const { branding, loading } = useSchoolBranding(schoolId)

  return (
    <div 
      className="rounded-2xl p-6 mb-6"
      style={{
        background: `linear-gradient(135deg, ${branding.primaryColor}15 0%, ${branding.secondaryColor}10 100%)`,
        borderLeft: `4px solid ${branding.primaryColor}`,
      }}
    >
      <div className="flex items-center gap-4">
        {branding.logo && (
          <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-white shadow-md flex-shrink-0">
            <Image
              src={branding.logo}
              alt={branding.name}
              fill
              className="object-contain p-2"
            />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            {icon && (
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${branding.primaryColor}20` }}
              >
                {icon}
              </div>
            )}
            <h1 
              className="text-3xl font-bold font-sora"
              style={{ color: branding.primaryColor }}
            >
              {title}
            </h1>
          </div>
          {description && (
            <p className="text-slate-600 font-medium">{description}</p>
          )}
          {branding.name && (
            <p className="text-xs text-slate-400 uppercase tracking-widest font-black mt-2">
              {branding.name}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
