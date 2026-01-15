import { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ParentPaymentHistory } from "@/app/dashboard/fees/parent/_components/parent-payment-history";

export const metadata: Metadata = {
    title: "Payment History",
    description: "View your payment history and receipts",
};

export default async function ParentHistoryPage() {
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

    // Get children
    const childrenRelations = await prisma.studentParent.findMany({
        where: { parentId: user.parent.id },
        include: {
            student: {
                include: {
                    user: {
                        select: {
                            name: true,
                        },
                    },
                },
            },
        },
    });

    const studentIds = childrenRelations.map((c) => c.studentId);
    const children = childrenRelations.map((c) => c.student);

    // Get manual payment requests
    const paymentRequests = await prisma.paymentRequest.findMany({
        where: {
            studentId: { in: studentIds },
        },
        include: {
            student: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },
            billAssignment: {
                include: {
                    bill: {
                        include: {
                            account: true,
                        },
                    },
                },
            },
            processedBy: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    // Get Squad payments
    const squadPayments = await prisma.squadPayment.findMany({
        where: {
            studentId: { in: studentIds },
            status: "SUCCESS",
        },
        include: {
            student: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },
            school: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    // Fetch bill names for squad payments
    const squadPaymentsWithBills = await Promise.all(
        squadPayments.map(async (payment) => {
            let billName = "School Fee";
            let billId = "";
            let dueDate = new Date();

            if (payment.feeId) {
                const bill = await prisma.bill.findUnique({
                    where: { id: payment.feeId },
                });
                if (bill) {
                    billName = bill.name;
                    billId = bill.id;
                    dueDate = bill.createdAt; // Fallback
                }
            }

            return {
                id: payment.id,
                amount: Number(payment.amount),
                status: "APPROVED", // Success Squad payments are virtually approved
                createdAt: payment.paidAt || payment.createdAt,
                updatedAt: payment.updatedAt,
                receiptUrl: `/dashboard/receipt/${payment.squadReference}`,
                notes: `Transaction Ref: ${payment.squadReference}`,
                reviewedAt: payment.paidAt || payment.createdAt,
                reviewNotes: "Automatically processed via Squad (GTBank)",
                student: {
                    id: payment.student.id,
                    user: {
                        id: payment.student.user.id,
                        name: payment.student.user.name,
                    },
                },
                billAssignment: {
                    id: payment.metadata?.billAssignmentId || "sq-" + payment.id,
                    bill: {
                        id: billId,
                        name: billName,
                        description: "Digital Payment",
                        amount: Number(payment.amount),
                        dueDate: dueDate,
                        account: {
                            id: "squad",
                            name: "Digital Payment",
                            bankName: "GTBank (Squad)",
                            accountNo: "N/A",
                        },
                    },
                },
                reviewedBy: {
                    id: "system",
                    name: "Squad Gateway",
                },
            };
        })
    );

    // Merge both types of payments
    const allPayments = [...paymentRequests, ...squadPaymentsWithBills].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return (
        <div className="container mx-auto py-8">
            <ParentPaymentHistory 
                paymentRequests={allPayments as any} 
                children={children as any} 
            />
        </div>
    );
}