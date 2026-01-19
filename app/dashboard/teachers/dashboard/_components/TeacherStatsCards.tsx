"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, GraduationCap, ClipboardCheck, Calendar, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface TeacherStats {
    totalStudents: number;
    totalClasses: number;
    totalSubjects: number;
    pendingResults: number;
    pendingAttendance: number;
    averagePerformance: number;
}

interface TeacherStatsCardsProps {
    stats: TeacherStats;
    loading?: boolean;
}

export function TeacherStatsCards({ stats, loading }: TeacherStatsCardsProps) {
    const statsData = [
        {
            title: "Total Students",
            value: stats.totalStudents,
            icon: Users,
            color: "bg-blue-500",
            lightColor: "bg-blue-50",
            textColor: "text-blue-600",
        },
        {
            title: "My Classes",
            value: stats.totalClasses,
            icon: GraduationCap,
            color: "bg-purple-500",
            lightColor: "bg-purple-50",
            textColor: "text-purple-600",
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
        },
        {
            title: "Pending Attendance",
            value: stats.pendingAttendance,
            icon: Calendar,
            color: "bg-red-500",
            lightColor: "bg-red-50",
            textColor: "text-red-600",
            alert: stats.pendingAttendance > 0,
        },
        {
            title: "Avg. Performance",
            value: `${stats.averagePerformance}%`,
            icon: TrendingUp,
            color: "bg-indigo-500",
            lightColor: "bg-indigo-50",
            textColor: "text-indigo-600",
        },
    ];

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="h-4 w-24 bg-slate-200 rounded" />
                            <div className="h-8 w-8 bg-slate-200 rounded-lg" />
                        </CardHeader>
                        <CardContent>
                            <div className="h-8 w-16 bg-slate-200 rounded mb-2" />
                            <div className="h-3 w-32 bg-slate-200 rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {statsData.map((stat, index) => {
                const Icon = stat.icon;
                return (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className={`border-none shadow-lg hover:shadow-xl transition-all duration-300 ${stat.alert ? 'ring-2 ring-orange-200' : ''}`}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-600">
                                    {stat.title}
                                </CardTitle>
                                <div className={`h-10 w-10 rounded-xl ${stat.lightColor} flex items-center justify-center`}>
                                    <Icon className={`h-5 w-5 ${stat.textColor}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{stat.value}</div>
                                {stat.alert && (
                                    <p className="text-xs text-orange-600 mt-2 font-medium">
                                        ⚠️ Requires attention
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                );
            })}
        </div>
    );
}
