"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    ChevronLeft,
    ChevronRight,
    LayoutDashboard,
    School,
    Users,
    Mail,
    BarChart,
    Settings,
} from "lucide-react";

const navItems = [
    {
        title: "Overview",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Schools",
        href: "/admin/dashboard/schools",
        icon: School,
    },
    {
        title: "Users",
        href: "/admin/dashboard/users",
        icon: Users,
    },
    {
        title: "Newsletter",
        href: "/admin/dashboard/newsletter",
        icon: Mail,
    },
    {
        title: "Analytics",
        href: "/admin/dashboard/analytics",
        icon: BarChart,
    },
    {
        title: "Settings",
        href: "/admin/dashboard/settings",
        icon: Settings,
    },
];

export function AdminSidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const pathname = usePathname();

    return (
        <div
            className={cn(
                "relative flex flex-col border-r bg-card transition-all duration-300",
                isCollapsed ? "w-16" : "w-64"
            )}
        >
            <div className="flex h-16 items-center justify-between px-4 py-4">
                {!isCollapsed && (
                    <h2 className="text-lg font-semibold tracking-tight">
                        Admin Panel
                    </h2>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {isCollapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <ChevronLeft className="h-4 w-4" />
                    )}
                </Button>
            </div>
            <nav className="flex-1 space-y-1 p-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                                pathname === item.href ? "bg-accent" : "transparent",
                                isCollapsed && "justify-center"
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {!isCollapsed && <span>{item.title}</span>}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
} 