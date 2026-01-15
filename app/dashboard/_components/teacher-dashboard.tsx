"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Users,
    School,
    BookOpen,
    ClipboardList,
    AlertCircle,
    TrendingUp,
    Calendar,
    Award
} from "lucide-react";
import { DashboardHeader } from "@/app/components/dashboard-header";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";

interface TeacherDashboardData {
    stats: {
        totalStudents: number;
        totalClasses: number;
        totalSubjects: number;
        classTeacherOf: number;
        pendingResults: number;
    };
    classes: Array<{
        id: string;
        name: string;
        section: string | null;
        level: string | null;
        studentCount: number;
        isClassTeacher: boolean;
    }>;
    subjects: Array<{
        id: string;
        name: string;
        code: string | null;
        isCore: boolean;
        classes: Array<{
            id: string;
            name: string;
            section: string | null;
            level: string | null;
            studentCount: number;
        }>;
    }>;
    recentResults: Array<{
        id: string;
        studentName: string;
        subjectName: string;
        periodName: string;
        score: number;
        grade: string;
        updatedAt: string;
    }>;
    currentSession: {
        id: string;
        name: string;
    };
    teacher: {
        id: string;
        name: string;
        employeeId: string | null;
        specialization: string | null;
    };
}

export default function TeacherDashboard() {
    const [data, setData] = useState<TeacherDashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                const res = await fetch("/api/teachers/dashboard");
                if (!res.ok) throw new Error("Failed to fetch dashboard data");

                const dashboardData = await res.json();
                setData(dashboardData);
            } catch (error) {
                console.error("Error fetching dashboard:", error);
                toast.error("Failed to load dashboard data");
            } finally {
                setLoading(false);
            }
        }

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">Failed to load dashboard</p>
            </div>
        );
    }

    const statCards = [
        {
            title: "Students Taught",
            value: data.stats.totalStudents,
            description: "Total students across all subjects",
            icon: Users,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
        },
        {
            title: "Classes",
            value: data.stats.totalClasses,
            description: `Class teacher of ${data.stats.classTeacherOf}`,
            icon: School,
            color: "text-green-600",
            bgColor: "bg-green-50",
        },
        {
            title: "Subjects",
            value: data.stats.totalSubjects,
            description: "Subjects you teach",
            icon: BookOpen,
            color: "text-purple-600",
            bgColor: "bg-purple-50",
        },
        {
            title: "Pending Results",
            value: data.stats.pendingResults,
            description: "Results to be entered",
            icon: ClipboardList,
            color: "text-orange-600",
            bgColor: "bg-orange-50",
        },
    ];

    return (
        <div className="space-y-6">
            <DashboardHeader
                heading={`Welcome back, ${data.teacher.name?.split(" ")[0]}!`}
                text={`${data.teacher.specialization || "Teacher"} | ${data.currentSession.name} Academic Session`}
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat) => (
                    <Card key={stat.title} className="border-none shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {stat.title}
                            </CardTitle>
                            <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                                <stat.icon className={cn("h-5 w-5", stat.color)} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* My Classes */}
                <Card className="border-none shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <School className="h-5 w-5" />
                            My Classes
                        </CardTitle>
                        <CardDescription>Classes you teach or manage</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {data.classes.length > 0 ? (
                            <div className="space-y-3">
                                {data.classes.map((classItem) => (
                                    <Link key={classItem.id} href={`/dashboard/classes/${classItem.id}`}>
                                        <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold">{classItem.name}</p>
                                                    {classItem.section && (
                                                        <Badge variant="outline">{classItem.section}</Badge>
                                                    )}
                                                    {classItem.isClassTeacher && (
                                                        <Badge className="bg-blue-600">Class Teacher</Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {classItem.level} • {classItem.studentCount} students
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground py-8">
                                No classes assigned yet
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* My Subjects */}
                <Card className="border-none shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            My Subjects
                        </CardTitle>
                        <CardDescription>Subjects you teach across classes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {data.subjects.length > 0 ? (
                            <div className="space-y-3">
                                {data.subjects.map((subject) => (
                                    <div
                                        key={subject.id}
                                        className="p-4 rounded-lg border hover:bg-accent transition-colors"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold">{subject.name}</p>
                                                {subject.isCore && (
                                                    <Badge variant="default">Core Subject</Badge>
                                                )}
                                            </div>
                                            {subject.code && (
                                                <Badge variant="outline">{subject.code}</Badge>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {subject.classes.map((classItem) => (
                                                <Badge key={classItem.id} variant="secondary" className="text-xs">
                                                    {classItem.name} ({classItem.studentCount})
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground py-8">
                                No subjects assigned yet
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Results Activity */}
            <Card className="border-none shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Recent Results Submitted
                    </CardTitle>
                    <CardDescription>Your latest result entries</CardDescription>
                </CardHeader>
                <CardContent>
                    {data.recentResults.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Period</TableHead>
                                    <TableHead className="text-right">Score</TableHead>
                                    <TableHead>Grade</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.recentResults.map((result) => (
                                    <TableRow key={result.id}>
                                        <TableCell className="font-medium">{result.studentName}</TableCell>
                                        <TableCell>{result.subjectName}</TableCell>
                                        <TableCell>{result.periodName}</TableCell>
                                        <TableCell className="text-right font-bold">{result.score}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    result.grade === "A" || result.grade === "B"
                                                        ? "default"
                                                        : result.grade === "F"
                                                            ? "destructive"
                                                            : "secondary"
                                                }
                                            >
                                                {result.grade}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(result.updatedAt).toLocaleDateString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-12">
                            <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-lg font-semibold text-muted-foreground">No results yet</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Start entering results for your students
                            </p>
                            <Button className="mt-4" asChild>
                                <Link href="/dashboard/results">Enter Results</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick Actions */}
            {data.stats.pendingResults > 0 && (
                <Card className="border-orange-200 bg-orange-50 border-none shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-900">
                            <AlertCircle className="h-5 w-5" />
                            Action Required
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-orange-800 mb-4">
                            You have <strong>{data.stats.pendingResults} pending results</strong> to enter for
                            the current term. Please submit them as soon as possible.
                        </p>
                        <Button className="bg-orange-600 hover:bg-orange-700" asChild>
                            <Link href="/dashboard/results">Enter Results Now</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
