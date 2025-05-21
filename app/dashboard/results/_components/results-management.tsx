"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, Lock } from "lucide-react";
import {
    Student,
    Subject,
    Period,
    Session,
    AssessmentComponent,
    Result,
} from "../types";

const resultEntrySchema = z.object({
    studentId: z.string().min(1, "Student is required"),
    subjectId: z.string().min(1, "Subject is required"),
    periodId: z.string().min(1, "Period is required"),
    sessionId: z.string().min(1, "Session is required"),
    componentScores: z.record(z.number().min(0)),
    affectiveTraits: z.record(z.string()).optional(),
    psychomotorSkills: z.record(z.string()).optional(),
    customFields: z.record(z.string()).optional(),
    teacherComment: z.string().optional(),
    adminComment: z.string().optional(),
});

type ResultEntry = z.infer<typeof resultEntrySchema>;

interface ResultsManagementProps {
    schoolId: string;
    students: Student[];
    subjects: Subject[];
    periods: Period[];
    sessions: Session[];
    components: AssessmentComponent[];
    selectedClassId?: string | null;
    canEditAllSubjects?: boolean;
}

export function ResultsManagement({
    students,
    subjects,
    periods,
    sessions,
    components,
    schoolId,
    selectedClassId,
    canEditAllSubjects = true,
}: ResultsManagementProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [results, setResults] = useState<Result[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<string>("");
    const [selectedPeriod, setSelectedPeriod] = useState<string>("");
    const [selectedSession, setSelectedSession] = useState<string>("");
    const [compositeScores, setCompositeScores] = useState<Record<string, number>>({});

    // This will handle the composite scores calculation (e.g., midterm = test1 + test2)
    const calculateCompositeScores = (componentScores: Record<string, number>) => {
        const newCompositeScores: Record<string, number> = {};
        
        // Find composite components (like midterm)
        const compositeComponents = components.filter(comp => 
            comp.name.toLowerCase().includes('midterm') || 
            comp.name.toLowerCase().includes('mid term')
        );
        
        // For simplicity, assume midterm is sum of test1 and test2
        for (const comp of compositeComponents) {
            const test1Score = componentScores['test1'] || 0;
            const test2Score = componentScores['test2'] || 0;
            newCompositeScores[comp.key] = test1Score + test2Score;
        }
        
        return newCompositeScores;
    };

    const form = useForm<ResultEntry>({
        resolver: zodResolver(resultEntrySchema),
        defaultValues: {
            componentScores: {},
            affectiveTraits: {},
            psychomotorSkills: {},
            customFields: {},
        },
    });

    // Set default session if available
    useEffect(() => {
        if (sessions.length > 0) {
            const currentSession = sessions.find(s => s.name.includes("2023") || s.name.includes("current"));
            if (currentSession) {
                form.setValue("sessionId", currentSession.id);
                setSelectedSession(currentSession.id);
            } else {
                form.setValue("sessionId", sessions[0].id);
                setSelectedSession(sessions[0].id);
            }
        }
    }, [sessions, form]);

    // Update composite scores when component scores change
    useEffect(() => {
        const subscription = form.watch((value, { name }) => {
            if (name && name.startsWith("componentScores.")) {
                const scores = form.getValues("componentScores");
                const newCompositeScores = calculateCompositeScores(scores);
                setCompositeScores(newCompositeScores);
            }
        });
        
        return () => subscription.unsubscribe();
    }, [form]);

    // Load results when filters change
    useEffect(() => {
        async function fetchResults() {
            if (!selectedSubject || !selectedPeriod || !selectedSession) return;
            
            setLoading(true);
            try {
                let url = `/api/schools/${schoolId}/results?subjectId=${selectedSubject}&periodId=${selectedPeriod}&sessionId=${selectedSession}`;
                
                if (selectedClassId) {
                    url += `&classId=${selectedClassId}`;
                }
                
                const response = await fetch(url);
                
                if (!response.ok) {
                    throw new Error("Failed to fetch results");
                }
                
                const data = await response.json();
                setResults(data);
            } catch (error) {
                console.error("Error fetching results:", error);
                toast({
                    title: "Error",
                    description: "Failed to fetch results",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        }
        
        fetchResults();
    }, [selectedSubject, selectedPeriod, selectedSession, selectedClassId, schoolId, toast]);

    async function onSubmit(data: ResultEntry) {
        try {
            setIsSubmitting(true);
            
            // Check if teacher can edit this subject
            if (!canEditAllSubjects && !subjects.some(s => s.id === data.subjectId)) {
                toast({
                    title: "Permission Denied",
                    description: "You don't have permission to edit this subject's results",
                    variant: "destructive",
                });
                return;
            }
            
            // Add composite scores to the data before sending
            const allScores = {
                ...data.componentScores,
                ...compositeScores
            };
            
            const submitData = {
                ...data,
                componentScores: allScores,
                classId: selectedClassId,
            };
            
            const response = await fetch(`/api/schools/${schoolId}/results`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(submitData),
            });

            if (!response.ok) {
                throw new Error("Failed to save result");
            }

            toast({
                title: "Success",
                description: "Result saved successfully",
            });

            form.reset();
            router.refresh();
            
            // Refresh results list
            if (selectedSubject && selectedPeriod && selectedSession) {
                let url = `/api/schools/${schoolId}/results?subjectId=${selectedSubject}&periodId=${selectedPeriod}&sessionId=${selectedSession}`;
                
                if (selectedClassId) {
                    url += `&classId=${selectedClassId}`;
                }
                
                const resultsResponse = await fetch(url);
                if (resultsResponse.ok) {
                    const results = await resultsResponse.json();
                    setResults(results);
                }
            }
            
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save result",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    const columns: ColumnDef<Result>[] = [
        {
            accessorKey: "student.name",
            header: "Student",
        },
        {
            accessorKey: "subject.name",
            header: "Subject",
        },
        {
            accessorKey: "period.name",
            header: "Period",
        },
        ...components.map(component => ({
            accessorKey: `componentScores.${component.key}`,
            header: component.name,
            cell: ({ row }: { row: any }) => {
                const scores = row.original.componentScores || [];
                const componentScore = scores.find((cs: any) => 
                    cs.component.key === component.key
                );
                return componentScore ? componentScore.score : "-";
            }
        })),
        {
            accessorKey: "total",
            header: "Total Score",
        },
        {
            accessorKey: "grade",
            header: "Grade",
        },
        {
            accessorKey: "remark",
            header: "Remark",
        },
        {
            accessorKey: "cumulativeAverage",
            header: "Cumulative Average",
            cell: ({ row }: { row: any }) => row.original.cumulativeAverage?.toFixed(2) || "-",
        },
    ];

    return (
        <div className="space-y-8">
            {selectedClassId && (
                <Alert>
                    <InfoIcon className="h-4 w-4" />
                    <AlertTitle>Filtered by Class</AlertTitle>
                    <AlertDescription>
                        You are currently viewing and entering results for students in a specific class.
                    </AlertDescription>
                </Alert>
            )}
            
            {!canEditAllSubjects && subjects.length === 0 && (
                <Alert variant="destructive">
                    <Lock className="h-4 w-4" />
                    <AlertTitle>Access Restricted</AlertTitle>
                    <AlertDescription>
                        You don't have permission to edit results for any subjects in this class.
                        You can only view results for subjects you are assigned to.
                    </AlertDescription>
                </Alert>
            )}
            
            <Card>
                <CardContent className="pt-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="studentId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Student</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                disabled={!canEditAllSubjects && subjects.length === 0}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select student" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {students.map((student) => (
                                                        <SelectItem key={student.id} value={student.id}>
                                                            {student.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="subjectId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Subject</FormLabel>
                                            <Select
                                                onValueChange={(value) => {
                                                    field.onChange(value);
                                                    setSelectedSubject(value);
                                                }}
                                                defaultValue={field.value}
                                                disabled={!canEditAllSubjects && subjects.length === 0}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select subject" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {subjects.map((subject) => (
                                                        <SelectItem key={subject.id} value={subject.id}>
                                                            {subject.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="periodId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Period</FormLabel>
                                            <Select
                                                onValueChange={(value) => {
                                                    field.onChange(value);
                                                    setSelectedPeriod(value);
                                                }}
                                                defaultValue={field.value}
                                                disabled={!canEditAllSubjects && subjects.length === 0}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select period" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {periods.map((period) => (
                                                        <SelectItem key={period.id} value={period.id}>
                                                            {period.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="sessionId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Session</FormLabel>
                                            <Select
                                                onValueChange={(value) => {
                                                    field.onChange(value);
                                                    setSelectedSession(value);
                                                }}
                                                defaultValue={field.value}
                                                disabled={!canEditAllSubjects && subjects.length === 0}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select session" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {sessions.map((session) => (
                                                        <SelectItem key={session.id} value={session.id}>
                                                            {session.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Assessment Components</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {components.filter(comp => !comp.name.toLowerCase().includes('midterm') && !comp.name.toLowerCase().includes('mid term')).map((component) => (
                                        <FormField
                                            key={component.id}
                                            control={form.control}
                                            name={`componentScores.${component.key}`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{component.name}</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max={component.maxScore}
                                                            placeholder={`Max: ${component.maxScore}`}
                                                            {...field}
                                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                                            disabled={!canEditAllSubjects && subjects.length === 0}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    ))}
                                    
                                    {/* Show composite scores (e.g., midterm) calculated from component scores */}
                                    {components.filter(comp => comp.name.toLowerCase().includes('midterm') || comp.name.toLowerCase().includes('mid term')).map((component) => (
                                        <FormItem key={component.id}>
                                            <FormLabel>{component.name}</FormLabel>
                                            <Input
                                                type="number"
                                                value={compositeScores[component.key] || 0}
                                                disabled
                                                className="bg-muted"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Automatically calculated
                                            </p>
                                        </FormItem>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Additional Assessments</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="teacherComment"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Teacher Comment</FormLabel>
                                                <FormControl>
                                                    <Textarea 
                                                        {...field} 
                                                        placeholder="Add teacher's comment"
                                                        disabled={!canEditAllSubjects && subjects.length === 0}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <Button type="submit" disabled={isSubmitting || (!canEditAllSubjects && subjects.length === 0)}>
                                {isSubmitting ? "Saving..." : "Save Result"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <h3 className="text-lg font-medium">Results</h3>
                {loading ? (
                    <p>Loading results...</p>
                ) : (
                    <DataTable 
                        columns={columns} 
                        data={results} 
                        searchPlaceholder="Search results..." 
                    />
                )}
            </div>
        </div>
    );
} 