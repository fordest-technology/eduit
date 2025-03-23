"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileDown, Loader2, GraduationCap, BookOpen, Award } from "lucide-react"
import { ResultsTable } from "./results-table"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DashboardHeader } from "@/app/components/dashboard-header"
import { useSession } from "next-auth/react"
import { ExtendedResult } from "./types"
import type { UserRole } from "@/lib/auth"

interface ExtendedSession {
  user: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
  role: UserRole
  expires: string
}

interface PageProps {
  params: { id: string }
}

export default function ResultsPage({ params }: PageProps) {
  const router = useRouter()
  const { data: session, status } = useSession() as { data: ExtendedSession | null, status: string }
  const [results, setResults] = useState<ExtendedResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [schoolData, setSchoolData] = useState<any>(null)

  // Calculate statistics
  const totalResults = results.length
  const approvedResults = results.filter(r => r.isApproved).length
  const averageScore = results.length > 0
    ? results.reduce((sum, r) => sum + (r.marks / r.totalMarks) * 100, 0) / results.length
    : 0

  useEffect(() => {
    async function fetchData() {
      try {
        if (status === "unauthenticated") {
          router.push("/login")
          return
        }

        // Fetch school data
        const schoolRes = await fetch("/api/schools/current")
        if (schoolRes.ok) {
          const schoolData = await schoolRes.json()
          setSchoolData(schoolData.school)
        }

        // Fetch results
        const resultsRes = await fetch("/api/results")
        if (!resultsRes.ok) {
          throw new Error("Failed to fetch results")
        }

        const resultsData = await resultsRes.json()
        setResults(resultsData)
      } catch (error) {
        console.error("Error:", error)
        if (error instanceof Error) {
          setError(error.message)
        } else {
          setError("An unexpected error occurred")
        }
        toast.error("Error loading page")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [status, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">{error || "Not authorized"}</p>
        <Button onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        heading="Academic Results"
        text="Manage and track student performance across all subjects and examinations"
        showBanner={true}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center text-blue-700">
              <GraduationCap className="mr-2 h-5 w-5" />
              Total Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-800">{totalResults}</p>
            <p className="text-sm text-blue-600 mt-1">Recorded assessments</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center text-emerald-700">
              <BookOpen className="mr-2 h-5 w-5" />
              Approved Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-800">{approvedResults}</p>
            <p className="text-sm text-emerald-600 mt-1">Verified assessments</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center text-purple-700">
              <Award className="mr-2 h-5 w-5" />
              Average Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-800">{averageScore.toFixed(1)}%</p>
            <p className="text-sm text-purple-600 mt-1">Overall performance</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/10 shadow-md">
        <CardHeader className="bg-primary/5 border-b border-primary/10">
          <CardTitle>Results Management</CardTitle>
          <CardDescription>View, add, and manage student examination results</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <ResultsTable
            initialData={{
              results,
              userRole: session.role,
              schoolId: schoolData?.id
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}