import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import ParentDetails from "./parent-details";

// Define interface for student data
interface StudentData {
    id: string;
    name: string;
    class: string;
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

        // Fetch parent with their children
        const parent = await prisma.user.findUnique({
            where: {
                id: params.id,
                role: UserRole.PARENT,
            },
            include: {
                parent: {
                    include: {
                        children: {
                            include: {
                                student: {
                                    include: {
                                        user: true,
                                        classes: {
                                            include: {
                                                class: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!parent) {
            return (
                <div className="container mx-auto py-10">
                    <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h2 className="text-xl font-semibold text-yellow-600 mb-2">Parent Not Found</h2>
                        <p className="text-yellow-600">
                            The parent you are looking for does not exist or has been removed.
                        </p>
                    </div>
                </div>
            );
        }

        // Check if user has permission to view this parent
        if (session.role === UserRole.SCHOOL_ADMIN && parent.schoolId !== session.schoolId) {
            return (
                <div className="container mx-auto py-10">
                    <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
                        <h2 className="text-xl font-semibold text-red-600 mb-2">Access Denied</h2>
                        <p className="text-red-600">
                            You do not have permission to view this parent's information.
                        </p>
                    </div>
                </div>
            );
        }

        // Get current academic session
        const currentSession = await prisma.academicSession.findFirst({
            where: {
                isCurrent: true,
                schoolId: parent.schoolId || undefined,
            },
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
            };
        }) || [];

        // Fetch all available students for linking
        const availableStudents: StudentData[] = [];

        if ([UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER].includes(session.role) && parent.schoolId) {
            const allStudents = await prisma.user.findMany({
                where: {
                    role: UserRole.STUDENT,
                    schoolId: parent.schoolId,
                },
                include: {
                    student: {
                        include: {
                            classes: {
                                where: currentSession ? {
                                    sessionId: currentSession.id,
                                } : undefined,
                                include: {
                                    class: true,
                                },
                            },
                        },
                    },
                },
            });

            // Filter out already linked students
            const linkedStudentIds = children.map((child) => child.id);

            // Populate availableStudents array
            for (const student of allStudents) {
                if (!linkedStudentIds.includes(student.id)) {
                    let className = "Not assigned";

                    if (student.student?.classes && student.student.classes.length > 0) {
                        className = student.student.classes[0].class.name;
                    }

                    availableStudents.push({
                        id: student.id,
                        name: student.name,
                        class: className
                    });
                }
            }
        }

        const parentData = {
            id: parent.id,
            name: parent.name,
            email: parent.email,
            profileImage: parent.profileImage,
            schoolId: parent.schoolId,
        };

        return (
            <div className="container mx-auto py-10">
                <ParentDetails
                    parent={parentData}
                    children={children}
                    availableStudents={availableStudents}
                    canManage={[UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER].includes(session.role)}
                />
            </div>
        );
    } catch (error) {
        console.error("Error in parent detail page:", error);
        return (
            <div className="container mx-auto py-10">
                <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
                    <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Parent Details</h2>
                    <p className="text-red-600">
                        There was a problem loading this parent's information. Please try again later or contact support.
                    </p>
                </div>
            </div>
        );
    }
} 