'use client'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    ArrowLeft,
    Users,
    School,
    Calendar,
    DollarSign,
    CheckCircle2,
    Clock,
    AlertCircle,
    CreditCard,
    Download,
    Send
} from "lucide-react"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

interface AssignmentDetails {
    id: string
    targetType: "CLASS" | "STUDENT"
    targetId: string
    dueDate: string
    status: "PAID" | "PARTIALLY_PAID" | "PENDING" | "OVERDUE"
    bill: {
        id: string
        name: string
        amount: number
        items: {
            id: string
            name: string
            amount: number
            description?: string
        }[]
    }
    class?: {
        id: string
        name: string
        section?: string
        students: {
            id: string
            user: {
                name: string
            }
        }[]
    }
    studentPayments: {
        id: string
        amountPaid: number
        studentId: string
        student?: {
            user: {
                name: string
            }
        }
    }[]
}

interface SchoolTheme {
    primaryColor: string
    secondaryColor: string
}

type PaymentStatus = "PAID" | "PARTIAL" | "UNPAID"

export default function ClassAssignmentPage() {
    const router = useRouter()
    const params = useParams()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [assignment, setAssignment] = useState<AssignmentDetails | null>(null)
    const [schoolTheme, setSchoolTheme] = useState<SchoolTheme | null>(null)

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch assignment details
                const assignmentRes = await fetch(`/api/bills/${params.billId}/assignments/${params.assignmentId}`)
                if (!assignmentRes.ok) throw new Error("Failed to fetch assignment details")
                const assignmentData = await assignmentRes.json()
                setAssignment(assignmentData)

                // Fetch school theme
                const themeRes = await fetch('/api/school/theme')
                if (themeRes.ok) {
                    const themeData = await themeRes.json()
                    setSchoolTheme(themeData)
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred")
            } finally {
                setLoading(false)
            }
        }

        if (params.billId && params.assignmentId) {
            fetchData()
        }
    }, [params.billId, params.assignmentId])

    if (loading) {
        return <LoadingSkeleton />
    }

    if (error || !assignment || assignment.targetType !== "CLASS") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <p className="text-red-500 mb-4">{error || "Assignment not found or invalid type"}</p>
                <Button onClick={() => router.push(`/dashboard/fees/${params.billId}`)}>
                    Back to Bill Details
                </Button>
            </div>
        )
    }

    const totalStudents = assignment.class?.students.length || 0
    const perStudentAmount = assignment.bill.amount
    const totalExpected = perStudentAmount * totalStudents
    const totalPaid = assignment.studentPayments.reduce((sum, payment) => sum + payment.amountPaid, 0)
    const totalPending = totalExpected - totalPaid

    // Calculate student payments
    const studentPayments = assignment.class?.students.map(student => {
        const payment = assignment.studentPayments.find(p => p.studentId === student.id)
        const amountPaid = payment?.amountPaid ?? 0
        const status: PaymentStatus = amountPaid >= perStudentAmount
            ? "PAID"
            : amountPaid > 0
                ? "PARTIAL"
                : "UNPAID"
        return {
            student,
            amountPaid,
            status
        }
    }) || []

    const paidStudents = studentPayments.filter(p => p.status === "PAID")
    const partialStudents = studentPayments.filter(p => p.status === "PARTIAL")
    const unpaidStudents = studentPayments.filter(p => p.status === "UNPAID")

    const statusColors: Record<PaymentStatus, string> = {
        PAID: "bg-green-100 text-green-700 border-green-200",
        PARTIAL: "bg-yellow-100 text-yellow-700 border-yellow-200",
        UNPAID: "bg-red-100 text-red-700 border-red-200"
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="ghost"
                            onClick={() => router.push(`/dashboard/fees/${params.billId}`)}
                            size="sm"
                            className="gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Bill
                        </Button>
                        <Separator orientation="vertical" className="h-6" />
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                {assignment.class?.name}
                                {assignment.class?.section && ` - ${assignment.class.section}`}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {assignment.bill.name} • Due {format(new Date(assignment.dueDate), "PPP")}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Export Report
                        </Button>
                        <Button variant="outline" size="sm">
                            <Send className="h-4 w-4 mr-2" />
                            Send Reminders
                        </Button>
                    </div>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="relative overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Expected
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline space-x-2">
                            <span className="text-2xl font-bold">${totalExpected.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
                            <span>${perStudentAmount.toFixed(2)}</span>
                            <span>×</span>
                            <span>{totalStudents} students</span>
                        </div>
                    </CardContent>
                    <div className="absolute top-0 right-0 h-full w-2" style={{ backgroundColor: schoolTheme?.primaryColor }} />
                </Card>

                <Card className="relative overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Collected
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline space-x-2">
                            <span className="text-2xl font-bold">${totalPaid.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {((totalPaid / totalExpected) * 100).toFixed(1)}% collected
                        </p>
                    </CardContent>
                    <div className="absolute top-0 right-0 h-full w-2" style={{ backgroundColor: schoolTheme?.secondaryColor }} />
                </Card>

                <Card className="relative overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Outstanding Balance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline space-x-2">
                            <span className="text-2xl font-bold">${totalPending.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {((totalPending / totalExpected) * 100).toFixed(1)}% remaining
                        </p>
                    </CardContent>
                    <div className="absolute top-0 right-0 h-full w-2" style={{ backgroundColor: schoolTheme?.primaryColor }} />
                </Card>

                <Card className="relative overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Payment Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-green-600">Paid in Full</span>
                                <span>{paidStudents.length}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-yellow-600">Partial Payment</span>
                                <span>{partialStudents.length}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-red-600">No Payment</span>
                                <span>{unpaidStudents.length}</span>
                            </div>
                        </div>
                    </CardContent>
                    <div className="absolute top-0 right-0 h-full w-2" style={{ backgroundColor: schoolTheme?.secondaryColor }} />
                </Card>
            </div>

            {/* Fee Components */}
            <Card>
                <CardHeader>
                    <CardTitle>Fee Components</CardTitle>
                    <CardDescription>Breakdown of charges per student</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {assignment.bill.items.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between p-4 rounded-lg border"
                                style={{
                                    borderLeft: schoolTheme ? `4px solid ${schoolTheme.primaryColor}` : undefined
                                }}
                            >
                                <div>
                                    <h3 className="font-medium">{item.name}</h3>
                                    {item.description && (
                                        <p className="text-sm text-muted-foreground">{item.description}</p>
                                    )}
                                </div>
                                <span className="font-semibold">${item.amount.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Student List */}
            <Card>
                <CardHeader>
                    <CardTitle>Student Payments</CardTitle>
                    <CardDescription>
                        Payment status for each student in {assignment.class?.name}
                        {assignment.class?.section && ` - ${assignment.class.section}`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-3">
                            {studentPayments.map(({ student, amountPaid, status }) => (
                                <div
                                    key={student.id}
                                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/5 transition-colors"
                                    style={{
                                        borderLeft: schoolTheme ? `4px solid ${schoolTheme.primaryColor}` : undefined
                                    }}
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="flex-shrink-0">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <span className="text-sm font-medium">
                                                    {student.user.name.split(' ').map(n => n[0]).join('')}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="font-medium">{student.user.name}</p>
                                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                                <span>Expected: ${perStudentAmount.toFixed(2)}</span>
                                                <span>•</span>
                                                <span>Paid: ${amountPaid.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="text-right">
                                            <p className="text-sm text-muted-foreground">
                                                {((amountPaid / perStudentAmount) * 100).toFixed(1)}% paid
                                            </p>
                                            <Progress
                                                value={(amountPaid / perStudentAmount) * 100}
                                                className="h-1.5 w-24"
                                                style={{
                                                    backgroundColor: schoolTheme?.secondaryColor,
                                                    '--progress-foreground': schoolTheme?.primaryColor
                                                } as any}
                                            />
                                        </div>
                                        <Badge className={statusColors[status]}>
                                            {status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    )
}

function LoadingSkeleton() {
    return (
        <div className="space-y-8">
            <div className="h-10 w-32">
                <Skeleton className="h-full w-full" />
            </div>
            <div className="grid gap-4 md:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-4 w-24" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-32" />
                            <Skeleton className="h-4 w-24 mt-2" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
} 