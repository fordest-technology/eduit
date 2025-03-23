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
import { Input } from "@/components/ui/input"

const formSchema = z.object({
    classId: z.string().min(1, "Please select a class"),
    sessionId: z.string().min(1, "Please select an academic session"),
    rollNumber: z.string().optional(),
})

interface AddStudentToClassDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    studentId: string
    onSuccess?: () => void
}

export function AddStudentToClassDialog({
    open,
    onOpenChange,
    studentId,
    onSuccess,
}: AddStudentToClassDialogProps) {
    const [classes, setClasses] = useState<any[]>([])
    const [sessions, setSessions] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [fetchingData, setFetchingData] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            classId: "",
            sessionId: "",
            rollNumber: "",
        },
    })

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            console.log("Dialog opened, fetching data and resetting form");
            form.reset({
                classId: "",
                sessionId: "",
                rollNumber: "",
            });
            fetchData();
        }
    }, [open, form]);

    const fetchData = async () => {
        console.log("Fetching class and session data");
        setFetchingData(true);
        try {
            await Promise.all([fetchClasses(), fetchSessions()]);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load required data. Please try again.");
        } finally {
            setFetchingData(false);
        }
    };

    const fetchClasses = async () => {
        try {
            console.log("Fetching classes");
            const response = await fetch("/api/classes");
            if (!response.ok) {
                throw new Error(`Failed to fetch classes: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            console.log("Fetched classes:", data);
            setClasses(data);
            return data;
        } catch (error) {
            console.error("Error fetching classes:", error);
            toast.error("Failed to fetch classes");
            throw error;
        }
    };

    const fetchSessions = async () => {
        try {
            console.log("Fetching academic sessions");
            const response = await fetch("/api/academic-sessions?isCurrent=true");
            if (!response.ok) {
                throw new Error(`Failed to fetch sessions: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            console.log("Fetched sessions:", data);

            // If data is an object with academicSessions property, extract it
            const sessionsArray = Array.isArray(data) ? data :
                data.academicSessions || [];

            setSessions(sessionsArray);

            // If there's a current session, set it as default
            const currentSession = sessionsArray.find((s: any) => s.isCurrent);
            if (currentSession) {
                console.log("Setting default session:", currentSession.id);
                form.setValue("sessionId", currentSession.id);
            }

            return sessionsArray;
        } catch (error) {
            console.error("Error fetching sessions:", error);
            toast.error("Failed to fetch academic sessions");
            throw error;
        }
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        console.log("Submitting form with values:", values);
        try {
            setLoading(true);
            const response = await fetch(`/api/students/${studentId}/class`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    classId: values.classId,
                    sessionId: values.sessionId,
                    rollNumber: values.rollNumber || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to add student to class");
            }

            console.log("Student added to class successfully:", data);
            toast.success("Student added to class successfully");
            onSuccess?.();
            onOpenChange(false);
        } catch (error) {
            console.error("Error adding student to class:", error);
            toast.error(error instanceof Error ? error.message : "Failed to add student to class");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(newState) => {
            console.log("Dialog state changing to:", newState);
            onOpenChange(newState);
        }}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add Student to Class</DialogTitle>
                    <DialogDescription>
                        Select a class and academic session to add this student to.
                    </DialogDescription>
                </DialogHeader>

                {fetchingData ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="sessionId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Academic Session</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select an academic session" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {sessions.length === 0 ? (
                                                    <SelectItem value="loading" disabled>
                                                        No sessions available
                                                    </SelectItem>
                                                ) : (
                                                    sessions.map((session) => (
                                                        <SelectItem key={session.id} value={session.id}>
                                                            {session.name} {session.isCurrent && "(Current)"}
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="classId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Class</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a class" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {classes.length === 0 ? (
                                                    <SelectItem value="loading" disabled>
                                                        No classes available
                                                    </SelectItem>
                                                ) : (
                                                    classes.map((cls) => (
                                                        <SelectItem key={cls.id} value={cls.id}>
                                                            {cls.name} {cls.section ? `- ${cls.section}` : ""}
                                                        </SelectItem>
                                                    ))
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
                                <Button type="submit" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Add to Class
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
} 