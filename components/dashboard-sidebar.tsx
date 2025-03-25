"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DashboardSidebarProps {
  user: {
    role: string
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
      case "super_admin":
      case "SUPER_ADMIN":
        return [
          { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
          { title: "Fees Payment", href: "/dashboard/fees", icon: Coins },
          { title: "Teachers", href: "/dashboard/teachers", icon: UserCog },
          { title: "Students", href: "/dashboard/students", icon: GraduationCap },
          { title: "Result", href: "/dashboard/results", icon: ClipboardCheck },
          { title: "Academic Session", href: "/dashboard/sessions", icon: Calendar },
          { title: "Parents", href: "/dashboard/parents", icon: UserCircle },
          { title: "Classes", href: "/dashboard/classes", icon: School },
          { title: "Subjects", href: "/dashboard/subjects", icon: BookText },
          { title: "Departments", href: "/dashboard/departments", icon: Layers },
          { title: "School Levels", href: "/dashboard/school-levels", icon: Building2 },
          { title: "Calendar", href: "/dashboard/calendar", icon: Calendar },
          { title: "Settings", href: "/dashboard/settings", icon: Settings },
        ]
      case "school_admin":
      case "SCHOOL_ADMIN":
        return [
          { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
          { title: "Fees Payment", href: "/dashboard/fees", icon: Coins },
          { title: "Teachers", href: "/dashboard/teachers", icon: UserCog },
          { title: "Students", href: "/dashboard/students", icon: GraduationCap },
          { title: "Result", href: "/dashboard/results", icon: ClipboardCheck },
          { title: "Academic Session", href: "/dashboard/sessions", icon: Calendar },
          { title: "Parents", href: "/dashboard/parents", icon: UserCircle },
          { title: "Classes", href: "/dashboard/classes", icon: School },
          { title: "Subjects", href: "/dashboard/subjects", icon: BookText },
          { title: "Departments", href: "/dashboard/departments", icon: Layers },
          { title: "School Levels", href: "/dashboard/school-levels", icon: Building2 },
          { title: "Calendar", href: "/dashboard/calendar", icon: Calendar },
          { title: "Settings", href: "/dashboard/settings", icon: Settings },
        ]
      case "teacher":
      case "TEACHER":
        return [
          { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
          { title: "My Classes", href: "/dashboard/my-classes", icon: School },
          { title: "Students", href: "/dashboard/students", icon: GraduationCap },
          { title: "Calendar", href: "/dashboard/calendar", icon: Calendar },
          { title: "Settings", href: "/dashboard/settings", icon: Settings },
        ]
      case "student":
      case "STUDENT":
        return [
          { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
          { title: "My Classes", href: "/dashboard/my-classes", icon: School },
          { title: "Calendar", href: "/dashboard/calendar", icon: Calendar },
          { title: "Settings", href: "/dashboard/settings", icon: Settings },
        ]
      case "parent":
      case "PARENT":
        return [
          { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
          { title: "Pay School Fees", href: "/dashboard/fees", icon: Coins },
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

  // Group navigation items by category for admin roles
  const getGroupedNavItems = () => {
    if (
      user.role !== "super_admin" &&
      user.role !== "SUPER_ADMIN" &&
      user.role !== "school_admin" &&
      user.role !== "SCHOOL_ADMIN"
    ) {
      return { main: getNavigationItems() }
    }

    const items = getNavigationItems()
    return {
      main: items.filter((item) => ["/dashboard", "/dashboard/fees", "/dashboard/calendar"].includes(item.href)),
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
          "flex h-screen flex-col border-r transition-all duration-300 ease-in-out",
          collapsed ? "w-[4.5rem]" : "w-64",
        )}
        style={{
          backgroundColor: activeColorHsl ? `hsl(${activeColorHsl.split(' ')[0]} 40% 90%)` : undefined,
        }}
      >
        {/* Header */}
        <div className="flex h-14 items-center border-b px-4">
          {schoolInfo?.logo ? (
            <div className={cn("flex items-center gap-2", collapsed && "justify-center")}>
              <div className="h-8 w-8 rounded-md overflow-hidden flex-shrink-0">
                <img
                  src={schoolInfo.logo || "/placeholder.svg"}
                  alt={schoolInfo.name}
                  className="h-full w-full object-contain"
                />
              </div>
              {!collapsed && <span className="text-lg font-bold truncate">{schoolInfo.name}</span>}
            </div>
          ) : (
            <div className={cn("flex items-center gap-2", collapsed && "justify-center w-full")}>
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 flex-shrink-0">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              {!collapsed && <span className="text-lg font-bold">EduIT</span>}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {/* Main navigation items */}
          <ul className="space-y-1">
            {groupedNavItems.main.map((item) => {
              const Icon = item.icon
              const isItemActive = isActive(item.href)

              return (
                <li key={item.href}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          isItemActive ? "text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          collapsed ? "justify-center" : "gap-3",
                        )}
                        style={isItemActive ? { backgroundColor: activeColor } : undefined}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </TooltipTrigger>
                    {collapsed && <TooltipContent side="right">{item.title}</TooltipContent>}
                  </Tooltip>
                </li>
              )
            })}
          </ul>

          {/* Users section - only for admin roles */}
          {groupedNavItems.users && groupedNavItems.users.length > 0 && (
            <>
              <div className={cn("mt-6 mb-2", collapsed ? "px-0 text-center" : "px-3")}>
                <h3 className="text-xs font-medium text-muted-foreground">{!collapsed ? "Account Management" : "—"}</h3>
              </div>
              <ul className="space-y-1">
                {groupedNavItems.users.map((item) => {
                  const Icon = item.icon
                  const isItemActive = isActive(item.href)

                  return (
                    <li key={item.href}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                              isItemActive
                                ? "text-white"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                              collapsed ? "justify-center" : "gap-3",
                            )}
                            style={isItemActive ? { backgroundColor: activeColor } : undefined}
                          >
                            <Icon className="h-5 w-5 flex-shrink-0" />
                            {!collapsed && <span>{item.title}</span>}
                          </Link>
                        </TooltipTrigger>
                        {collapsed && <TooltipContent side="right">{item.title}</TooltipContent>}
                      </Tooltip>
                    </li>
                  )
                })}
              </ul>
            </>
          )}

          {/* Academics section - only for admin roles */}
          {groupedNavItems.academics && groupedNavItems.academics.length > 0 && (
            <>
              <div className={cn("mt-6 mb-2", collapsed ? "px-0 text-center" : "px-3")}>
                <h3 className="text-xs font-medium text-muted-foreground">{!collapsed ? "Academics" : "—"}</h3>
              </div>
              <ul className="space-y-1">
                {groupedNavItems.academics.map((item) => {
                  const Icon = item.icon
                  const isItemActive = isActive(item.href)

                  return (
                    <li key={item.href}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                              isItemActive
                                ? "text-white"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                              collapsed ? "justify-center" : "gap-3",
                            )}
                            style={isItemActive ? { backgroundColor: activeColor } : undefined}
                          >
                            <Icon className="h-5 w-5 flex-shrink-0" />
                            {!collapsed && <span>{item.title}</span>}
                          </Link>
                        </TooltipTrigger>
                        {collapsed && <TooltipContent side="right">{item.title}</TooltipContent>}
                      </Tooltip>
                    </li>
                  )
                })}
              </ul>
            </>
          )}

          {/* System section - only for admin roles */}
          {groupedNavItems.system && groupedNavItems.system.length > 0 && (
            <>
              <div className={cn("mt-6 mb-2", collapsed ? "px-0 text-center" : "px-3")}>
                <h3 className="text-xs font-medium text-muted-foreground">{!collapsed ? "System" : "—"}</h3>
              </div>
              <ul className="space-y-1">
                {groupedNavItems.system.map((item) => {
                  const Icon = item.icon
                  const isItemActive = isActive(item.href)

                  return (
                    <li key={item.href}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                              isItemActive
                                ? "text-white"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                              collapsed ? "justify-center" : "gap-3",
                            )}
                            style={isItemActive ? { backgroundColor: activeColor } : undefined}
                          >
                            <Icon className="h-5 w-5 flex-shrink-0" />
                            {!collapsed && <span>{item.title}</span>}
                          </Link>
                        </TooltipTrigger>
                        {collapsed && <TooltipContent side="right">{item.title}</TooltipContent>}
                      </Tooltip>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </nav>

        {/* Toggle button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-md"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>

        {/* Footer with user info */}
        <div className="border-t p-4">
          <div className={cn("flex items-center", collapsed ? "flex-col gap-2" : "gap-3")}>
            <Avatar className={cn(collapsed && "h-8 w-8")}>
              <AvatarImage src={user.profileImage || undefined} />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {typeof user.role === "string"
                    ? user.role.toLowerCase().replace("_", " ").replace("admin", "Admin")
                    : "User"}
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
                  className="text-muted-foreground hover:text-foreground h-8 w-8"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="sr-only">Logout</span>
                </Button>
              </TooltipTrigger>
              {collapsed && <TooltipContent side="right">Logout</TooltipContent>}
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

