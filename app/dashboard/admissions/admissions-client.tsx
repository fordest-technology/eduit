"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Calendar, Users, CheckCircle, Edit, Trash, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { formatDistanceToNow, format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
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
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"

// Define session schema
const sessionSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    startDate: z.date({
        required_error: "Start date is required",
    }),
    endDate: z.date({
        required_error: "End date is required",
    }).refine(
        (date) => date > new Date(),
        "End date must be in the future"
    ),
    isCurrent: z.boolean().default(false),
});

// Session interface
interface Session {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    isCurrent: boolean;
    studentCount: number;
    createdAt: Date;
}

interface AdmissionsClientProps {
    sessions: Session[];
    error?: string;
}

export function AdmissionsClient({ sessions, error }: AdmissionsClientProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // Form for adding/editing sessions
    const form = useForm<z.infer<typeof sessionSchema>>({
        resolver: zodResolver(sessionSchema),
        defaultValues: {
            name: "",
            startDate: new Date(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default to 1 year from now
            isCurrent: false,
        },
    });

    const handleEdit = (session: Session) => {
        setSelectedSession(session);
        form.reset({
            name: session.name,
            startDate: new Date(session.startDate),
            endDate: new Date(session.endDate),
            isCurrent: session.isCurrent,
        });
        setIsEditModalOpen(true);
    };

    const handleDelete = (session: Session) => {
        setSelectedSession(session);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedSession) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/sessions/${selectedSession.id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete academic session");
            }

            toast.success("Academic session deleted successfully");
            router.refresh();
        } catch (error) {
            console.error("Error deleting session:", error);
            toast.error("Failed to delete academic session");
        } finally {
            setIsLoading(false);
            setIsDeleteDialogOpen(false);
        }
    };

    const onSubmit = async (values: z.infer<typeof sessionSchema>) => {
        setIsLoading(true);
        try {
            // Determine if we're adding or editing
            const method = selectedSession ? "PUT" : "POST";
            const url = selectedSession
                ? `/api/sessions/${selectedSession.id}`
                : "/api/sessions";

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to save academic session");
            }

            toast.success(
                selectedSession
                    ? "Academic session updated successfully"
                    : "Academic session created successfully"
            );
            router.refresh();

            // Close the modal and reset form
            setIsAddModalOpen(false);
            setIsEditModalOpen(false);
            form.reset();
        } catch (error) {
            console.error("Error saving session:", error);
            toast.error(error instanceof Error ? error.message : "Failed to save academic session");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle setting a session as current
    const setSessionCurrent = async (sessionId: string, isCurrent: boolean) => {
        try {
            const response = await fetch(`/api/sessions/${sessionId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ isCurrent }),
            });

            if (!response.ok) {
                throw new Error("Failed to update session status");
            }

            toast.success(
                isCurrent
                    ? "Session set as current academic year"
                    : "Session is no longer the current academic year"
            );
            router.refresh();
        } catch (error) {
            console.error("Error updating session status:", error);
            toast.error("Failed to update session status");
        }
    };

    if (error) {
        return (
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Academic Sessions</CardTitle>
                    <CardDescription>Manage academic sessions and student enrollment periods</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                        <p className="text-muted-foreground">{error}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <div className="grid gap-6 mt-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold tracking-tight">Academic Sessions</h2>
                    <Button onClick={() => {
                        form.reset(); // Reset form 
                        setIsAddModalOpen(true);
                    }}>
                        <Plus className="mr-2 h-4 w-4" /> Add Session
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Academic Sessions</CardTitle>
                        <CardDescription>
                            Manage academic sessions, enrollment periods, and set the current academic year
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {sessions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 text-center">
                                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium">No Academic Sessions</h3>
                                <p className="text-muted-foreground">
                                    Create your first academic session to start admitting students.
                                </p>
                                <Button className="mt-4" onClick={() => setIsAddModalOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" /> Create Session
                                </Button>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Period</TableHead>
                                        <TableHead>Students</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sessions.map((session) => (
                                        <TableRow key={session.id}>
                                            <TableCell className="font-medium">{session.name}</TableCell>
                                            <TableCell>
                                                {format(new Date(session.startDate), "MMM d, yyyy")} - {format(new Date(session.endDate), "MMM d, yyyy")}
                                            </TableCell>
                                            <TableCell>{session.studentCount} students</TableCell>
                                            <TableCell>
                                                <div className="flex items-center">
                                                    <Switch
                                                        checked={session.isCurrent}
                                                        onCheckedChange={(checked) => setSessionCurrent(session.id, checked)}
                                                        className="mr-2"
                                                    />
                                                    <span>
                                                        {session.isCurrent ? (
                                                            <Badge variant="default">Current</Badge>
                                                        ) : (
                                                            <Badge variant="outline">Not Current</Badge>
                                                        )}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            Actions
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleEdit(session)}>
                                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(session)}
                                                            className="text-destructive focus:text-destructive"
                                                            disabled={session.studentCount > 0 || session.isCurrent}
                                                        >
                                                            <Trash className="mr-2 h-4 w-4" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                        <p className="text-xs text-muted-foreground">
                            <strong>Note:</strong> The current academic session will be used as the default when adding new students. You cannot delete sessions that have students or are marked as current.
                        </p>
                    </CardFooter>
                </Card>
            </div>

            {/* Add Session Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Add Academic Session</DialogTitle>
                        <DialogDescription>
                            Create a new academic session for student enrollments.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Session Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="2023-2024 Academic Year"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="startDate"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Start Date</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            className={cn(
                                                                "w-full pl-3 text-left font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, "PPP")
                                                            ) : (
                                                                <span>Pick a date</span>
                                                            )}
                                                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <CalendarComponent
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="endDate"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>End Date</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            className={cn(
                                                                "w-full pl-3 text-left font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, "PPP")
                                                            ) : (
                                                                <span>Pick a date</span>
                                                            )}
                                                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <CalendarComponent
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="isCurrent"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">
                                                Current Academic Session
                                            </FormLabel>
                                            <FormDescription>
                                                Mark this as the current active academic session
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <DialogFooter className="pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsAddModalOpen(false)}
                                    type="button"
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>Create Session</>
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Edit Session Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit Academic Session</DialogTitle>
                        <DialogDescription>
                            Update the details of this academic session.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Session Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="2023-2024 Academic Year"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="startDate"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Start Date</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            className={cn(
                                                                "w-full pl-3 text-left font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, "PPP")
                                                            ) : (
                                                                <span>Pick a date</span>
                                                            )}
                                                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <CalendarComponent
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="endDate"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>End Date</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            className={cn(
                                                                "w-full pl-3 text-left font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, "PPP")
                                                            ) : (
                                                                <span>Pick a date</span>
                                                            )}
                                                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <CalendarComponent
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="isCurrent"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">
                                                Current Academic Session
                                            </FormLabel>
                                            <FormDescription>
                                                Mark this as the current active academic session
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <DialogFooter className="pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsEditModalOpen(false)}
                                    type="button"
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        <>Update Session</>
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the academic session "{selectedSession?.name}".
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
} 