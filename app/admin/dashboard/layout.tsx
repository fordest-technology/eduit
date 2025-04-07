import { ReactNode } from "react";
import { AdminSidebar } from "./_components/admin-sidebar";

interface AdminDashboardLayoutProps {
    children: ReactNode;
}

export default function AdminDashboardLayout({ children }: AdminDashboardLayoutProps) {
    return (
        <div className="flex h-screen overflow-hidden">
            <AdminSidebar />
            <main className="flex-1 overflow-y-auto bg-background">
                {children}
            </main>
        </div>
    );
} 