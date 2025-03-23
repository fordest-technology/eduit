"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, AlertTriangle, Info, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

const formSchema = z.object({
    studentId: z.string().min(1, "Please select a student"),
    sessionId: z.string().min(1, "Please select an academic session"),
    rollNumber: z.string().optional(),
    forceReassign: z.boolean().default(false),
})

interface Student {
    id: string;
    name: string;
    email: string;
    profileImage: string | null;
    department: {
        id: string;
        name: string;
    } | null;
    currentClass: {
        id: string;
        fullName: string;
        rollNumber: string | null;
    } | null;
}

interface AddStudentClassModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    classId: string
    sessionId?: string
    onSuccess?: () => void
}

export function AddStudentClassModal({
    open,
    onOpenChange,
    classId,
    sessionId,
    onSuccess,
}: AddStudentClassModalProps) {
    const [loading, setLoading] = useState(false)
    const [availableStudents, setAvailableStudents] = useState<Student[]>([])
    const [academicSessions, setAcademicSessions] = useState<any[]>([])
    const [currentSession, setCurrentSession] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [conflictInfo, setConflictInfo] = useState<any>(null)
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            studentId: "",
            sessionId: sessionId || "",
            rollNumber: "",
            forceReassign: false,
        },
    })

    // Handle student selection changes
    useEffect(() => {
        const subscription = form.watch((value, { name }) => {
            if (name === "studentId" && value.studentId) {
                setError(null)
                setConflictInfo(null)

                // Find and store the selected student for UI display
                const student = availableStudents.find(s => s.id === value.studentId)
                setSelectedStudent(student || null)
            }
        })
        return () => subscription.unsubscribe()
    }, [form, availableStudents])

    useEffect(() => {
        if (open) {
            fetchAvailableStudents()
            fetchAcademicSessions()
            setError(null)
            setConflictInfo(null)
            setSelectedStudent(null)
            form.reset()
        }
    }, [open, classId, form])

    const fetchAvailableStudents = async () => {
        try {
            setLoading(true)
            setError(null)

            let targetSessionId = sessionId

            // If no sessionId provided, try to get current session
            if (!targetSessionId) {
                const sessionRes = await fetch('/api/academic-sessions?isCurrent=true')

                if (sessionRes.ok) {
                    const sessionsData = await sessionRes.json()
                    if (Array.isArray(sessionsData) && sessionsData.length > 0) {
                        targetSessionId = sessionsData[0].id
                        form.setValue("sessionId", targetSessionId)
                    }
                }
            } else {
                form.setValue("sessionId", targetSessionId)
            }

            // Fetch available students
            const response = await fetch(
                `/api/classes/${classId}/available-students${targetSessionId ? `?sessionId=${targetSessionId}` : ''}`
            )

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || 'Failed to fetch available students')
            }

            const data = await response.json()

            if (!data.data || !Array.isArray(data.data)) {
                console.error('Invalid response format:', data)
                throw new Error('Invalid response format from server')
            }

            setAvailableStudents(data.data)
        } catch (error) {
            console.error('Error fetching available students:', error)
            setError(error instanceof Error ? error.message : 'Failed to load available students')
            setAvailableStudents([])
        } finally {
            setLoading(false)
        }
    }

    const fetchAcademicSessions = async () => {
        try {
            const response = await fetch('/api/academic-sessions?active=true')

            if (!response.ok) {
                const data = await response.json().catch(() => ({}))
                throw new Error(data.error || "Failed to fetch academic sessions")
            }

            const data = await response.json()
            console.log("Academic sessions:", data)
            setAcademicSessions(Array.isArray(data) ? data : [])

            // Set default session if provided or use current session
            if (sessionId) {
                form.setValue("sessionId", sessionId)
            } else {
                const currentSession = data.find((s: any) => s.isCurrent)
                if (currentSession) {
                    form.setValue("sessionId", currentSession.id)
                }
            }

            // Refetch students for this session
            if (open) {
                await fetchAvailableStudents()
            }
        } catch (error) {
            console.error("Error fetching academic sessions:", error)
            setError(error instanceof Error ? error.message : "Failed to fetch academic sessions")
            toast.error("Failed to fetch academic sessions")
        }
    }

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            setLoading(true)
            setError(null)
            setConflictInfo(null)
            console.log("Submitting form with values:", values)

            // Format the data for submission to the add-student endpoint
            const formData = new FormData()
            formData.append("studentId", values.studentId)
            formData.append("sessionId", values.sessionId)
            if (values.rollNumber) {
                formData.append("rollNumber", values.rollNumber)
            }
            formData.append("forceReassign", values.forceReassign.toString())

            console.log("Submitting to endpoint:", `/api/classes/${classId}/add-student`)

            // Use the dedicated API endpoint for adding a student to a class
            const response = await fetch(`/api/classes/${classId}/add-student`, {
                method: "POST",
                body: formData
            })

            console.log("Response status:", response.status, response.statusText)

            // Handle different response types
            if (response.redirected) {
                console.log("Redirect URL:", response.url)
                toast.success("Student added to class successfully")
                onSuccess?.()
                onOpenChange(false)
                return
            }

            // Try to parse the response
            let data
            try {
                data = await response.json()
                console.log("Response data:", data)
            } catch (e) {
                console.error("Error parsing JSON response:", e)
                data = {}
            }

            if (!response.ok) {
                // Special handling for the case where student is in another class
                if (response.status === 409 && data.code === "STUDENT_IN_OTHER_CLASS") {
                    setConflictInfo(data.details)
                    return // Don't throw, we'll show a special UI for this
                }

                throw new Error(
                    data.error || data.message || `Failed to add student to class (${response.status})`
                )
            }

            console.log("Student added to class successfully:", data)
            toast.success(data.message || "Student added to class successfully")
            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            console.error("Error adding student to class:", error)
            setError(error instanceof Error ? error.message : "Failed to add student to class")
            toast.error(error instanceof Error ? error.message : "Failed to add student to class")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Student to Class</DialogTitle>
                    <DialogDescription>
                        Select a student to add to this class.
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {selectedStudent?.currentClass && (
                    <Alert className="mb-2">
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            This student is currently in {selectedStudent.currentClass.fullName}.
                            Adding them to this class will remove them from their current class.
                        </AlertDescription>
                    </Alert>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="studentId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Student</FormLabel>
                                    <Select
                                        disabled={loading}
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a student" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <ScrollArea className="h-[300px]">
                                                {loading ? (
                                                    <div className="p-4 text-center">
                                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                                        <p className="text-sm text-muted-foreground mt-2">Loading students...</p>
                                                    </div>
                                                ) : availableStudents.length === 0 ? (
                                                    <div className="p-4 text-center text-muted-foreground">
                                                        No available students found
                                                    </div>
                                                ) : (
                                                    availableStudents.map((student) => (
                                                        <SelectItem key={student.id} value={student.id}>
                                                            <div className="flex items-center gap-2">
                                                                <Avatar className="h-6 w-6">
                                                                    <AvatarImage
                                                                        src={student.profileImage || ''}
                                                                        alt={student.name}
                                                                    />
                                                                    <AvatarFallback>
                                                                        {student.name?.charAt(0) || 'S'}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">{student.name}</span>
                                                                    {student.department && (
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {student.department.name}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </ScrollArea>
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
                                    <FormLabel>Academic Session</FormLabel>
                                    <Select
                                        onValueChange={(value) => {
                                            field.onChange(value)
                                            // Refetch students when session changes
                                            fetchAvailableStudents()
                                        }}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a session" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {academicSessions.map((session) => (
                                                <SelectItem key={session.id} value={session.id}>
                                                    {session.name} {session.isCurrent && "(Current)"}
                                                </SelectItem>
                                            ))}
                                            {academicSessions.length === 0 && (
                                                <div className="py-6 text-center text-sm text-muted-foreground">
                                                    No active sessions available
                                                </div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="rollNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Roll Number (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter roll number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading || availableStudents.length === 0 || academicSessions.length === 0}
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {conflictInfo && form.getValues().forceReassign
                                    ? "Move to Class"
                                    : selectedStudent?.currentClass
                                        ? "Move to Class"
                                        : "Add to Class"
                                }
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
} 