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
import { Loader2 } from "lucide-react"

const formSchema = z.object({
    studentId: z.string().min(1, "Please select a student"),
})

interface LinkStudentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    parentId: string
    onSuccess?: () => void
}

export function LinkStudentDialog({
    open,
    onOpenChange,
    parentId,
    onSuccess,
}: LinkStudentDialogProps) {
    const [students, setStudents] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            studentId: "",
        },
    })

    useEffect(() => {
        if (open) {
            fetchStudents()
        }
    }, [open])

    const fetchStudents = async () => {
        try {
            const response = await fetch("/api/students")
            if (!response.ok) {
                throw new Error("Failed to fetch students")
            }
            const data = await response.json()
            setStudents(data)
        } catch (error) {
            console.error("Error fetching students:", error)
            toast.error("Failed to fetch students")
        }
    }

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            setLoading(true)
            const response = await fetch(`/api/parents/${parentId}/students`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    studentId: values.studentId,
                }),
            })

            if (!response.ok) {
                throw new Error("Failed to link student")
            }

            toast.success("Student linked successfully")
            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            console.error("Error linking student:", error)
            toast.error("Failed to link student")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Link Student</DialogTitle>
                    <DialogDescription>
                        Select a student to link with this parent.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="studentId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Student</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a student" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {students.map((student) => (
                                                <SelectItem key={student.id} value={student.id}>
                                                    {student.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Link Student
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
} 