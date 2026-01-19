import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import ParentDetails from "./parent-details";
import { Metadata } from "next";
import { DashboardHeader } from "@/app/components/dashboard-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Users, Phone, Mail, MapPin, ChevronLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Define interface for student data
interface StudentData {
    id: string;
    name: string;
    class: string;
}

// Enable caching for this page
export const revalidate = 60; // Revalidate every 60 seconds

// Generate metadata for the page
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    try {
        const parent = await prisma.user.findUnique({
            where: {
                id,
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
    params: Promise<{ id: string }>
}) {
    const { id } = await params;
    try {
        const session = await getSession();

        if (!session) {
            redirect("/login");
        }

        // Fetch parent with their children - optimized query with only necessary fields
        const parent = await prisma.user.findUnique({
            where: {
                id,
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
            const currentClass = studentClasses.length > 0 ? studentClasses[0].class?.name || "Not assigned" : "Not assigned";

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

        const isStaff = session.role === UserRole.SUPER_ADMIN || session.role === UserRole.SCHOOL_ADMIN || session.role === UserRole.TEACHER;
        if (isStaff && parent.schoolId) {
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
                    className = student.student.classes[0].class?.name || "Not assigned";
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
            status: "active" as const, // Default status
        };

        return (
            <div className="space-y-6">
                <DashboardHeader
                    heading={parent.name}
                    text="View and manage parent information and linked students"
                    showBanner={true}
                    action={
                        <div className="flex gap-2">
                            <Link href="/dashboard/parents">
                                <Button variant="outline" size="sm">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Parents
                                </Button>
                            </Link>
                        </div>
                    }
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: "Linked Children", value: children.length, icon: Users, color: "blue" },
                        { label: "Email Address", value: parent.email, icon: Mail, color: "emerald", truncate: true },
                        { label: "Primary Phone", value: parent.parent?.phone || "Not provided", icon: Phone, color: "purple" },
                        { label: "Account Security", value: "Verified", icon: ShieldCheck, color: "orange" }
                    ].map((stat, i) => (
                        <div key={i} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300">
                            <div className={`absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity`}>
                                <stat.icon className="h-16 w-16" />
                            </div>
                            <div className="flex flex-col gap-4">
                                <div className={cn(
                                    "flex h-10 w-10 items-center justify-center rounded-xl",
                                    stat.color === "blue" && "bg-blue-50 text-blue-600",
                                    stat.color === "emerald" && "bg-emerald-50 text-emerald-600",
                                    stat.color === "purple" && "bg-purple-50 text-purple-600",
                                    stat.color === "orange" && "bg-orange-50 text-orange-600"
                                )}>
                                    <stat.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                                    <h3 className={cn(
                                        "text-lg font-bold text-slate-900 mt-1",
                                        stat.truncate && "truncate max-w-[180px]"
                                    )}>
                                        {stat.value}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <ParentDetails
                    parent={parentData}
                    children={children}
                    availableStudents={availableStudents}
                    canManage={isStaff}
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
                    </div>
                </div>
            </div>
        );
    }
} 