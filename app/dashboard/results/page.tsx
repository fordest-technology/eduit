"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getSession } from "@/lib/auth-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, ClipboardCheck, Loader2, AlertTriangle, Layout } from "lucide-react";
import { ClassTabs } from "./_components/class-tabs";
import { ResultsManagementContainer } from "./_components/results-management-container";
import { ResultsConfigurationForm } from "./_components/results-configuration-form";
import { PublishResults } from "./_components/publish-results";
import { ResultsTemplatesList } from "./_components/results-templates-list";
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
        <TabsList className="w-full grid grid-cols-4 bg-gradient-to-r from-slate-100 to-slate-50 h-14 p-1.5 rounded-2xl gap-2 shadow-inner">
          <TabsTrigger
            value="results"
            className="rounded-xl font-semibold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-lg data-[state=active]:shadow-orange-100 transition-all h-11 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            <span>Results Entry</span>
          </TabsTrigger>
          <TabsTrigger
            value="publish"
            className="rounded-xl font-semibold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-lg data-[state=active]:shadow-green-100 transition-all h-11 flex items-center gap-2"
            disabled={!isAdmin}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Publish Results</span>
          </TabsTrigger>
          <TabsTrigger
            value="configuration"
            className="rounded-xl font-semibold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg data-[state=active]:shadow-blue-100 transition-all h-11 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Configuration</span>
          </TabsTrigger>
          <TabsTrigger
            value="templates"
            className="rounded-xl font-semibold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-lg data-[state=active]:shadow-purple-100 transition-all h-11 flex items-center gap-2"
            disabled={!isAdmin}
          >
            <Layout className="h-5 w-5" />
            <span>Templates</span>
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
        <TabsContent value="publish" className="mt-4">
          {isAdmin && <PublishResults schoolId={schoolId} />}
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
            <>
              {(configData as any).isNew && (
                <Alert className="mb-4 bg-blue-50 border-blue-200">
                  <InfoIcon className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800">New Configuration</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    This is a default template. Customize the settings below and save to create your school's result configuration.
                  </AlertDescription>
                </Alert>
              )}
              <ResultsConfigurationForm
                initialData={configData}
                isReadOnly={!isAdmin}
              />
            </>
          )}
        </TabsContent>
        <TabsContent value="templates" className="mt-4">
          {isAdmin && <ResultsTemplatesList schoolId={schoolId} />}
        </TabsContent>
      </Tabs>
    </div>
  );
} 