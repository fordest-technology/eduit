"use client";

import { useState, useEffect } from "react";
import { ResultsManagement } from "./results-management";
import { BatchResultsEntry } from "./batch-results-entry";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AlertTriangle, Loader2 } from "lucide-react";
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

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setLoadingErrors({});

        // Fetch subjects
        try {
          // Use the correct API endpoint for subjects
          const subjectsResponse = await fetch(`/api/subjects`);
          if (!subjectsResponse.ok) {
            throw new Error(`HTTP error ${subjectsResponse.status}`);
          }
          const subjectsData = await subjectsResponse.json();
          setSubjects(subjectsData);
        } catch (error) {
          console.error("Error fetching subjects:", error);
          setLoadingErrors(prev => ({ ...prev, subjects: "Failed to load subjects" }));
          // Still continue with other data fetching
        }

        // Fetch academic sessions
        try {
          // Use the correct API endpoint for sessions
          const sessionsResponse = await fetch(`/api/sessions?schoolId=${schoolId}`);
          if (!sessionsResponse.ok) {
            throw new Error(`HTTP error ${sessionsResponse.status}`);
          }
          const sessionsData = await sessionsResponse.json();
          setSessions(sessionsData);

          // Find current session
          let currentSessionDetails: Session | undefined = sessionsData.find((s: Session) => s.name.toLowerCase().includes("current"));
          if (currentSessionDetails) {
            setCurrentSession(currentSessionDetails.id);
          } else if (sessionsData.length > 0) {
            setCurrentSession(sessionsData[0].id);
            currentSessionDetails = sessionsData[0]; // Initialize currentSessionDetails if not found by name
          }
        } catch (error) {
          console.error("Error fetching sessions:", error);
          setLoadingErrors(prev => ({ ...prev, sessions: "Failed to load academic sessions" }));
        }

        // Fetch results configuration
        try {
          const configResponse = await fetch(`/api/schools/${schoolId}/results/config`);

          if (!configResponse.ok) {
            if (configResponse.status === 404) {
              setConfigExists(false);
              return;
            }
            throw new Error(`HTTP error ${configResponse.status}`);
          }

          const configData = await configResponse.json();
          setPeriods(configData.periods || []);
          setComponents(configData.assessmentComponents || []);
          setConfigExists(true);
        } catch (error) {
          console.error("Error fetching results configuration:", error);
          setLoadingErrors(prev => ({ ...prev, config: "Failed to load results configuration" }));
          setConfigExists(false);
        }

        // If user is a teacher, fetch teacher info
        let teacherData = null;
        if (userRole === "TEACHER") {
          try {
            const teacherResponse = await fetch(`/api/schools/${schoolId}/teachers/me`);
            if (teacherResponse.ok) {
              teacherData = await teacherResponse.json();
              setTeacherInfo(teacherData);
            }
          } catch (error) {
            console.error("Error fetching teacher info:", error);
            setLoadingErrors(prev => ({ ...prev, teacher: "Failed to load teacher information" }));
          }
        }

        // Fetch students for the selected class if we have a current session
        if (selectedClassId && sessions.length > 0) {
          // Ensure currentSession is set, or default to the first session
          const sessionToUse = currentSession || sessions[0]?.id;
          if (sessionToUse) { // Add a check to ensure sessionToUse is not null
            await fetchStudents(selectedClassId, sessionToUse, teacherData);
          }
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
  }, [schoolId, userRole, toast]);

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
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="batch" className="text-sm font-medium">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                  Batch Entry
                </div>
              </TabsTrigger>
              <TabsTrigger value="individual" className="text-sm font-medium">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Individual Entry
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="batch" className="pt-2 space-y-4">
              <div className="bg-secondary/5 p-3 rounded-md border mb-4">
                <div className="flex items-start">
                  <div className="mr-2 mt-0.5 rounded-full bg-primary/10 p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Batch Entry Mode</h4>
                    <p className="text-xs text-muted-foreground">
                      Enter scores for multiple students and subjects at once using the matrix table.
                      <br />Scores are saved automatically when you click "Save Changes".
                    </p>
                  </div>
                </div>
              </div>
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

            <TabsContent value="individual" className="pt-2 space-y-4">
              <div className="bg-secondary/5 p-3 rounded-md border mb-4">
                <div className="flex items-start">
                  <div className="mr-2 mt-0.5 rounded-full bg-primary/10 p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Individual Entry Mode</h4>
                    <p className="text-xs text-muted-foreground">
                      Enter scores for one student and subject at a time with additional options for comments and traits.
                    </p>
                  </div>
                </div>
              </div>
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