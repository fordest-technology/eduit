"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    BookOpen,
    Building2,
    Settings,
    School,
    UserCog,
    BookMarked,
    Calendar,
    FileText,
    BarChart,
} from "lucide-react"

const adminLinks = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "All Users",
        href: "/dashboard/users",
        icon: Users,
    },
    {
        title: "Admins",
        href: "/dashboard/users/admins",
        icon: UserCog,
    },
    {
        title: "Teachers",
        href: "/dashboard/users/teachers",
        icon: GraduationCap,
    },
    {
        title: "Students",
        href: "/dashboard/users/students",
        icon: BookOpen,
    },
    {
        title: "Admissions",
        href: "/dashboard/admissions",
        icon: Calendar,
    },
    {
        title: "Parents",
        href: "/dashboard/users/parents",
        icon: Users,
    },
    {
        title: "Classes",
        href: "/dashboard/classes",
        icon: BookMarked,
    },
    {
        title: "Departments",
        href: "/dashboard/departments",
        icon: Building2,
    },
    {
        title: "Subjects",
        href: "/dashboard/subjects",
        icon: BookOpen,
    },
    {
        title: "Schedule",
        href: "/dashboard/schedule",
        icon: Calendar,
    },
    {
        title: "Reports",
        href: "/dashboard/reports",
        icon: FileText,
    },
    {
        title: "Analytics",
        href: "/dashboard/analytics",
        icon: BarChart,
    },
    {
        title: "Schools",
        href: "/dashboard/schools",
        icon: School,
    },
    {
        title: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
    },
]

export function AdminSidebar() {
    const pathname = usePathname()

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 space-y-1 p-2">
                {adminLinks.map((link) => {
                    const Icon = link.icon
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                                pathname === link.href
                                    ? "bg-accent text-accent-foreground"
                                    : "text-muted-foreground"
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {link.title}
                        </Link>
                    )
                })}
            </div>
        </div>
    )
} 