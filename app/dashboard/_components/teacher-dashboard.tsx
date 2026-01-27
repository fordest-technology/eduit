"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Users,
    BookOpen,
    GraduationCap,
    ClipboardCheck,
    Calendar,
    TrendingUp,
    ChevronRight,
    AlertCircle,
} from "lucide-react";
import { DashboardHeader } from "@/app/components/dashboard-header";
import Link from "next/link";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useColors } from "@/contexts/color-context";

interface TeacherStats {
    totalStudents: number;
    totalClasses: number;
    totalSubjects: number;
    pendingResults: number;
    pendingAttendance: number;
    averagePerformance: number;
}

export default function TeacherDashboard() {
    const [stats, setStats] = useState<TeacherStats | null>(null);
    const [loading, setLoading] = useState(true);

    const { refreshColors } = useColors();

    useEffect(() => {
        async function fetchStats() {
            try {
                // Refresh colors to ensure correct organization branding
                refreshColors();
                
                setLoading(true);
                const response = await fetch("/api/teachers/dashboard/stats");

                if (!response.ok) {
                    throw new Error("Failed to fetch dashboard stats");
                }

                const data = await response.json();
                setStats(data);
            } catch (error) {
                console.error("Error fetching stats:", error);
                toast.error("Failed to load dashboard statistics");
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, []);

    const statsData = stats
        ? [
            {
                title: "Total Students",
                value: stats.totalStudents,
                icon: Users,
                color: "bg-blue-500",
                lightColor: "bg-blue-50",
                textColor: "text-blue-600",
                link: "/dashboard/teachers/students",
            },
            {
                title: "My Classes",
                value: stats.totalClasses,
                icon: GraduationCap,
                color: "bg-purple-500",
                lightColor: "bg-purple-50",
                textColor: "text-purple-600",
                link: "/dashboard/my-classes",
            },
            {
                title: "Subjects Teaching",
                value: stats.totalSubjects,
                icon: BookOpen,
                color: "bg-green-500",
                lightColor: "bg-green-50",
                textColor: "text-green-600",
            },
            {
                title: "Pending Results",
                value: stats.pendingResults,
                icon: ClipboardCheck,
                color: "bg-orange-500",
                lightColor: "bg-orange-50",
                textColor: "text-orange-600",
                alert: stats.pendingResults > 0,
                link: "/dashboard/results",
            },
            {
                title: "Pending Attendance",
                value: stats.pendingAttendance,
                icon: Calendar,
                color: "bg-red-500",
                lightColor: "bg-red-50",
                textColor: "text-red-600",
                alert: stats.pendingAttendance > 0,
                link: "/dashboard/attendance",
            },
            {
                title: "Avg. Performance",
                value: `${stats.averagePerformance}%`,
                icon: TrendingUp,
                color: "bg-indigo-500",
                lightColor: "bg-indigo-50",
                textColor: "text-indigo-600",
            },
        ]
        : [];

    if (loading) {
        return (
            <div className="space-y-6 p-6">
                <div className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <DashboardHeader
                heading="Teacher Dashboard"
                text="Welcome back! Here's an overview of your teaching activities."
                showBanner={true}
                icon={<GraduationCap className="h-8 w-8 text-white" />}
            />

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {statsData.map((stat, index) => {
                    const Icon = stat.icon;
                    const CardWrapper = stat.link ? Link : "div";
                    const cardProps = stat.link ? { href: stat.link } : {};

                    return (
                        <motion.div
                            key={stat.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <CardWrapper {...cardProps}>
                                <Card
                                    className={`border-none shadow-lg hover:shadow-xl transition-all duration-300 ${stat.alert ? "ring-2 ring-orange-200" : ""
                                        } ${stat.link ? "cursor-pointer" : ""}`}
                                >
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className={`h-12 w-12 rounded-xl ${stat.lightColor} flex items-center justify-center`}>
                                                <Icon className={`h-6 w-6 ${stat.textColor}`} />
                                            </div>
                                            {stat.link && <ChevronRight className="h-5 w-5 text-slate-400" />}
                                        </div>
                                        <div className="text-3xl font-bold mb-1">{stat.value}</div>
                                        <p className="text-sm text-slate-600">{stat.title}</p>
                                        {stat.alert && (
                                            <div className="mt-3 flex items-center gap-1 text-xs text-orange-600 font-medium">
                                                <AlertCircle className="h-3 w-3" />
                                                Requires attention
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </CardWrapper>
                        </motion.div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                <Card className="border-none shadow-xl bg-gradient-to-br from-primary/5 to-primary/10">
                    <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <span>Quick Actions</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <Link href="/dashboard/my-classes">
                                <Button variant="outline" className="w-full rounded-xl justify-start" size="lg">
                                    <GraduationCap className="h-5 w-5 mr-2" />
                                    My Classes
                                </Button>
                            </Link>
                            <Link href="/dashboard/teachers/students">
                                <Button variant="outline" className="w-full rounded-xl justify-start" size="lg">
                                    <Users className="h-5 w-5 mr-2" />
                                    My Students
                                </Button>
                            </Link>
                            <Link href="/dashboard/attendance">
                                <Button variant="outline" className="w-full rounded-xl justify-start" size="lg">
                                    <Calendar className="h-5 w-5 mr-2" />
                                    Mark Attendance
                                </Button>
                            </Link>
                            <Link href="/dashboard/results">
                                <Button variant="outline" className="w-full rounded-xl justify-start" size="lg">
                                    <ClipboardCheck className="h-5 w-5 mr-2" />
                                    Enter Results
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Alerts */}
            {stats && (stats.pendingResults > 0 || stats.pendingAttendance > 0) && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
                    <Card className="border-orange-200 bg-orange-50 border-2">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                                    <AlertCircle className="h-6 w-6 text-orange-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-orange-900 mb-2">Pending Tasks</h3>
                                    <div className="space-y-2 text-sm text-orange-800">
                                        {stats.pendingResults > 0 && (
                                            <div className="flex items-center justify-between">
                                                <span>• {stats.pendingResults} results need to be entered</span>
                                                <Link href="/dashboard/results">
                                                    <Button size="sm" variant="outline" className="rounded-xl border-orange-300">
                                                        Enter Now
                                                    </Button>
                                                </Link>
                                            </div>
                                        )}
                                        {stats.pendingAttendance > 0 && (
                                            <div className="flex items-center justify-between">
                                                <span>• {stats.pendingAttendance} students attendance not marked today</span>
                                                <Link href="/dashboard/attendance">
                                                    <Button size="sm" variant="outline" className="rounded-xl border-orange-300">
                                                        Mark Now
                                                    </Button>
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </div>
    );
}
