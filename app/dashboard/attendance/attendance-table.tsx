"use client"

import { useState, useEffect } from "react"
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

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { format } from "date-fns"
import { Calendar, Loader2, PlusIcon } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Class {
    id: string
    name: string
    section?: string | null
    teacher?: {
        id: string
        name: string
    }
    _count: {
        students: number
    }
}

interface Session {
    id: string
    name: string
}

interface AttendanceTableProps {
    userRole: string
    userId: string
    schoolId: string
    currentSession: Session
    classes: Class[]
}

export function AttendanceTable({
    userRole,
    userId,
    schoolId,
    currentSession,
    classes,
}: AttendanceTableProps) {
    const router = useRouter()
    const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"))
    const [selectedClass, setSelectedClass] = useState<string>("")
    const [isLoading, setIsLoading] = useState(false)
    const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])
    const [students, setStudents] = useState<any[]>([])

    // Fetch students and attendance data when component mounts or dependencies change
    useEffect(() => {
        if (selectedClass) {
            fetchStudents(selectedClass)
            fetchAttendance()
        }
    }, [selectedClass, selectedDate])

    // Fetch students for selected class
    async function fetchStudents(classId: string) {
        setIsLoading(true)
        try {
            const response = await fetch(
                `/api/student-classes?classId=${classId}&sessionId=${currentSession.id}`
            )
            if (!response.ok) throw new Error("Failed to fetch students")
            const data = await response.json()
            setStudents(data)

            // Pre-fetch attendance for these students
            fetchAttendance()
        } catch (error) {
            console.error("Error fetching students:", error)
            toast.error("Failed to fetch students")
        } finally {
            setIsLoading(false)
        }
    }

    // Fetch attendance records with improved error handling
    async function fetchAttendance() {
        if (!selectedClass || !selectedDate) return

        setIsLoading(true)
        try {
            const response = await fetch(
                `/api/attendance?classId=${selectedClass}&date=${selectedDate}&sessionId=${currentSession.id}`
            )
            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Failed to fetch attendance")
            }
            const data = await response.json()
            setAttendanceRecords(data)
        } catch (error) {
            console.error("Error fetching attendance:", error)
            toast.error(error instanceof Error ? error.message : "Failed to fetch attendance")
        } finally {
            setIsLoading(false)
        }
    }

    // Record attendance for multiple students with improved error handling
    async function handleRecordAttendance(records: any[]) {
        setIsLoading(true)
        try {
            const response = await fetch("/api/attendance", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    records: records.map((record) => ({
                        studentId: record.studentId,
                        date: selectedDate,
                        status: record.status,
                        sessionId: currentSession.id,
                        remarks: record.remarks || "",
                    })),
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Failed to record attendance")
            }

            toast.success("Attendance recorded successfully")
            await fetchAttendance()
        } catch (error) {
            console.error("Error recording attendance:", error)
            toast.error(error instanceof Error ? error.message : "Failed to record attendance")
        } finally {
            setIsLoading(false)
        }
    }

    // Update single attendance record with improved error handling
    async function handleUpdateAttendance(attendanceId: string, status: string, remarks?: string) {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/attendance/${attendanceId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    status,
                    remarks: remarks || "",
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Failed to update attendance")
            }

            toast.success("Attendance updated successfully")
            await fetchAttendance()
        } catch (error) {
            console.error("Error updating attendance:", error)
            toast.error(error instanceof Error ? error.message : "Failed to update attendance")
        } finally {
            setIsLoading(false)
        }
    }

    // Handle class selection with immediate data fetch
    async function handleClassChange(classId: string) {
        setSelectedClass(classId)
        if (classId) {
            await fetchStudents(classId)
        }
    }

    // Handle date selection with immediate data fetch
    function handleDateChange(date: string) {
        setSelectedDate(date)
        if (selectedClass) {
            fetchAttendance()
        }
    }

    if (userRole === "student") {
        return (
            <div>
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-48">
                        <Label>Date</Label>
                        <Input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => handleDateChange(e.target.value)}
                        />
                    </div>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Remarks</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {attendanceRecords.map((record) => (
                            <TableRow key={record.id}>
                                <TableCell>{format(new Date(record.date), "PPP")}</TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            record.status === "PRESENT"
                                                ? "default"
                                                : record.status === "LATE"
                                                    ? "secondary"
                                                    : record.status === "EXCUSED"
                                                        ? "outline"
                                                        : "destructive"
                                        }
                                    >
                                        {record.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{record.remarks || "-"}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        )
    }

    return (
        <div>
            <div className="flex items-center gap-4 mb-4">
                <div className="w-64">
                    <Label>Class</Label>
                    <Select value={selectedClass} onValueChange={handleClassChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a class" />
                        </SelectTrigger>
                        <SelectContent>
                            {classes.map((cls) => (
                                <SelectItem key={cls.id} value={cls.id}>
                                    {cls.name} {cls.section && `(${cls.section})`}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="w-48">
                    <Label>Date</Label>
                    <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                    />
                </div>
            </div>

            {selectedClass && (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Remarks</TableHead>
                            {(userRole === "super_admin" ||
                                userRole === "school_admin" ||
                                userRole === "teacher") && <TableHead>Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.map((student) => {
                            const attendance = attendanceRecords.find(
                                (record) => record.studentId === student.student.id
                            )
                            return (
                                <TableRow key={student.student.id}>
                                    <TableCell>{student.student.name}</TableCell>
                                    <TableCell>
                                        {attendance ? (
                                            <Badge
                                                variant={
                                                    attendance.status === "PRESENT"
                                                        ? "default"
                                                        : attendance.status === "LATE"
                                                            ? "secondary"
                                                            : attendance.status === "EXCUSED"
                                                                ? "outline"
                                                                : "destructive"
                                                }
                                            >
                                                {attendance.status}
                                            </Badge>
                                        ) : (
                                            "-"
                                        )}
                                    </TableCell>
                                    <TableCell>{attendance?.remarks || "-"}</TableCell>
                                    {(userRole === "super_admin" ||
                                        userRole === "school_admin" ||
                                        userRole === "teacher") && (
                                            <TableCell>
                                                <Select
                                                    value={attendance?.status || ""}
                                                    onValueChange={(value) =>
                                                        attendance
                                                            ? handleUpdateAttendance(attendance.id, value)
                                                            : handleRecordAttendance([
                                                                {
                                                                    studentId: student.student.id,
                                                                    status: value,
                                                                },
                                                            ])
                                                    }
                                                    disabled={isLoading}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Mark attendance" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="PRESENT">Present</SelectItem>
                                                        <SelectItem value="ABSENT">Absent</SelectItem>
                                                        <SelectItem value="LATE">Late</SelectItem>
                                                        <SelectItem value="EXCUSED">Excused</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                        )}
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            )}
        </div>
    )
} 