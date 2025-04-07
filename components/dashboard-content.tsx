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
        [UserRole.SUPER_ADMIN]: "SUPER_ADMIN",
        [UserRole.SCHOOL_ADMIN]: "SCHOOL_ADMIN",
        [UserRole.TEACHER]: "TEACHER",
        [UserRole.STUDENT]: "STUDENT",
        [UserRole.PARENT]: "PARENT",
    };

    const userRole = roleMapping[session.role] || "SCHOOL_ADMIN";

    return (
        <div className="relative flex h-screen overflow-hidden">
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
                    "fixed md:relative h-screen w-fit bg-background border-r transition-transform duration-200 ease-in-out overflow-y-auto scrollbar-hide",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <DashboardSidebar user={{ ...session, role: userRole }} />
            </aside>

            {/* Main content */}
            <main className="flex-1 w-full h-screen overflow-y-auto">
                <div className="container mx-auto p-6">
                    {children}
                </div>
            </main>
        </div>
    )
}