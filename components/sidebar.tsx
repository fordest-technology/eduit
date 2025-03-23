import { UserRole } from "@prisma/client";
import {
    LucideIcon,
    LayoutDashboard,
    Users,
    GraduationCap,
    BookOpen,
    School,
    Settings,
    Calendar,
    ClipboardList,
    Bell,
    MessageSquare,
    BarChart2,
    Layers,
} from "lucide-react";

interface SidebarRoute {
    icon: LucideIcon;
    label: string;
    href: string;
    for: UserRole[];
    active?: boolean;
}

export const sidebarRoutes: SidebarRoute[] = [
    {
        icon: LayoutDashboard,
        label: "Dashboard",
        href: "/dashboard",
        for: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STUDENT],
    },
    {
        icon: Users,
        label: "Teachers",
        href: "/dashboard/teachers",
        for: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN],
    },
    {
        icon: GraduationCap,
        label: "Students",
        href: "/dashboard/students",
        for: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER],
    },
    {
        icon: School,
        label: "Classes",
        href: "/dashboard/classes",
        for: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER],
    },
    {
        icon: Layers,
        label: "School Levels",
        href: "/dashboard/school-levels",
        for: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN],
    },
    {
        icon: BookOpen,
        label: "Subjects",
        href: "/dashboard/subjects",
        for: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN],
    },
]; 