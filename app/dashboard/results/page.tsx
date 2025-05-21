"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getSession } from "@/lib/auth-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, ClipboardCheck, Loader2, AlertTriangle } from "lucide-react";
import { ClassTabs } from "./_components/class-tabs";
import { ResultsManagementContainer } from "./_components/results-management-container";
import { ResultsConfigurationForm } from "./_components/results-configuration-form";
import { DashboardHeader } from "@/app/components/dashboard-header";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ResultConfiguration } from "./types";

export default function ResultsPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const classId = searchParams.get('classId');

  const [activeTab, setActiveTab] = useState("results");
  const [configData, setConfigData] = useState<ResultConfiguration | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSessionAndData() {
      try {
        setLoading(true);
        setError(null);

        const sessionRes = await fetch('/api/auth/session');
        if (!sessionRes.ok) {
          throw new Error('Failed to fetch session');
        }

        const sessionData = await sessionRes.json();
        if (!sessionData) {
          router.push('/login');
          return;
        }

        const allowedRoles = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'];
        if (!sessionData.role || !allowedRoles.includes(sessionData.role)) {
          throw new Error('You do not have permission to access this page');
        }
        setSession(sessionData);
      } catch (error) {
        console.error("Error:", error);
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("An unexpected error occurred");
        }
        toast.error("Error loading session data");
      } finally {
        setLoading(false);
      }
    }
    fetchSessionAndData();
  }, [router]);

  useEffect(() => {
    if (activeTab === "configuration" && session?.schoolId) {
      async function fetchConfig() {
        setIsLoadingConfig(true);
        setConfigError(null);
        try {
          const response = await fetch(`/api/schools/${session.schoolId}/results/config-client`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to fetch configuration: ${response.statusText}`);
          }
          const data: ResultConfiguration = await response.json();
          setConfigData(data);
        } catch (err) {
          if (err instanceof Error) {
            setConfigError(err.message);
          } else {
            setConfigError("An unknown error occurred while fetching configuration.");
          }
          setConfigData(null);
        } finally {
          setIsLoadingConfig(false);
        }
      }
      fetchConfig();
    }
  }, [activeTab, session?.schoolId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-destructive">{error || "Not authorized"}</p>
        <Button onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const schoolId = session?.schoolId;

  if (!schoolId) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertTitle>School Not Found</AlertTitle>
          <AlertDescription>
            No school associated with your account.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const isAdmin = session.role === "SCHOOL_ADMIN" || session.role === "SUPER_ADMIN";
  const isTeacher = session.role === "TEACHER";
  const canEditAllSubjects = isAdmin;

  return (
    <div className="space-y-6">
      <DashboardHeader
        heading="Results Management & Configuration"
        text="View, enter, manage student results and configure result settings"
        icon={<ClipboardCheck className="h-6 w-6" />}
        showBanner={true}
      />

      <Tabs defaultValue="results" className="w-full" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="w-full grid grid-cols-2 bg-muted/50 h-11 p-1 rounded-md border border-border/40">
          <TabsTrigger
            value="results"
            className="rounded font-medium data-[state=active]:bg-gradient-to-b data-[state=active]:from-background data-[state=active]:to-background data-[state=active]:text-primary data-[state=active]:border-primary data-[state=active]:shadow-sm data-[state=active]:border-b-2 ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9"
          >
            Results
          </TabsTrigger>
          <TabsTrigger
            value="configuration"
            className="rounded font-medium data-[state=active]:bg-gradient-to-b data-[state=active]:from-background data-[state=active]:to-background data-[state=active]:text-primary data-[state=active]:border-primary data-[state=active]:shadow-sm data-[state=active]:border-b-2 ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9"
          >
            Configuration
          </TabsTrigger>
        </TabsList>
        <TabsContent value="results">
          <ClassTabs schoolId={schoolId}>
            {(selectedClassId) => (
              <ResultsManagementContainer
                schoolId={schoolId}
                selectedClassId={selectedClassId || classId}
                canEditAllSubjects={canEditAllSubjects}
                userRole={session.role}
              />
            )}
          </ClassTabs>
        </TabsContent>
        <TabsContent value="configuration" className="mt-4">
          {isLoadingConfig && (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          )}
          {configError && !isLoadingConfig && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error Loading Configuration</AlertTitle>
              <AlertDescription>{configError}</AlertDescription>
            </Alert>
          )}
          {!isLoadingConfig && !configError && configData && (
            <ResultsConfigurationForm
              initialData={configData}
              isReadOnly={!isAdmin}
            />
          )}
          {!isLoadingConfig && !configError && !configData && (
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>No Configuration Data</AlertTitle>
              <AlertDescription>
                Result configuration data could not be loaded or is not yet set up for your school for the current academic session.
                {isAdmin && " You can set it up using the form above once loaded, or if this persists, ensure an academic session is active."}
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 