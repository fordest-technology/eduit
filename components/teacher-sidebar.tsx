"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    BookOpen,
    Calendar,
    FileText,
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
        href: "/dashboard/classes",
        icon: BookMarked,
    },
    {
        title: "Students",
        href: "/dashboard/students",
        icon: Users,
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
        title: "Assignments",
        href: "/dashboard/assignments",
        icon: FileText,
    },
    {
        title: "Grades",
        href: "/dashboard/grades",
        icon: GraduationCap,
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