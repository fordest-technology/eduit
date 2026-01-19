"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DashboardHeader } from "@/app/components/dashboard-header";
import { ClipboardList, Loader2, BookOpen } from "lucide-react";
import { BatchResultsEntry } from "@/app/dashboard/results/_components/batch-results-entry";
import { getSession } from "@/lib/auth-client";

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
    weight: number;
}

export default function TeacherResultEntry() {
    // Selection state
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubject, setSelectedSubject] = useState("");
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedPeriod, setSelectedPeriod] = useState("");
    
    // Data state
    const [teacher, setTeacher] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [components, setComponents] = useState<AssessmentComponent[]>([]);
    const [periods, setPeriods] = useState<Array<{ id: string; name: string }>>([]);
    const [sessions, setSessions] = useState<Array<{ id: string; name: string; isCurrent: boolean }>>([]);
    
    // UI state
    const [loading, setLoading] = useState(true);
    const [loadingStudents, setLoadingStudents] = useState(false);

    // Fetch initial teacher data and config
    useEffect(() => {
        async function init() {
            try {
                const session = await getSession();
                if (!session) return;

                // 1. Fetch Teacher Dashboard Data (Subjects, Classes)
                const dashboardRes = await fetch("/api/teachers/dashboard");
                if (!dashboardRes.ok) throw new Error("Failed to fetch dashboard data");
                const dashboardData = await dashboardRes.json();
                
                setTeacher(dashboardData.teacher);
                setSubjects(dashboardData.subjects);
                
                // 2. Fetch School Config (Periods, Components, Sessions)
                const schoolId = dashboardData.teacher.schoolId;
                const configRes = await fetch(`/api/schools/${schoolId}/results/config-client`);
                if (!configRes.ok) throw new Error("Failed to fetch result configuration");
                const configData = await configRes.json();
                
                setPeriods(configData.periods || []);
                setComponents(configData.assessmentComponents || []);
                
                // Fetch sessions (if not in config client, fetch separately or use dashboardData currentSession)
                // Dashboard data only has currentSession. Let's fetch all sessions to be safe or just use current.
                // For BatchResultsEntry, it expects a list of sessions.
                const sessionsRes = await fetch(`/api/schools/${schoolId}/sessions`);
                if (sessionsRes.ok) {
                    const sessionsData = await sessionsRes.json();
                    setSessions(sessionsData);
                     // Default to current session
                     const current = sessionsData.find((s: any) => s.isCurrent);
                     if (current && !selectedPeriod) { // Don't override if already selected? No, this is init.
                         // BatchResultsEntry handles session selection internally if passed list.
                     }
                } else {
                     // Fallback
                     setSessions([{ ...dashboardData.currentSession, isCurrent: true }]);
                }

            } catch (error) {
                console.error("Error initializing teacher results:", error);
                toast.error("Failed to load initial data");
            } finally {
                setLoading(false);
            }
        }

        init();
    }, []);

    // Fetch students when a class is selected
    useEffect(() => {
        if (!selectedClass || !teacher) return;

        async function fetchStudents() {
            setLoadingStudents(true);
            try {
                // We reuse the teacher results endpoint but we only care about the student list for now.
                // Or better, a dedicate endpoint. 
                // Let's use the filter logic we have.
                // Effectively we want "Students in Class X".
                // We can use the generic classes API if we have access, or just simple fetch.
                
                // Workaround: We use the existing results endpoint which returns students formatted.
                // Ideally we want raw students.
                // The `BatchResultsEntry` expects `Student[]`.
                
                const sessionId = sessions.find(s => s.isCurrent)?.id;
                if (!sessionId) return; // Should have a session

                // We can use the /api/classes API if available? 
                // Let's check permissions. Usually teachers can't list all classes.
                // But this `selectedClass` is one they are assigned to.
                
                // Let's call /api/teachers/results just to get the student roster, even if we ignore the results part for now
                // (BatchResultsEntry will refetch results, which is slightly redundant but safer for the component reuse).
                
                // Wait, /api/teachers/results requires subjectId.
                if (!selectedSubject) return;

                // Let's fetch.
                const res = await fetch(
                    `/api/teachers/results?subjectId=${selectedSubject}&classId=${selectedClass}&periodId=${periods[0]?.id || ""}&sessionId=${sessionId}`
                );
                
                if (res.ok) {
                    const data = await res.json();
                    // Transform to match Student interface expected by BatchResultsEntry
                    const formattedStudents = data.students.map((s: any) => ({
                        id: s.studentId,
                        name: s.name,
                        rollNumber: s.rollNumber,
                        // Add other fields if needed
                    }));
                    setStudents(formattedStudents);
                }
            } catch (error) {
                console.error("Error fetching students:", error);
                toast.error("Failed to load students");
            } finally {
                setLoadingStudents(false);
            }
        }
        
        fetchStudents();
    }, [selectedClass, selectedSubject, teacher, sessions, periods]);

    const selectedSubjectData = subjects.find(s => s.id === selectedSubject);
    const classesForSubject = selectedSubjectData?.classes || [];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <DashboardHeader
                heading="Results Entry"
                text="Record student scores for your assigned subjects"
                icon={<ClipboardList className="h-6 w-6 text-primary" />}
            />

            <Card className="border-l-4 border-l-primary shadow-sm bg-card">
                <CardHeader>
                    <div className="flex items-center gap-2">
                         <BookOpen className="h-5 w-5 text-primary" />
                         <CardTitle>Select Subject & Class</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label>Subject</Label>
                        <Select value={selectedSubject} onValueChange={(val) => {
                            setSelectedSubject(val);
                            setSelectedClass(""); // Reset class when subject changes
                        }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a subject" />
                            </SelectTrigger>
                            <SelectContent>
                                {subjects.map((subject) => (
                                    <SelectItem key={subject.id} value={subject.id}>
                                        <div className="flex items-center justify-between w-full min-w-[200px]">
                                            <span>{subject.name}</span>
                                            {subject.isCore && <Badge variant="secondary" className="max-h-[20px] text-[10px] ml-2">Core</Badge>}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Class</Label>
                        <Select 
                            value={selectedClass} 
                            onValueChange={setSelectedClass}
                            disabled={!selectedSubject}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={!selectedSubject ? "Select subject first" : "Select a class"} />
                            </SelectTrigger>
                            <SelectContent>
                                {classesForSubject.map((cls) => (
                                    <SelectItem key={cls.id} value={cls.id}>
                                        {cls.name} ({cls.studentCount} students)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {selectedClass && selectedSubject && teacher && (
                <div className="animate-in fade-in max-w-[calc(100vw-3rem)]">
                     {loadingStudents ? (
                         <div className="flex flex-col items-center justify-center p-12">
                             <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                             <p className="text-muted-foreground">Loading student roster...</p>
                         </div>
                     ) : (
                        <BatchResultsEntry
                            schoolId={teacher.schoolId}
                            students={students}
                            subjects={[selectedSubjectData].filter(Boolean) as any[]}
                            periods={periods}
                            sessions={sessions as any[]}
                            components={components}
                            selectedClassId={selectedClass}
                            canEditAllSubjects={true} // Validated by logic above and API
                        />
                     )}
                </div>
            )}
        </div>
    );
}
