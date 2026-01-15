import { getSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/app/components/dashboard-header";
import { ShieldCheck } from "lucide-react";
import { AdminManagement } from "./admin-management";
import prisma from "@/lib/db";

async function getAdmins(schoolId: string) {
    return await prisma.user.findMany({
        where: {
            role: "SCHOOL_ADMIN",
            schoolId: schoolId,
        },
        include: {
            admin: true,
        },
        orderBy: {
            name: "asc",
        },
    });
}

export default async function AdminsPage() {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    // Only allow primary admins or those with manage_admins permission
    // For simplicity now, we allow all SCHOOL_ADMINs and SUPER_ADMINs
    if (session.role !== "SCHOOL_ADMIN" && session.role !== "SUPER_ADMIN") {
        redirect("/dashboard");
    }

    const admins = await getAdmins(session.schoolId as string);

    return (
        <div className="space-y-6">
            <DashboardHeader
                heading="Admin Management"
                text="Manage school administrators and their granular permissions."
                icon={<ShieldCheck className="h-6 w-6" />}
                showBanner={true}
            />

            <AdminManagement initialAdmins={admins} currentUserRole={session.role} />
        </div>
    );
}
