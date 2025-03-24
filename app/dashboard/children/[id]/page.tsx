import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Users, GraduationCap, BookOpen, Calendar, Mail, Phone, MapPin, User } from "lucide-react"
import { DashboardHeader } from "@/app/components/dashboard-header"
import { format } from "date-fns"
import { BackButton } from "../components/back-button"

interface ChildDetail {
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
        section: string | null;
    }>;
    address: string | null;
    phone: string | null;
    dateOfBirth: Date | null;
    gender: string | null;
    admissionDate: Date | null;
}

async function getChildDetail(childId: string, parentId: string): Promise<ChildDetail | null> {
    const relationship = await prisma.studentParent.findFirst({
        where: {
            studentId: childId,
            parentId: parentId,
        },
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

    if (!relationship) return null;

    return {
        id: relationship.student.id,
        user: relationship.student.user,
        classes: relationship.student.classes.map(cls => ({
            classId: cls.class.id,
            className: cls.class.name,
            section: cls.class.section,
        })),
        address: relationship.student.address,
        phone: relationship.student.phone,
        dateOfBirth: relationship.student.dateOfBirth,
        gender: relationship.student.gender,
        admissionDate: relationship.student.admissionDate,
    };
}

export default async function ChildDetailPage({
    params,
}: {
    params: { id: string }
}) {
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

    const child = await getChildDetail(params.id, user.parent.id);

    if (!child) {
        redirect("/dashboard/children");
    }

    return (
        <div className="space-y-6">
            <DashboardHeader
                heading={`${child.user.name}'s Profile`}
                text="View detailed information about your child"
                showBanner={true}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Personal Information
                        </CardTitle>
                        <CardDescription>Basic details about your child</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{child.user.email}</span>
                        </div>
                        {child.phone && (
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{child.phone}</span>
                            </div>
                        )}
                        {child.address && (
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>{child.address}</span>
                            </div>
                        )}
                        {child.dateOfBirth && (
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>Born: {format(child.dateOfBirth, 'PPP')}</span>
                            </div>
                        )}
                        {child.gender && (
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>Gender: {child.gender}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Academic Information Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <GraduationCap className="h-5 w-5" />
                            Academic Information
                        </CardTitle>
                        <CardDescription>Current classes and academic status</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {child.admissionDate && (
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>Admitted: {format(child.admissionDate, 'PPP')}</span>
                            </div>
                        )}
                        <div className="space-y-2">
                            <h4 className="font-medium">Current Classes:</h4>
                            {child.classes.length > 0 ? (
                                <ul className="space-y-2">
                                    {child.classes.map((cls) => (
                                        <li key={cls.classId} className="flex items-center gap-2">
                                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                                            <span>{cls.className} - {cls.section || 'No Section'}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-muted-foreground">No classes assigned yet</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end">
                <BackButton />
            </div>
        </div>
    );
} 