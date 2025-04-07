"use client";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import {
    Users,
    GraduationCap,
    School as SchoolIcon,
    TrendingUp,
    BookOpen,
    DollarSign,
} from "lucide-react";
import { BarChart, LineChart, PieChart } from "@/app/components/ui/charts";
// import { BarChart, LineChart, PieChart } from "@/components/ui/charts";

interface SchoolStats {
    id: string;
    name: string;
    location: string;
    email: string;
    phone: string | null;
    shortName: string;
    createdAt: Date;
    teacherCount: number;
    studentCount: number;
    parentCount: number;
    revenue: number;
    locationBreakdown: Record<string, number>;
}

interface DashboardStats {
    totalSchools: number;
    totalTeachers: number;
    totalStudents: number;
    totalParents: number;
    totalSubjects: number;
    activeUsers: number;
    revenue: number;
    newsletterSubscribers: number;
    userGrowth: Array<{
        date: Date;
        count: number;
    }>;
    locationStats: Array<{
        location: string;
        count: number;
    }>;
}

interface AdminDashboardContentProps {
    stats: DashboardStats;
    schools: SchoolStats[];
}

// Stats Card Component
function StatsCard({ title, value, description, icon }: {
    title: string;
    value: string;
    description: string;
    icon: React.ReactNode;
}) {
    return (
        <Card className="p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{description}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                    {icon}
                </div>
            </div>
        </Card>
    );
}

export function AdminDashboardContent({ stats, schools }: AdminDashboardContentProps) {
    return (
        <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="schools">Schools</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <StatsCard
                        title="Total Schools"
                        value={stats.totalSchools.toString()}
                        description="Active educational institutions"
                        icon={<SchoolIcon className="h-6 w-6 text-primary" />}
                    />
                    <StatsCard
                        title="Total Teachers"
                        value={stats.totalTeachers.toString()}
                        description="Registered teaching staff"
                        icon={<Users className="h-6 w-6 text-green-600" />}
                    />
                    <StatsCard
                        title="Total Students"
                        value={stats.totalStudents.toString()}
                        description="Enrolled students"
                        icon={<GraduationCap className="h-6 w-6 text-purple-600" />}
                    />
                    <StatsCard
                        title="Total Parents"
                        value={stats.totalParents.toString()}
                        description="Registered parents"
                        icon={<Users className="h-6 w-6 text-orange-600" />}
                    />
                    <StatsCard
                        title="Total Revenue"
                        value={`$${(stats.revenue / 1000).toFixed(1)}K`}
                        description="Total revenue from all schools"
                        icon={<DollarSign className="h-6 w-6 text-emerald-600" />}
                    />
                    <StatsCard
                        title="Active Users"
                        value={stats.activeUsers.toString()}
                        description="Users active today"
                        icon={<TrendingUp className="h-6 w-6 text-blue-600" />}
                    />
                </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">User Growth</h3>
                        <LineChart
                            data={stats.userGrowth}
                            xField="date"
                            yField="count"
                            height={300}
                        />
                    </Card>
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Location Distribution</h3>
                        <PieChart
                            data={stats.locationStats}
                            nameField="location"
                            valueField="count"
                            height={300}
                        />
                    </Card>
                    <Card className="p-6 md:col-span-2">
                        <h3 className="text-lg font-semibold mb-4">School Statistics</h3>
                        <BarChart
                            data={schools.slice(0, 10)}
                            xField="name"
                            yField="studentCount"
                            height={300}
                        />
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="schools" className="space-y-6">
                <DataTable
                    columns={[
                        { accessorKey: "name", header: "School Name" },
                        { accessorKey: "location", header: "Location" },
                        {
                            accessorKey: "revenue",
                            header: "Revenue",
                            cell: ({ row }) => `$${(row.getValue("revenue") as number / 1000).toFixed(1)}K`,
                        },
                        { accessorKey: "teacherCount", header: "Teachers" },
                        { accessorKey: "studentCount", header: "Students" },
                        { accessorKey: "parentCount", header: "Parents" },
                    ]}
                    data={schools}
                    searchKey="name"
                    searchPlaceholder="Search schools..."
                />
            </TabsContent>
        </Tabs>
    );
} 