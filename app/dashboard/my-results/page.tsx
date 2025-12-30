"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, TrendingUp, Award, BookOpen } from "lucide-react";
import { DashboardHeader } from "@/app/components/dashboard-header";
import { toast } from "sonner";

interface ComponentScore {
    component: {
        id: string;
        name: string;
        key: string;
        maxScore: number;
    };
    score: number;
}

interface Result {
    id: string;
    total: number;
    grade: string;
    remark: string;
    teacherComment?: string;
    subject: {
        id: string;
        name: string;
        code?: string;
    };
    period: {
        id: string;
        name: string;
    };
    session: {
        id: string;
        name: string;
        isCurrent: boolean;
    };
    componentScores: ComponentScore[];
}

interface Metrics {
    average: number;
    totalSubjects: number;
    position: number | null;
    totalStudents: number | null;
    classAverage: number | null;
}

export default function MyResultsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState<Result[]>([]);
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [sessions, setSessions] = useState<any[]>([]);
    const [periods, setPeriods] = useState<any[]>([]);
    const [selectedSession, setSelectedSession] = useState<string>("");
    const [selectedPeriod, setSelectedPeriod] = useState<string>("");
    const [studentId, setStudentId] = useState<string>("");
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        async function init() {
            try {
                const session = await getSession();

                if (!session || session.role !== "STUDENT") {
                    router.push("/login");
                    return;
                }

                // Get student ID
                const response = await fetch("/api/auth/session");
                const sessionData = await response.json();

                const studentResponse = await fetch(`/api/students?userId=${sessionData.id}`);
                const studentData = await studentResponse.json();

                if (studentData.length > 0) {
                    setStudentId(studentData[0].id);

                    // Fetch sessions and periods
                    await fetchSessionsAndPeriods(sessionData.schoolId);
                }
            } catch (error) {
                console.error("Error initializing:", error);
                toast.error("Failed to load data");
            } finally {
                setLoading(false);
            }
        }

        init();
    }, [router]);

    async function fetchSessionsAndPeriods(schoolId: string) {
        try {
            // Fetch sessions
            const sessionsRes = await fetch(`/api/schools/${schoolId}/sessions`);
            const sessionsData = await sessionsRes.json();
            setSessions(sessionsData);

            // Set current session as default
            const currentSession = sessionsData.find((s: any) => s.isCurrent);
            if (currentSession) {
                setSelectedSession(currentSession.id);

                // Fetch periods for current session
                await fetchPeriods(schoolId, currentSession.id);
            }
        } catch (error) {
            console.error("Error fetching sessions:", error);
        }
    }

    async function fetchPeriods(schoolId: string, sessionId: string) {
        try {
            const periodsRes = await fetch(
                `/api/schools/${schoolId}/results/config?sessionId=${sessionId}`
            );
            const configData = await periodsRes.json();

            if (configData.periods) {
                setPeriods(configData.periods);

                // Set first period as default
                if (configData.periods.length > 0) {
                    setSelectedPeriod(configData.periods[0].id);
                }
            }
        } catch (error) {
            console.error("Error fetching periods:", error);
        }
    }

    useEffect(() => {
        if (studentId && selectedSession && selectedPeriod) {
            fetchResults();
        }
    }, [studentId, selectedSession, selectedPeriod]);

    async function fetchResults() {
        try {
            setLoading(true);
            const response = await fetch(
                `/api/students/${studentId}/results?sessionId=${selectedSession}&periodId=${selectedPeriod}`
            );

            if (!response.ok) {
                throw new Error("Failed to fetch results");
            }

            const data = await response.json();
            setResults(data.results || []);
            setMetrics(data.metrics || null);
        } catch (error) {
            console.error("Error fetching results:", error);
            toast.error("Failed to load results");
        } finally {
            setLoading(false);
        }
    }

    async function handleDownloadReportCard() {
        try {
            setDownloading(true);
            const response = await fetch(
                `/api/students/${studentId}/report-card?sessionId=${selectedSession}&periodId=${selectedPeriod}`
            );

            if (!response.ok) {
                throw new Error("Failed to generate report card");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `report-card-${selectedPeriod}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success("Report card downloaded successfully");
        } catch (error) {
            console.error("Error downloading report card:", error);
            toast.error("Failed to download report card");
        } finally {
            setDownloading(false);
        }
    }

    if (loading && !studentId) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <DashboardHeader
                heading="My Results"
                text="View your academic performance and download report cards"
                icon={<BookOpen className="h-6 w-6" />}
            />

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Select Term</CardTitle>
                    <CardDescription>Choose academic session and term to view results</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Academic Session</label>
                            <Select value={selectedSession} onValueChange={setSelectedSession}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select session" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sessions.map((session) => (
                                        <SelectItem key={session.id} value={session.id}>
                                            {session.name} {session.isCurrent && "(Current)"}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">Term</label>
                            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select term" />
                                </SelectTrigger>
                                <SelectContent>
                                    {periods.map((period) => (
                                        <SelectItem key={period.id} value={period.id}>
                                            {period.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            {metrics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.average}%</div>
                            <p className="text-xs text-muted-foreground">
                                Across {metrics.totalSubjects} subjects
                            </p>
                        </CardContent>
                    </Card>

                    {metrics.position && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Position in Class</CardTitle>
                                <Award className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {metrics.position}/{metrics.totalStudents}
                                </div>
                                <p className="text-xs text-muted-foreground">Class ranking</p>
                            </CardContent>
                        </Card>
                    )}

                    {metrics.classAverage && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Class Average</CardTitle>
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{metrics.classAverage}%</div>
                                <p className="text-xs text-muted-foreground">
                                    {metrics.average > metrics.classAverage ? "Above" : "Below"} average
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Report Card</CardTitle>
                            <Download className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <Button
                                onClick={handleDownloadReportCard}
                                disabled={downloading || results.length === 0}
                                className="w-full"
                            >
                                {downloading ? "Downloading..." : "Download PDF"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Results Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Subject Results</CardTitle>
                    <CardDescription>Detailed breakdown of your performance</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : results.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No results published for this term yet.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Subject</TableHead>
                                    {results[0]?.componentScores.map((cs) => (
                                        <TableHead key={cs.component.key}>
                                            {cs.component.name}
                                        </TableHead>
                                    ))}
                                    <TableHead>Total</TableHead>
                                    <TableHead>Grade</TableHead>
                                    <TableHead>Remark</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {results.map((result) => (
                                    <TableRow key={result.id}>
                                        <TableCell className="font-medium">{result.subject.name}</TableCell>
                                        {result.componentScores.map((cs) => (
                                            <TableCell key={cs.component.key}>
                                                {cs.score}/{cs.component.maxScore}
                                            </TableCell>
                                        ))}
                                        <TableCell className="font-semibold">{result.total}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{result.grade}</Badge>
                                        </TableCell>
                                        <TableCell>{result.remark}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
