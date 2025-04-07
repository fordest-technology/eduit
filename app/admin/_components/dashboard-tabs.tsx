"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
    Users,
    GraduationCap,
    School as SchoolIcon,
    UserCog,
    Settings,
    TrendingUp,
    BookOpen
} from "lucide-react";

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

interface StatsCardProps {
    title: string;
    value: string;
    description: string;
    icon: React.ReactNode;
}

function StatsCard({ title, value, description, icon }: StatsCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </CardContent>
        </Card>
    );
}

interface AdminToolCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    action: () => void;
}

function AdminToolCard({ title, description, icon, action }: AdminToolCardProps) {
    return (
        <Card
            className="hover:bg-accent/50 transition-colors cursor-pointer group"
            onClick={action}
        >
            <CardHeader>
                <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-background group-hover:bg-white transition-colors">
                        {icon}
                    </div>
                    <div>
                        <CardTitle className="text-lg">{title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                </div>
            </CardHeader>
        </Card>
    );
}

type Row = {
    original: SchoolStats;
};

function SchoolsTable({
    data,
}: {
    data: SchoolStats[],
}) {
    const columns = [
        {
            accessorKey: "name",
            header: "School Name",
            cell: ({ row }: { row: Row }) => (
                <div>
                    <div className="font-medium">{row.original.name}</div>
                    <div className="text-sm text-muted-foreground">{row.original.shortName}</div>
                </div>
            ),
        },
        {
            accessorKey: "location",
            header: "Location",
        },
        {
            accessorKey: "contact",
            header: "Contact",
            cell: ({ row }: { row: Row }) => (
                <div className="text-sm">
                    <div>{row.original.email}</div>
                    {row.original.phone && (
                        <div className="text-muted-foreground">{row.original.phone}</div>
                    )}
                </div>
            ),
        },
        {
            accessorKey: "teacherCount",
            header: "Teachers",
        },
        {
            accessorKey: "studentCount",
            header: "Students",
        },
        {
            accessorKey: "parentCount",
            header: "Parents",
        },
        {
            id: "actions",
            cell: ({ row }: { row: Row }) => (
                <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-accent"
                >
                    View Details
                </Button>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Schools</h2>
                    <p className="text-muted-foreground">
                        Manage and monitor all registered schools
                    </p>
                </div>
                <Button>Add School</Button>
            </div>

            <DataTable
                columns={columns}
                data={data}
                searchKey="name"
            />
        </div>
    );
}

export function DashboardTabs({ stats, schools }: { stats: DashboardStats; schools: SchoolStats[] }) {
    return (
        <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="schools">Schools</TabsTrigger>
                <TabsTrigger value="admin-tools">Admin Tools</TabsTrigger>
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
                <SchoolsTable data={schools} />
            </TabsContent>

            <TabsContent value="admin-tools" className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <AdminToolCard
                        title="User Management"
                        description="Manage system users and their roles"
                        icon={<UserCog className="h-6 w-6 text-blue-600" />}
                        action={() => { }}
                    />
                    <AdminToolCard
                        title="System Settings"
                        description="Configure global system settings"
                        icon={<Settings className="h-6 w-6 text-purple-600" />}
                        action={() => { }}
                    />
                </div>
            </TabsContent>
        </Tabs>
    );
} 