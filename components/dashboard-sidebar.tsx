"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, BookOpen, Calendar, GraduationCap, Home, LogOut, Settings, Users, Bell, BookOpenCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import type { UserRole } from "@/lib/auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { getSession } from "@/lib/auth"
import {
  LayoutDashboard,
  Users2,
  CalendarDays,
  ClipboardCheck,
  Medal,
} from "lucide-react"

interface DashboardSidebarProps {
  user: {
    name: string
    role: UserRole
    profileImage?: string | null
  }
}

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname()
  const [schoolInfo, setSchoolInfo] = useState<{
    name: string
    logo?: string
    primaryColor?: string
    secondaryColor?: string
  } | null>(null)

  useEffect(() => {
    // Fetch school information when component mounts
    const fetchSchoolInfo = async () => {
      try {
        const response = await fetch("/api/schools/current")
        if (response.ok) {
          const data = await response.json()
          setSchoolInfo(data.school)

          // Apply school colors to CSS variables if available
          if (data.school.primaryColor) {
            document.documentElement.style.setProperty("--primary", convertHexToHsl(data.school.primaryColor))
          }
          if (data.school.secondaryColor) {
            document.documentElement.style.setProperty("--secondary", convertHexToHsl(data.school.secondaryColor))
          }
        }
      } catch (error) {
        console.error("Failed to fetch school info:", error)
      }
    }

    fetchSchoolInfo()
  }, [])

  // Function to convert hex color to HSL format for CSS variables
  const convertHexToHsl = (hex: string): string => {
    // Remove the # if present
    hex = hex.replace("#", "")

    // Convert hex to RGB
    const r = Number.parseInt(hex.substring(0, 2), 16) / 255
    const g = Number.parseInt(hex.substring(2, 4), 16) / 255
    const b = Number.parseInt(hex.substring(4, 6), 16) / 255

    // Find min and max RGB components
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)

    let h = 0,
      s = 0,
      l = (max + min) / 2

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

      h *= 60
    }

    // Return HSL values in the format expected by Tailwind CSS variables
    return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
  }

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`)
  }

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Logout failed")
      }

      // Redirect to login page
      window.location.href = "/login"
    } catch (error) {
      console.error("Logout failed:", error)
      // Even if there's an error, try to redirect to login
      window.location.href = "/login"
    }
  }

  return (
    <SidebarProvider>
      <Sidebar className="border-r">
        <SidebarHeader className="flex flex-col gap-2 px-6 py-4">
          <div className="flex items-center justify-between">
            {schoolInfo?.logo ? (
              <div className="flex items-center gap-2">
                <img
                  src={schoolInfo.logo}
                  alt={schoolInfo.name}
                  className="h-8 w-8 rounded-md object-contain"
                />
                <span className="text-lg font-bold truncate">{schoolInfo.name}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                  <GraduationCap className="h-4 w-4 text-primary" />
                </div>
                <span className="text-lg font-bold">EduIT</span>
              </div>
            )}
            <SidebarTrigger />
          </div>
          {schoolInfo && (
            <div className="text-xs text-muted-foreground truncate">{schoolInfo.name}</div>
          )}
        </SidebarHeader>
        <SidebarContent className="px-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/dashboard")}>
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Super Admin and School Admin */}
            {(user.role === "super_admin" || user.role === "school_admin") && (
              <>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/dashboard/users")}>
                    <Link href="/dashboard/users">
                      <Users2 className="h-4 w-4" />
                      <span>Users</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/dashboard/classes")}>
                    <Link href="/dashboard/classes">
                      <GraduationCap className="h-4 w-4" />
                      <span>Classes</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/dashboard/sessions")}>
                    <Link href="/dashboard/sessions">
                      <BookOpenCheck className="h-4 w-4" />
                      <span>Sessions</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/dashboard/events")}>
                    <Link href="/dashboard/events">
                      <CalendarDays className="h-4 w-4" />
                      <span>Events</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            )}

            {/* All users except parents */}
            {user.role !== "parent" && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/attendance")}>
                  <Link href="/dashboard/attendance">
                    <Calendar className="h-4 w-4" />
                    <span>Attendance</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}

            {/* All users */}
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/dashboard/results")}>
                <Link href="/dashboard/results">
                  <Medal className="h-4 w-4" />
                  <span>Results</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/dashboard/settings")}>
                <Link href="/dashboard/settings">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t px-6 py-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.profileImage || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium leading-none">{user.name}</span>
              <span className="text-xs text-muted-foreground capitalize">
                {user.role.replace("_", " ")}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto h-8 w-8"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Log out</span>
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  )
}

