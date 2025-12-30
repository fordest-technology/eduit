import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Users, GraduationCap, BookOpen } from "lucide-react"
import { ChildrenTable } from "./children-table"
import { DashboardHeader } from "@/app/components/dashboard-header"
import { DashboardStatsCard, DashboardStatsGrid } from "@/components/dashboard-stats-card"

interface Student {
    id: string;
    user: {
        id: string;
        name: string;
        email: string;
        profileImage: string | null;
    };
    classes: Array<{
        classId: string;
        className: string;
        section: string;
    }>;
}

async function getParentChildren(parentId: string): Promise<Student[]> {
    // Get all StudentParent relationships for this parent
    const relationships = await prisma.studentParent.findMany({
        where: { parentId },
        include: {
            student: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            profileImage: true,
                        },
                    },
                    classes: {
                        include: {
                            class: {
                                select: {
                                    id: true,
                                    name: true,
                                    section: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    // Transform the data to match our Student interface
    return relationships.map(rel => ({
        id: rel.student.id,
        user: rel.student.user,
        classes: rel.student.classes.map(cls => ({
            classId: cls.class.id,
            className: cls.class.name,
            section: cls.class.section,
        })),
    }));
}

export default async function ChildrenPage() {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    const user = await prisma.user.findUnique({
        where: { id: session.id },
        include: { parent: true },
    });

    if (!user || !user.parent) {
        redirect("/dashboard");
    }

    const children = await getParentChildren(user.parent.id);

    return (
        <div className="space-y-6">
            <DashboardHeader
                heading="My Children"
                text="View and manage your children's information"
                showBanner={true}
            />

            <DashboardStatsGrid columns={3} className="mb-6">
                <DashboardStatsCard
                    title="Total Children"
                    value={children.length}
                    icon={Users}
                    color="blue"
                    description="Registered children"
                />
                <DashboardStatsCard
                    title="Active Classes"
                    value={children.filter(child => child.classes.length > 0).length}
                    icon={GraduationCap}
                    color="purple"
                    description="Children in active classes"
                />
                <DashboardStatsCard
                    title="Pending"
                    value={children.filter(child => child.classes.length === 0).length}
                    icon={BookOpen}
                    color="emerald"
                    description="Children pending class assignment"
                />
            </DashboardStatsGrid>

            <Card className="border-primary/10 shadow-md">
                <CardHeader className="bg-primary/5 border-b border-primary/10">
                    <CardTitle>Children Information</CardTitle>
                    <CardDescription>View and manage your children's details</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <ChildrenTable
                        children={children}
                    />
                </CardContent>
            </Card>
        </div>
    )
} 