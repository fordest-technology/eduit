"use client"

import { useState } from "react"
import { UserRole } from "@prisma/client"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { UserRole as AuthUserRole } from "@/lib/auth"

interface DashboardContentProps {
    children: React.ReactNode
    session: {
        role: UserRole
        name: string
        profileImage?: string | null
    }
}

export function DashboardContent({ children, session }: DashboardContentProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)

    // Map Prisma UserRole to auth UserRole
    const roleMapping: Record<UserRole, AuthUserRole> = {
        [UserRole.SUPER_ADMIN]: "super_admin",
        [UserRole.SCHOOL_ADMIN]: "school_admin",
        [UserRole.TEACHER]: "teacher",
        [UserRole.STUDENT]: "student",
        [UserRole.PARENT]: "parent",
    };

    const userRole = roleMapping[session.role] || "school_admin";

    return (
        <div className="flex h-screen">
            {/* Mobile sidebar toggle */}
            <Button
                variant="ghost"
                size="icon"
                className="fixed top-4 left-4 z-50 md:hidden"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
                <Menu className="h-6 w-6" />
            </Button>

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-40 w-64 bg-background border-r transition-transform duration-200 ease-in-out md:translate-x-0",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <DashboardSidebar user={{ ...session, role: userRole }} />
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto md:ml-64">
                <div className="container mx-auto p-6">{children}</div>
            </main>
        </div>
    )
} 