"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    Calendar,
    FileText,
    Settings,
    BookMarked,
} from "lucide-react"

const parentLinks = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "My Children",
        href: "/dashboard/children",
        icon: Users,
    },
    {
        title: "Classes",
        href: "/dashboard/classes",
        icon: BookMarked,
    },
    {
        title: "Grades",
        href: "/dashboard/grades",
        icon: GraduationCap,
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
        title: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
    },
]

export function ParentSidebar() {
    const pathname = usePathname()

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 space-y-1 p-2">
                {parentLinks.map((link) => {
                    const Icon = link.icon
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                                pathname === link.href
                                    ? "bg-accent text-accent-foreground text-white"
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