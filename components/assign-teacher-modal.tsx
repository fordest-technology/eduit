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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const formSchema = z.object({
    teacherId: z.string().min(1, "Please select a teacher"),
})

interface AssignTeacherModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    classId: string
    onSuccess?: () => void
}

export function AssignTeacherModal({
    open,
    onOpenChange,
    classId,
    onSuccess,
}: AssignTeacherModalProps) {
    const [teachers, setTeachers] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [loadingTeachers, setLoadingTeachers] = useState(true)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            teacherId: "",
        },
    })

    useEffect(() => {
        if (open) {
            fetchTeachers()
        }
    }, [open])

    const fetchTeachers = async () => {
        try {
            setLoadingTeachers(true)
            const response = await fetch("/api/teachers")
            if (!response.ok) {
                throw new Error("Failed to fetch teachers")
            }
            const data = await response.json()
            setTeachers(data)
        } catch (error) {
            console.error("Error fetching teachers:", error)
            toast.error("Failed to fetch teachers")
        } finally {
            setLoadingTeachers(false)
        }
    }

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            setLoading(true)
            const response = await fetch(`/api/classes/${classId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    teacherId: values.teacherId,
                }),
            })

            if (!response.ok) {
                throw new Error("Failed to assign teacher")
            }

            toast.success("Teacher assigned successfully")
            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            console.error("Error assigning teacher:", error)
            toast.error("Failed to assign teacher")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Assign Teacher</DialogTitle>
                    <DialogDescription>
                        Assign a teacher to be responsible for this class.
                    </DialogDescription>
                </DialogHeader>

                {loadingTeachers ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="teacherId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Teacher</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value || undefined}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a teacher" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {teachers.map((teacher) => (
                                                    <SelectItem key={teacher.id} value={teacher.id}>
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="h-6 w-6">
                                                                <AvatarImage
                                                                    src={teacher.user?.profileImage || undefined}
                                                                    alt={teacher.user?.name || "Teacher"}
                                                                />
                                                                <AvatarFallback>
                                                                    {teacher.user?.name?.charAt(0) || "T"}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span>{teacher.user?.name}</span>
                                                            {teacher.specialization && (
                                                                <span className="text-xs text-muted-foreground ml-1">
                                                                    ({teacher.specialization})
                                                                </span>
                                                            )}
                                                        </div>
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
                                    Assign Teacher
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    )
} 