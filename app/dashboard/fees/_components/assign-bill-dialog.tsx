'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, School, User } from "lucide-react"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command"

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
            })

            if (!res.ok) {
                throw new Error("Failed to assign bill")
            }

            toast.success("Bill assigned successfully")
            router.refresh()
            onClose()
        } catch (error) {
            console.error("Error assigning bill:", error)
            toast.error("Failed to assign bill")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Assign Bill</DialogTitle>
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
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !selectedClass && "text-muted-foreground"
                                        )}
                                    >
                                        {selectedClass
                                            ? classes.find((c) => c.id === selectedClass)?.name
                                            : "Select class"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="p-0">
                                    <Command>
                                        <CommandInput placeholder="Search classes..." />
                                        <CommandEmpty>No class found.</CommandEmpty>
                                        <CommandGroup>
                                            {classes.map((classItem) => (
                                                <CommandItem
                                                    key={classItem.id}
                                                    value={classItem.id}
                                                    onSelect={() => setSelectedClass(classItem.id)}
                                                >
                                                    {classItem.name}
                                                    {classItem.section && ` - ${classItem.section}`}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </TabsContent>

                        <TabsContent value="STUDENT" className="space-y-4">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !selectedStudent && "text-muted-foreground"
                                        )}
                                    >
                                        {selectedStudent
                                            ? students.find((s) => s.id === selectedStudent)?.user.name
                                            : "Select student"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="p-0">
                                    <Command>
                                        <CommandInput placeholder="Search students..." />
                                        <CommandEmpty>No student found.</CommandEmpty>
                                        <CommandGroup>
                                            {students.map((student) => (
                                                <CommandItem
                                                    key={student.id}
                                                    value={student.id}
                                                    onSelect={() => setSelectedStudent(student.id)}
                                                >
                                                    {student.user.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </TabsContent>
                    </Tabs>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP") : "Pick a due date"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>

                    <Button
                        onClick={handleAssign}
                        disabled={loading || !date || (!selectedClass && !selectedStudent)}
                    >
                        {loading ? "Assigning..." : "Assign Bill"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
} 