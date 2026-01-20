"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, BookOpen, Calendar, TrendingUp } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

import { getSession, UserRole } from "@/lib/auth-client";

interface ClassDetailHeaderProps {
    classData: {
        id: string;
        name: string;
        section: string | null;
        level: {
            id: string;
            name: string;
        };
        teacher: {
            id: string;
            user: {
                name: string;
                email: string;
                profileImage: string | null;
            };
        } | null;
        stats: {
            totalStudents: number;
            totalSubjects: number;
            attendance: {
                total: number;
                present: number;
                absent: number;
                late: number;
                notMarked: number;
            };
            performance: {
                averageScore: number;
                highestScore: number;
                lowestScore: number;
                totalResults: number;
            };
        };
    };
    userRole?: UserRole;
}

export function ClassDetailHeader({ classData, userRole }: ClassDetailHeaderProps) {
    const attendancePercentage = classData.stats.attendance.total > 0
        ? Math.round((classData.stats.attendance.present / classData.stats.attendance.total) * 100)
        : 0;

    return (
        <div className="space-y-6">
            {/* Class Info Card */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Card className="border-none shadow-xl bg-gradient-to-br from-white to-slate-50">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <GraduationCap className="h-8 w-8 text-primary" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold tracking-tight">
                                        {classData.name}
                                        {classData.section && (
                                            <span className="text-slate-400 ml-2">({classData.section})</span>
                                        )}
                                    </h1>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Badge variant="secondary">{classData.level.name}</Badge>
                                        <span className="text-sm text-slate-500">
                                            {classData.stats.totalStudents} Students • {classData.stats.totalSubjects} Subjects
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {classData.teacher && (
                                <div className="flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-100">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={classData.teacher.user.profileImage || undefined} />
                                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                            {classData.teacher.user.name.split(" ").map((n) => n[0]).join("")}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium">Class Teacher</p>
                                        <p className="font-semibold">{classData.teacher.user.name}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-500 font-medium uppercase">Students</p>
                                    <p className="text-2xl font-bold mt-1">{classData.stats.totalStudents}</p>
                                </div>
                                <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                                    <Users className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-500 font-medium uppercase">Subjects</p>
                                    <p className="text-2xl font-bold mt-1">{classData.stats.totalSubjects}</p>
                                </div>
                                <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center">
                                    <BookOpen className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-500 font-medium uppercase">Attendance Today</p>
                                    <p className="text-2xl font-bold mt-1">{attendancePercentage}%</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {classData.stats.attendance.present}/{classData.stats.attendance.total} Present
                                    </p>
                                </div>
                                <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center">
                                    <Calendar className="h-6 w-6 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-500 font-medium uppercase">Avg. Performance</p>
                                    <p className="text-2xl font-bold mt-1">{classData.stats.performance.averageScore}%</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {classData.stats.performance.totalResults} Results
                                    </p>
                                </div>
                                <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                                    <TrendingUp className="h-6 w-6 text-indigo-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Quick Actions - Only for Teachers */}
            {(userRole === "TEACHER" || !userRole) && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Card className="border-none shadow-lg">
                        <CardContent className="p-4">
                            <div className="flex flex-wrap gap-3">
                                <Link href={`/dashboard/attendance?classId=${classData.id}`}>
                                    <Button variant="default" className="rounded-xl">
                                        <Calendar className="h-4 w-4 mr-2" />
                                        Mark Attendance
                                    </Button>
                                </Link>
                                <Link href={`/dashboard/results/entry?classId=${classData.id}`}>
                                    <Button variant="outline" className="rounded-xl">
                                        <BookOpen className="h-4 w-4 mr-2" />
                                        Enter Results
                                    </Button>
                                </Link>
                                <Link href={`/dashboard/my-classes/${classData.id}/performance`}>
                                    <Button variant="outline" className="rounded-xl">
                                        <TrendingUp className="h-4 w-4 mr-2" />
                                        View Performance
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </div>
    );
}
