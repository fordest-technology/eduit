"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { zodResolver } from "@hookform/resolvers/zod"
import { Calendar, MoreHorizontal, Plus, AlertCircle } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { format, isValid, parseISO } from "date-fns"
import { useRouter } from "next/navigation"
import { DatePicker } from "@/components/ui/date-picker"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ColumnFiltersState } from "@tanstack/react-table"

// Define types for our data
interface School {
    id: string
    name: string
}

interface Session {
    id: string
    name: string
    startDate: string
    endDate: string
    isActive: boolean
    schoolId: string
    school: School
    _count: {
        studentClasses: number
        attendance: number
        results: number
    }
    createdAt: string
    updatedAt: string
}

interface SessionsTableProps {
    initialSessions: Session[]
    schools: School[]
    userRole: string
    userSchoolId: string
}

// Define form schema
const formSchema = z.object({
    name: z.string().min(3, { message: "Name must be at least 3 characters" }),
    schoolId: z.string().min(1, { message: "School is required" }),
    startDate: z.date({ required_error: "Start date is required" }),
    endDate: z.date({ required_error: "End date is required" })
        .refine((date) => date > new Date(), {
            message: "End date must be in the future"
        })
})

// Add this utility function after the formSchema definition
// Safely parse and format a date, handling various formats
function formatDate(dateValue: string | Date | null | undefined): string {
    if (!dateValue) return "N/A";
    
    let date: Date;
    if (typeof dateValue === 'string') {
        // Try to parse the date string
        date = parseISO(dateValue);
    } else {
        date = dateValue;
    }
    
    // Check if the date is valid
    return isValid(date) ? format(date, "MMM d, yyyy") : "N/A";
}

// Define columns
const getColumns = (toggleActive: (id: string) => Promise<void>, userRole: string) => {
    const baseColumns = [
        {
            accessorKey: "name",
            header: "Session Name",
            cell: ({ row }: { row: any }) => (
                <div className="font-medium">{row.getValue("name")}</div>
            )
        },
    ];
    
    // Only show the school column for super_admin
    if (userRole === "super_admin") {
        baseColumns.push({
            accessorKey: "school.name",
            header: "School",
            cell: ({ row }: { row: any }) => (
                <div>{row.original.school.name}</div>
            )
        });
    }
    
    // Add remaining columns
    return [
        ...baseColumns,
        {
            accessorKey: "startDate",
            header: "Start Date",
            cell: ({ row }: { row: any }) => {
                const date = row.getValue("startDate");
                return (
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(date)}
                    </div>
                );
            }
        },
        {
            accessorKey: "endDate",
            header: "End Date",
            cell: ({ row }: { row: any }) => {
                const date = row.getValue("endDate");
                return (
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(date)}
                    </div>
                );
            }
        },
        {
            accessorKey: "isActive",
            header: "Status",
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center">
                    <Badge variant={row.getValue("isActive") ? "default" : "secondary"}>
                        {row.getValue("isActive") ? "Active" : "Inactive"}
                    </Badge>
                </div>
            )
        },
        {
            accessorKey: "_count.studentClasses",
            header: "Classes",
            cell: ({ row }: { row: any }) => (
                <div>{row.original._count.studentClasses}</div>
            )
        },
        {
            id: "actions",
            cell: ({ row }: { row: any }) => {
                const session = row.original

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => toggleActive(session.id)}
                            >
                                {session.isActive ? "Set Inactive" : "Set Active"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Manage Classes</DropdownMenuItem>
                            <DropdownMenuItem>Edit Session</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            }
        }
    ]
}

