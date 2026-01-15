'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, School, User, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"

interface Bill {
    id: string
    name: string
    amount: number
    assignments: {
        targetType: "CLASS" | "STUDENT"
        targetId: string
    }[]
}

interface Class {
    id: string
    name: string
    section?: string
}

interface Student {
    id: string
    name: string
    currentClass?: {
        id: string
        name: string
    }
}

interface AssignBillDialogProps {
    isOpen: boolean
    onClose: () => void
    bill: Bill | null
    classes: Class[]
    students: Student[]
}

export function AssignBillDialog({
    isOpen,
    onClose,
    bill,
    classes,
    students,
}: AssignBillDialogProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [date, setDate] = useState<Date>()
    const [selectedClass, setSelectedClass] = useState<string>()
    const [selectedStudent, setSelectedStudent] = useState<string>()
    const [assignmentType, setAssignmentType] = useState<"CLASS" | "STUDENT">("CLASS")

    // Logic to filter out already assigned targets
    const assignedClassIds = bill?.assignments
        .filter(a => a.targetType === "CLASS")
        .map(a => a.targetId) || []
    
    const assignedIndividualStudentIds = bill?.assignments
        .filter(a => a.targetType === "STUDENT")
        .map(a => a.targetId) || []

    const filteredClasses = classes.filter(c => !assignedClassIds.includes(c.id))
    
    // Filter students: 
    // 1. Exclude those already assigned individually
    // 2. Exclude those whose class is already assigned
    const filteredStudents = students.filter(s => 
        !assignedIndividualStudentIds.includes(s.id) && 
        !(s.currentClass && assignedClassIds.includes(s.currentClass.id))
    )

    async function handleAssign() {
        if (!bill || !date || (!selectedClass && !selectedStudent)) {
            toast.error("Please fill in all required fields")
            return
        }

        try {
            setLoading(true)
            const res = await fetch(`/api/bills/${bill.id}/assignments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    targetType: assignmentType,
                    targetId: assignmentType === "CLASS" ? selectedClass : selectedStudent,
                    dueDate: date.toISOString(),
                }),
                credentials: "include",
            })

            if (!res.ok) {
                if (res.status === 401) {
                    toast.error("You are not authorized to assign this bill")
                    router.push("/auth/login")
                    return
                }
                const data = await res.json()
                throw new Error(data.error || "Failed to assign bill")
            }

            toast.success("Bill assigned successfully")
            router.refresh()
            setDate(undefined)
            setSelectedClass(undefined)
            setSelectedStudent(undefined)
            setAssignmentType("CLASS")
            onClose()
        } catch (error) {
            console.error("Error assigning bill:", error)
            toast.error(error instanceof Error ? error.message : "Failed to assign bill")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (isOpen) {
            setDate(undefined)
            setSelectedClass(undefined)
            setSelectedStudent(undefined)
            setAssignmentType("CLASS")
        }
    }, [isOpen])

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="sm:max-w-xl overflow-y-auto">
                <SheetHeader className="space-y-3 pb-6 border-b">
                    <SheetTitle className="text-2xl font-bold">Assign Bill</SheetTitle>
                    <SheetDescription className="text-base">
                        Assign <span className="font-bold text-slate-900">"{bill?.name}"</span> to a class or individual student.
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-8 py-8">
                    <div className="space-y-4">
                        <Label className="text-sm font-bold text-slate-800 uppercase tracking-wider">Select Target Group</Label>
                        <Tabs
                            defaultValue="CLASS"
                            value={assignmentType}
                            onValueChange={(value) => setAssignmentType(value as "CLASS" | "STUDENT")}
                            className="w-full"
                        >
                            <TabsList className="grid w-full grid-cols-2 p-1.5 bg-slate-200/40 rounded-xl h-14 border border-slate-200/50">
                                <TabsTrigger 
                                    value="CLASS" 
                                    className="flex items-center gap-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-md font-bold text-slate-600 transition-all duration-200"
                                >
                                    <div className={cn(
                                        "p-1.5 rounded-md transition-colors",
                                        assignmentType === "CLASS" ? "bg-indigo-50 text-indigo-700" : "bg-transparent text-slate-400"
                                    )}>
                                        <School className="h-4 w-4" />
                                    </div>
                                    <span className="text-sm">Entire Class</span>
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="STUDENT" 
                                    className="flex items-center gap-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-md font-bold text-slate-600 transition-all duration-200"
                                >
                                    <div className={cn(
                                        "p-1.5 rounded-md transition-colors",
                                        assignmentType === "STUDENT" ? "bg-indigo-50 text-indigo-700" : "bg-transparent text-slate-400"
                                    )}>
                                        <User className="h-4 w-4" />
                                    </div>
                                    <span className="text-sm">Single Student</span>
                                </TabsTrigger>
                            </TabsList>

                            <div className="mt-6">
                                <TabsContent value="CLASS" className="space-y-4 m-0">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-500 uppercase">Select Class</Label>
                                        <Select
                                            value={selectedClass}
                                            onValueChange={setSelectedClass}
                                        >
                                            <SelectTrigger className="h-11 bg-slate-50 border-slate-200">
                                                <SelectValue placeholder="Which class is this for?" />
                                            </SelectTrigger>
                                             <SelectContent>
                                                 {filteredClasses.length === 0 ? (
                                                     <div className="p-4 text-center text-sm text-slate-500">All classes already assigned</div>
                                                 ) : (
                                                     filteredClasses.map((cls) => (
                                                         <SelectItem key={cls.id} value={cls.id}>
                                                             {cls.name}
                                                             {cls.section ? ` - ${cls.section}` : ""}
                                                         </SelectItem>
                                                     ))
                                                 )}
                                             </SelectContent>
                                        </Select>
                                        <p className="text-[11px] text-slate-600 font-medium">This bill will be assigned to all students in the selected class.</p>
                                    </div>
                                </TabsContent>

                                <TabsContent value="STUDENT" className="space-y-4 m-0">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-500 uppercase">Select Student</Label>
                                        <Select
                                            value={selectedStudent}
                                            onValueChange={setSelectedStudent}
                                        >
                                            <SelectTrigger className="h-11 bg-slate-50 border-slate-200">
                                                <SelectValue placeholder="Search for a student..." />
                                            </SelectTrigger>
                                             <SelectContent>
                                                 {filteredStudents.length === 0 ? (
                                                     <div className="p-4 text-center text-sm text-slate-500">All eligible students already assigned</div>
                                                 ) : (
                                                     filteredStudents.map((student) => (
                                                         <SelectItem key={student.id} value={student.id}>
                                                             {student.name}
                                                         </SelectItem>
                                                     ))
                                                 )}
                                             </SelectContent>
                                        </Select>
                                    </div>
                                </TabsContent>
                            </div>
                        </Tabs>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-sm font-bold text-slate-800 uppercase tracking-wider">Due Date & Timeline</Label>
                        <div className="p-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                            <DatePicker
                                date={date}
                                setDate={setDate}
                            />
                            <p className="mt-2 text-[11px] text-slate-700 italic font-medium">
                                Parents will receive notifications and will be expected to pay by this date.
                            </p>
                        </div>
                    </div>
                </div>

                <SheetFooter className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t">
                    <div className="flex w-full items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 h-12 font-bold"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAssign}
                            disabled={loading}
                            className="flex-1 h-12 font-bold shadow-lg shadow-primary/20"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Assigning...
                                </>
                            ) : (
                                "Confirm Assignment"
                            )}
                        </Button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
} 
