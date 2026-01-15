import type { Metadata } from "next"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PaymentRequestsAdmin } from "./_components/payment-requests-admin"

export const metadata: Metadata = {
    title: "Payment Requests | Admin",
    description: "Review and process parent payment requests",
}

async function getPaymentRequests(schoolId?: string | null) {
    try {
        const whereClause = schoolId ? { student: { user: { schoolId } } } : {};
        
        const paymentRequests = await prisma.paymentRequest.findMany({
            where: whereClause,
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                        classes: {
                            include: {
                                class: true,
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
        })

        const manualRequests = paymentRequests.map(request => ({
            id: request.id,
            amount: request.amount,
            status: request.status,
            createdAt: request.createdAt,
            updatedAt: request.updatedAt,
            receiptUrl: request.receiptUrl,
            notes: request.notes,
            reviewedAt: request.processedAt,
            reviewNotes: request.notes,
            student: request.student,
            billAssignment: {
                id: request.billAssignment.id,
                bill: {
                    id: request.billAssignment.bill.id,
                    name: request.billAssignment.bill.name,
                    description: request.billAssignment.bill.description,
                    amount: request.billAssignment.bill.amount,
                    dueDate: request.billAssignment.dueDate || new Date(),
                    account: {
                        id: request.billAssignment.bill.account?.id || "manual",
                        name: request.billAssignment.bill.account?.name || "Manual Account",
                        bankName: request.billAssignment.bill.account?.bankName || "Unknown",
                        accountNo: request.billAssignment.bill.account?.accountNo || "N/A"
                    }
                }
            },
            requestedBy: request.processedBy || { id: '', name: 'Unknown' },
            reviewedBy: request.processedBy
        }));

        // Fetch Squad Payments
        const squadWhereClause = schoolId ? { schoolId } : {};
        const squadPayments = await prisma.squadPayment.findMany({
            where: {
                ...squadWhereClause,
                status: "SUCCESS"
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
                        classes: {
                            include: {
                                class: true,
                            },
                            where: { status: "ACTIVE" },
                            take: 1
                        },
                    },
                },
                school: true
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        const squadDisplayPayments = await Promise.all(squadPayments.map(async (payment) => {
            let billName = "School Fee";
            let billId = payment.feeId || "";
            if (payment.feeId) {
                const bill = await prisma.bill.findUnique({
                    where: { id: payment.feeId },
                    select: { name: true }
                });
                if (bill) billName = bill.name;
            }

            return {
                id: payment.id,
                amount: Number(payment.amount),
                status: "APPROVED",
                createdAt: payment.paidAt || payment.createdAt,
                updatedAt: payment.updatedAt,
                receiptUrl: `/dashboard/receipt/${payment.squadReference}`,
                notes: `Squad Ref: ${payment.squadReference}`,
                reviewedAt: payment.paidAt || payment.createdAt,
                reviewNotes: "Automatically verified via Squad",
                student: payment.student,
                billAssignment: {
                    id: "squad-" + payment.id,
                    bill: {
                        id: billId,
                        name: billName,
                        description: "Digital Payment via Squad",
                        amount: Number(payment.amount),
                        dueDate: payment.createdAt,
                        account: {
                            id: "squad",
                            name: "Digital Payment",
                            bankName: "GTBank (Squad)",
                            accountNo: "N/A"
                        }
                    }
                },
                requestedBy: { id: 'squad', name: 'Digital Gateway' },
                reviewedBy: { id: 'squad', name: 'Digital Gateway' }
            };
        }));

        return [...manualRequests, ...squadDisplayPayments].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    } catch (error) {
        console.error("Error fetching payment requests:", error)
        return []
    }
}

export default async function PaymentRequestsAdminPage() {
    const session = await getSession(null)
    if (!session || !session.id) {
        redirect("/auth/signin?callbackUrl=/dashboard/fees/admin/payment-requests")
    }

    const user = await prisma.user.findUnique({
        where: { id: session.id },
        include: {
            admin: true,
        },
    })

    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "SCHOOL_ADMIN" && !user.admin)) {
        redirect("/dashboard")
    }

    const paymentRequests = await getPaymentRequests(user.schoolId)

    return <PaymentRequestsAdmin paymentRequests={paymentRequests} />
}

