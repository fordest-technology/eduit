import type { Metadata } from "next"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PaymentRequestsAdmin } from "./_components/payment-requests-admin"

export const metadata: Metadata = {
    title: "Payment Requests | Admin",
    description: "Review and process parent payment requests",
}

async function getPaymentRequests() {
    try {
        const paymentRequests = await prisma.paymentRequest.findMany({
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

        return paymentRequests.map(request => ({
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
                        id: request.billAssignment.bill.account.id,
                        name: request.billAssignment.bill.account.name,
                        bankName: request.billAssignment.bill.account.bankName,
                        accountNo: request.billAssignment.bill.account.accountNo
                    }
                }
            },
            requestedBy: request.processedBy || { id: '', name: 'Unknown' },
            reviewedBy: request.processedBy
        }))
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

    // Verify admin access
    const user = await prisma.user.findUnique({
        where: { id: session.id },
        include: {
            admin: true,
        },
    })

    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "SCHOOL_ADMIN" && !user.admin)) {
        redirect("/dashboard")
    }

    const paymentRequests = await getPaymentRequests()

    return <PaymentRequestsAdmin paymentRequests={paymentRequests} />
}

