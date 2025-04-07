"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import {
    Users,
    GraduationCap,
    School as SchoolIcon,
    TrendingUp,
    BookOpen,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

interface SchoolStats {
    id: string;
    name: string;
    location: string;
    email: string;
    phone: string | null;
    shortName: string;
    teacherCount: number;
    studentCount: number;
    parentCount: number;
    createdAt: Date;
}

interface DashboardStats {
    totalSchools: number;
    totalTeachers: number;
    totalStudents: number;
    totalParents: number;
    totalSubjects: number;
    activeUsers: number;
}

// Stats Card Component
function StatsCard({ title, value, description, icon }: {
    title: string;
    value: string;
    description: string;
    icon: React.ReactNode;
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    );
}

export function AdminDashboardTabs({ stats, schools }: { stats: DashboardStats; schools: SchoolStats[] }) {
    return (
        <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="schools">Schools</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <StatsCard
                        title="Total Schools"
                        value={stats.totalSchools.toString()}
                        description="Active educational institutions"
                        icon={<SchoolIcon className="h-4 w-4 text-blue-600" />}
                    />
                    <StatsCard
                        title="Total Teachers"
                        value={stats.totalTeachers.toString()}
                        description="Registered teaching staff"
                        icon={<Users className="h-4 w-4 text-green-600" />}
                    />
                    <StatsCard
                        title="Total Students"
                        value={stats.totalStudents.toString()}
                        description="Enrolled students"
                        icon={<GraduationCap className="h-4 w-4 text-purple-600" />}
                    />
                    <StatsCard
                        title="Total Parents"
                        value={stats.totalParents.toString()}
                        description="Registered parents"
                        icon={<Users className="h-4 w-4 text-orange-600" />}
                    />
                    <StatsCard
                        title="Total Subjects"
                        value={stats.totalSubjects.toString()}
                        description="Available courses"
                        icon={<BookOpen className="h-4 w-4 text-red-600" />}
                    />
                    <StatsCard
                        title="Active Users"
                        value={stats.activeUsers.toString()}
                        description="Users active today"
                        icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
                    />
                </div>
            </TabsContent>

            <TabsContent value="schools" className="space-y-6">
                <DataTable<SchoolStats, string>
                    columns={[
                        { accessorKey: "name", header: "School Name" },
                        { accessorKey: "location", header: "Location" },
                        { accessorKey: "teacherCount", header: "Teachers" },
                        { accessorKey: "studentCount", header: "Students" },
                        { accessorKey: "parentCount", header: "Parents" },
                    ] as ColumnDef<SchoolStats, string>[]}
                    data={schools}
                    searchKey="name"
                    searchPlaceholder="Search schools..."
                />
            </TabsContent>
        </Tabs>
    );
} 