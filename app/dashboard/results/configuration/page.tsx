"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getSession } from "@/lib/auth-client";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, Settings, Loader2 } from "lucide-react";
import { ResultsConfigurationFormContainer } from "../_components/results-configuration-form-container";
import { DashboardHeader } from "@/app/components/dashboard-header";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ResultsConfigurationPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const classId = searchParams.get('classId');

  useEffect(() => {
    async function fetchSessionAndData() {
      try {
        setLoading(true);
        setError(null);

        // First fetch the session
        const sessionRes = await fetch('/api/auth/session');
        if (!sessionRes.ok) {
          throw new Error('Failed to fetch session');
        }

        const sessionData = await sessionRes.json();
        if (!sessionData) {
          router.push('/login');
          return;
        }

        // Check if user has required role
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

  const isAdmin = session?.role === "SCHOOL_ADMIN" || session?.role === "SUPER_ADMIN";
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

  return (
    <div className="space-y-6">
      <DashboardHeader
        heading="Results Configuration"
        text="Configure assessment components, periods and grading scales for student evaluation"
        icon={<Settings className="h-6 w-6" />}
        showBanner={true}
      />

      {!isAdmin && (
        <Alert variant="default">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Limited Access</AlertTitle>
          <AlertDescription>
            As a teacher, you can view but not modify the results configuration.
          </AlertDescription>
        </Alert>
      )}

      <ResultsConfigurationFormContainer schoolId={schoolId} />
    </div>
  );
} 