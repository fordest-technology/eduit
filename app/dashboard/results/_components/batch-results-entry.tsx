"use client";

import React, { useState, useEffect, useMemo, Fragment } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, Lock, Save, RefreshCw, XCircle, HelpCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Student,
  Subject,
  Period,
  Session,
  AssessmentComponent,
  Result,
} from "../types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface BatchResultsEntryProps {
  schoolId: string;
  students: Student[];
  subjects: Subject[];
  periods: Period[];
  sessions: Session[];
  components: AssessmentComponent[];
  selectedClassId: string | null;
  canEditAllSubjects?: boolean;
  teacherInfo?: any;
}

type CompositeMap = {
  [key: string]: {
    component: AssessmentComponent;
    sources: string[];
  }
};

type ResultMatrix = {
  [studentId: string]: {
    [subjectId: string]: {
      [componentId: string]: number;
    }
  }
};

type RemarksMatrix = {
  [studentId: string]: {
    [subjectId: string]: string;
  }
};

export function BatchResultsEntry({
  schoolId,
  students,
  subjects,
  periods,
  sessions,
  components,
  selectedClassId,
  canEditAllSubjects = true,
  teacherInfo,
}: BatchResultsEntryProps) {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedPeriod, setSelectedPeriod] = useState<string>(searchParams.get("periodId") || "");
  const [selectedSession, setSelectedSession] = useState<string>(searchParams.get("sessionId") || "");
  const [selectedSubject, setSelectedSubject] = useState<string>(searchParams.get("subjectId") || "all");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dataMatrix, setDataMatrix] = useState<ResultMatrix>({});
  const [initialMatrix, setInitialMatrix] = useState<ResultMatrix>({});
  const [remarks, setRemarks] = useState<RemarksMatrix>({});
  const [initialRemarks, setInitialRemarks] = useState<RemarksMatrix>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Helper to check permission
  const isSubjectEditable = (subjectId: string) => {
    if (canEditAllSubjects) return true;
    if (!teacherInfo) return false;

    // Check if subject is assigned to teacher
    if (teacherInfo.subjects?.some((s: any) => s.subjectId === subjectId)) {
      return true;
    }

    // Check if teacher is form teacher for this class
    if (teacherInfo.classes?.some((c: any) => c.id === selectedClassId)) {
      return true;
    }

    return false;
  };

  // Find composite components (like midterm)
  const compositeMap = useMemo<CompositeMap>(() => {
    const map: CompositeMap = {};
    components.forEach(comp => {
      if (comp.name.toLowerCase().includes('midterm') || comp.name.toLowerCase().includes('mid term')) {
        map[comp.key] = {
          component: comp,
          sources: ['test1', 'test2']
        };
      }
    });
    return map;
  }, [components]);

  const regularComponents = useMemo(() => {
    return components.filter(comp =>
      !Object.keys(compositeMap).includes(comp.key)
    );
  }, [components, compositeMap]);

  // Filter subjects based on permissions
  const filteredSubjects = useMemo(() => {
    if (canEditAllSubjects) return subjects;
    if (!teacherInfo) return [];

    // Check if form teacher for this class
    const isFormTeacher = teacherInfo.classes?.some((c: any) => c.id === selectedClassId);
    if (isFormTeacher) {
        return subjects;
    }

    // Filter by assigned subjects
    const assignedSubjectIds = new Set(teacherInfo.subjects?.map((s: any) => s.subjectId));
    return subjects.filter(sub => assignedSubjectIds.has(sub.id));
  }, [subjects, canEditAllSubjects, teacherInfo, selectedClassId]);

  // Update selected subject when filtered subjects change
  useEffect(() => {
    if (filteredSubjects.length > 0) {
       // If current selection is not in filtered list (and is not "all" or "all" is not valid anymore?), reset
       // Actually, safely default to first available if strictly restricted
       if (selectedSubject !== "all" && !filteredSubjects.find(s => s.id === selectedSubject)) {
          setSelectedSubject(filteredSubjects[0].id);
       } else if (selectedSubject === "all" && filteredSubjects.length === 1) {
          // If only 1 subject, auto select it?
          setSelectedSubject(filteredSubjects[0].id);
       }
    }
  }, [filteredSubjects, selectedSubject]);

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    let hasChanges = false;
    
    if (selectedPeriod && params.get("periodId") !== selectedPeriod) {
      params.set("periodId", selectedPeriod);
      hasChanges = true;
    }
    if (selectedSession && params.get("sessionId") !== selectedSession) {
      params.set("sessionId", selectedSession);
      hasChanges = true;
    }
    // Only update subject if it's set and different (handle "all" explicitly if needed)
    if (selectedSubject && params.get("subjectId") !== selectedSubject) {
      params.set("subjectId", selectedSubject);
      hasChanges = true;
    }
    
    if (hasChanges) {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [selectedPeriod, selectedSession, selectedSubject, pathname, router, searchParams]);

  // Set default filters if not set
  useEffect(() => {
    if (sessions.length > 0 && !selectedSession) {
      const currentSession = sessions.find(s => s.name.includes("current"));
      if (currentSession) {
        setSelectedSession(currentSession.id);
      } else {
        setSelectedSession(sessions[0].id);
      }
    }

    if (periods.length > 0 && !selectedPeriod) {
      setSelectedPeriod(periods[0].id);
    }

    if (subjects.length > 0 && !selectedSubject && selectedSubject !== "all") {
      setSelectedSubject(subjects[0].id);
    }
  }, [sessions, periods, subjects, selectedSession, selectedPeriod, selectedSubject]);

  // Calculate composite scores for a student and subject
  const calculateCompositeScore = (studentId: string, subjectId: string, compositeKey: string) => {
    const sources = compositeMap[compositeKey]?.sources || [];
    let total = 0;

    sources.forEach(sourceKey => {
      total += dataMatrix[studentId]?.[subjectId]?.[sourceKey] || 0;
    });

    return total;
  };

  // Load results when filters change
  useEffect(() => {
    async function fetchResults() {
      if (!selectedPeriod || !selectedSession) return;

      setLoading(true);
      try {
        let url = `/api/schools/${schoolId}/results/batch?periodId=${selectedPeriod}&sessionId=${selectedSession}`;
        if (selectedClassId) url += `&classId=${selectedClassId}`;
        if (selectedSubject && selectedSubject !== "all") url += `&subjectId=${selectedSubject}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch results");

        const data: Result[] = await response.json();

        const newMatrix: ResultMatrix = {};
        const newRemarks: RemarksMatrix = {};

        // Initialize with default values
        students.forEach(student => {
          newMatrix[student.id] = {};
          newRemarks[student.id] = {};
          
          const activeLevelSubjects = subjects; // All subjects passed in

          activeLevelSubjects.forEach(subject => {
            if (!subject) return;
            newMatrix[student.id][subject.id] = {};
            newRemarks[student.id][subject.id] = "";
            components.forEach(component => {
              newMatrix[student.id][subject.id][component.id] = 0; // Use component.id
            });
          });
        });

        // Populate with fetched data
        data.forEach(result => {
          const sId = result.studentId;
          const subId = result.subjectId;
          
          if (!newMatrix[sId]) newMatrix[sId] = {};
          if (!newRemarks[sId]) newRemarks[sId] = {};
          if (!newMatrix[sId][subId]) newMatrix[sId][subId] = {};

          newRemarks[sId][subId] = result.teacherComment || "";

          if (result.componentScores) {
            result.componentScores.forEach((cs: any) => {
              // Map by component ID for absolute reliability
              if (cs.component) {
                newMatrix[sId][subId][cs.component.id] = cs.score;
              }
            });
          }
        });

        setDataMatrix(newMatrix);
        setInitialMatrix(JSON.parse(JSON.stringify(newMatrix)));
        setRemarks(newRemarks);
        setInitialRemarks(JSON.parse(JSON.stringify(newRemarks)));
      } catch (error) {
        console.error("Error fetching results:", error);
        toast({ title: "Error", description: "Failed to fetch results", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, [selectedPeriod, selectedSession, selectedSubject, selectedClassId, schoolId, students, subjects, components, toast]);

  // Check if a value has changed from initial load
  const hasChanged = (studentId: string, subjectId: string, componentId: string) => {
    const initial = initialMatrix[studentId]?.[subjectId]?.[componentId];
    const current = dataMatrix[studentId]?.[subjectId]?.[componentId];
    return initial !== current;
  };

  const hasRemarkChanged = (studentId: string, subjectId: string) => {
    const initial = initialRemarks[studentId]?.[subjectId];
    const current = remarks[studentId]?.[subjectId];
    return initial !== current;
  };

  // Handle score input change
  const handleScoreChange = (studentId: string, subjectId: string, componentId: string, value: string) => {
    const numValue = value === "" ? 0 : Number(value);
    const component = components.find(c => c.id === componentId);

    // Validate the input
    if (component && numValue > component.maxScore) {
      setErrors({
        ...errors,
        [`${studentId}-${subjectId}-${componentId}`]: `Max score is ${component.maxScore}`
      });
    } else {
      // Clear error if it exists
      const newErrors = { ...errors };
      delete newErrors[`${studentId}-${subjectId}-${componentId}`];
      setErrors(newErrors);
    }

    // Update the matrix
    setDataMatrix(prev => {
      const updated = { ...prev };
      if (!updated[studentId]) updated[studentId] = {};
      if (!updated[studentId][subjectId]) updated[studentId][subjectId] = {};

      updated[studentId][subjectId][componentId] = numValue;
      return updated;
    });
  };

  const handleRemarkChange = (studentId: string, subjectId: string, value: string) => {
    setRemarks(prev => {
      const updated = { ...prev };
      if (!updated[studentId]) updated[studentId] = {};
      updated[studentId][subjectId] = value;
      return updated;
    });
  };

  // Calculate total number of changes
  const countUnsavedChanges = () => {
    let count = 0;

    students.forEach(student => {
      const displaySubjects = selectedSubject === "all"
        ? subjects
        : [subjects.find(s => s.id === selectedSubject)].filter(Boolean);

      displaySubjects.forEach(subject => {
        if (!subject) return;

        // Check component changes
        regularComponents.forEach(component => {
          if (hasChanged(student.id, subject.id, component.id)) {
            count++;
          }
        });

        // Check remark changes
        if (hasRemarkChanged(student.id, subject.id)) {
          count++;
        }
      });
    });

    return count;
  };

  // Save changes to the server
  const saveChanges = async () => {
    if (Object.keys(errors).length > 0) {
      toast({
        title: "Validation Error",
        description: "Please fix all errors before saving",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Collect all changes
      const changes: any[] = [];

      students.forEach(student => {
        const displaySubjects = selectedSubject === "all"
          ? subjects
          : [subjects.find(s => s.id === selectedSubject)].filter(Boolean);

        displaySubjects.forEach(subject => {
          if (!subject) return;

          // Check if any component has changed for this student and subject
          const hasComponentChanges = regularComponents.some(component =>
            hasChanged(student.id, subject.id, component.id)
          );
          
          const remarkChanged = hasRemarkChanged(student.id, subject.id);

          if (hasComponentChanges || remarkChanged) {
            // Build component scores
            const componentScores = regularComponents.map(component => ({
              componentId: component.id,
              score: dataMatrix[student.id][subject.id][component.id] || 0,
            }));
            
            // Get remark
            const teacherComment = remarks[student.id]?.[subject.id] || "";

            // Add to changes
            changes.push({
              studentId: student.id,
              subjectId: subject.id,
              periodId: selectedPeriod,
              sessionId: selectedSession,
              componentScores,
              classId: selectedClassId,
              teacherComment, // Send remark
            });
          }
        });
      });

      if (changes.length === 0) {
        toast({
          title: "No Changes",
          description: "No changes to save",
        });
        setSaving(false);
        return;
      }

      // Send changes to the server
      const response = await fetch(`/api/schools/${schoolId}/results/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ results: changes }),
      });

      if (!response.ok) {
        throw new Error("Failed to save results");
      }

      // Update the initialMatrix to match current values
      setInitialMatrix(JSON.parse(JSON.stringify(dataMatrix)));
      setInitialRemarks(JSON.parse(JSON.stringify(remarks)));

      toast({
        title: "Success",
        description: `Saved ${changes.length} student result${changes.length === 1 ? "" : "s"}`,
      });
    } catch (error) {
      console.error("Error saving results:", error);
      toast({
        title: "Error",
        description: "Failed to save results",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Handler for refreshing data
  const handleRefresh = () => {
    // Reset to initial data
    setDataMatrix(JSON.parse(JSON.stringify(initialMatrix)));
    setRemarks(JSON.parse(JSON.stringify(initialRemarks)));
    setErrors({});
  };

  // Check if there are any students
  const hasStudents = students.length > 0;

  // Count changes
  const changeCount = countUnsavedChanges();

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Results Entry</CardTitle>
          <CardDescription>Loading assessment data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if periods are available
  if (periods.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Results Entry</CardTitle>
          <CardDescription>No periods configured</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>No Academic Periods</AlertTitle>
            <AlertDescription>
              No academic periods (terms) have been configured. Please go to the Configuration tab to set up periods, assessment components, and grading scales.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Check if no class is selected
  if (!selectedClassId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Results Entry</CardTitle>
          <CardDescription>Select a class to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="bg-blue-50 border-blue-200">
            <InfoIcon className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Select a Class</AlertTitle>
            <AlertDescription className="text-blue-700">
              Please select a class from the tabs above to view and enter student results.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!hasStudents) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Results Entry</CardTitle>
          <CardDescription>No students in selected class</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="bg-amber-50 border-amber-200">
            <InfoIcon className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">No Students Found</AlertTitle>
            <AlertDescription className="text-amber-700">
              There are no active students enrolled in the selected class for the current session.
              Please ensure students have been enrolled in this class.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }



  // Determine which subjects to display based on selected subject for the UI
  const displaySubjects = selectedSubject === "all"
    ? filteredSubjects
    : [filteredSubjects.find(s => s.id === selectedSubject)].filter(Boolean);

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle>Batch Results Entry</CardTitle>
            <CardDescription>
              Enter scores for multiple students at once
            </CardDescription>
          </div>
          {changeCount > 0 && (
            <Badge variant="outline" className="px-3 py-1">
              <span className="mr-1">{changeCount} unsaved change{changeCount === 1 ? '' : 's'}</span>
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Session</label>
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Period</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Period" />
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Subject Filter</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  {filteredSubjects.length > 1 && <SelectItem value="all">All Subjects</SelectItem>}
                  {filteredSubjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-6">
            <div className="rounded-md border overflow-hidden">
              <div className="overflow-x-auto">
                <ScrollArea className="h-[calc(100vh-28rem)]" type="always">
                  <Table>
                    <TableHeader className="sticky top-0 bg-card z-10">
                      <TableRow className="bg-muted/50">
                        <TableHead className="sticky left-0 bg-muted/50 z-20">Student</TableHead>
                        {displaySubjects.map((subject) =>
                          subject && (
                            <TableHead
                              key={subject.id}
                              colSpan={regularComponents.length + Object.keys(compositeMap).length + 1}
                              className="text-center font-medium px-0 border-l"
                            >
                              {subject.name}
                            </TableHead>
                          )
                        )}
                      </TableRow>
                      <TableRow>
                        <TableHead className="sticky left-0 bg-card z-20"></TableHead>
                        {displaySubjects.map((subject) =>
                          subject && (
                            <Fragment key={`${subject.id}-components`}>
                              {regularComponents.map((component) => (
                                <TableHead key={`${subject.id}-${component.key}`} className="p-0 text-center border-l">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="flex items-center justify-center py-2 px-1">
                                          <span className="text-xs">{component.name}</span>
                                          <span className="text-xs ml-1">
                                            <HelpCircle className="h-3 w-3 inline ml-1" />
                                          </span>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-xs">
                                        <div className="space-y-1">
                                          <p><strong>{component.name}</strong></p>
                                          <p>Max score: {component.maxScore}</p>
                                          <p className="text-xs text-muted-foreground">This is a direct assessment component</p>
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </TableHead>
                              ))}
                              {Object.entries(compositeMap).map(([key, data]) => (
                                <TableHead key={`${subject.id}-${key}`} className="p-0 text-center border-l bg-muted/30">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="flex items-center justify-center py-2 px-1">
                                          <span className="text-xs font-semibold">{data.component.name}</span>
                                          <span className="text-xs ml-1">
                                            <HelpCircle className="h-3 w-3 inline ml-1" />
                                          </span>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-xs">
                                        <div className="space-y-1">
                                          <p><strong>{data.component.name}</strong></p>
                                          <p>Max score: {data.component.maxScore}</p>
                                          <p className="text-xs text-muted-foreground">
                                            Composite score calculated from:
                                            <ul className="list-disc pl-4 mt-1">
                                              {data.sources.map(source => {
                                                const sourceComp = components.find(c => c.key === source);
                                                return sourceComp ? (
                                                  <li key={source}>{sourceComp.name}</li>
                                                ) : null;
                                              })}
                                            </ul>
                                          </p>
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </TableHead>
                              ))}
                              <TableHead className="p-0 text-center border-l min-w-[150px]">
                                <span className="text-xs font-semibold">Remark</span>
                              </TableHead>
                            </Fragment>
                          )
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="sticky left-0 bg-card z-10 font-medium">
                            {student.name}
                          </TableCell>
                          {displaySubjects.map((subject) =>
                            subject && (
                              <Fragment key={`${student.id}-${subject.id}`}>
                                {regularComponents.map((component) => {
                                  // PERMISSION CHECK
                                  const isEditable = isSubjectEditable(subject.id);
                                  
                                  const hasError = errors[`${student.id}-${subject.id}-${component.id}`];
                                  const isChanged = hasChanged(student.id, subject.id, component.id);

                                  return (
                                    <TableCell key={`${student.id}-${subject.id}-${component.id}`} className="p-0 border-l">
                                      <div
                                        className={cn(
                                          "py-2 px-1 h-full relative",
                                          isChanged && "bg-primary/5",
                                          !isEditable && "bg-muted/10"
                                        )}
                                      >
                                        {isEditable ? (
                                          <Input
                                            type="number"
                                            min={0}
                                            max={component.maxScore}
                                            value={dataMatrix[student.id]?.[subject.id]?.[component.id] ?? ""}
                                            onChange={(e) => handleScoreChange(student.id, subject.id, component.id, e.target.value)}
                                            className={cn(
                                              "h-8 text-center",
                                              hasError ? "border-destructive" : isChanged ? "border-primary" : ""
                                            )}
                                          />
                                        ) : (
                                          <div className="flex items-center justify-center gap-1 h-8 opacity-70">
                                            <span>{dataMatrix[student.id]?.[subject.id]?.[component.id] ?? 0}</span>
                                            <Lock className="h-3 w-3 text-muted-foreground" />
                                          </div>
                                        )}
                                        {hasError && (
                                          <p className="text-destructive text-xs mt-1 absolute bottom-1 left-1">{hasError}</p>
                                        )}
                                      </div>
                                    </TableCell>
                                  );
                                })}
                                {Object.entries(compositeMap).map(([key, data]) => {
                                  const compositeScore = calculateCompositeScore(student.id, subject.id, key);

                                  return (
                                    <TableCell
                                      key={`${student.id}-${subject.id}-${key}`}
                                      className="text-center p-0 border-l bg-muted/30"
                                    >
                                      <div className="py-2 px-1 h-full">
                                        <div className="flex items-center justify-center h-8">
                                          <span className="font-medium">{compositeScore}</span>
                                        </div>
                                      </div>
                                    </TableCell>
                                  );
                                })}
                                {/* Remark Input */}
                                <TableCell className="p-0 border-l">
                                    <div className={cn(
                                        "py-2 px-1 h-full relative",
                                        hasRemarkChanged(student.id, subject.id) && "bg-primary/5"
                                    )}>
                                        {isSubjectEditable(subject.id) ? (
                                        <Input
                                            type="text"
                                            placeholder="Remark..."
                                            value={remarks[student.id]?.[subject.id] || ""}
                                            onChange={(e) => handleRemarkChange(student.id, subject.id, e.target.value)}
                                            className={cn(
                                                "h-8 text-sm",
                                                hasRemarkChanged(student.id, subject.id) ? "border-primary" : ""
                                            )}
                                        />
                                        ) : (
                                            <div className="flex items-center justify-center h-full px-2">
                                                <span className="text-xs text-muted-foreground italic truncate max-w-[100px]">
                                                    {remarks[student.id]?.[subject.id] || "No remark"}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                              </Fragment>
                            )
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t p-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={saving}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>

          <div className="text-sm text-muted-foreground">
            {changeCount > 0 ? (
              <span className="text-primary">
                {changeCount} unsaved change{changeCount === 1 ? '' : 's'}
              </span>
            ) : (
              <span>No changes</span>
            )}
          </div>
        </div>

        <Button
          onClick={saveChanges}
          disabled={saving || changeCount === 0}
          className="w-full sm:w-auto"
        >
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 