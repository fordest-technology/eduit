"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Clock, Heart, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
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

interface AttendanceMarkingProps {
    students: Student[];
    onSave: (attendance: Array<{ studentId: string; status: string; remarks?: string }>) => Promise<void>;
    saving?: boolean;
}

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export function AttendanceMarking({ students, onSave, saving }: AttendanceMarkingProps) {
    const [attendance, setAttendance] = useState<
        Map<string, { status: AttendanceStatus; remarks: string }>
    >(() => {
        const map = new Map();
        students.forEach((student) => {
            if (student.attendance) {
                map.set(student.id, {
                    status: student.attendance.status as AttendanceStatus,
                    remarks: student.attendance.remarks || "",
                });
            }
        });
        return map;
    });

    const [expandedRemarks, setExpandedRemarks] = useState<Set<string>>(new Set());

    const setStudentStatus = (studentId: string, status: AttendanceStatus) => {
        const current = attendance.get(studentId) || { status: "PRESENT", remarks: "" };
        setAttendance(new Map(attendance.set(studentId, { ...current, status })));
    };

    const setStudentRemarks = (studentId: string, remarks: string) => {
        const current = attendance.get(studentId) || { status: "PRESENT", remarks: "" };
        setAttendance(new Map(attendance.set(studentId, { ...current, remarks })));
    };

    const toggleRemarks = (studentId: string) => {
        const newExpanded = new Set(expandedRemarks);
        if (newExpanded.has(studentId)) {
            newExpanded.delete(studentId);
        } else {
            newExpanded.add(studentId);
        }
        setExpandedRemarks(newExpanded);
    };

    const markAll = (status: AttendanceStatus) => {
        const newAttendance = new Map(attendance);
        students.forEach((student) => {
            const current = newAttendance.get(student.id) || { status: "PRESENT", remarks: "" };
            newAttendance.set(student.id, { ...current, status });
        });
        setAttendance(newAttendance);
    };

    const handleSave = async () => {
        const attendanceData = students.map((student) => {
            const record = attendance.get(student.id) || { status: "PRESENT" as AttendanceStatus, remarks: "" };
            return {
                studentId: student.id,
                status: record.status,
                remarks: record.remarks || undefined,
            };
        });

        await onSave(attendanceData);
    };

    const stats = {
        present: Array.from(attendance.values()).filter((a) => a.status === "PRESENT").length,
        absent: Array.from(attendance.values()).filter((a) => a.status === "ABSENT").length,
        late: Array.from(attendance.values()).filter((a) => a.status === "LATE").length,
        excused: Array.from(attendance.values()).filter((a) => a.status === "EXCUSED").length,
        notMarked: students.length - attendance.size,
    };

    return (
        <div className="space-y-4">
            {/* Quick Actions */}
            <Card className="border-none shadow-lg">
                <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-medium text-slate-600">Quick Actions:</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAll("PRESENT")}
                            className="rounded-xl"
                        >
                            <Check className="h-4 w-4 mr-2 text-green-600" />
                            Mark All Present
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAll("ABSENT")}
                            className="rounded-xl"
                        >
                            <X className="h-4 w-4 mr-2 text-red-600" />
                            Mark All Absent
                        </Button>
                        <div className="ml-auto flex items-center gap-4 text-sm">
                            <Badge variant="secondary" className="rounded-lg">
                                <Check className="h-3 w-3 mr-1 text-green-600" />
                                {stats.present} Present
                            </Badge>
                            <Badge variant="secondary" className="rounded-lg">
                                <X className="h-3 w-3 mr-1 text-red-600" />
                                {stats.absent} Absent
                            </Badge>
                            <Badge variant="secondary" className="rounded-lg">
                                <Clock className="h-3 w-3 mr-1 text-orange-600" />
                                {stats.late} Late
                            </Badge>
                            {stats.notMarked > 0 && (
                                <Badge variant="destructive" className="rounded-lg">
                                    {stats.notMarked} Not Marked
                                </Badge>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Students List */}
            <Card className="border-none shadow-xl">
                <CardHeader>
                    <CardTitle>Students ({students.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {students.map((student, index) => {
                            const record = attendance.get(student.id);
                            const isExpanded = expandedRemarks.has(student.id);

                            return (
                                <motion.div
                                    key={student.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.02 }}
                                >
                                    <Card className="border border-slate-100">
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-4">
                                                {/* Student Info */}
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage src={student.profileImage || undefined} />
                                                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                                            {student.name.split(" ").map((n) => n[0]).join("")}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold truncate">{student.name}</p>
                                                        <p className="text-xs text-slate-500 truncate">{student.email}</p>
                                                    </div>
                                                    {student.rollNumber && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {student.rollNumber}
                                                        </Badge>
                                                    )}
                                                </div>

                                                {/* Status Buttons */}
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant={record?.status === "PRESENT" ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => setStudentStatus(student.id, "PRESENT")}
                                                        className={cn(
                                                            "rounded-xl",
                                                            record?.status === "PRESENT" && "bg-green-600 hover:bg-green-700"
                                                        )}
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant={record?.status === "ABSENT" ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => setStudentStatus(student.id, "ABSENT")}
                                                        className={cn(
                                                            "rounded-xl",
                                                            record?.status === "ABSENT" && "bg-red-600 hover:bg-red-700"
                                                        )}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant={record?.status === "LATE" ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => setStudentStatus(student.id, "LATE")}
                                                        className={cn(
                                                            "rounded-xl",
                                                            record?.status === "LATE" && "bg-orange-600 hover:bg-orange-700"
                                                        )}
                                                    >
                                                        <Clock className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant={record?.status === "EXCUSED" ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => setStudentStatus(student.id, "EXCUSED")}
                                                        className={cn(
                                                            "rounded-xl",
                                                            record?.status === "EXCUSED" && "bg-blue-600 hover:bg-blue-700"
                                                        )}
                                                    >
                                                        <Heart className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => toggleRemarks(student.id)}
                                                        className="rounded-xl"
                                                    >
                                                        <MessageSquare className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Remarks */}
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="mt-3"
                                                >
                                                    <Textarea
                                                        placeholder="Add remarks (optional)..."
                                                        value={record?.remarks || ""}
                                                        onChange={(e) => setStudentRemarks(student.id, e.target.value)}
                                                        className="rounded-xl text-sm"
                                                        rows={2}
                                                    />
                                                </motion.div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Save Button */}
                    <div className="mt-6 flex justify-end">
                        <Button
                            onClick={handleSave}
                            disabled={saving || stats.notMarked > 0}
                            className="rounded-xl"
                            size="lg"
                        >
                            {saving ? "Saving..." : "Save Attendance"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
