"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard, DollarSign, Clock, Users, CalendarDays, GraduationCap } from "lucide-react"
import { DashboardHeader } from "@/app/components/dashboard-header"

interface ParentDashboardProps {
    data: {
        children: any[]
        stats: {
            totalBilled: number
            totalPaid: number
            pendingPayments: number
            approvedPayments: number
            remainingBalance: number
        }
    }
}

export function ParentDashboard({ data }: ParentDashboardProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount)
    }

    return (
        <div className="space-y-6">
            <DashboardHeader
                heading="Parent Dashboard"
                text="Monitor your children's academic progress, fees, and school activities"
                showBanner={true}
            />
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center text-blue-700">
                            <Users className="mr-2 h-5 w-5" />
                            Children
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-blue-800">{data.children.length}</p>
                        <p className="text-sm text-blue-600 mt-1">Students linked to your account</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center text-green-700">
                            <DollarSign className="mr-2 h-5 w-5" />
                            Total Billed
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-green-800">{formatCurrency(data.stats.totalBilled)}</p>
                        <p className="text-sm text-green-600 mt-1">Total fees for your children</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center text-amber-700">
                            <Clock className="mr-2 h-5 w-5" />
                            Pending Payments
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-amber-800">{data.stats.pendingPayments}</p>
                        <p className="text-sm text-amber-600 mt-1">Awaiting approval</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center text-purple-700">
                            <CreditCard className="mr-2 h-5 w-5" />
                            Remaining Balance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-purple-800">{formatCurrency(data.stats.remainingBalance)}</p>
                        <p className="text-sm text-purple-600 mt-1">Outstanding balance</p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Access Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/dashboard/cfees">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-md transition-all cursor-pointer">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-medium text-blue-700">Fee Management</CardTitle>
                                <CreditCard className="h-5 w-5 text-blue-700" />
                            </div>
                            <CardDescription className="text-blue-600">View and manage school fees</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>

                <Link href="/dashboard/pevents">
                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-md transition-all cursor-pointer">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-medium text-green-700">School Events</CardTitle>
                                <CalendarDays className="h-5 w-5 text-green-700" />
                            </div>
                            <CardDescription className="text-green-600">View upcoming school events</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>
            </div>
        </div>
    )
} 