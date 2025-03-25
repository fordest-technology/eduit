import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";
import { DashboardHeader } from "@/app/components/dashboard-header";
import { AdmissionsClient } from "./admissions-client";

export const metadata: Metadata = {
    title: "Admissions",
    description: "Manage academic sessions and student admissions",
};

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export default async function AdmissionsPage() {
    const session = await getSession();

    if (!session) {
        redirect("/auth/signin");
    }
    const allowedRoles = new Map<string, boolean>([
        ["super_admin", true],
        ["school_admin", true],
    ]);

    if (!allowedRoles.has(session.role)) {
        redirect("/dashboard");
    }

    try {
        // Test database connection
        try {
            await prisma.$queryRaw`SELECT 1`
        } catch (error) {
            console.error("Database connection error:", error)
            return (
                <div className="p-6">
                    <DashboardHeader
                        heading="Admissions"
                        text="Manage academic sessions and student admissions."
                    />
                    <AdmissionsClient
                        sessions={[]}
                        error="We couldn't connect to the database. Please try again later."
                    />
                </div>
            )
        }

        // Fetch academic sessions
        const academicSessions = await prisma.academicSession.findMany({
            where: {
                ...(session.schoolId ? { schoolId: session.schoolId } : {}),
            },
            include: {
                _count: {
                    select: {
                        studentClasses: true,
                    }
                }
            },
            orderBy: [
                { isCurrent: 'desc' },
                { startDate: 'desc' }
            ],
        });

        // Format sessions for client component
        const formattedSessions = academicSessions.map(s => ({
            id: s.id,
            name: s.name,
            startDate: s.startDate,
            endDate: s.endDate,
            isCurrent: s.isCurrent,
            studentCount: s._count.studentClasses,
            createdAt: s.createdAt,
        }));

        return (
            <div className="p-6">
                <DashboardHeader
                    heading="Admissions"
                    text="Manage academic sessions and student admissions."
                />
                <AdmissionsClient sessions={formattedSessions} />
            </div>
        )
    } catch (error) {
        console.error("Error in AdmissionsPage:", error)
        return (
            <div className="p-6">
                <DashboardHeader
                    heading="Admissions"
                    text="Manage academic sessions and student admissions."
                />
                <AdmissionsClient
                    sessions={[]}
                    error="Something went wrong while loading academic sessions. Please try again later."
                />
            </div>
        )
    }
} 