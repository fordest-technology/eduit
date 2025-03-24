import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Users, GraduationCap, BookOpen } from "lucide-react"
import { ChildrenTable } from "./children-table"
import { DashboardHeader } from "@/app/components/dashboard-header"

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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center text-blue-700">
                            <Users className="mr-2 h-5 w-5" />
                            Total Children
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-blue-800">{children.length}</p>
                        <p className="text-sm text-blue-600 mt-1">Registered children</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center text-purple-700">
                            <GraduationCap className="mr-2 h-5 w-5" />
                            Active Classes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-purple-800">
                            {children.filter(child => child.classes.length > 0).length}
                        </p>
                        <p className="text-sm text-purple-600 mt-1">Children in active classes</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center text-emerald-700">
                            <BookOpen className="mr-2 h-5 w-5" />
                            Pending
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-emerald-800">
                            {children.filter(child => child.classes.length === 0).length}
                        </p>
                        <p className="text-sm text-emerald-600 mt-1">Children pending class assignment</p>
                    </CardContent>
                </Card>
            </div>

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