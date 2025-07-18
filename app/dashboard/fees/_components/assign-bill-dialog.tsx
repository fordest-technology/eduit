'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
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
}

interface Class {
    id: string
    name: string
    section?: string
    students: { id: string }[]
}

interface Student {
    id: string
    user: {
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
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Assign Bill</DialogTitle>
                    <DialogDescription>
                        Assign this bill to a class or individual student
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <Tabs
                        defaultValue="CLASS"
                        value={assignmentType}
                        onValueChange={(value) => setAssignmentType(value as "CLASS" | "STUDENT")}
                    >
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="CLASS" className="flex items-center gap-2">
                                <School className="h-4 w-4" />
                                Class
                            </TabsTrigger>
                            <TabsTrigger value="STUDENT" className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Student
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="CLASS" className="space-y-4">
                            <div className="space-y-2">
                                <Label>Select Class</Label>
                                <Select
                                    value={selectedClass}
                                    onValueChange={setSelectedClass}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classes.map((cls) => (
                                            <SelectItem key={cls.id} value={cls.id}>
                                                {cls.name}
                                                {cls.section ? ` - ${cls.section}` : ""}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </TabsContent>

                        <TabsContent value="STUDENT" className="space-y-4">
                            <div className="space-y-2">
                                <Label>Select Student</Label>
                                <Select
                                    value={selectedStudent}
                                    onValueChange={setSelectedStudent}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a student" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {students.map((student) => (
                                            <SelectItem key={student.id} value={student.id}>
                                                {student.user?.name || "Unknown Student"}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="space-y-2">
                        <Label>Due Date</Label>
                        <DatePicker
                            date={date}
                            setDate={setDate}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAssign}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Assigning...
                            </>
                        ) : (
                            "Assign Bill"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
} 