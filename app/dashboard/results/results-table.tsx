"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import type { UserRole } from "@/lib/auth"
import { CheckCircle, Edit, FileDown, Loader2, Plus, Search, SortAsc, SortDesc, XCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Check, X } from "lucide-react"
import type { Result } from "@prisma/client"
import { ResultReport } from "./components/result-report"
import { useSession } from "next-auth/react"
import { ExtendedResult } from "./types"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent } from "@/components/ui/card"
import { format } from "date-fns"

// Type for Next-Auth session user with custom fields
interface ExtendedUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

interface Session {
  id: string
  name: string
  isCurrent: boolean
}

interface Subject {
  id: string
  name: string
  code?: string
}

interface Student {
  id: string
  name: string
  class?: string
  section?: string
}

interface ResultsTableProps {
  initialData: {
    results: ExtendedResult[]
    userRole: UserRole
    schoolId: string | undefined
  }
}

interface ResultsTableRowProps {
  result: ExtendedResult
  onEdit: (result: ExtendedResult) => void
  onDelete: (result: ExtendedResult) => void
}

function ResultsTableRow({ result, onEdit, onDelete }: ResultsTableRowProps) {
  const studentName = result.student?.user?.name || 'N/A'
  const subjectName = result.subject?.name || 'N/A'
  const className = result.student?.classes[0]?.class.name || "N/A"
  const section = result.student?.classes[0]?.class.section || "N/A"

  return (
    <TableRow className="hover:bg-muted/50 transition-colors">
      <TableCell>{studentName}</TableCell>
      <TableCell>{subjectName}</TableCell>
      <TableCell>{className}</TableCell>
      <TableCell>{section}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="font-medium">{result.marks}</span>
          <span className="text-muted-foreground">/ {result.totalMarks}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={result.grade === 'A' ? 'default' : result.grade === 'F' ? 'destructive' : 'secondary'}>
          {result.grade || 'N/A'}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge
          variant={result.isApproved ? 'default' : 'secondary'}
          className={result.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
        >
          {result.isApproved ? 'Approved' : 'Pending'}
        </Badge>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <span className="sr-only">Open menu</span>
              <Edit className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(result)}>
              <Edit className="mr-2 h-4 w-4" /> Edit Result
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(result)}
              className="text-destructive focus:text-destructive"
            >
              <X className="mr-2 h-4 w-4" /> Delete Result
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

export function ResultsTable({ initialData }: ResultsTableProps) {
  const { data: session, status } = useSession()
  const [results, setResults] = useState<ExtendedResult[]>(initialData.results)
  const [filteredResults, setFilteredResults] = useState<ExtendedResult[]>(results)
  const [loading, setLoading] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [userRole, setUserRole] = useState<UserRole>(initialData.userRole)
  const [schoolId, setSchoolId] = useState<string | null>(initialData.schoolId || null)
  const [selectedSession, setSelectedSession] = useState<string>("")
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  const [selectedStudent, setSelectedStudent] = useState<string>("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentResult, setCurrentResult] = useState<ExtendedResult | null>(null)
  const [formData, setFormData] = useState({
    studentId: "",
    subjectId: "",
    sessionId: "",
    examType: "MIDTERM",
    marks: 0,
    totalMarks: 100,
    remarks: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [editForm, setEditForm] = useState({
    marks: "",
    totalMarks: "",
    grade: "",
    comments: "",
  })
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedExamType, setSelectedExamType] = useState("MIDTERM")
  const [showReportGenerator, setShowReportGenerator] = useState(false)
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<{
    key: keyof ExtendedResult | "studentName" | "subjectName",
    direction: "asc" | "desc"
  }>({ key: "createdAt", direction: "desc" })
  const router = useRouter()
  const { toast } = useToast()

  // Protect the component from unauthorized access
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  // If loading or not authenticated, show nothing
  if (status === "loading" || status === "unauthenticated") {
    return null
  }

  // Fetch students and sessions
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch sessions
        const sessionsResponse = await fetch(`/api/sessions${schoolId ? `?schoolId=${schoolId}` : ""}`)

        if (!sessionsResponse.ok) {
          throw new Error("Failed to fetch sessions")
        }

        const sessionsData = await sessionsResponse.json()
        setSessions(sessionsData)

        // Fetch subjects for teacher
        if (userRole === "teacher") {
          const subjectsResponse = await fetch(`/api/subjects/teaching`)

          if (!subjectsResponse.ok) {
            throw new Error("Failed to fetch teacher's subjects")
          }

          const subjectsData = await subjectsResponse.json()
          setSubjects(subjectsData)

          // Fetch students enrolled in teacher's subjects
          if (subjectsData.length > 0) {
            const studentsResponse = await fetch(`/api/students/by-subjects?subjectIds=${subjectsData.map((s: Subject) => s.id).join(",")}`)

            if (!studentsResponse.ok) {
              throw new Error("Failed to fetch students")
            }

            const studentsData = await studentsResponse.json()
            setStudents(studentsData)
          }
        }
        // Fetch all subjects and students for admin
        else if (userRole === "school_admin" || userRole === "super_admin") {
          const subjectsResponse = await fetch(`/api/subjects${schoolId ? `?schoolId=${schoolId}` : ""}`)

          if (!subjectsResponse.ok) {
            throw new Error("Failed to fetch subjects")
          }

          const subjectsData = await subjectsResponse.json()
          setSubjects(subjectsData)

          const studentsResponse = await fetch(`/api/users?role=student${schoolId ? `&schoolId=${schoolId}` : ""}`)

          if (!studentsResponse.ok) {
            throw new Error("Failed to fetch students")
          }

          const studentsData = await studentsResponse.json()
          setStudents(studentsData)
        }

        // Set default session if not already set
        if (!selectedSession && sessionsData.length > 0) {
          const currentSession = sessionsData.find((s: Session) => s.isCurrent)
          setSelectedSession(currentSession?.id || sessionsData[0].id)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        })
      }
    }

    fetchData()
  }, [schoolId, userRole])

  // Fetch classes
  useEffect(() => {
    async function fetchClasses() {
      try {
        let url = "/api/classes"
        if (schoolId) {
          url += `?schoolId=${schoolId}`
        }
        if (userRole === "teacher" && session?.user) {
          const user = session.user as ExtendedUser
          if (user.id) {
            url += `${schoolId ? "&" : "?"}teacherId=${user.id}`
          }
        }

        const response = await fetch(url)
        if (!response.ok) {
          throw new Error("Failed to fetch classes")
        }

        const data = await response.json()
        setClasses(data)

        // Set default class if available
        if (data.length > 0 && !selectedClass) {
          setSelectedClass(data[0].id)
        }
      } catch (error) {
        console.error("Error fetching classes:", error)
        toast({
          title: "Error",
          description: "Failed to load classes",
          variant: "destructive",
        })
      }
    }

    if (session?.user) {
      fetchClasses()
    }
  }, [schoolId, userRole, session, selectedClass])

  // Filter and sort results
  useEffect(() => {
    let filtered = [...results]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(result =>
        result.student.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.grade?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply filters
    if (selectedClass) {
      filtered = filtered.filter(result =>
        result.student.classes.some(c => c.class.id === selectedClass)
      )
    }

    if (selectedSubject) {
      filtered = filtered.filter(result =>
        result.subject.id === selectedSubject
      )
    }

    if (selectedExamType) {
      filtered = filtered.filter(result =>
        result.examType === selectedExamType
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number | null;
      let bValue: string | number | null;

      // Handle special cases for nested properties
      if (sortConfig.key === "studentName") {
        aValue = a.student.user.name;
        bValue = b.student.user.name;
      } else if (sortConfig.key === "subjectName") {
        aValue = a.subject.name;
        bValue = b.subject.name;
      } else {
        // Handle direct properties
        const key = sortConfig.key as keyof ExtendedResult;
        aValue = a[key] as string | number | null;
        bValue = b[key] as string | number | null;
      }

      // Convert null/undefined to empty string for comparison
      aValue = aValue ?? '';
      bValue = bValue ?? '';

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredResults(filtered)
  }, [results, searchTerm, selectedClass, selectedSubject, selectedExamType, sortConfig])

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "marks" || name === "totalMarks" ? Number.parseFloat(value) : value,
    }))
  }

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      studentId: "",
      subjectId: "",
      sessionId: selectedSession,
      examType: "MIDTERM",
      marks: 0,
      totalMarks: 100,
      remarks: "",
    })
  }

  // Open add dialog
  const openAddDialog = () => {
    resetForm()
    setFormData((prev) => ({
      ...prev,
      sessionId: selectedSession,
      subjectId: selectedSubject || (students.length > 0 ? students[0].id : ""),
    }))
    setIsAddDialogOpen(true)
  }

  // Open edit dialog
  const openEditDialog = (result: ExtendedResult) => {
    setCurrentResult(result)
    setEditForm({
      marks: result.marks.toString(),
      totalMarks: result.totalMarks.toString(),
      grade: result.grade || "",
      comments: result.remarks || "",
    })
    setIsEditDialogOpen(true)
  }

  // Add result
  const addResult = async () => {
    setSubmitting(true)
    try {
      const response = await fetch("/api/results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to add result")
      }

      const newResult = await response.json()

      setResults((prev) => [newResult, ...prev])
      setIsAddDialogOpen(false)
      resetForm()

      toast({
        title: "Success",
        description: "Result added successfully",
      })
      router.refresh()
    } catch (error: any) {
      console.error("Error adding result:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add result",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Update result
  const updateResult = async () => {
    if (!currentResult) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/results/${currentResult.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update result")
      }

      const updatedResult = await response.json()

      setResults((prev) => prev.map((result) => (result.id === updatedResult.id ? updatedResult : result)))
      setIsEditDialogOpen(false)
      setCurrentResult(null)

      toast({
        title: "Success",
        description: "Result updated successfully",
      })
      router.refresh()
    } catch (error: any) {
      console.error("Error updating result:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update result",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Approve/reject result
  const toggleApproval = async (resultId: string, approve: boolean) => {
    try {
      const response = await fetch(`/api/results/${resultId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isApproved: approve }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `Failed to ${approve ? "approve" : "reject"} result`)
      }

      const updatedResult = await response.json()

      setResults((prev) => prev.map((result) => (result.id === updatedResult.id ? updatedResult : result)))

      toast({
        title: "Success",
        description: `Result ${approve ? "approved" : "rejected"} successfully`,
      })
      router.refresh()
    } catch (error: any) {
      console.error(`Error ${approve ? "approving" : "rejecting"} result:`, error)
      toast({
        title: "Error",
        description: error.message || `Failed to ${approve ? "approve" : "reject"} result`,
        variant: "destructive",
      })
    }
  }

  // Generate report card
  const generateReportCard = () => {
    // In a real implementation, this would generate a PDF report card
    toast({
      title: "Report Card",
      description: "Report card generation would be implemented here",
    })
  }

  const handleEditResult = async () => {
    if (!currentResult) return

    try {
      const response = await fetch(`/api/results/${currentResult.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          marks: Number(editForm.marks),
          totalMarks: Number(editForm.totalMarks),
          grade: editForm.grade,
          comments: editForm.comments || "",
        }),
      })

      if (!response.ok) throw new Error("Failed to update result")

      const updatedResult = await response.json()
      setResults(prev => prev.map(result =>
        result.id === updatedResult.id ? updatedResult : result
      ))
      setIsEditDialogOpen(false)
      toast({
        title: "Success",
        description: "Result updated successfully",
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update result",
        variant: "destructive",
      })
    }
  }

  const handleApproveResult = async (resultId: string) => {
    try {
      const response = await fetch(`/api/results/${resultId}/approve`, {
        method: "POST",
      })

      if (!response.ok) throw new Error("Failed to approve result")

      const updatedResult = await response.json()
      setResults(prev => prev.map(result =>
        result.id === updatedResult.id ? updatedResult : result
      ))
      toast({
        title: "Success",
        description: "Result approved successfully",
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve result",
        variant: "destructive",
      })
    }
  }

  const handleRejectResult = async (resultId: string) => {
    try {
      const response = await fetch(`/api/results/${resultId}/reject`, {
        method: "POST",
      })

      if (!response.ok) throw new Error("Failed to reject result")

      const updatedResult = await response.json()
      setResults(prev => prev.map(result =>
        result.id === updatedResult.id ? updatedResult : result
      ))
      toast({
        title: "Success",
        description: "Result rejected successfully",
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject result",
        variant: "destructive",
      })
    }
  }

  const handleEdit = async (result: ExtendedResult) => {
    try {
      const response = await fetch(`/api/results/${result.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(result),
      })

      if (!response.ok) {
        throw new Error("Failed to update result")
      }

      const updatedResult = await response.json()
      setResults(results.map(r => r.id === updatedResult.id ? updatedResult : r))
      toast({
        title: "Success",
        description: "Result updated successfully",
        duration: 3000,
      })
      router.refresh()
    } catch (error) {
      console.error("Error updating result:", error)
      toast({
        title: "Error",
        description: "Failed to update result",
        duration: 3000,
      })
    }
  }

  const handleDelete = async (result: ExtendedResult) => {
    try {
      const response = await fetch(`/api/results/${result.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete result")
      }

      setResults(results.filter(r => r.id !== result.id))
      toast({
        title: "Success",
        description: "Result deleted successfully",
        duration: 3000,
      })
      router.refresh()
    } catch (error) {
      console.error("Error deleting result:", error)
      toast({
        title: "Error",
        description: "Failed to delete result",
        duration: 3000,
      })
    }
  }

  const handleSort = (key: typeof sortConfig.key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc"
    }))
  }

  return (
    <div className="space-y-6">
      {showReportGenerator ? (
        <ResultReport
          classId={selectedClass}
          sessionId={selectedSession}
          examType={selectedExamType}
          students={filteredResults.map(result => ({
            id: result.student.id,
            name: result.student.user.name,
            results: [{
              subjectId: result.subject.id,
              subjectName: result.subject.name,
              marks: result.marks,
              totalMarks: result.totalMarks,
              grade: result.grade || "",
              position: result.position || 0,
              skillRatings: result.skillRatings ?
                Object.entries(result.skillRatings).reduce((acc, [key, value]) => ({
                  ...acc,
                  [key]: typeof value === 'number' ? value : 0
                }), {}) : {},
              attendance: result.attendance || 0,
              behavior: result.behavior || 0,
              effort: result.effort || 0,
              teacherNote: result.teacherNote || ""
            }]
          }))}
          onClose={() => setShowReportGenerator(false)}
        />
      ) : (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center space-x-2">
              <Input
                placeholder="Search results..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-[300px]"
              />
              <Button variant="outline" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((class_) => (
                    <SelectItem key={class_.id} value={class_.id}>
                      {class_.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select Session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.name} {session.isCurrent && "(Current)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedExamType} onValueChange={setSelectedExamType}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select Exam Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MIDTERM">Mid-Term</SelectItem>
                  <SelectItem value="FINAL">Final</SelectItem>
                  <SelectItem value="TEST">Test</SelectItem>
                  <SelectItem value="QUIZ">Quiz</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              {(userRole === "teacher" || userRole === "school_admin" || userRole === "super_admin") && (
                <>
                  <Button onClick={() => setShowReportGenerator(true)} variant="outline">
                    <FileDown className="mr-2 h-4 w-4" />
                    Generate Report
                  </Button>
                  <Button onClick={openAddDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Result
                  </Button>
                </>
              )}
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("studentName")}>
                        <div className="flex items-center gap-2">
                          Student
                          {sortConfig.key === "studentName" && (
                            sortConfig.direction === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("subjectName")}>
                        <div className="flex items-center gap-2">
                          Subject
                          {sortConfig.key === "subjectName" && (
                            sortConfig.direction === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("marks")}>
                        <div className="flex items-center gap-2">
                          Marks
                          {sortConfig.key === "marks" && (
                            sortConfig.direction === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="flex justify-center items-center">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            Loading results...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredResults.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          No results found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredResults.map((result) => (
                        <ResultsTableRow
                          key={result.id}
                          result={result}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Add Result Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Result</DialogTitle>
            <DialogDescription>Enter the student's result details for the selected subject and exam.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="student" className="text-sm font-medium">
                  Student
                </label>
                <Select
                  name="studentId"
                  value={formData.studentId}
                  onValueChange={(value) => handleSelectChange("studentId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name} {student.class && `(${student.class}${student.section ? ` - ${student.section}` : ""})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium">
                  Subject
                </label>
                <Select
                  name="subjectId"
                  value={formData.subjectId}
                  onValueChange={(value) => handleSelectChange("subjectId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="examType" className="text-sm font-medium">
                  Exam Type
                </label>
                <Select
                  name="examType"
                  value={formData.examType}
                  onValueChange={(value) => handleSelectChange("examType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Exam Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="QUIZ">Quiz</SelectItem>
                    <SelectItem value="TEST">Test</SelectItem>
                    <SelectItem value="MIDTERM">Midterm</SelectItem>
                    <SelectItem value="FINAL">Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="session" className="text-sm font-medium">
                  Academic Session
                </label>
                <Select
                  name="sessionId"
                  value={formData.sessionId}
                  onValueChange={(value) => handleSelectChange("sessionId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Session" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        {session.name} {session.isCurrent && "(Current)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="marks" className="text-sm font-medium">
                  Marks Obtained
                </label>
                <Input
                  id="marks"
                  name="marks"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.marks}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="totalMarks" className="text-sm font-medium">
                  Total Marks
                </label>
                <Input
                  id="totalMarks"
                  name="totalMarks"
                  type="number"
                  min="1"
                  step="0.01"
                  value={formData.totalMarks}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="remarks" className="text-sm font-medium">
                Remarks (Optional)
              </label>
              <Textarea
                id="remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                placeholder="Add any comments or feedback for the student"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addResult} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Result
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Result Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Result</DialogTitle>
            <DialogDescription>Update the student's result details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Student</label>
                <Input value={currentResult?.student.user.name || ""} disabled />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Input value={currentResult?.subject.name || ""} disabled />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="examType" className="text-sm font-medium">
                  Exam Type
                </label>
                <Select
                  name="examType"
                  value={formData.examType}
                  onValueChange={(value) => handleSelectChange("examType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Exam Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="QUIZ">Quiz</SelectItem>
                    <SelectItem value="TEST">Test</SelectItem>
                    <SelectItem value="MIDTERM">Midterm</SelectItem>
                    <SelectItem value="FINAL">Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Academic Session</label>
                <Input value={currentResult?.sessionId || ""} disabled />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="marks" className="text-sm font-medium">
                  Marks Obtained
                </label>
                <Input
                  id="marks"
                  name="marks"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.marks}
                  onChange={(e) => setEditForm(prev => ({ ...prev, marks: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="totalMarks" className="text-sm font-medium">
                  Total Marks
                </label>
                <Input
                  id="totalMarks"
                  name="totalMarks"
                  type="number"
                  min="1"
                  step="0.01"
                  value={editForm.totalMarks}
                  onChange={(e) => setEditForm(prev => ({ ...prev, totalMarks: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="grade" className="text-sm font-medium">
                Grade
              </label>
              <Input
                id="grade"
                name="grade"
                value={editForm.grade}
                onChange={(e) => setEditForm(prev => ({ ...prev, grade: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="comments" className="text-sm font-medium">
                Comments
              </label>
              <Textarea
                id="comments"
                name="comments"
                value={editForm.comments}
                onChange={(e) => setEditForm(prev => ({ ...prev, comments: e.target.value }))}
                placeholder="Add any comments or feedback for the student"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditResult}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

