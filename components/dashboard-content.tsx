"use client"

import { useState } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { UserRole } from "@/lib/auth"

interface DashboardContentProps {
    children: React.ReactNode
    session: {
        role: UserRole
        name: string
        profileImage?: string | null
        permissions?: any
    }
}

export function DashboardContent({ children, session }: DashboardContentProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)

    return (
        <div className="relative flex h-screen overflow-hidden bg-slate-50/50 font-poppins">
            {/* Background Aurora Glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Mobile sidebar toggle */}
            <Button
                variant="ghost"
                size="icon"
                className="fixed top-4 left-4 z-50 md:hidden bg-white/80 backdrop-blur-md shadow-sm border border-slate-200/50 rounded-xl"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
                <Menu className="h-5 w-5 text-slate-600" />
            </Button>

            {/* Sidebar */}
            <DashboardSidebar user={session} />

            {/* Main content */}
            <main className="flex-1 w-full h-screen overflow-y-auto relative z-10 scroll-smooth">
                <div className="container mx-auto p-4 md:p-8 max-w-[1600px]">
                    {children}
                </div>
            </main>
        </div>
    )
}