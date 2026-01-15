"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/app/components/dashboard-header";
import {
    ArrowRightLeft,
    Search,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ChevronRight,
    UserPlus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface StudentPerf {
    id: string;
    name: string;
    email: string;
    annualAverage: number;
    resultsCount: number;
    isEligible: boolean;
    targetClassId?: string;
}

interface Session {
    id: string;
    name: string;
    isCurrent: boolean;
}

interface Class {
    id: string;
    name: string;
    section: string;
}

export default function PromotionsPage() {
    const router = useRouter();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [students, setStudents] = useState<StudentPerf[]>([]);

    const [sourceSession, setSourceSession] = useState<string>("");
    const [sourceClass, setSourceClass] = useState<string>("");
    const [destSession, setDestSession] = useState<string>("");
    const [destClass, setDestClass] = useState<string>("");
    const [passMark, setPassMark] = useState<number>(40);

    const [loading, setLoading] = useState(false);
    const [fetchingStudents, setFetchingStudents] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [schoolId, setSchoolId] = useState<string | null>(null);

    useEffect(() => {
        async function init() {
            try {
                setLoading(true);
                const sessionRes = await fetch("/api/auth/session");
                const session = await sessionRes.json();

                if (!session || !session.schoolId) {
                    router.push("/login");
                    return;
                }
                setSchoolId(session.schoolId);

                // Fetch Sessions
                const sessRes = await fetch(`/api/sessions?schoolId=${session.schoolId}`);
                const sessData = await sessRes.json();
                setSessions(sessData);

                // Fetch Classes
                const classRes = await fetch(`/api/classes?schoolId=${session.schoolId}`);
                const classData = await classRes.json();
                setClasses(classData);

                // Set default dest session as the active one
                const active = sessData.find((s: Session) => s.isCurrent);
                if (active) setDestSession(active.id);

            } catch (error) {
                toast.error("Failed to load promotion data");
            } finally {
                setLoading(false);
            }
        }
        init();
    }, [router]);

    const loadStudents = async () => {
        if (!sourceSession || !sourceClass) {
            toast.error("Please select a source session and class");
            return;
        }

        try {
            setFetchingStudents(true);
            const res = await fetch(`/api/schools/${schoolId}/promotions/eligibility?sessionId=${sourceSession}&classId=${sourceClass}`);
            if (!res.ok) throw new Error("Failed to fetch students");
            const data = await res.json();

            // Auto-assign destination classes based on pass mark
            const processed = data.map((s: StudentPerf) => ({
                ...s,
                isEligible: s.annualAverage >= passMark,
                targetClassId: s.annualAverage >= passMark ? destClass : sourceClass
            }));

            setStudents(processed);
        } catch (error) {
            toast.error("Error loading student performance data");
        } finally {
            setFetchingStudents(false);
        }
    };

    const handlePromoteAll = async () => {
        if (!destSession || students.length === 0) {
            toast.error("Requirements missing: destination session and loaded students");
            return;
        }

        try {
            setProcessing(true);
            const payload = {
                sessionId: destSession,
                promotions: students.map(s => ({
                    studentId: s.id,
                    classId: s.targetClassId || (s.annualAverage >= passMark ? destClass : sourceClass)
                }))
            };

            const res = await fetch(`/api/schools/${schoolId}/promotions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Promotion failed");

            toast.success("Promotions processed successfully!");
            setStudents([]);
        } catch (error) {
            toast.error("Failed to execute promotions");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <DashboardHeader
                heading="Promotion Engine"
                text="Manage student movement between classes and academic sessions"
                icon={<ArrowRightLeft className="h-6 w-6" />}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1 border-none shadow-md bg-white dark:bg-slate-900">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <Search className="h-5 w-5 text-primary" />
                            Promotion Strategy
                        </CardTitle>
                        <CardDescription>Select source and destination for promotion</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Source Session (Old)</label>
                            <Select value={sourceSession} onValueChange={setSourceSession}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select session" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sessions.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Source Class</label>
                            <Select value={sourceClass} onValueChange={setSourceClass}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select class" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name} {c.section}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800" />

                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Destination Session (New)</label>
                            <Select value={destSession} onValueChange={setDestSession}>
                                <SelectTrigger className="w-full border-primary/20 bg-primary/5">
                                    <SelectValue placeholder="Select session" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sessions.map(s => (
                                        <SelectItem key={s.id} value={s.id}>
                                            {s.name} {s.isCurrent && "(Current Active)"}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Destination Class (Promotion target)</label>
                            <Select value={destClass} onValueChange={setDestClass}>
                                <SelectTrigger className="w-full border-primary/20 bg-primary/5">
                                    <SelectValue placeholder="Select class" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name} {c.section}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Pass Mark (%)</label>
                            <Input
                                type="number"
                                value={passMark}
                                onChange={(e) => setPassMark(Number(e.target.value))}
                                className="font-bold text-lg text-primary text-center"
                            />
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Students below this will repeat their class</p>
                        </div>

                        <Button
                            className="w-full mt-4 h-11 bg-primary hover:bg-primary/90 text-white shadow-lg"
                            onClick={loadStudents}
                            disabled={fetchingStudents}
                        >
                            {fetchingStudents ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Fetching...</>
                            ) : (
                                <>Analyze Performance <ChevronRight className="ml-2 h-4 w-4" /></>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2 border-none shadow-md bg-white dark:bg-slate-900 overflow-hidden">
                    <CardHeader className="pb-0">
                        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                            <div>
                                <CardTitle className="text-xl font-bold">Candidates</CardTitle>
                                <CardDescription>Review and adjust individual student movements</CardDescription>
                            </div>
                            <Button
                                variant="default"
                                size="lg"
                                disabled={students.length === 0 || processing}
                                onClick={handlePromoteAll}
                                className="bg-green-600 hover:bg-green-700 text-white shadow-md transition-all active:scale-95"
                            >
                                {processing ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                                ) : (
                                    <><UserPlus className="mr-2 h-5 w-5" /> Execute Roll-over</>
                                )}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {students.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50 dark:bg-slate-800">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="font-bold py-4">Student</TableHead>
                                            <TableHead className="font-bold text-center">Annual Avg</TableHead>
                                            <TableHead className="font-bold">Proposed Action</TableHead>
                                            <TableHead className="font-bold">Next Class</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {students.map((student) => {
                                            const isPromoted = student.annualAverage >= passMark;
                                            return (
                                                <TableRow key={student.id} className="group border-slate-100 dark:border-slate-800">
                                                    <TableCell className="py-4">
                                                        <div>
                                                            <p className="font-semibold text-slate-800 dark:text-slate-200">{student.name}</p>
                                                            <p className="text-xs text-muted-foreground">{student.email}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center font-mono font-bold text-lg">
                                                        <span className={cn(
                                                            "px-2 py-1 rounded",
                                                            isPromoted ? "text-green-600" : "text-red-500"
                                                        )}>
                                                            {student.annualAverage}%
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={cn(
                                                            "px-3 py-1 font-bold",
                                                            isPromoted ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-red-100 text-red-700 hover:bg-red-100"
                                                        )}>
                                                            {isPromoted ? "PROMOTED" : "REPEATING"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Select
                                                            value={student.targetClassId}
                                                            onValueChange={(val) => {
                                                                setStudents(prev => prev.map(s => s.id === student.id ? { ...s, targetClassId: val } : s));
                                                            }}
                                                        >
                                                            <SelectTrigger className="h-9 w-[180px] bg-white dark:bg-slate-900">
                                                                <SelectValue placeholder="Select class" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {classes.map(c => (
                                                                    <SelectItem key={c.id} value={c.id}>{c.name} {c.section}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-full mb-4">
                                    <ArrowRightLeft className="h-12 w-12 text-slate-300 dark:text-slate-700" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-600 dark:text-slate-400">Ready to start?</h3>
                                <p className="max-w-[300px] text-muted-foreground">Select a source session and class on the left to analyze which students passed.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900 mt-6">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                <AlertTitle className="text-amber-800 dark:text-amber-300 font-bold">Important Notice</AlertTitle>
                <AlertDescription className="text-amber-700 dark:text-amber-400">
                    The promotion engine calculates the **Annual Weighted Average** across all terms in the source session.
                    Students who do not meet the pass mark are automatically suggested to repeat their current class in the new session.
                    You can override individual student targets manually using the dropdowns above.
                </AlertDescription>
            </Alert>
        </div>
    );
}
