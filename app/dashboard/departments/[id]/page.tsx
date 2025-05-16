"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserRole } from "@prisma/client";

interface Student {
    id: string;
    user: {
        id: string;
        name: string;
        email: string;
        profileImage: string | null;
    };
    class: {
        id: string;
        name: string;
    } | null;
}

interface Department {
    id: string;
    name: string;
    description: string | null;
    _count: {
        students: number;
        subjects: number;
        teachers: number;
    };
}

export default function DepartmentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [department, setDepartment] = useState<Department | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [schoolColors, setSchoolColors] = useState({
        primary: "#4f46e5",
        secondary: "#8b5cf6",
    });

    const fetchDepartment = useCallback(async () => {
        setLoading(true);
        try {
            const sessionRes = await fetch("/api/auth/session");
            if (!sessionRes.ok) {
                throw new Error("Failed to fetch session");
            }
            const session = await sessionRes.json();

            if (!session) {
                router.push("/login");
                return;
            }

            // Check if user has access to this department
            const departmentRes = await fetch(`/api/departments/${params.id}`);
            if (!departmentRes.ok) {
                if (departmentRes.status === 403) {
                    router.push("/dashboard");
                    return;
                }
                throw new Error(`Failed to fetch department: ${departmentRes.statusText}`);
            }
            const departmentData = await departmentRes.json();
            setDepartment(departmentData);

            // Fetch school colors if available
            if (session.schoolId) {
                const colorRes = await fetch(`/api/schools/${session.schoolId}`);
                if (colorRes.ok) {
                    const schoolData = await colorRes.json();
                    if (schoolData.primaryColor && schoolData.secondaryColor) {
                        setSchoolColors({
                            primary: schoolData.primaryColor,
                            secondary: schoolData.secondaryColor,
                        });
                    }
                }
            }

            // Fetch students in this department
            const studentsRes = await fetch(`/api/departments/${params.id}/students`);
            if (studentsRes.ok) {
                const studentsData = await studentsRes.json();
                setStudents(studentsData);
            }
        } catch (err: any) {
            console.error("Error fetching department data:", err);
            setError(err.message || "Failed to load department data");
        } finally {
            setLoading(false);
        }
    }, [params.id, router]);

    useEffect(() => {
        fetchDepartment();
    }, [fetchDepartment]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <h2 className="text-2xl font-bold text-red-500">Error</h2>
                <p className="text-gray-600">{error}</p>
                <Button
                    onClick={() => router.push("/dashboard/departments")}
                    className="mt-4"
                >
                    Back to Departments
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6">
            {/* Banner */}
            <div
                className="w-full p-6 mb-6 rounded-lg shadow-md"
                style={{
                    background: `linear-gradient(135deg, ${schoolColors.primary} 0%, ${schoolColors.secondary} 100%)`,
                }}
            >
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-white">
                            {loading ? (
                                <Skeleton className="h-8 w-48 bg-white/20" />
                            ) : (
                                department?.name || "Department Details"
                            )}
                        </h1>
                        <div className="text-white/80 mt-1">
                            {loading ? (
                                <Skeleton className="h-4 w-64 bg-white/20" />
                            ) : (
                                department?.description || "Department information and students"
                            )}
                        </div>
                    </div>
                    <Button
                        onClick={() => router.push("/dashboard/departments")}
                        variant="outline"
                        className="bg-white/10 text-white hover:bg-white/20 border-white/20"
                    >
                        Back to Departments
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Skeleton className="h-32 rounded-lg" />
                    <Skeleton className="h-32 rounded-lg" />
                    <Skeleton className="h-32 rounded-lg" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Students
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {department?._count?.students || 0}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Teachers
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {department?._count?.teachers || 0}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Subjects
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {department?._count?.subjects || 0}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Students Table */}
            <Tabs defaultValue="students" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="students">Students</TabsTrigger>
                    <TabsTrigger value="subjects">Subjects</TabsTrigger>
                </TabsList>

                <TabsContent value="students">
                    <Card>
                        <CardHeader>
                            <CardTitle>Students in this Department</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="space-y-2">
                                    {[...Array(5)].map((_, i) => (
                                        <Skeleton key={i} className="h-12 w-full" />
                                    ))}
                                </div>
                            ) : students.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    No students found in this department
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Student</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Class</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {students.map((student) => (
                                            <TableRow key={student.id}>
                                                <TableCell className="flex items-center gap-2">
                                                    {student.user.profileImage ? (
                                                        <Image
                                                            src={student.user.profileImage}
                                                            alt={student.user.name}
                                                            width={32}
                                                            height={32}
                                                            className="rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                                            {student.user.name.charAt(0)}
                                                        </div>
                                                    )}
                                                    {student.user.name}
                                                </TableCell>
                                                <TableCell>{student.user.email}</TableCell>
                                                <TableCell>
                                                    {student.class ? (
                                                        <Badge variant="outline">
                                                            {student.class.name}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-gray-400">
                                                            Not Assigned
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            router.push(`/dashboard/students/${student.id}`)
                                                        }
                                                    >
                                                        View Details
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="subjects">
                    <Card>
                        <CardHeader>
                            <CardTitle>Subjects in this Department</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8 text-gray-500">
                                Subject listing coming soon
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
} 