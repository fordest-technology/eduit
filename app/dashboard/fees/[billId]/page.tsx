'use client'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users, School, Calendar, DollarSign } from "lucide-react"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

interface BillDetails {
    id: string
    name: string
    amount: number
    createdAt: string
    account: {
        name: string
        bankName: string
        accountNo: string
    }
    items: {
        id: string
        name: string
        amount: number
        description?: string
    }[]
    assignments: {
        id: string
        targetType: "CLASS" | "STUDENT"
        targetId: string
        dueDate: string
        status: "PAID" | "PARTIALLY_PAID" | "PENDING" | "OVERDUE"
        studentPayments: {
            amountPaid: number
            studentId: string
        }[]
    }[]
}

export default function BillDetailsPage() {
    const router = useRouter()
    const params = useParams()
    const [loading, setLoading] = useState(true)
    const [bill, setBill] = useState<BillDetails | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchBillDetails() {
            try {
                const res = await fetch(`/api/bills/${params.billId}`)
                if (!res.ok) throw new Error("Failed to fetch bill details")
                const data = await res.json()
                setBill(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred")
            } finally {
                setLoading(false)
            }
        }

        if (params.billId) {
            fetchBillDetails()
        }
    }, [params.billId])

    if (loading) {
        return <BillDetailsSkeleton />
    }

    if (error || !bill) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <p className="text-red-500 mb-4">{error || "Bill not found"}</p>
                <Button onClick={() => router.push("/dashboard/fees")}>
                    Back to Fees
                </Button>
            </div>
        )
    }

    const statusColors = {
        PAID: "bg-green-500",
        PARTIALLY_PAID: "bg-yellow-500",
        PENDING: "bg-blue-500",
        OVERDUE: "bg-red-500",
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    onClick={() => router.push("/dashboard/fees")}
                    className="gap-2"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Fees
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Bill Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h3 className="font-medium">Name</h3>
                            <p className="text-sm text-muted-foreground">{bill.name}</p>
                        </div>
                        <div>
                            <h3 className="font-medium">Total Amount</h3>
                            <p className="text-sm text-muted-foreground">
                                ${bill.amount.toFixed(2)}
                            </p>
                        </div>
                        <div>
                            <h3 className="font-medium">Created Date</h3>
                            <p className="text-sm text-muted-foreground">
                                {format(new Date(bill.createdAt), "PPP")}
                            </p>
                        </div>
                        <div>
                            <h3 className="font-medium">Payment Account</h3>
                            <p className="text-sm text-muted-foreground">
                                {bill.account.name} - {bill.account.bankName} ({bill.account.accountNo})
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Bill Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {bill.items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex justify-between items-center p-3 bg-muted rounded-lg"
                                >
                                    <div>
                                        <p className="font-medium">{item.name}</p>
                                        {item.description && (
                                            <p className="text-sm text-muted-foreground">
                                                {item.description}
                                            </p>
                                        )}
                                    </div>
                                    <p className="font-medium">${item.amount.toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Assignments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {bill.assignments.map((assignment) => (
                                <div
                                    key={assignment.id}
                                    className="flex justify-between items-center p-4 border rounded-lg"
                                >
                                    <div className="flex items-center gap-4">
                                        {assignment.targetType === "CLASS" ? (
                                            <School className="h-5 w-5 text-muted-foreground" />
                                        ) : (
                                            <Users className="h-5 w-5 text-muted-foreground" />
                                        )}
                                        <div>
                                            <p className="font-medium">
                                                {assignment.targetType === "CLASS" ? "Class" : "Student"} Assignment
                                            </p>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Calendar className="h-4 w-4" />
                                                Due: {format(new Date(assignment.dueDate), "PP")}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-sm text-muted-foreground">Payments</p>
                                            <p className="font-medium">
                                                ${assignment.studentPayments.reduce((sum, payment) => sum + payment.amountPaid, 0).toFixed(2)}
                                            </p>
                                        </div>
                                        <Badge
                                            className={`${statusColors[assignment.status]} text-white`}
                                        >
                                            {assignment.status.replace("_", " ")}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function BillDetailsSkeleton() {
    return (
        <div className="space-y-6">
            <div className="h-10 w-32">
                <Skeleton className="h-full w-full" />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i}>
                                <Skeleton className="h-4 w-24 mb-2" />
                                <Skeleton className="h-4 w-full" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent>
                        {[1, 2].map((i) => (
                            <div key={i} className="mb-4">
                                <Skeleton className="h-16 w-full rounded-lg" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
} 