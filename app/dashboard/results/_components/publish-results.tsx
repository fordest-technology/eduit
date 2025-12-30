"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface PublishResultsProps {
    schoolId: string;
}

export function PublishResults({ schoolId }: PublishResultsProps) {
    const [sessions, setSessions] = useState<any[]>([]);
    const [periods, setPeriods] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedSession, setSelectedSession] = useState<string>("");
    const [selectedPeriod, setSelectedPeriod] = useState<string>("");
    const [selectedClass, setSelectedClass] = useState<string>("all");
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        fetchSessions();
        fetchClasses();
    }, [schoolId]);

    useEffect(() => {
        if (selectedSession) {
            fetchPeriods();
        }
    }, [selectedSession]);

    useEffect(() => {
        if (selectedSession && selectedPeriod) {
            fetchStats();
        }
    }, [selectedSession, selectedPeriod, selectedClass]);

    async function fetchSessions() {
        try {
            const response = await fetch(`/api/schools/${schoolId}/sessions`);
            const data = await response.json();
            setSessions(data);

            const current = data.find((s: any) => s.isCurrent);
            if (current) {
                setSelectedSession(current.id);
            }
        } catch (error) {
            console.error("Error fetching sessions:", error);
        }
    }

    async function fetchPeriods() {
        try {
            const response = await fetch(
                `/api/schools/${schoolId}/results/config?sessionId=${selectedSession}`
            );
            const data = await response.json();

            if (data.periods) {
                setPeriods(data.periods);
                if (data.periods.length > 0) {
                    setSelectedPeriod(data.periods[0].id);
                }
            }
        } catch (error) {
            console.error("Error fetching periods:", error);
        }
    }

    async function fetchClasses() {
        try {
            const response = await fetch(`/api/classes?schoolId=${schoolId}`);
            const data = await response.json();
            setClasses(data);
        } catch (error) {
            console.error("Error fetching classes:", error);
        }
    }

    async function fetchStats() {
        try {
            const classFilter = selectedClass !== "all" ? `&classId=${selectedClass}` : "";
            const response = await fetch(
                `/api/schools/${schoolId}/results?sessionId=${selectedSession}&periodId=${selectedPeriod}${classFilter}`
            );
            const data = await response.json();

            const published = data.filter((r: any) => r.published).length;
            const unpublished = data.filter((r: any) => !r.published).length;

            setStats({
                total: data.length,
                published,
                unpublished,
            });
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    }

    async function handlePublish() {
        try {
            setLoading(true);

            const body: any = {
                sessionId: selectedSession,
                periodId: selectedPeriod,
            };

            if (selectedClass !== "all") {
                body.classId = selectedClass;
            }

            const response = await fetch("/api/admin/results/publish", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to publish results");
            }

            const data = await response.json();
            toast.success(data.message);

            // Refresh stats
            await fetchStats();
        } catch (error: any) {
            console.error("Error publishing results:", error);
            toast.error(error.message || "Failed to publish results");
        } finally {
            setLoading(false);
        }
    }

    async function handleUnpublish() {
        try {
            setLoading(true);

            const classFilter = selectedClass !== "all" ? `&classId=${selectedClass}` : "";
            const response = await fetch(
                `/api/admin/results/publish?sessionId=${selectedSession}&periodId=${selectedPeriod}${classFilter}`,
                { method: "DELETE" }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to unpublish results");
            }

            const data = await response.json();
            toast.success(data.message);

            // Refresh stats
            await fetchStats();
        } catch (error: any) {
            console.error("Error unpublishing results:", error);
            toast.error(error.message || "Failed to unpublish results");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Publish Results</CardTitle>
                <CardDescription>
                    Control when results become visible to students and parents
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                    <div>
                        <label className="text-sm font-medium mb-2 block">Class (Optional)</label>
                        <Select value={selectedClass} onValueChange={setSelectedClass}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select class" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Classes</SelectItem>
                                {classes.map((cls) => (
                                    <SelectItem key={cls.id} value={cls.id}>
                                        {cls.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">Total Results</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    Published
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{stats.published}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <XCircle className="h-4 w-4 text-orange-500" />
                                    Unpublished
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-orange-600">{stats.unpublished}</div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Warning */}
                {stats && stats.unpublished > 0 && (
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            Publishing results will make them visible to students and parents immediately.
                            Notifications will be sent to all affected users.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Actions */}
                <div className="flex gap-4">
                    <Button
                        onClick={handlePublish}
                        disabled={loading || !stats || stats.unpublished === 0}
                        className="flex-1"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Publishing...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Publish Results ({stats?.unpublished || 0})
                            </>
                        )}
                    </Button>

                    <Button
                        onClick={handleUnpublish}
                        disabled={loading || !stats || stats.published === 0}
                        variant="outline"
                        className="flex-1"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Unpublishing...
                            </>
                        ) : (
                            <>
                                <XCircle className="mr-2 h-4 w-4" />
                                Unpublish Results ({stats?.published || 0})
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