export function SessionsTable({ initialSessions, schools, userRole, userSchoolId }: SessionsTableProps) {
    // No need to filter initialSessions here as it's already filtered by the API
    const [sessions, setSessions] = useState<Session[]>(initialSessions)
    const [isLoading, setIsLoading] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            schoolId: userRole === "school_admin" ? userSchoolId : "",
            startDate: new Date(),
            endDate: new Date(new Date().setMonth(new Date().getMonth() + 10))
        }
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        setError(null)

        try {
            // For school_admin, always use their schoolId regardless of what was selected
            const submissionValues = {
                ...values,
                schoolId: userRole === "school_admin" ? userSchoolId : values.schoolId
            }

            const response = await fetch("/api/sessions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(submissionValues)
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || "Failed to create session")
            }

            const newSession = await response.json()

            toast.success("Academic session created successfully")
            // Add new session to the list (no need to filter since we ensure correct schoolId)
            setSessions([newSession, ...sessions])
            form.reset()
            setIsDialogOpen(false)
            router.refresh()
        } catch (err: any) {
            console.error(err)
            setError(err.message || "An error occurred while creating the session")
            toast.error("Failed to create session")
        } finally {
            setIsLoading(false)
        }
    }

    async function toggleActive(id: string) {
        setIsLoading(true)

        try {
            const session = sessions.find(s => s.id === id)
            if (!session) return
            
            // Prevent school_admin from modifying sessions from other schools
            if (userRole === "school_admin" && session.schoolId !== userSchoolId) {
                throw new Error("You do not have permission to modify sessions from other schools")
            }

            // Make a simpler update request - just update isActive status
            // Note: In the API, isCurrent is what controls the active state
            const response = await fetch(`/api/sessions/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    // Only send the isCurrent property to avoid validation errors with other fields
                    isCurrent: !session.isActive
                })
            })

            // Debug response for troubleshooting
            console.log(`Status: ${response.status}, Status Text: ${response.statusText}`);
            
            if (!response.ok) {
                let errorMessage = `Failed to update session (Status: ${response.status})`;
                try {
                    const errorData = await response.json();
                    console.error("Error response data:", errorData);
                    errorMessage = errorData.error || errorData.message || errorMessage;
                } catch (e) {
                    console.error("Failed to parse error response:", e);
                }
                throw new Error(errorMessage);
            }

            // Get updated session from response
            const updatedSession = await response.json();
            console.log("Updated session:", updatedSession);
            
            // The server may return isActive or isCurrent - use updatedSession if available
            // Otherwise fall back to inverting the current state
            const isNowActive = 
                typeof updatedSession.isActive !== 'undefined' ? updatedSession.isActive : 
                typeof updatedSession.isCurrent !== 'undefined' ? updatedSession.isCurrent : 
                !session.isActive;

            // Update local state with the response
            setSessions(sessions.map(s =>
                s.id === id ? { ...s, isActive: isNowActive } : s
            ))

            toast.success(`Session ${isNowActive ? "activated" : "deactivated"} successfully`)
            router.refresh()
        } catch (err: any) {
            console.error("Toggle active error:", err);
            toast.error(`Failed to update session status: ${err.message}`);
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-4 p-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold">Academic Sessions</h2>
                    <p className="text-sm text-muted-foreground">
                        Manage your academic sessions and terms
                    </p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Session
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Academic Session</DialogTitle>
                            <DialogDescription>
                                Add a new academic session or term to your school calendar.
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
                                            <FormLabel>Session Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. 2023/2024 Academic Year" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {userRole === "super_admin" && (
                                    <FormField
                                        control={form.control}
                                        name="schoolId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>School</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a school" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {schools.map(school => (
                                                            <SelectItem key={school.id} value={school.id}>
                                                                {school.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="startDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Start Date</FormLabel>
                                                <FormControl>
                                                    <DatePicker
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        placeholder="Select start date"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="endDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>End Date</FormLabel>
                                                <FormControl>
                                                    <DatePicker
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        placeholder="Select end date"
                                                        minDate={form.getValues().startDate || new Date()}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <DialogFooter>
                                    <Button type="submit" disabled={isLoading}>
                                        {isLoading ? "Creating..." : "Create Session"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            {sessions.length > 0 ? (
                <DataTable
                    columns={getColumns(toggleActive, userRole)}
                    data={sessions}
                    searchKey="name"
                    searchPlaceholder="Search sessions..."
                />
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>No Sessions Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>No academic sessions have been created yet. Click the "Add Session" button to create your first session.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
} 