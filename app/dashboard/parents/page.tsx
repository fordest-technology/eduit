import { Suspense } from "react"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/app/components/dashboard-header"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Mail, UserPlus, BookOpen } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { ParentsClient } from "./parents-client"
import { prisma } from "@/lib/prisma"

// Define types
interface SchoolColors {
    primaryColor: string
    secondaryColor: string
}

interface ParentStats {
    total: number
    withChildren: number
    totalChildren: number
    activeChildren: number
}

// Skeleton loaders
function StatsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                    <CardContent className="pt-6">
                        <div className="flex items-center">
                            <Skeleton className="h-12 w-12 rounded-full mr-4" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-8 w-16" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

// Enable caching for this page
export const revalidate = 60; // Revalidate every 60 seconds

// Server component to fetch data
export default async function ParentsPage() {
    const session = await getSession();

    // Auth check
    if (!session) {
        redirect("/login");
    }

    // Role check
    if (!["SUPER_ADMIN", "SCHOOL_ADMIN"].includes(session.role)) {
        redirect("/dashboard");
    }

    // Fetch parents data
    const parents = await prisma.user.findMany({
        where: {
            role: "PARENT",
            schoolId: session.role === "SCHOOL_ADMIN" ? session.schoolId : undefined,
        },
        select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            parent: {
                select: {
                    phone: true,
                    alternatePhone: true,
                    occupation: true,
                    _count: {
                        select: {
                            children: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            name: "asc",
        },
    });

    // Get school colors
    const defaultColors = {
        primaryColor: "#3b82f6",
        secondaryColor: "#1f2937",
    };

    let schoolColors = defaultColors;

    if (session.schoolId) {
        const school = await prisma.school.findUnique({
            where: { id: session.schoolId },
            select: {
                primaryColor: true,
                secondaryColor: true,
            },
        });

        if (school?.primaryColor && school?.secondaryColor) {
            schoolColors = {
                primaryColor: school.primaryColor,
                secondaryColor: school.secondaryColor,
            };
        }
    }

    // Calculate stats
    const withChildren = parents.filter(p => (p.parent?._count?.children || 0) > 0).length;
    const totalChildren = parents.reduce((acc, p) => acc + (p.parent?._count?.children || 0), 0);

    // Get active children count
    const activeChildrenCount = await prisma.studentClass.count({
        where: {
            status: "ACTIVE",
            student: {
                user: {
                    schoolId: session.role === "SCHOOL_ADMIN" ? session.schoolId : undefined,
                }
            }
        }
    });

    // Format data for client component
    const formattedParents = parents.map(parent => ({
        id: parent.id,
        name: parent.name,
        email: parent.email,
        profileImage: parent.profileImage,
        phone: parent.parent?.phone,
        alternatePhone: parent.parent?.alternatePhone,
        occupation: parent.parent?.occupation,
        childrenCount: parent.parent?._count?.children || 0,
    }));

    const stats: ParentStats = {
        total: parents.length,
        withChildren,
        totalChildren,
        activeChildren: activeChildrenCount,
    };

    return (
        <div className="space-y-6">
            <DashboardHeader
                heading="Parents"
                text="Manage parent accounts and their connections with students"
                showBanner={true}
            />

            {/* Stats Cards */}
            <Suspense fallback={<StatsSkeleton />}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardContent className="pt-6 flex items-center">
                            <div className="rounded-full p-3 bg-blue-100 mr-4">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Parents</p>
                                <h3 className="text-2xl font-bold">{stats.total}</h3>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 flex items-center">
                            <div className="rounded-full p-3 bg-green-100 mr-4">
                                <UserPlus className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Parents with Children</p>
                                <h3 className="text-2xl font-bold">{stats.withChildren}</h3>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 flex items-center">
                            <div className="rounded-full p-3 bg-purple-100 mr-4">
                                <BookOpen className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Children</p>
                                <h3 className="text-2xl font-bold">{stats.totalChildren}</h3>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 flex items-center">
                            <div className="rounded-full p-3 bg-orange-100 mr-4">
                                <Mail className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Active Children</p>
                                <h3 className="text-2xl font-bold">{stats.activeChildren}</h3>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </Suspense>

            {/* Parents Table */}
            <div className="border rounded-lg overflow-hidden p-6 bg-white">
                <ParentsClient parents={formattedParents} stats={stats} />
            </div>
        </div>
    );
} 