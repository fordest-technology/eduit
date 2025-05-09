"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Users,
    GraduationCap,
    School as SchoolIcon,
    UserCog,
    Settings,
    TrendingUp,
    BookOpen
} from "lucide-react";
import { SchoolDetailsDialog } from "./school-details-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Suspense } from "react";
import { DashboardTabs } from "./dashboard-tabs";

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

// Server component for fetching stats
async function getDashboardStats(): Promise<DashboardStats> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/stats`, {
        cache: 'no-store'
    });
    if (!response.ok) {
        throw new Error('Failed to fetch dashboard statistics');
    }
    return response.json();
}

// Server component for fetching schools
async function getSchools(): Promise<SchoolStats[]> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/schools`, {
        cache: 'no-store'
    });
    if (!response.ok) {
        throw new Error('Failed to fetch schools');
    }
    return response.json();
}

// Loading skeleton component
function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array(6).fill(null).map((_, i) => (
                    <div key={i} className="rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-[100px]" />
                            <Skeleton className="h-4 w-4 rounded" />
                        </div>
                        <div className="mt-2">
                            <Skeleton className="h-8 w-[60px] mb-2" />
                            <Skeleton className="h-4 w-[120px]" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Main server component
export async function AdminDashboard() {
    try {
        const [stats, schools] = await Promise.all([
            getDashboardStats(),
            getSchools()
        ]);

        return (
            <div className="container mx-auto py-10 space-y-8">
                <div className="flex justify-between items-center">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
                        <p className="text-muted-foreground">
                            Manage your educational system and view key metrics
                        </p>
                    </div>
                </div>

                <Suspense fallback={<DashboardSkeleton />}>
                    <DashboardTabs stats={stats} schools={schools} />
                </Suspense>
            </div>
        );
    } catch (error) {
        return (
            <div className="container mx-auto py-10">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Failed to load dashboard data. Please try refreshing the page.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }
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