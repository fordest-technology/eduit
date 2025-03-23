"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Server, RefreshCw, Users, School, BookOpen } from "lucide-react";

export default function AdminDashboardClient({
    stats
}: {
    stats: {
        totalStudents: number;
        totalTeachers: number;
        totalClasses: number;
        totalSubjects: number;
    }
}) {
    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalStudents}</div>
                        <p className="text-xs text-muted-foreground">
                            Students enrolled in your school
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalTeachers}</div>
                        <p className="text-xs text-muted-foreground">
                            Teachers registered in your school
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                        <School className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalClasses}</div>
                        <p className="text-xs text-muted-foreground">
                            Active classes in your school
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalSubjects}</div>
                        <p className="text-xs text-muted-foreground">
                            Subjects taught at your school
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Administrative Tools Section */}
            <div className="mt-8">
                <h3 className="font-medium text-muted-foreground mb-4">Administrative Tools</h3>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    <Card className="col-span-1">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Email Debug</CardTitle>
                            <Mail className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Debug Tools</div>
                            <p className="text-xs text-muted-foreground">
                                Troubleshoot email sending issues
                            </p>
                        </CardContent>
                        <CardFooter>
                            <Button asChild size="sm" variant="outline" className="w-full">
                                <Link href="/dashboard/debug">
                                    Open Debug Tools
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card className="col-span-1">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">System Status</CardTitle>
                            <Server className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Health Check</div>
                            <p className="text-xs text-muted-foreground">
                                Monitor system performance and status
                            </p>
                        </CardContent>
                        <CardFooter>
                            <Button size="sm" variant="outline" className="w-full">
                                Check Status
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card className="col-span-1">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Data Refresh</CardTitle>
                            <RefreshCw className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Cache Tools</div>
                            <p className="text-xs text-muted-foreground">
                                Refresh data caches and reload information
                            </p>
                        </CardContent>
                        <CardFooter>
                            <Button size="sm" variant="outline" className="w-full">
                                Refresh Data
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </>
    );
} 