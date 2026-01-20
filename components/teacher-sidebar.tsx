"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    BookOpen,
    Calendar,
    Users,
    BookMarked,
    GraduationCap,
    Settings,
} from "lucide-react"

const teacherLinks = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "My Classes",
        href: "/dashboard/my-classes",
        icon: BookMarked,
    },
    {
        title: "My Students",
        href: "/dashboard/teachers/students",
        icon: Users,
    },
    {
        title: "Attendance",
        href: "/dashboard/attendance",
        icon: Calendar,
    },
    {
        title: "Results",
        href: "/dashboard/results",
        icon: GraduationCap,
    },
    {
        title: "Subjects",
        href: "/dashboard/subjects",
        icon: BookOpen,
    },
    {
        title: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
    },
]

export function TeacherSidebar() {
    const pathname = usePathname()

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 space-y-1 p-2">
                {teacherLinks.map((link) => {
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