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
import { CheckCircle, Edit, FileDown, Loader2, Plus, XCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Check, X } from "lucide-react"
import type { Result, Role } from "@prisma/client"

interface ExtendedResult extends Result {
  student: {
    id: string
    name: string
  }
  subject: {
    id: string
    name: string
  }
}

interface ResultsTableProps {
  userRole: UserRole
  schoolId?: string
  results: ExtendedResult[]
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

export function ResultsTable({ userRole, schoolId, results: initialResults }: ResultsTableProps) {
  const [results, setResults] = useState<ExtendedResult[]>(initialResults)
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<Student[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
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

  // Fetch results
  useEffect(() => {
    async function fetchResults() {
      setLoading(true)
      try {
        let url = "/api/results?"

        if (selectedSession) {
          url += `&sessionId=${selectedSession}`
        }

        if (selectedSubject) {
          url += `&subjectId=${selectedSubject}`
        }

        if (selectedStudent) {
          url += `&studentId=${selectedStudent}`
        }

        const response = await fetch(url)

        if (!response.ok) {
          throw new Error("Failed to fetch results")
        }

        const data = await response.json()
        setResults(data)
      } catch (error) {
        console.error("Error fetching results:", error)
        toast({
          title: "Error",
          description: "Failed to load results",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [selectedSession, selectedSubject, selectedStudent])

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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject result",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-2">
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

          {(userRole === "teacher" || userRole === "school_admin" || userRole === "super_admin") && (
            <>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects?.map((subject: { id: string, name: string, code?: string }) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name} {subject.code ? `(${subject.code})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Students" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem> {/* Already correct */}
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} {student.class && `(${student.class}${student.section ? ` - ${student.section}` : ""})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>

        <div className="flex gap-2">
          {(userRole === "teacher" || userRole === "school_admin" || userRole === "super_admin") && (
            <Button onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Result
            </Button>
          )}

          {(userRole === "student" || userRole === "parent") && (
            <Button onClick={generateReportCard}>
              <FileDown className="mr-2 h-4 w-4" />
              Download Report Card
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Exam Type</TableHead>
              <TableHead className="text-right">Marks</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading results...
                  </div>
                </TableCell>
              </TableRow>
            ) : results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No results found
                </TableCell>
              </TableRow>
            ) : (
              results.map((result) => (
                <TableRow key={result.id}>
                  <TableCell>{result.student.name}</TableCell>
                  <TableCell>{result.subject.name}</TableCell>
                  <TableCell>{result.examType.charAt(0) + result.examType.slice(1).toLowerCase()}</TableCell>
                  <TableCell className="text-right">
                    {result.marks}/{result.totalMarks} ({((result.marks / result.totalMarks) * 100).toFixed(1)}%)
                  </TableCell>
                  <TableCell>{result.grade}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        result.isApproved ? "default"
                          : "destructive"
                      }
                    >
                      {result.isApproved ? "Approved" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {(userRole === "teacher" || userRole === "school_admin" || userRole === "super_admin") && (
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(result)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      )}

                      {(userRole === "school_admin" || userRole === "super_admin") && !result.isApproved && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleApproval(result.id, true)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span className="sr-only">Approve</span>
                        </Button>
                      )}

                      {(userRole === "school_admin" || userRole === "super_admin") && result.isApproved && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleApproval(result.id, false)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4" />
                          <span className="sr-only">Reject</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
                <Input value={currentResult?.student.name || ""} disabled />
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

