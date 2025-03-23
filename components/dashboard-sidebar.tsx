"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserRole } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  LogOut,
  Menu,
  School,
  Users,
  BookOpen,
  Calendar,
  Settings,
  UserCircle,
  GraduationCap,
  UserCog,
  LayoutDashboard,
  Users2,
  BookOpenCheck,
  FolderKanban,
  BookText,
  Building2,
  Bell,
  ClipboardCheck,
  Medal,
  Layers
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DashboardSidebarProps {
  user: {
    role: UserRole
    name: string
    profileImage?: string | null
  }
}

// Helper function to convert hex to HSL
function convertHexToHsl(hex: string): string {
  hex = hex.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2

  let h = 0
  let s = 0

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }

    h = h / 6
  }

  const hDegrees = Math.round(h * 360)
  const sPercent = Math.round(s * 100)
  const lPercent = Math.round(l * 100)

  return `${hDegrees}deg ${sPercent}% ${lPercent}%`
}

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [schoolInfo, setSchoolInfo] = useState<{
    name: string
    logo?: string
    primaryColor?: string
    secondaryColor?: string
  } | null>(null)
  const [activeColor, setActiveColor] = useState("#e3f92d")

  useEffect(() => {
    const fetchSchoolInfo = async () => {
      try {
        const response = await fetch("/api/schools/current")
        if (!response.ok) {
          throw new Error("Failed to fetch school information")
        }

        const data = await response.json()
        setSchoolInfo(data.school)

        if (data.school.primaryColor) {
          setActiveColor(data.school.primaryColor)
        }
      } catch (error) {
        // Silent fail - use default values
      }
    }

    fetchSchoolInfo()
  }, [])

  const handleLogout = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to logout")
      }

      window.location.href = "/login"
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getNavigationItems = () => {
    switch (user.role) {
      case "super_admin":
      case "school_admin":
        return [
          { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
          { title: "Teachers", href: "/dashboard/teachers", icon: UserCog },
          { title: "Students", href: "/dashboard/students", icon: GraduationCap },
          { title: "Result", href: "/dashboard/results", icon: GraduationCap },
          { title: "Academic Session ", href: "/dashboard/sessions", icon: School },
          { title: "Parents", href: "/dashboard/parents", icon: UserCircle },
          { title: "Classes", href: "/dashboard/classes", icon: School },
          { title: "Subjects", href: "/dashboard/subjects", icon: BookText },
          { title: "Departments", href: "/dashboard/departments", icon: Layers },
          { title: "School Levels", href: "/dashboard/school-levels", icon: Layers },
          { title: "Calendar", href: "/dashboard/calendar", icon: Calendar },
          { title: "Settings", href: "/dashboard/settings", icon: Settings },
        ]
      case "teacher":
        return [
          { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
          { title: "My Classes", href: "/dashboard/my-classes", icon: School },
          { title: "Students", href: "/dashboard/students", icon: GraduationCap },
          { title: "Calendar", href: "/dashboard/calendar", icon: Calendar },
          { title: "Settings", href: "/dashboard/settings", icon: Settings },
        ]
      case "student":
        return [
          { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
          { title: "My Classes", href: "/dashboard/my-classes", icon: School },
          { title: "Calendar", href: "/dashboard/calendar", icon: Calendar },
          { title: "Settings", href: "/dashboard/settings", icon: Settings },
        ]
      case "parent":
        return [
          { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
          { title: "Children", href: "/dashboard/children", icon: GraduationCap },
          { title: "Calendar", href: "/dashboard/calendar", icon: Calendar },
          { title: "Settings", href: "/dashboard/settings", icon: Settings },
        ]
      default:
        return []
    }
  }

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname === path || pathname.startsWith(`${path}/`)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4">
        {schoolInfo?.logo ? (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md overflow-hidden">
              <img
                src={schoolInfo.logo}
                alt={schoolInfo.name}
                className="h-full w-full object-contain"
              />
            </div>
            <span className="text-lg font-bold truncate">{schoolInfo.name}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md">
              <GraduationCap className="h-5 w-5 text-gray-700" />
            </div>
            <span className="text-lg font-bold">EduIT</span>
          </div>
        )}
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {getNavigationItems().map((item) => {
          const Icon = item.icon
          const isItemActive = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-5 py-3 text-sm font-medium transition-colors",
                isItemActive
                  ? "text-gray- text-white"
                  : "text-gray-700 hover:bg-gray-100"
              )}
              style={isItemActive ? { backgroundColor: activeColor } : undefined}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          )
        })}
      </nav>
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user.profileImage || undefined} />
            <AvatarFallback>{user.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user.role.replace('_', ' ')}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            disabled={isLoading}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

