"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, BookOpen, TrendingUp, Award, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ParentResultsDashboardProps {
    data: {
        children: {
            id: string;
            user: {
                name: string;
                email: string;
            };
            currentClass: {
                name: string;
                level: string;
            } | null;
        }[];
        schoolId: string;
    };
}

export function ParentResultsDashboard({ data }: ParentResultsDashboardProps) {
    const [selectedChild, setSelectedChild] = useState(data.children[0]?.id);
    const [selectedSession, setSelectedSession] = useState("");
    const [selectedPeriod, setSelectedPeriod] = useState("");
    const [sessions, setSessions] = useState<any[]>([]);
    const [periods, setPeriods] = useState<any[]>([]);
    const [results, setResults] = useState<any[]>([]);
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        if (data.schoolId) {
            fetchSessionsAndPeriods();
        }
    }, [data.schoolId]);

    async function fetchSessionsAndPeriods() {
        try {
            const sessionsRes = await fetch(`/api/schools/${data.schoolId}/sessions`);
            const sessionsData = await sessionsRes.json();
            setSessions(sessionsData);

            const currentSession = sessionsData.find((s: any) => s.isCurrent) || sessionsData[0];
            if (currentSession) {
                setSelectedSession(currentSession.id);
                fetchPeriods(currentSession.id);
            }
        } catch (error) {
            console.error("Error fetching sessions:", error);
        }
    }

    async function fetchPeriods(sessionId: string) {
        try {
            const periodsRes = await fetch(
                `/api/schools/${data.schoolId}/results/config-client?sessionId=${sessionId}`
            );
            const configData = await periodsRes.json();
            if (configData.periods) {
                setPeriods(configData.periods);
                if (configData.periods.length > 0) {
                    setSelectedPeriod(configData.periods[0].id);
                }
            }
        } catch (error) {
            console.error("Error fetching periods:", error);
        }
    }

    useEffect(() => {
        if (selectedChild && selectedSession && selectedPeriod) {
            fetchResults();
        }
    }, [selectedChild, selectedSession, selectedPeriod]);

    async function fetchResults() {
        setLoading(true);
        try {
            const response = await fetch(
                `/api/students/${selectedChild}/results-view/results?sessionId=${selectedSession}&periodId=${selectedPeriod}`
            );
            const resData = await response.json();
            setResults(resData.results || []);
            setMetrics(resData.metrics || null);
        } catch (error) {
            console.error("Error fetching results:", error);
            toast.error("Failed to load results");
        } finally {
            setLoading(false);
        }
    }

    async function handleDownload(childId: string, childName: string) {
        setDownloading(true);
        try {
            const response = await fetch(
                `/api/students/${childId}/report-card?sessionId=${selectedSession}&periodId=${selectedPeriod}`
            );
            if (!response.ok) throw new Error("Failed to download report card");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Report_Card_${childName.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success("Report card downloaded");
        } catch (error) {
            toast.error("Failed to download PDF");
        } finally {
            setDownloading(false);
        }
    }

    return (
        <div className="space-y-6">
            <Tabs value={selectedChild} onValueChange={setSelectedChild} className="w-full">
                <TabsList className="mb-4">
                    {data.children.map((child) => (
                        <TabsTrigger key={child.id} value={child.id}>
                            {child.user.name}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {data.children.map((child) => (
                    <TabsContent key={child.id} value={child.id} className="space-y-6">
                        {/* Filters */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">Select Academic Period</CardTitle>
                                <CardDescription>Choose session and term to view results for {child.user.name}</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Academic Session</label>
                                    <Select value={selectedSession} onValueChange={(v) => { setSelectedSession(v); fetchPeriods(v); }}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select session" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sessions.map((s) => (
                                                <SelectItem key={s.id} value={s.id}>{s.name} {s.isCurrent && "(Current)"}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Term / Period</label>
                                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select period" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {periods.map((p) => (
                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Summary Metrics */}
                        {metrics && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <Card>
                                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                                        <CardTitle className="text-sm font-medium">Average</CardTitle>
                                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                        <div className="text-2xl font-bold">{metrics.average}%</div>
                                        <p className="text-xs text-muted-foreground">{metrics.totalSubjects} subjects</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                                        <CardTitle className="text-sm font-medium">Position</CardTitle>
                                        <Award className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                        <div className="text-2xl font-bold">{metrics.position || 'N/A'}/{metrics.totalStudents || 'N/A'}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                                        <CardTitle className="text-sm font-medium">Class Average</CardTitle>
                                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                        <div className="text-2xl font-bold">{metrics.classAverage}%</div>
                                    </CardContent>
                                </Card>
                                <Card className="flex flex-col justify-center p-4">
                                    <Button
                                        onClick={() => handleDownload(child.id, child.user.name)}
                                        disabled={downloading || results.length === 0}
                                        className="w-full"
                                    >
                                        {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                        Download PDF
                                    </Button>
                                </Card>
                            </div>
                        )}

                        {/* Results Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Subject Breakdown</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                                ) : results.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">No published results found for this period.</div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Subject</TableHead>
                                                {results[0]?.componentScores.map((cs: any) => (
                                                    <TableHead key={cs.component.key}>{cs.component.name}</TableHead>
                                                ))}
                                                <TableHead>Total</TableHead>
                                                <TableHead>Grade</TableHead>
                                                <TableHead>Remark</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {results.map((r) => (
                                                <TableRow key={r.id}>
                                                    <TableCell className="font-medium">{r.subject.name}</TableCell>
                                                    {r.componentScores.map((cs: any) => (
                                                        <TableCell key={cs.component.key}>{cs.score}/{cs.component.maxScore}</TableCell>
                                                    ))}
                                                    <TableCell className="font-bold">{r.total}</TableCell>
                                                    <TableCell><Badge variant="outline">{r.grade}</Badge></TableCell>
                                                    <TableCell>{r.remark}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
