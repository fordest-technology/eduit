"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardHeader } from "@/app/components/dashboard-header";
import { AttendanceMarking } from "./_components/AttendanceMarking";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Student {
    id: string;
    userId: string;
    name: string;
    email: string;
    profileImage: string | null;
    rollNumber: string | null;
    attendance: {
        status: string;
        remarks: string | null;
    } | null;
}

interface AttendanceData {
    students: Student[];
    date: string;
    classId: string;
}

export default function AttendancePage() {
    const searchParams = useSearchParams();
    const preselectedClassId = searchParams.get("classId");

    const [classes, setClasses] = useState<Array<{ id: string; name: string; section: string | null }>>([]);
    const [selectedClass, setSelectedClass] = useState(preselectedClassId || "");
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loadingClasses, setLoadingClasses] = useState(true);

    // Fetch teacher's classes
    useEffect(() => {
        async function fetchClasses() {
            try {
                setLoadingClasses(true);
                const response = await fetch("/api/classes");

                if (!response.ok) {
                    throw new Error("Failed to fetch classes");
                }

                const data = await response.json();
                setClasses(data);

                // Auto-select first class if no preselected class
                if (!preselectedClassId && data.length > 0) {
                    setSelectedClass(data[0].id);
                }
            } catch (error) {
                console.error("Error fetching classes:", error);
                toast.error("Failed to load classes");
            } finally {
                setLoadingClasses(false);
            }
        }

        fetchClasses();
    }, [preselectedClassId]);

    // Fetch attendance data when class or date changes
    useEffect(() => {
        async function fetchAttendance() {
            if (!selectedClass) return;

            try {
                setLoading(true);
                const dateStr = format(selectedDate, "yyyy-MM-dd");
                const response = await fetch(
                    `/api/attendance/mark?classId=${selectedClass}&date=${dateStr}`
                );

                if (!response.ok) {
                    throw new Error("Failed to fetch attendance");
                }

                const data = await response.json();
                setAttendanceData(data);
            } catch (error) {
                console.error("Error fetching attendance:", error);
                toast.error("Failed to load attendance data");
            } finally {
                setLoading(false);
            }
        }

        fetchAttendance();
    }, [selectedClass, selectedDate]);

    const handleSaveAttendance = async (
        attendance: Array<{ studentId: string; status: string; remarks?: string }>
    ) => {
        try {
            setSaving(true);
            const dateStr = format(selectedDate, "yyyy-MM-dd");

            const response = await fetch("/api/attendance/mark", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    classId: selectedClass,
                    date: dateStr,
                    attendance,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to save attendance");
            }

            toast.success("Attendance saved successfully!");

            // Refresh attendance data
            const refreshResponse = await fetch(
                `/api/attendance/mark?classId=${selectedClass}&date=${dateStr}`
            );
            if (refreshResponse.ok) {
                const data = await refreshResponse.json();
                setAttendanceData(data);
            }
        } catch (error) {
            console.error("Error saving attendance:", error);
            toast.error(error instanceof Error ? error.message : "Failed to save attendance");
        } finally {
            setSaving(false);
        }
    };

    const selectedClassName = classes.find((c) => c.id === selectedClass);

    return (
        <div className="space-y-6">
            <DashboardHeader
                heading="Mark Attendance"
                text="Record daily attendance for your classes"
                showBanner={true}
                icon={<Calendar className="h-8 w-8 text-white" />}
            />

            {/* Class and Date Selection */}
            <Card className="border-none shadow-lg">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Class Selector */}
                        <div className="flex-1">
                            <label className="text-sm font-medium text-slate-600 mb-2 block">
                                Select Class
                            </label>
                            {loadingClasses ? (
                                <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
                            ) : (
                                <Select value={selectedClass} onValueChange={setSelectedClass}>
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="Choose a class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classes.map((cls) => (
                                            <SelectItem key={cls.id} value={cls.id}>
                                                {cls.name} {cls.section && `(${cls.section})`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {/* Date Picker */}
                        <div className="flex-1">
                            <label className="text-sm font-medium text-slate-600 mb-2 block">
                                Select Date
                            </label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal rounded-xl",
                                            !selectedDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <CalendarComponent
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={(date) => date && setSelectedDate(date)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {selectedClassName && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                            <p className="text-sm text-blue-900">
                                <span className="font-semibold">Marking attendance for:</span>{" "}
                                {selectedClassName.name} {selectedClassName.section && `(${selectedClassName.section})`} on{" "}
                                {format(selectedDate, "MMMM d, yyyy")}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Attendance Marking */}
            {loading ? (
                <Card className="border-none shadow-lg">
                    <CardContent className="p-12">
                        <div className="text-center">
                            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                            <p className="text-slate-500">Loading attendance data...</p>
                        </div>
                    </CardContent>
                </Card>
            ) : !selectedClass ? (
                <Card className="border-none shadow-lg">
                    <CardContent className="p-12">
                        <div className="text-center">
                            <Calendar className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-700 mb-2">Select a Class</h3>
                            <p className="text-slate-500">
                                Please select a class to mark attendance
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ) : attendanceData && attendanceData.students.length > 0 ? (
                <AttendanceMarking
                    students={attendanceData.students}
                    onSave={handleSaveAttendance}
                    saving={saving}
                />
            ) : (
                <Card className="border-none shadow-lg">
                    <CardContent className="p-12">
                        <div className="text-center">
                            <p className="text-slate-500">No students found in this class</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}