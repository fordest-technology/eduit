import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminDashboard } from "./_components/admin-dashboard";

export const metadata: Metadata = {
    title: "Admin Dashboard | EduIT",
    description: "Administrative dashboard for managing schools and system-wide settings",
};

export default async function AdminPage() {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    // Only super admins can access this page
    if (session.role !== "SUPER_ADMIN") {
        redirect("/dashboard");
    }

    return <AdminDashboard />;
}
