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
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    section: z.string().optional(),
    teacherId: z.string().optional(),
    levelId: z.string().optional(),
})

interface Teacher {
    id: string;
    name: string;
    email: string;
    profileImage: string | null;
    department: {
        id: string;
        name: string;
    } | null;
    specialization: string | null;
    qualifications: string | null;
}

interface EditClassModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    classData: any;
    onSuccess?: () => void;
}

export function EditClassModal({
    open,
    onOpenChange,
    classData,
    onSuccess,
}: EditClassModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([]);
    const [levels, setLevels] = useState<any[]>([]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: classData?.name || "",
            section: classData?.section || "",
            teacherId: classData?.teacherId || "none",
            levelId: classData?.levelId || "none",
        },
    });

    useEffect(() => {
        if (open) {
            fetchTeachers();
            fetchLevels();
        }
    }, [open]);

    const fetchTeachers = async () => {
        try {
            const response = await fetch("/api/teachers/available");
            if (!response.ok) {
                throw new Error("Failed to fetch teachers");
            }
            const data = await response.json();
            setAvailableTeachers(data.data || []);
        } catch (error) {
            console.error("Error fetching teachers:", error);
            toast.error("Failed to fetch available teachers");
        }
    };

    const fetchLevels = async () => {
        try {
            const response = await fetch("/api/school-levels");
            if (!response.ok) {
                throw new Error("Failed to fetch levels");
            }
            const data = await response.json();
            setLevels(data || []);
        } catch (error) {
            console.error("Error fetching levels:", error);
            toast.error("Failed to fetch school levels");
        }
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            setLoading(true);
            setError(null);

            // Convert "none" values to null
            const submitData = {
                ...values,
                teacherId: values.teacherId === "none" ? null : values.teacherId,
                levelId: values.levelId === "none" ? null : values.levelId,
            };

            const response = await fetch(`/api/classes/${classData.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(submitData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to update class");
            }

            toast.success("Class updated successfully");
            onSuccess?.();
            onOpenChange(false);
        } catch (error) {
            console.error("Error updating class:", error);
            setError(error instanceof Error ? error.message : "Failed to update class");
            toast.error(error instanceof Error ? error.message : "Failed to update class");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Class</DialogTitle>
                    <DialogDescription>
                        Make changes to the class details.
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter class name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="section"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Section (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter section" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="teacherId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Teacher (Optional)</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value || "none"}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a teacher" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <ScrollArea className="h-[200px]">
                                                <SelectItem value="none">No teacher assigned</SelectItem>
                                                {availableTeachers.map((teacher) => (
                                                    <SelectItem key={teacher.id} value={teacher.id}>
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="h-6 w-6">
                                                                <AvatarImage
                                                                    src={teacher.profileImage || ''}
                                                                    alt={teacher.name}
                                                                />
                                                                <AvatarFallback>
                                                                    {teacher.name?.charAt(0) || 'T'}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{teacher.name}</span>
                                                                {teacher.department && (
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {teacher.department.name}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </ScrollArea>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="levelId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Level (Optional)</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value || "none"}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a level" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">No level assigned</SelectItem>
                                            {levels.map((level) => (
                                                <SelectItem key={level.id} value={level.id}>
                                                    {level.name}
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
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
} 