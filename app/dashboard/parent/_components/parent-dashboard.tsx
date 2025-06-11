"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { ParentFeeDashboard } from "../../fees/_components/parent-fee-dashboard"
import { ParentStudentsCard } from "./parent-students-card"
import { ParentEventsCard } from "./parent-events-card"
import { ParentResultsCard } from "./parent-results-card"
import { CreditCard, DollarSign, Clock, CheckCircle, CalendarDays, GraduationCap, Users } from "lucide-react"
import { cn } from "@/lib/utils"

// Define custom Badge variants for use in the dashboard
const badgeVariants = {
    success: "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
}

interface ParentDashboardProps {
    data: {
        children: any[]
        bills: any[]
        paymentAccounts: any[]
        paymentRequests: any[]
        paymentHistory: any[]
        approvedResults: any[]
        upcomingEvents: any[]
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
            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-primary/10 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-primary/5">
                        <CardTitle className="text-sm font-medium">Children</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.children.length}</div>
                        <p className="text-xs text-muted-foreground">Students linked to your account</p>
                    </CardContent>
                </Card>
                <Card className="border-primary/10 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-primary/5">
                        <CardTitle className="text-sm font-medium">Total Billed</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(data.stats.totalBilled)}</div>
                        <p className="text-xs text-muted-foreground">Total fees for your children</p>
                    </CardContent>
                </Card>
                <Card className="border-primary/10 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-primary/5">
                        <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                        <Clock className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.stats.pendingPayments}</div>
                        <p className="text-xs text-muted-foreground">Awaiting approval</p>
                    </CardContent>
                </Card>
                <Card className="border-primary/10 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-primary/5">
                        <CardTitle className="text-sm font-medium">Remaining Balance</CardTitle>
                        <CreditCard className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(data.stats.remainingBalance)}</div>
                        <p className="text-xs text-muted-foreground">Outstanding balance</p>
                    </CardContent>
                </Card>
            </div>

            {/* Children Cards */}
            <ParentStudentsCard children={data.children} />

            {/* Quick Access Widgets */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Upcoming Events */}
                <Card className="border-primary/10 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="bg-primary/5">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Upcoming Events</CardTitle>
                            <CalendarDays className="h-4 w-4 text-primary" />
                        </div>
                        <CardDescription>School events and activities</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                        {data.upcomingEvents.length > 0 ? (
                            <div className="space-y-4">
                                {data.upcomingEvents.slice(0, 3).map((event) => (
                                    <div key={event.id} className="flex items-start space-x-3">
                                        <div className="bg-primary/10 rounded-md p-2 text-primary">
                                            <CalendarDays className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium">{event.title}</h4>
                                            <p className="text-xs text-muted-foreground">
                                                {format(new Date(event.startDate), "PPP")}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No upcoming events</p>
                        )}
                    </CardContent>
                    <CardFooter className="bg-muted/30 py-2">
                        <Link href="/dashboard/calendar" className="w-full">
                            <Button variant="ghost" size="sm" className="w-full">
                                View All Events
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>

                {/* Recent Results */}
                <Card className="border-primary/10 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="bg-primary/5">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Recent Results</CardTitle>
                            <GraduationCap className="h-4 w-4 text-primary" />
                        </div>
                        <CardDescription>Latest approved academic results</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                        {data.approvedResults.length > 0 ? (
                            <div className="space-y-4">
                                {data.approvedResults.slice(0, 3).map((result) => (
                                    <div key={result.id} className="flex items-start space-x-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                                {result.student.user.name.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="flex items-center">
                                                <h4 className="text-sm font-medium">{result.student.user.name}</h4>
                                                <Separator orientation="vertical" className="mx-2 h-4" />
                                                <span className="text-xs">{result.subject.name}</span>
                                            </div>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <Badge variant="outline" className="text-xs h-5">
                                                    Grade: {result.grade}
                                                </Badge>
                                                <span className={cn(
                                                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold h-5",
                                                    getScoreBadgeStyle(result.total / 100)
                                                )}>
                                                    {Math.round(result.total)}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No approved results available</p>
                        )}
                    </CardContent>
                    <CardFooter className="bg-muted/30 py-2">
                        <Link href="/dashboard/results" className="w-full">
                            <Button variant="ghost" size="sm" className="w-full">
                                View All Results
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}

// Helper function for score badge styling
function getScoreBadgeStyle(score: number): string {
    if (score >= 0.7) return "bg-green-100 text-green-800 border border-green-200"
    if (score >= 0.5) return "bg-amber-100 text-amber-800 border border-amber-200"
    return "bg-red-100 text-red-800 border border-red-200"
} 