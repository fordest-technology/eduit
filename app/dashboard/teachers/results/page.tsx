"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DashboardHeader } from "@/app/components/dashboard-header";
import { ClipboardList, Save, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Subject {
    id: string;
    name: string;
    code: string | null;
    isCore: boolean;
    classes: Array<{
        id: string;
        name: string;
        section: string | null;
        level: string | null;
        studentCount: number;
    }>;
}

interface AssessmentComponent {
    id: string;
    name: string;
    key: string;
    maxScore: number;
}

interface StudentResult {
    studentId: string;
    name: string;
    email: string;
    rollNumber: string | null;
    resultId?: string;
    total: number;
    grade?: string;
    remark?: string;
    teacherComment?: string;
    componentScores: Record<string, number>;
    hasResult: boolean;
}

export default function TeacherResultEntry() {
    const router = useRouter();

    // Selection state
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubject, setSelectedSubject] = useState("");
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedPeriod, setSelectedPeriod] = useState("");
    const [sessionId, setSessionId] = useState("");

    // Data state
    const [students, setStudents] = useState<StudentResult[]>([]);
    const [components, setComponents] = useState<AssessmentComponent[]>([]);
    const [periods, setPeriods] = useState<Array<{ id: string; name: string }>>([]);

    // UI state
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // Fetch teacher data
    useEffect(() => {
        async function fetchTeacherData() {
            try {
                const res = await fetch("/api/teachers/dashboard");
                if (!res.ok) throw new Error("Failed to fetch teacher data");

                const data = await res.json();
                setSubjects(data.subjects);
                setSessionId(data.currentSession.id);

                // Fetch periods
                const periodsRes = await fetch(`/api/schools/${data.teacher.schoolId}/results/config-client`);
                if (periodsRes.ok) {
                    const configData = await periodsRes.json();
                    setPeriods(configData.periods || []);
                }
            } catch (error) {
                console.error("Error fetching teacher data:", error);
                toast.error("Failed to load teacher data");
            }
        }

        fetchTeacherData();
    }, []);

    // Fetch students and results when selections are made
    const handleFetchResults = async () => {
        if (!selectedSubject || !selectedClass || !selectedPeriod || !sessionId) {
            toast.error("Please select subject, class, and period");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(
                `/api/teachers/results?subjectId=${selectedSubject}&classId=${selectedClass}&periodId=${selectedPeriod}&sessionId=${sessionId}`
            );

            if (!res.ok) throw new Error("Failed to fetch results");

            const data = await res.json();
            setStudents(data.students);
            setComponents(data.components);
            setShowForm(true);
        } catch (error) {
            console.error("Error fetching results:", error);
            toast.error("Failed to load students");
        } finally {
            setLoading(false);
        }
    };

    // Update component score
    const updateComponentScore = (studentId: string, componentId: string, value: string) => {
        const score = parseFloat(value) || 0;
        const component = components.find((c) => c.id === componentId);

        if (component && score > component.maxScore) {
            toast.error(`Score cannot exceed ${component.maxScore}`);
            return;
        }

        setStudents((prev) =>
            prev.map((student) => {
                if (student.studentId === studentId) {
                    const newScores = {
                        ...student.componentScores,
                        [componentId]: score,
                    };

                    // Calculate total
                    const total = Object.values(newScores).reduce((sum, score) => sum + score, 0);

                    return {
                        ...student,
                        componentScores: newScores,
                        total,
                    };
                }
                return student;
            })
        );
    };

    // Update comment
    const updateComment = (studentId: string, comment: string) => {
        setStudents((prev) =>
            prev.map((student) =>
                student.studentId === studentId
                    ? { ...student, teacherComment: comment }
                    : student
            )
        );
    };

    // Save results
    const handleSaveResults = async () => {
        if (students.length === 0) {
            toast.error("No students to save");
            return;
        }

        // Validate that all component scores are entered
        const incomplete = students.some((student) =>
            components.some((comp) => !student.componentScores[comp.id] && student.componentScores[comp.id] !== 0)
        );

        if (incomplete) {
            toast.error("Please enter scores for all components for all students");
            return;
        }

        setSaving(true);
        try {
            const results = students.map((student) => ({
                studentId: student.studentId,
                subjectId: selectedSubject,
                sessionId,
                periodId: selectedPeriod,
                componentScores: student.componentScores,
                total: student.total,
                teacherComment: student.teacherComment || "",
            }));

            const res = await fetch("/api/teachers/results", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ results }),
            });

            if (!res.ok) throw new Error("Failed to save results");

            const data = await res.json();
            toast.success(data.message);

            // Refresh the data
            handleFetchResults();
        } catch (error) {
            console.error("Error saving results:", error);
            toast.error("Failed to save results");
        } finally {
            setSaving(false);
        }
    };

    const selectedSubjectData = subjects.find((s) => s.id === selectedSubject);
    const classesForSubject = selectedSubjectData?.classes || [];

    const selectedClassName = classesForSubject.find((c) => c.id === selectedClass)?.name;
    const selectedPeriodName = periods.find((p) => p.id === selectedPeriod)?.name;

    const completedCount = students.filter((s) => s.hasResult).length;
    const totalCount = students.length;

    return (
        <div className="space-y-6">
            <DashboardHeader
                heading="Result Entry"
                text="Enter and manage student results for your subjects"
                icon={<ClipboardList className="h-6 w-6" />}
            />

            {/* Selection Form */}
            <Card className="border-none shadow-md">
                <CardHeader>
                    <CardTitle>Select Class and Subject</CardTitle>
                    <CardDescription>Choose the class, subject, and term to enter results</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Subject Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="subject">Subject</Label>
                            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                                <SelectTrigger id="subject">
                                    <SelectValue placeholder="Select subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjects.map((subject) => (
                                        <SelectItem key={subject.id} value={subject.id}>
                                            <div className="flex items-center gap-2">
                                                {subject.name}
                                                {subject.isCore && <Badge variant="default" className="ml-2 text-xs">Core</Badge>}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Class Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="class">Class</Label>
                            <Select
                                value={selectedClass}
                                onValueChange={setSelectedClass}
                                disabled={!selectedSubject}
                            >
                                <SelectTrigger id="class">
                                    <SelectValue placeholder="Select class" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classesForSubject.map((classItem) => (
                                        <SelectItem key={classItem.id} value={classItem.id}>
                                            {classItem.name} {classItem.section && `- ${classItem.section}`} ({classItem.studentCount} students)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Period Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="period">Term/Period</Label>
                            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                                <SelectTrigger id="period">
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

                    <Button
                        onClick={handleFetchResults}
                        disabled={!selectedSubject || !selectedClass || !selectedPeriod || loading}
                        className="mt-6"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            "Load Students"
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Results Entry Table */}
            {showForm && (
                <Card className="border-none shadow-md">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>
                                    {selectedSubjectData?.name} - {selectedClassName}
                                </CardTitle>
                                <CardDescription>
                                    {selectedPeriodName} • {totalCount} students • {completedCount} completed
                                </CardDescription>
                            </div>
                            <Button onClick={handleSaveResults} disabled={saving} size="lg">
                                {saving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save All Results
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {students.length > 0 ? (
                            <div className="rounded-lg border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">#</TableHead>
                                            <TableHead>Student Name</TableHead>
                                            {components.map((comp) => (
                                                <TableHead key={comp.id} className="text-center">
                                                    {comp.name}
                                                    <br />
                                                    <span className="text-xs text-muted-foreground">({comp.maxScore})</span>
                                                </TableHead>
                                            ))}
                                            <TableHead className="text-center font-bold">Total</TableHead>
                                            <TableHead>Comment</TableHead>
                                            <TableHead className="text-center">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {students.map((student, index) => (
                                            <TableRow key={student.studentId}>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell className="font-medium">{student.name}</TableCell>
                                                {components.map((comp) => (
                                                    <TableCell key={comp.id}>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max={comp.maxScore}
                                                            step="0.5"
                                                            value={student.componentScores[comp.id] || ""}
                                                            onChange={(e) =>
                                                                updateComponentScore(student.studentId, comp.id, e.target.value)
                                                            }
                                                            className="w-20 text-center"
                                                        />
                                                    </TableCell>
                                                ))}
                                                <TableCell className="text-center">
                                                    <span className="font-bold text-lg">{student.total.toFixed(1)}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <Textarea
                                                        value={student.teacherComment || ""}
                                                        onChange={(e) => updateComment(student.studentId, e.target.value)}
                                                        placeholder="Optional comment..."
                                                        className="min-w-[200px]"
                                                        rows={1}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {student.hasResult ? (
                                                        <Badge variant="default" className="gap-1">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            Saved
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="gap-1">
                                                            <AlertCircle className="h-3 w-3" />
                                                            Pending
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-lg font-semibold text-muted-foreground">No students found</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    This class may not have any active students
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
