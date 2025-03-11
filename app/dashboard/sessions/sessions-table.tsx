"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { format } from "date-fns"
import { CalendarIcon, Loader2, PlusIcon } from "lucide-react"

interface School {
    id: string
    name: string
}

interface Session {
    id: string
    name: string
    startDate: string
    endDate: string
    isCurrent: boolean
    school: {
        id: string
        name: string
    }
    _count: {
        studentClasses: number
        attendance: number
        results: number
    }
}

interface SessionsTableProps {
    initialSessions: Session[]
    schools: School[]
    userRole: string
    userSchoolId: string
}

export function SessionsTable({ initialSessions, schools, userRole, userSchoolId }: SessionsTableProps) {
    const router = useRouter()
    const [sessions, setSessions] = useState(initialSessions)
    const [isCreating, setIsCreating] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [updatingSessionId, setUpdatingSessionId] = useState<string | null>(null)

    const [newSession, setNewSession] = useState({
        name: "",
        startDate: "",
        endDate: "",
        schoolId: userRole === "super_admin" ? "" : userSchoolId,
    })

    async function handleCreateSession() {
        if (!newSession.name || !newSession.startDate || !newSession.endDate || !newSession.schoolId) {
            toast.error("Please fill in all fields")
            return
        }

        setIsLoading(true)

        try {
            const response = await fetch("/api/sessions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(newSession),
            })

            if (!response.ok) {
                throw new Error("Failed to create session")
            }

            const createdSession = await response.json()
            setSessions([createdSession, ...sessions])
            setIsCreating(false)
            setNewSession({
                name: "",
                startDate: "",
                endDate: "",
                schoolId: userRole === "super_admin" ? "" : userSchoolId,
            })
            toast.success("Session created successfully")
            router.refresh()
        } catch (error) {
            toast.error("Failed to create session")
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    async function handleToggleSessionStatus(sessionId: string, currentStatus: boolean) {
        setUpdatingSessionId(sessionId)
        try {
            const response = await fetch(`/api/sessions/${sessionId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    isCurrent: !currentStatus,
                }),
            })

            if (!response.ok) {
                throw new Error("Failed to update session status")
            }

            // Update sessions list with new status
            setSessions(sessions.map(session =>
                session.id === sessionId
                    ? { ...session, isCurrent: !currentStatus }
                    : session.isCurrent && !currentStatus
                        ? { ...session, isCurrent: false }
                        : session
            ))
            toast.success("Session status updated successfully")
            router.refresh()
        } catch (error) {
            console.error(error)
            toast.error("Failed to update session status")
        } finally {
            setUpdatingSessionId(null)
        }
    }

    return (
        <div className="w-full">
            <div className="flex items-center justify-between p-4 border-b">
                <div className="space-y-1">
                    <h2 className="text-2xl font-semibold tracking-tight">Sessions</h2>
                    <p className="text-sm text-muted-foreground">
                        Create and manage academic sessions
                    </p>
                </div>
                <Dialog open={isCreating} onOpenChange={setIsCreating}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusIcon className="w-4 h-4 mr-2" />
                            New Session
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Session</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Session Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g., 2023/2024 Academic Year"
                                    value={newSession.name}
                                    onChange={(e) => setNewSession({ ...newSession, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={newSession.startDate}
                                    onChange={(e) => setNewSession({ ...newSession, startDate: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">End Date</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={newSession.endDate}
                                    onChange={(e) => setNewSession({ ...newSession, endDate: e.target.value })}
                                />
                            </div>
                            {userRole === "super_admin" && (
                                <div className="space-y-2">
                                    <Label htmlFor="school">School</Label>
                                    <Select
                                        value={newSession.schoolId}
                                        onValueChange={(value) => setNewSession({ ...newSession, schoolId: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a school" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {schools.map((school) => (
                                                <SelectItem key={school.id} value={school.id}>
                                                    {school.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <Button
                                className="w-full"
                                onClick={handleCreateSession}
                                disabled={isLoading}
                            >
                                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Create Session
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>School</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Classes</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sessions.map((session) => (
                        <TableRow key={session.id}>
                            <TableCell className="font-medium">{session.name}</TableCell>
                            <TableCell>{session.school.name}</TableCell>
                            <TableCell>{format(new Date(session.startDate), "MMM d, yyyy")}</TableCell>
                            <TableCell>{format(new Date(session.endDate), "MMM d, yyyy")}</TableCell>
                            <TableCell>
                                {session.isCurrent ? (
                                    <Badge>Current</Badge>
                                ) : (
                                    <Badge variant="secondary">Inactive</Badge>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                {session._count.studentClasses}
                            </TableCell>
                            <TableCell>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleToggleSessionStatus(session.id, session.isCurrent)}
                                    disabled={updatingSessionId === session.id}
                                >
                                    {updatingSessionId === session.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : session.isCurrent ? (
                                        "Make Inactive"
                                    ) : (
                                        "Make Active"
                                    )}
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
} 