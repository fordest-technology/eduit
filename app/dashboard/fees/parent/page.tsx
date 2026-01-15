import { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ParentPaymentForm } from "@/app/dashboard/fees/parent/_components/parent-payment-form";

export const metadata: Metadata = {
    title: "Fee Payments",
    description: "Make fee payments for your children",
};

async function getParentData(parentId: string) {
    // Get parent's students (children)
    const children = await prisma.studentParent.findMany({
        where: { parentId },
        include: {
            student: {
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                        },
                    },
                    classes: {
                        include: {
                            class: true,
                        },
                    },
                },
            },
        },
    });

    // Get school ID from any of the children
    let schoolId;
    if (children.length > 0) {
        const studentId = children[0].studentId;
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: {
                user: {
                    select: {
                        schoolId: true,
                    },
                },
            },
        });
        schoolId = student?.user.schoolId;
    }

    // If no children or no school ID, return empty arrays
    if (!schoolId || children.length === 0) {
        return {
            children: [],
            bills: [],
            paymentAccounts: [],
        };
    }

    // Get active payment accounts
    const paymentAccounts = await prisma.paymentAccount.findMany({
        where: {
            schoolId,
            isActive: true,
        },
    });

    // Get all bills assigned to the parent's children
    const studentIds = children.map((child) => child.studentId);
    const classes = await prisma.studentClass.findMany({
        where: {
            studentId: {
                in: studentIds,
            },
        },
        select: {
            classId: true,
        },
    });
    const classIds = classes.map((cls) => cls.classId);

    // Find bills through assignments where the target is either the student or their class
    const bills = await prisma.bill.findMany({
        where: {
            schoolId,
            assignments: {
                some: {
                    OR: [
                        {
                            targetType: "STUDENT",
                            targetId: {
                                in: studentIds,
                            },
                        },
                        {
                            targetType: "CLASS",
                            targetId: {
                                in: classIds,
                            },
                        },
                    ],
                },
            },
        },
        include: {
            account: true,
            assignments: {
                where: {
                    OR: [
                        {
                            targetType: "STUDENT",
                            targetId: {
                                in: studentIds,
                            },
                        },
                        {
                            targetType: "CLASS",
                            targetId: {
                                in: classIds,
                            },
                        },
                    ],
                },
                include: {
                    studentPayments: {
                        where: {
                            studentId: {
                                in: studentIds,
                            },
                        },
                    },
                },
            },
        },
    });

    return {
        children: children.map((child) => child.student),
        bills,
        paymentAccounts,
    };
}

export default async function ParentFeePage() {
    const session = await getSession(null);

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

    const parentData = await getParentData(user.parent.id);

    return (
        <div className="container mx-auto py-6">
            <h1 className="text-2xl font-bold mb-6">Make a Payment</h1>
            <ParentPaymentForm
                children={parentData.children}
                bills={parentData.bills}
            />
        </div>
    );
} 