import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import ParentDetails from "./parent-details";
import { Metadata } from "next";
import { DashboardHeader } from "@/app/components/dashboard-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Users, Phone, Mail, MapPin } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

// Define interface for student data
interface StudentData {
    id: string;
    name: string;
    class: string;
}

// Enable caching for this page
export const revalidate = 60; // Revalidate every 60 seconds

// Generate metadata for the page
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    try {
        const parent = await prisma.user.findUnique({
            where: {
                id: params.id,
                role: UserRole.PARENT,
            },
            select: {
                name: true,
            },
        });

        return {
            title: parent ? `${parent.name} - Parent Details` : "Parent Details",
            description: "View and manage parent information and linked students",
        };
    } catch (error) {
        return {
            title: "Parent Details",
            description: "View and manage parent information",
        };
    }
}

export default async function ParentPage({
    params
}: {
    params: { id: string }
}) {
    try {
        const session = await getSession();

        if (!session) {
            redirect("/login");
        }

        // Fetch parent with their children - optimized query with only necessary fields
        const parent = await prisma.user.findUnique({
            where: {
                id: params.id,
                role: UserRole.PARENT,
            },
            select: {
                id: true,
                name: true,
                email: true,
                profileImage: true,
                schoolId: true,
                parent: {
                    select: {
                        id: true,
                        phone: true,
                        alternatePhone: true,
                        occupation: true,
                        address: true,
                        city: true,
                        state: true,
                        country: true,
                        createdAt: true,
                        children: {
                            select: {
                                id: true,
                                relation: true,
                                isPrimary: true,
                                student: {
                                    select: {
                                        id: true,
                                        user: {
                                            select: {
                                                id: true,
                                                name: true,
                                                profileImage: true,
                                            }
                                        },
                                        classes: {
                                            take: 1,
                                            select: {
                                                class: {
                                                    select: {
                                                        name: true,
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!parent) {
            return (
                <div className="space-y-6">
                    <DashboardHeader
                        heading="Parent Not Found"
                        text="The parent you are looking for does not exist or has been removed."
                        showBanner={true}
                        action={
                            <Link href="/dashboard/parents">
                                <Button variant="outline" size="sm">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Parents
                                </Button>
                            </Link>
                        }
                    />
                    <div className="rounded-lg border bg-card p-8 text-card-foreground shadow-sm">
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <User className="h-12 w-12 text-muted-foreground" />
                            <h2 className="text-xl font-bold text-muted-foreground">Parent Not Found</h2>
                            <p className="text-center text-muted-foreground">
                                The parent you are looking for does not exist or has been removed.
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        // Check if user has permission to view this parent
        if (session.role === UserRole.SCHOOL_ADMIN && parent.schoolId !== session.schoolId) {
            return (
                <div className="space-y-6">
                    <DashboardHeader
                        heading="Access Denied"
                        text="You do not have permission to view this parent's information."
                        showBanner={true}
                        action={
                            <Link href="/dashboard/parents">
                                <Button variant="outline" size="sm">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Parents
                                </Button>
                            </Link>
                        }
                    />
                    <div className="rounded-lg border bg-card p-8 text-card-foreground shadow-sm">
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <User className="h-12 w-12 text-red-500" />
                            <h2 className="text-xl font-bold text-red-500">Access Denied</h2>
                            <p className="text-center text-muted-foreground">
                                You do not have permission to view this parent's information.
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        // Get current academic session - optimized with select
        const currentSession = await prisma.academicSession.findFirst({
            where: {
                isCurrent: true,
                schoolId: parent.schoolId || undefined,
            },
            select: {
                id: true
            }
        });

        // Format children data
        const children = parent.parent?.children.map((relation) => {
            const studentClasses = relation.student.classes || [];
            const currentClass = studentClasses.length > 0 ? studentClasses[0].class.name : "Not assigned";

            return {
                id: relation.student.user.id,
                name: relation.student.user.name,
                class: currentClass,
                relation: relation.relation || "Not specified",
                linkId: relation.id,
                isPrimary: relation.isPrimary || false,
                profileImage: relation.student.user.profileImage,
            };
        }) || [];

        // Fetch all available students for linking - only if user can manage
        let availableStudents: StudentData[] = [];

        if ([UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER].includes(session.role) && parent.schoolId) {
            // Get already linked student IDs for efficient filtering
            const linkedStudentIds = children.map((child) => child.id);

            // Fetch only unlinked students - optimized query
            const unlinkedStudents = await prisma.user.findMany({
                where: {
                    role: UserRole.STUDENT,
                    schoolId: parent.schoolId,
                    id: {
                        notIn: linkedStudentIds
                    }
                },
                select: {
                    id: true,
                    name: true,
                    student: {
                        select: {
                            classes: {
                                where: currentSession ? {
                                    sessionId: currentSession.id,
                                } : undefined,
                                take: 1,
                                select: {
                                    class: {
                                        select: {
                                            name: true,
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                take: 100, // Limit to 100 students for performance
            });

            // Format available students
            availableStudents = unlinkedStudents.map(student => {
                let className = "Not assigned";
                if (student.student?.classes && student.student.classes.length > 0) {
                    className = student.student.classes[0].class.name;
                }

                return {
                    id: student.id,
                    name: student.name,
                    class: className
                };
            });
        }

        // Format parent data for the client component
        const parentData = {
            id: parent.id,
            name: parent.name,
            email: parent.email,
            profileImage: parent.profileImage,
            schoolId: parent.schoolId,
            phone: parent.parent?.phone || null,
            alternatePhone: parent.parent?.alternatePhone || null,
            occupation: parent.parent?.occupation || null,
            address: parent.parent?.address || null,
            city: parent.parent?.city || null,
            state: parent.parent?.state || null,
            country: parent.parent?.country || null,
            joinDate: parent.parent?.createdAt?.toISOString(),
            status: "active", // Default status
        };

        // Create action buttons for the header
        const ActionButtons = () => (
            <div className="flex gap-2">
                <Link href="/dashboard/parents">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Parents
                    </Button>
                </Link>
            </div>
        );

        return (
            <div className="space-y-6">
                <DashboardHeader
                    heading={parent.name}
                    text="View and manage parent information and linked students"
                    showBanner={true}
                    action={<ActionButtons />}
                />

                {/* Quick Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                        <CardContent className="pt-6 flex items-center">
                            <div className="rounded-full p-3 bg-blue-100 mr-4">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-blue-600">Linked Children</p>
                                <h3 className="text-2xl font-bold text-blue-800">{children.length}</h3>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                        <CardContent className="pt-6 flex items-center">
                            <div className="rounded-full p-3 bg-green-100 mr-4">
                                <Mail className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-green-600">Email</p>
                                <h3 className="text-sm font-medium text-green-800 truncate">{parent.email}</h3>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                        <CardContent className="pt-6 flex items-center">
                            <div className="rounded-full p-3 bg-purple-100 mr-4">
                                <Phone className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-purple-600">Primary Phone</p>
                                <h3 className="text-sm font-medium text-purple-800">
                                    {parent.parent?.phone || "Not provided"}
                                </h3>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                        <CardContent className="pt-6 flex items-center">
                            <div className="rounded-full p-3 bg-orange-100 mr-4">
                                <MapPin className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-orange-600">Location</p>
                                <h3 className="text-sm font-medium text-orange-800">
                                    {parent.parent?.city || "Not specified"}
                                </h3>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <ParentDetails
                    parent={parentData}
                    children={children}
                    availableStudents={availableStudents}
                    canManage={[UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER].includes(session.role)}
                />
            </div>
        );
    } catch (error) {
        // Only log in development
        if (process.env.NODE_ENV !== "production") {
            console.error("Error in parent detail page:", error);
        }

        return (
            <div className="space-y-6">
                <DashboardHeader
                    heading="Error Loading Parent Details"
                    text="There was a problem loading this parent's information."
                    showBanner={true}
                    action={
                        <Link href="/dashboard/parents">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Parents
                            </Button>
                        </Link>
                    }
                />
                <div className="rounded-lg border bg-card p-8 text-card-foreground shadow-sm">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <User className="h-12 w-12 text-red-500" />
                        <h2 className="text-xl font-bold text-red-500">Error Loading Parent Details</h2>
                        <p className="text-center text-muted-foreground">
                            There was a problem loading this parent's information. Please try again later or contact support.
                        </p>
                        <Button onClick={() => window.location.reload()}>
                            Retry
                        </Button>
                    </div>
                </div>
            </div>
        );
    }
} 