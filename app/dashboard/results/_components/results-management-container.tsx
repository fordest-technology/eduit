"use client";

import { useState, useEffect } from "react";
import { ResultsManagement } from "./results-management";
import { BatchResultsEntry } from "./batch-results-entry";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AlertTriangle, Loader2, Table2, Edit3, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import {
  Student,
  Subject,
  Period,
  Session,
  AssessmentComponent
} from "../types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

interface ResultsManagementContainerProps {
  schoolId: string;
  selectedClassId: string | null;
  canEditAllSubjects?: boolean;
  userRole?: string;
}

export function ResultsManagementContainer({
  schoolId,
  selectedClassId,
  canEditAllSubjects = false,
  userRole
}: ResultsManagementContainerProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [components, setComponents] = useState<AssessmentComponent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teacherInfo, setTeacherInfo] = useState<any>(null);
  const [configExists, setConfigExists] = useState(true);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [loadingErrors, setLoadingErrors] = useState<{ [key: string]: string }>({});

  // Fetch data - PARALLEL for speed
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setLoadingErrors({});

        // Build subjects URL - filter by class if selected
        const subjectsUrl = selectedClassId 
          ? `/api/subjects?classId=${selectedClassId}` 
          : `/api/subjects`;

        // Fetch all data in PARALLEL for maximum speed
        const [subjectsResult, sessionsResult, configResult, teacherResult] = await Promise.allSettled([
          // Subjects (filtered by class if selected)
          fetch(subjectsUrl).then(r => r.ok ? r.json() : Promise.reject(r.status)),
          // Sessions
          fetch(`/api/sessions?schoolId=${schoolId}`).then(r => r.ok ? r.json() : Promise.reject(r.status)),
          // Config
          fetch(`/api/schools/${schoolId}/results/config-client`).then(r => r.ok ? r.json() : Promise.reject(r.status)),
          // Teacher info (only if teacher role)
          userRole === "TEACHER" 
            ? fetch(`/api/schools/${schoolId}/teachers/me`).then(r => r.ok ? r.json() : null)
            : Promise.resolve(null),
        ]);

        // Process subjects
        if (subjectsResult.status === "fulfilled") {
          setSubjects(subjectsResult.value || []);
        } else {
          console.error("Error fetching subjects:", subjectsResult.reason);
          setLoadingErrors(prev => ({ ...prev, subjects: "Failed to load subjects" }));
        }

        // Process sessions
        let currentSessionId: string | null = null;
        if (sessionsResult.status === "fulfilled") {
          const sessionsData = sessionsResult.value || [];
          setSessions(sessionsData);
          const currentSessionObj = sessionsData.find((s: any) => s.isCurrent === true) || sessionsData[0];
          if (currentSessionObj) {
            currentSessionId = currentSessionObj.id;
            setCurrentSession(currentSessionId);
          }
        } else {
          console.error("Error fetching sessions:", sessionsResult.reason);
          setLoadingErrors(prev => ({ ...prev, sessions: "Failed to load academic sessions" }));
        }

        // Process config
        if (configResult.status === "fulfilled") {
          const configData = configResult.value;
          if (configData) {
            setPeriods(configData.periods || []);
            setComponents(configData.assessmentComponents || []);
            setConfigExists(true);
          } else {
            setConfigExists(false);
          }
        } else {
          if (configResult.reason === 404) {
            setConfigExists(false);
          } else {
            console.error("Error fetching config:", configResult.reason);
            setLoadingErrors(prev => ({ ...prev, config: "Failed to load results configuration" }));
            setConfigExists(false);
          }
        }

        // Process teacher info
        if (teacherResult.status === "fulfilled" && teacherResult.value) {
          setTeacherInfo(teacherResult.value);
        }

        // Fetch students AFTER we have session ID (depends on session data)
        if (selectedClassId && currentSessionId) {
          await fetchStudents(selectedClassId, currentSessionId, 
            teacherResult.status === "fulfilled" ? teacherResult.value : null);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load results data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [schoolId, userRole, selectedClassId, toast]);


  // Separate function to fetch students - will be called again when class changes
  async function fetchStudents(classId: string | null, sessionId: string | null, teacherData: any = null) {
    if (!classId || !sessionId) {
      setStudents([]);
      return;
    }

    try {
      // Get students for the selected class
      const url = `/api/students?classId=${classId}&sessionId=${sessionId}`;
      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch students: ${response.statusText}`);
      }

      const data = await response.json();

      // Format student data properly based on the API response structure
      const formattedStudents = data.map((student: any) => ({
        id: student.id,
        name: student.name || student.user?.name || 'Unknown',
        rollNumber: student.rollNumber || student.currentClass?.rollNumber,
        currentClass: student.currentClass ? {
          id: student.currentClass.id,
          name: student.currentClass.name,
          section: student.currentClass.section,
          status: student.currentClass.status
        } : null
      }));

      // Filter out inactive students if needed
      const activeStudents = formattedStudents.filter(
        (student: any) => student.currentClass?.status === 'ACTIVE'
      );

      setStudents(activeStudents);
    } catch (error) {
      console.error("Error fetching students:", error);
      setLoadingErrors(prev => ({ ...prev, students: error instanceof Error ? error.message : "Failed to load students" }));
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load students data",
        variant: "destructive",
      });
      setStudents([]); // Reset students on error
    }
  }

  // Listen for class ID changes to fetch students
  useEffect(() => {
    if (currentSession && selectedClassId) { // Ensure selectedClassId is also checked
      fetchStudents(selectedClassId, currentSession);
    }
  }, [selectedClassId, currentSession]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading results data...</p>
        </div>
      </div>
    );
  }

  // Show error messages for critical load failures
  if (Object.keys(loadingErrors).length > 0 && (loadingErrors.config || (loadingErrors.subjects && loadingErrors.sessions))) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Data Loading Error</CardTitle>
          <CardDescription>
            Some required data couldn't be loaded
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(loadingErrors).map(([key, message]) => (
              <div key={key} className="p-3 bg-destructive/10 rounded-md border border-destructive/20">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  {message}
                </h4>
              </div>
            ))}
            <Button onClick={() => window.location.reload()} className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show message if no results configuration exists
  if (!configExists) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <div className="rounded-full bg-amber-100 p-3">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="text-lg font-medium text-center">Result Configuration Required</h3>
            <p className="text-muted-foreground text-center max-w-md">
              No result configuration found. Please set up the assessment components,
              periods, and grading scales before entering results.
            </p>
            {(userRole === "SUPER_ADMIN" || userRole === "SCHOOL_ADMIN") && (
              <Link href="/dashboard/results/configuration">
                <Button>
                  Go to Results Configuration
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/10 shadow-sm">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Results Entry</CardTitle>
              <CardDescription>
                {selectedClassId ?
                  "Enter and manage results for students in the selected class." :
                  "Select a class tab above to view and enter results for students."}
              </CardDescription>
            </div>
            {selectedClassId && (
              <div className="rounded-md bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Class Selected
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Show non-critical warnings */}
          {(loadingErrors.students || loadingErrors.teacher) && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Warning</p>
                  <p>{loadingErrors.students || loadingErrors.teacher}</p>
                  <p className="mt-1">Some functionality might be limited.</p>
                </div>
              </div>
            </div>
          )}

          <Tabs defaultValue="batch" className="w-full">
            {/* Improved Entry Mode Tabs */}
            <div className="mb-6">
              <TabsList className="w-full grid grid-cols-2 h-auto p-1.5 bg-gradient-to-r from-slate-100 to-slate-50 rounded-xl gap-2">
                <TabsTrigger 
                  value="batch" 
                  className="rounded-lg py-4 px-4 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:shadow-orange-100/50 transition-all"
                >
                  <div className="flex flex-col items-center gap-2 w-full">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-orange-100 data-[state=active]:bg-orange-500">
                        <Table2 className="h-5 w-5 text-orange-600" />
                      </div>
                      <span className="font-semibold text-base text-slate-800">Batch Entry</span>
                    </div>
                    <p className="text-xs text-slate-500 text-center">
                      Enter scores for multiple students at once
                    </p>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="individual" 
                  className="rounded-lg py-4 px-4 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-100/50 transition-all"
                >
                  <div className="flex flex-col items-center gap-2 w-full">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <Edit3 className="h-5 w-5 text-blue-600" />
                      </div>
                      <span className="font-semibold text-base text-slate-800">Individual Entry</span>
                    </div>
                    <p className="text-xs text-slate-500 text-center">
                      Enter scores one student at a time
                    </p>
                  </div>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="batch" className="mt-0 space-y-4">
              <BatchResultsEntry
                schoolId={schoolId}
                students={students}
                subjects={subjects}
                periods={periods}
                sessions={sessions}
                components={components}
                selectedClassId={selectedClassId}
                canEditAllSubjects={canEditAllSubjects}
              />
            </TabsContent>

            <TabsContent value="individual" className="mt-0 space-y-4">
              <ResultsManagement
                schoolId={schoolId}
                students={students}
                subjects={subjects}
                periods={periods}
                sessions={sessions}
                components={components}
                selectedClassId={selectedClassId}
                canEditAllSubjects={canEditAllSubjects}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
 