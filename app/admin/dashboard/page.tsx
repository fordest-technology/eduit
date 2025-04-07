import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DashboardHeader } from "@/app/components/dashboard-header";
import { AdminDashboardContent } from "./_components/admin-dashboard-content";
import prisma from "@/lib/db";
import { UserRole, Prisma } from "@prisma/client";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
    title: "Admin Dashboard",
    description: "Administrative dashboard for managing schools and system-wide settings",
};

interface UserGrowthData {
    date: Date;
    count: number;
}

interface LocationStatsData {
    location: string;
    count: number;
}

async function getAdminStats() {
    const [
        totalSchools,
        totalTeachers,
        totalStudents,
        totalParents,
        totalSubjects,
        activeUsers,
        revenue,
        newsletterSubscribers,
        userGrowth,
        locationStats,
    ] = await Promise.all([
        prisma.school.count(),
        prisma.teacher.count(),
        prisma.student.count(),
        prisma.parent.count(),
        prisma.subject.count(),
        prisma.user.count({
            where: {
                updatedAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                },
            },
        }),
        prisma.studentPayment.aggregate({
            _sum: {
                amountPaid: true,
            },
        }),
        prisma.user.count({
            where: {
                email: {
                    not: "",
                },
            },
        }),
        prisma.$queryRaw<UserGrowthData[]>`
            SELECT DATE_TRUNC('month', "createdAt") as date,
                   COUNT(*) as count
            FROM "User"
            WHERE "createdAt" >= NOW() - INTERVAL '6 months'
            GROUP BY DATE_TRUNC('month', "createdAt")
            ORDER BY date ASC
        `,
        prisma.$queryRaw<LocationStatsData[]>`
            WITH LocationCounts AS (
                SELECT city as location, COUNT(*) as count
                FROM "Teacher"
                WHERE city IS NOT NULL
                GROUP BY city
                UNION ALL
                SELECT city, COUNT(*)
                FROM "Student"
                WHERE city IS NOT NULL
                GROUP BY city
                UNION ALL
                SELECT city, COUNT(*)
                FROM "Parent"
                WHERE city IS NOT NULL
                GROUP BY city
            )
            SELECT location, SUM(count)::float as count
            FROM LocationCounts
            GROUP BY location
            ORDER BY count DESC
            LIMIT 10
        `,
    ]);

    // Convert any remaining Decimal values to numbers
    const locationStatsConverted = locationStats.map(stat => ({
        location: stat.location,
        count: Number(stat.count)
    }));

    const userGrowthConverted = userGrowth.map(data => ({
        date: data.date,
        count: Number(data.count)
    }));

    return {
        totalSchools,
        totalTeachers,
        totalStudents,
        totalParents,
        totalSubjects,
        activeUsers,
        revenue: revenue._sum.amountPaid || 0,
        newsletterSubscribers,
        userGrowth: userGrowthConverted,
        locationStats: locationStatsConverted,
    };
}

async function getSchools() {
    return prisma.school.findMany({
        select: {
            id: true,
            name: true,
            shortName: true,
            address: true,
            email: true,
            phone: true,
            createdAt: true,
            users: {
                where: {
                    OR: [
                        { teacher: { isNot: null } },
                        { student: { isNot: null } },
                        { parent: { isNot: null } },
                    ],
                },
                select: {
                    teacher: {
                        select: {
                            city: true,
                        },
                    },
                    student: {
                        select: {
                            city: true,
                            payments: {
                                select: {
                                    amountPaid: true,
                                },
                            },
                        },
                    },
                    parent: {
                        select: {
                            city: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    }).then(schools => schools.map(school => {
        const users = school.users;
        const teachers = users.filter(u => u.teacher).length;
        const students = users.filter(u => u.student).length;
        const parents = users.filter(u => u.parent).length;
        const revenue = users.reduce((sum, user) => {
            if (user.student?.payments) {
                return sum + user.student.payments.reduce((total, payment) => total + payment.amountPaid, 0);
            }
            return sum;
        }, 0);

        const locationBreakdown = users.reduce((acc, user) => {
            const city = user.teacher?.city || user.student?.city || user.parent?.city;
            if (city) {
                acc[city] = (acc[city] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        return {
            ...school,
            location: school.address || "No address provided",
            teacherCount: teachers,
            studentCount: students,
            parentCount: parents,
            revenue,
            locationBreakdown,
        };
    }));
}

function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array(6).fill(null).map((_, i) => (
                    <div key={i} className="rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-[100px]" />
                            <Skeleton className="h-4 w-4 rounded" />
                        </div>
                        <div className="mt-2">
                            <Skeleton className="h-8 w-[60px] mb-2" />
                            <Skeleton className="h-4 w-[120px]" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default async function AdminDashboardPage() {
    const session = await getSession();

    if (!session || session.role !== "SUPER_ADMIN") {
        redirect("/auth/login");
    }

    return (
        <div className="container mx-auto py-10 space-y-8">
            <DashboardHeader
                heading="Admin Dashboard"
                text="Manage your educational system and view key metrics"
            />
            <Suspense fallback={<DashboardSkeleton />}>
                <AdminDashboardContent
                    stats={await getAdminStats()}
                    schools={await getSchools()}
                />
            </Suspense>
        </div>
    );
} 