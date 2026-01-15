"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { UserRole } from "@/lib/auth"
import {
  LogOut,
  School,
  Coins,
  Calendar,
  Settings,
  UserCircle,
  GraduationCap,
  UserCog,
  LayoutDashboard,
  BookText,
  Building2,
  ClipboardCheck,
  Layers,
  ChevronLeft,
  ChevronRight,
  Receipt,
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
  hex = hex.replace("#", "")
  const r = Number.parseInt(hex.substring(0, 2), 16) / 255
  const g = Number.parseInt(hex.substring(2, 4), 16) / 255
  const b = Number.parseInt(hex.substring(4, 6), 16) / 255

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
  const [collapsed, setCollapsed] = useState(false)
  const [schoolInfo, setSchoolInfo] = useState<{
    name: string
    logo?: string
    primaryColor?: string
    secondaryColor?: string
  } | null>(null)
  const [activeColor, setActiveColor] = useState("#4f46e5")
  const [activeColorHsl, setActiveColorHsl] = useState("226deg 64% 40%")

  // Check if the screen is mobile on mount and window resize
  useEffect(() => {
    const checkIfMobile = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true)
      }
    }

    // Initial check
    checkIfMobile()

    // Add event listener
    window.addEventListener("resize", checkIfMobile)

    // Clean up
    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

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
          const hsl = convertHexToHsl(data.school.primaryColor)
          setActiveColorHsl(hsl)
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
      case "SUPER_ADMIN":
        return [
          { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
          { title: "Wallet & Fees", href: "/dashboard/wallet", icon: Receipt },
          { title: "Fees Management", href: "/dashboard/fees", icon: Coins },
          { title: "Teachers", href: "/dashboard/teachers", icon: UserCog },
          { title: "Students", href: "/dashboard/students", icon: GraduationCap },
          {
            title: "Results",
            href: "/dashboard/results",
            icon: ClipboardCheck,
            children: [
              { title: "Results Management", href: "/dashboard/results" },
              { title: "Results Configuration", href: "/dashboard/results/configuration" },
            ]
          },
          { title: "Academic Session", href: "/dashboard/sessions", icon: Calendar },
          { title: "Parents", href: "/dashboard/parents", icon: UserCircle },
          { title: "Classes", href: "/dashboard/classes", icon: School },
          { title: "Subjects", href: "/dashboard/subjects", icon: BookText },
          { title: "Departments", href: "/dashboard/departments", icon: Layers },
          { title: "School Levels", href: "/dashboard/school-levels", icon: Building2 },
          { title: "Calendar", href: "/dashboard/calendar", icon: Calendar },
          { title: "Settings", href: "/dashboard/settings", icon: Settings },
        ]
      case "SCHOOL_ADMIN":
        return [
          { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
          { title: "Wallet & Fees", href: "/dashboard/wallet", icon: Receipt },
          { title: "Fees Management", href: "/dashboard/fees", icon: Coins },
          { title: "Teachers", href: "/dashboard/teachers", icon: UserCog },
          { title: "Students", href: "/dashboard/students", icon: GraduationCap },
          {
            title: "Results",
            href: "/dashboard/results",
            icon: ClipboardCheck,
            children: [
              { title: "Results Management", href: "/dashboard/results" },
              { title: "Results Configuration", href: "/dashboard/results/configuration" },
            ]
          },
          { title: "Academic Session", href: "/dashboard/sessions", icon: Calendar },
          { title: "Parents", href: "/dashboard/parents", icon: UserCircle },
          { title: "Classes", href: "/dashboard/classes", icon: School },
          { title: "Subjects", href: "/dashboard/subjects", icon: BookText },
          { title: "Departments", href: "/dashboard/departments", icon: Layers },
          { title: "School Levels", href: "/dashboard/school-levels", icon: Building2 },
          { title: "Calendar", href: "/dashboard/calendar", icon: Calendar },
          { title: "Settings", href: "/dashboard/settings", icon: Settings },
        ]
      case "TEACHER":
        return [
          { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
          { title: "My Classes", href: "/dashboard/my-classes", icon: School },
          { title: "Students", href: "/dashboard/students", icon: GraduationCap },
          {
            title: "Results",
            href: "/dashboard/results",
            icon: ClipboardCheck,
            children: [
              { title: "Results Management", href: "/dashboard/results" },
              { title: "Results Configuration", href: "/dashboard/results/configuration" },
            ]
          },
          { title: "Calendar", href: "/dashboard/calendar", icon: Calendar },
          { title: "Settings", href: "/dashboard/settings", icon: Settings },
        ]
      case "STUDENT":
        return [
          { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
          { title: "My Classes", href: "/dashboard/my-classes", icon: School },
          { title: "Calendar", href: "/dashboard/calendar", icon: Calendar },
          { title: "Settings", href: "/dashboard/settings", icon: Settings },
        ]
      case "PARENT":
        return [
          { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
          { title: "My Children", href: "/dashboard/children", icon: GraduationCap },
          { title: "School Fees", href: "/dashboard/cfees", icon: Coins },
          { title: "Events", href: "/dashboard/pevents", icon: Calendar },
          { title: "Settings", href: "/dashboard/p-settings", icon: Settings },
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

  // Group navigation items by category for admin roles
  const getGroupedNavItems = () => {
    // For non-admin roles (including parent), return all items in the main group
    if (
      !["SUPER_ADMIN", "SCHOOL_ADMIN"].includes(user.role)
    ) {
      return { main: getNavigationItems() }
    }

    // For admin roles, group the items by category
    const items = getNavigationItems()
    return {
      main: items.filter((item) => ["/dashboard", "/dashboard/wallet", "/dashboard/fees", "/dashboard/calendar"].includes(item.href)),
      users: items.filter((item) =>
        ["/dashboard/teachers", "/dashboard/students", "/dashboard/parents"].includes(item.href),
      ),
      academics: items.filter((item) =>
        [
          "/dashboard/classes",
          "/dashboard/subjects",
          "/dashboard/departments",
          "/dashboard/school-levels",
          "/dashboard/sessions",
          "/dashboard/results",
        ].includes(item.href),
      ),
      system: items.filter((item) => ["/dashboard/settings"].includes(item.href)),
    }
  }

  const groupedNavItems = getGroupedNavItems()

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          "flex h-screen flex-col border-r transition-all duration-500 ease-in-out z-50 overflow-hidden relative font-poppins",
          collapsed ? "w-[80px]" : "w-72",
        )}
        style={{
          backgroundColor: activeColorHsl ? `hsl(${activeColorHsl.split(' ')[0]} 15% 98%)` : "hsl(210 20% 98%)",
          borderColor: activeColor + "20"
        }}
      >
        {/* Ambient Glows */}
        <div
          className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full blur-[100px] pointer-events-none opacity-20"
          style={{ backgroundColor: activeColor }}
        />

        {/* Header */}
        <div className="flex h-20 items-center px-6 z-50 flex-shrink-0 relative">
          {schoolInfo?.logo ? (
            <div className={cn("flex items-center gap-3 transition-all duration-300", collapsed && "justify-center w-full")}>
              <div className="h-10 w-10 rounded-xl bg-white shadow-xl shadow-black/5 ring-1 ring-black/5 p-1.5 flex items-center justify-center overflow-hidden flex-shrink-0 z-50">
                <img
                  src={schoolInfo.logo || "/placeholder.svg"}
                  alt={schoolInfo.name}
                  className="h-full w-full object-contain"
                />
              </div>
              {!collapsed && (
                <div className="flex flex-col">
                  <span className="text-base font-bold font-sora truncate tracking-tight text-slate-800 leading-none">
                    {schoolInfo.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-[0.2em] mt-1">Management</span>
                </div>
              )}
            </div>
          ) : (
            <div className={cn("flex items-center gap-3", collapsed && "justify-center w-full")}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-xl shadow-black/5 ring-1 ring-black/5 flex-shrink-0">
                <GraduationCap className="h-6 w-6" style={{ color: activeColor }} />
              </div>
              {!collapsed && (
                <div className="flex flex-col">
                  <span className="text-xl font-bold font-sora tracking-tight text-slate-800 leading-none">EduIT</span>
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-[0.2em] mt-1">Portal</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 z-50 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="space-y-6">
            {Object.entries(groupedNavItems).map(([key, items]) => {
              if (!items || items.length === 0) return null;

              const groupLabels: Record<string, string> = {
                main: "Overview",
                users: "People",
                academics: "Academic",
                system: "Configuration"
              };

              return (
                <div key={key} className="space-y-1">
                  {!collapsed && (
                    <div className="px-4 mb-2">
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                        {groupLabels[key] || key}
                      </h3>
                    </div>
                  )}
                  <ul className="space-y-1">
                    {items.map((item: any) => {
                      const Icon = item.icon
                      const isItemActive = isActive(item.href)

                      return (
                        <li key={item.href}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                href={item.href}
                                className={cn(
                                  "group flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 relative overflow-hidden",
                                  isItemActive
                                    ? "text-white shadow-lg"
                                    : "text-slate-600 hover:bg-white/80 hover:text-slate-900 border border-transparent hover:border-slate-200/60",
                                  collapsed ? "justify-center" : "gap-3",
                                )}
                                style={isItemActive ? {
                                  backgroundColor: activeColor,
                                  boxShadow: `0 10px 15px -3px ${activeColor}33`
                                } : undefined}
                              >
                                {isItemActive && (
                                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                                )}
                                <Icon className={cn(
                                  "h-5 w-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110",
                                  isItemActive ? "text-white" : "text-slate-400 group-hover:text-slate-900"
                                )} />
                                {!collapsed && <span className="truncate">{item.title}</span>}
                              </Link>
                            </TooltipTrigger>
                            {collapsed && <TooltipContent side="right" className="font-poppins">{item.title}</TooltipContent>}
                          </Tooltip>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 flex-shrink-0 bg-white/40 backdrop-blur-sm border-t border-slate-200/60">
          <div className={cn("flex items-center rounded-2xl p-2 transition-all duration-300 bg-white/60 ring-1 ring-black/5 shadow-sm", collapsed ? "flex-col gap-2" : "gap-3")}>
            <div className="relative group">
              <Avatar className={cn("rounded-xl transition-all duration-300 ring-2 ring-white", collapsed ? "h-10 w-10" : "h-10 w-10 shadow-md")}>
                <AvatarImage src={user?.profileImage || undefined} className="object-cover" />
                <AvatarFallback className="bg-slate-100 text-slate-700 font-bold">{(user?.name || 'U')[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
            </div>

            {!collapsed && (
              <div className="flex-1 min-w-0 pr-1">
                <p className="text-sm font-bold font-sora text-slate-800 truncate leading-tight">{user.name}</p>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-[0.1em] mt-0.5">
                  {typeof user.role === "string"
                    ? user.role.toLowerCase().replace("_", " ").replace("admin", "Admin")
                    : "Member"}
                </p>
              </div>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="text-slate-400 hover:text-red-500 hover:bg-red-50 h-9 w-9 rounded-xl transition-all duration-300"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="sr-only">Logout</span>
                </Button>
              </TooltipTrigger>
              {collapsed && <TooltipContent side="right">Logout</TooltipContent>}
            </Tooltip>
          </div>
        </div>

        {/* Custom Toggle at bottom */}
        <div className="flex justify-center pb-4 pt-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="group flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-black/5 text-slate-400 hover:text-slate-900 transition-all duration-300"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </TooltipProvider>
  )
}

