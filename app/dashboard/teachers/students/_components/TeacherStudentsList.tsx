"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { User, TrendingUp, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface Student {
    id: string;
    userId: string;
    name: string;
    email: string;
    profileImage: string | null;
    gender: string | null;
    rollNumber: string | null;
    class: {
        id: string;
        name: string;
        section: string | null;
        level: string;
    };
    attendance: {
        percentage: number;
        present: number;
        total: number;
    };
    performance: {
        average: number;
    };
}

interface TeacherStudentsListProps {
    students: Student[];
    loading?: boolean;
}

export function TeacherStudentsList({ students, loading }: TeacherStudentsListProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                    <Card key={i} className="border border-slate-100 animate-pulse">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-12 w-12 rounded-full bg-slate-200" />
                                <div className="flex-1">
                                    <div className="h-4 w-32 bg-slate-200 rounded mb-2" />
                                    <div className="h-3 w-24 bg-slate-200 rounded" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-3 w-full bg-slate-200 rounded" />
                                <div className="h-3 w-3/4 bg-slate-200 rounded" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (students.length === 0) {
        return (
            <Card className="border-none shadow-lg">
                <CardContent className="p-12">
                    <div className="text-center">
                        <User className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">No Students Found</h3>
                        <p className="text-slate-500">
                            No students match your current filters. Try adjusting your search criteria.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
                {students.map((student, index) => {
                    const attendanceColor =
                        student.attendance.percentage >= 80
                            ? "text-green-600"
                            : student.attendance.percentage >= 60
                                ? "text-orange-600"
                                : "text-red-600";

                    const performanceColor =
                        student.performance.average >= 70
                            ? "text-green-600"
                            : student.performance.average >= 50
                                ? "text-orange-600"
                                : "text-red-600";

                    return (
                        <motion.div
                            key={student.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: index * 0.03 }}
                        >
                            <Link href={`/dashboard/students/${student.id}`}>
                                <Card className="border border-slate-100 hover:border-primary/20 hover:shadow-lg transition-all duration-300 cursor-pointer group">
                                    <CardContent className="p-4">
                                        {/* Student Header */}
                                        <div className="flex items-center gap-3 mb-3">
                                            <Avatar className="h-12 w-12 ring-2 ring-slate-100 group-hover:ring-primary/20 transition-all">
                                                <AvatarImage src={student.profileImage || undefined} />
                                                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                                    {student.name.split(" ").map((n) => n[0]).join("")}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold truncate group-hover:text-primary transition-colors">
                                                    {student.name}
                                                </p>
                                                <p className="text-xs text-slate-500 truncate">{student.email}</p>
                                            </div>
                                        </div>

                                        {/* Class Info */}
                                        <div className="mb-3">
                                            <Badge variant="secondary" className="text-xs">
                                                {student.class.name} {student.class.section && `(${student.class.section})`}
                                            </Badge>
                                            {student.rollNumber && (
                                                <Badge variant="outline" className="text-xs ml-2">
                                                    Roll: {student.rollNumber}
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Stats */}
                                        <div className="space-y-3">
                                            {/* Attendance */}
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3 text-slate-400" />
                                                        <span className="text-xs text-slate-600">Attendance</span>
                                                    </div>
                                                    <span className={`text-xs font-semibold ${attendanceColor}`}>
                                                        {student.attendance.percentage}%
                                                    </span>
                                                </div>
                                                <Progress value={student.attendance.percentage} className="h-1.5" />
                                                <p className="text-[10px] text-slate-400 mt-1">
                                                    {student.attendance.present}/{student.attendance.total} days
                                                </p>
                                            </div>

                                            {/* Performance */}
                                            {student.performance.average > 0 && (
                                                <div>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <div className="flex items-center gap-1">
                                                            <TrendingUp className="h-3 w-3 text-slate-400" />
                                                            <span className="text-xs text-slate-600">Performance</span>
                                                        </div>
                                                        <span className={`text-xs font-semibold ${performanceColor}`}>
                                                            {student.performance.average}%
                                                        </span>
                                                    </div>
                                                    <Progress value={student.performance.average} className="h-1.5" />
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
