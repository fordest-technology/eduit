"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { ResponsiveSheet } from "@/components/ui/responsive-sheet"
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
import { AlertCircle, Info, Loader2, Sparkles, UserPlus, Layers } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

const formSchema = z.object({
    studentId: z.string().min(1, "Please select a student"),
    targetClassId: z.string().min(1, "Please select an arm/section"),
    sessionId: z.string().min(1, "Please select an academic session"),
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

interface ClassArm {
    id: string;
    name: string;
    section: string | null;
}

interface AddStudentClassModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    classId: string // Current class ID
    onSuccess?: () => void
}

export function AddStudentClassModal({
    open,
    onOpenChange,
    classId,
    onSuccess,
}: AddStudentClassModalProps) {
    const [loading, setLoading] = useState(false)
    const [availableStudents, setAvailableStudents] = useState<Student[]>([])
    const [academicSessions, setAcademicSessions] = useState<any[]>([])
    const [availableArms, setAvailableArms] = useState<ClassArm[]>([])
    const [error, setError] = useState<string | null>(null)
    const [conflictInfo, setConflictInfo] = useState<any>(null)
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            studentId: "",
            targetClassId: classId,
            sessionId: "",
            forceReassign: false,
        },
    })

    // Fetch details about the current class and other arms
    const fetchClassArms = async () => {
        try {
            const response = await fetch(`/api/classes/${classId}`)
            if (response.ok) {
                const data = await response.json()
                const arms = [
                    { id: data.id, name: data.name, section: data.section },
                    ...(data.otherArms || []).map((arm: any) => ({
                        id: arm.id,
                        name: data.name,
                        section: arm.section
                    }))
                ]
                setAvailableArms(arms)
            }
        } catch (error) {
            console.error("Error fetching class arms:", error)
        }
    }

    const fetchAvailableStudents = async (sessId?: string) => {
        try {
            setLoading(true)
            const targetSess = sessId || form.getValues("sessionId")
            if (!targetSess) return;

            const response = await fetch(
                `/api/classes/${classId}/available-students?sessionId=${targetSess}`
            )

            if (!response.ok) throw new Error('Failed to fetch students')
            const data = await response.json()
            setAvailableStudents(data.data || [])
        } catch (error) {
            console.error('Error fetching students:', error)
            setAvailableStudents([])
        } finally {
            setLoading(false)
        }
    }

    const fetchAcademicSessions = async () => {
        try {
            const response = await fetch('/api/academic-sessions?active=true')
            const data = await response.json()
            setAcademicSessions(Array.isArray(data) ? data : [])
            const current = data.find((s: any) => s.isCurrent)
            if (current) {
                form.setValue("sessionId", current.id)
                fetchAvailableStudents(current.id)
            }
        } catch (error) {
            console.error("Error fetching sessions:", error)
        }
    }

    useEffect(() => {
        if (open) {
            fetchClassArms()
            fetchAcademicSessions()
            form.reset({
                studentId: "",
                targetClassId: classId,
                sessionId: form.getValues("sessionId"),
                forceReassign: false
            })
            setSelectedStudent(null)
            setError(null)
            setConflictInfo(null)
        }
    }, [open, classId])

    useEffect(() => {
        const subscription = form.watch((value, { name }) => {
            if (name === "studentId" && value.studentId) {
                const student = availableStudents.find(s => s.id === value.studentId)
                setSelectedStudent(student || null)
                setError(null)
            }
        })
        return () => subscription.unsubscribe()
    }, [form, availableStudents])

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            setLoading(true)
            setError(null)
            
            const formData = new FormData()
            formData.append("studentId", values.studentId)
            formData.append("sessionId", values.sessionId)
            formData.append("forceReassign", values.forceReassign.toString())

            const response = await fetch(`/api/classes/${values.targetClassId}/add-student`, {
                method: "POST",
                body: formData
            })

            const data = await response.json()

            if (!response.ok) {
                if (data.error === "STUDENT_ALREADY_IN_CLASS") {
                    setConflictInfo(data)
                    setError("This student is already registered in an arm.")
                } else {
                    setError(data.error || "Failed to enroll student")
                }
                return
            }

            toast.success("Student successfully enrolled in the selected arm!")
            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            toast.error("An error occurred during enrollment.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <ResponsiveSheet
            open={open}
            onOpenChange={onOpenChange}
            title="Enroll New Student"
            description="Map a student to a specific academic block and session."
        >
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 relative z-10">
                    {/* Student Selection */}
                    <FormField
                        control={form.control}
                        name="studentId"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-400">Select Prospect Student</FormLabel>
                                <Select disabled={loading} onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white font-bold text-lg">
                                            <SelectValue placeholder="Choose from pool..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="rounded-2xl shadow-2xl border-slate-50">
                                        <ScrollArea className="h-[300px]">
                                            {availableStudents.length === 0 ? (
                                                <div className="p-10 text-center text-slate-400 font-medium italic">No available students found...</div>
                                            ) : (
                                                availableStudents.map((student) => (
                                                    <SelectItem key={student.id} value={student.id} className="rounded-xl py-3 focus:bg-indigo-50">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-8 w-8 rounded-lg">
                                                                <AvatarImage src={student.profileImage || ''} />
                                                                <AvatarFallback className="bg-slate-200 text-xs font-black">{student.name[0]}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-slate-800">{student.name}</span>
                                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{student.email}</span>
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

                    {/* Arm Selection & Session */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="targetClassId"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <Layers className="h-3 w-3" /> Target Arm/Section
                                    </FormLabel>
                                    <Select disabled={loading} onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white font-bold">
                                                <SelectValue placeholder="Assign block" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="rounded-2xl shadow-2xl border-slate-50">
                                            {availableArms.map((arm) => (
                                                <SelectItem key={arm.id} value={arm.id} className="rounded-xl py-3 focus:bg-indigo-50">
                                                    <span className="font-bold">{arm.name} {arm.section}</span>
                                                </SelectItem>
                                            ))}
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
                                <FormItem className="space-y-3">
                                    <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-400">Academic Session</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white font-bold">
                                                <SelectValue placeholder="Period" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="rounded-2xl shadow-2xl border-slate-50">
                                            {academicSessions.map((session) => (
                                                <SelectItem key={session.id} value={session.id} className="rounded-xl py-3 whitespace-nowrap">
                                                    {session.name} {session.isCurrent && "(CURRENT)"}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Conflict Info */}
                    {selectedStudent?.currentClass && (
                        <Alert className="rounded-3xl bg-amber-50 border-amber-100 p-6 animate-in slide-in-from-top-4 duration-300">
                            <Info className="h-5 w-5 text-amber-600" />
                            <AlertTitle className="text-amber-800 font-black font-sora ml-2 uppercase tracking-widest text-[10px]">Movement Warning</AlertTitle>
                            <AlertDescription className="text-amber-700 font-medium ml-2 mt-2">
                                {selectedStudent.name} is currently in <span className="font-black underline">{selectedStudent.currentClass.fullName}</span>. 
                                Enrolling them here will automatically reassign their records.
                            </AlertDescription>
                        </Alert>
                    )}

                    {error && (
                        <Alert className="rounded-3xl bg-red-50 border-red-100 p-6">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            <AlertTitle className="text-red-800 font-black font-sora ml-2 uppercase tracking-widest text-[10px]">Enrollment Blocked</AlertTitle>
                            <AlertDescription className="text-red-700 font-medium ml-2 mt-2">{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1 h-16 rounded-[1.25rem] border-slate-200 font-bold hover:bg-slate-50"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Discard
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || availableStudents.length === 0}
                            className="flex-[2] h-16 rounded-[1.25rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                            {selectedStudent?.currentClass ? "Reassign Student" : "Finalize Enrollment"}
                        </Button>
                    </div>
                </form>
            </Form>
        </ResponsiveSheet>
    )
} 