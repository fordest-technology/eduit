"use client";

import { useEffect, useState, useMemo } from "react";
import { DashboardHeader } from "@/app/components/dashboard-header";
import { StudentFilters } from "./_components/StudentFilters";
import { TeacherStudentsList } from "./_components/TeacherStudentsList";
import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, UserX, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Student {
    id: string;
    userId: string;
    name: string;
    email: string;
    profileImage: string | null;
    gender: string | null;
    rollNumber: string | null;
    class: {
        id: string;
        name: string;
        section: string | null;
        level: string;
    };
    attendance: {
        percentage: number;
        present: number;
        total: number;
    };
    performance: {
        average: number;
    };
}

interface StudentsData {
    students: Student[];
    classes: Array<{ id: string; name: string; section: string | null }>;
    stats: {
        total: number;
        male: number;
        female: number;
        activeClasses: number;
    };
}

export default function TeacherStudentsPage() {
    const [data, setData] = useState<StudentsData | null>(null);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedClass, setSelectedClass] = useState("all");
    const [selectedGender, setSelectedGender] = useState("all");
    const [selectedPerformance, setSelectedPerformance] = useState("all");
    const [selectedAttendance, setSelectedAttendance] = useState("all");

    useEffect(() => {
        async function fetchStudents() {
            try {
                setLoading(true);
                const response = await fetch("/api/teachers/students");

                if (!response.ok) {
                    throw new Error("Failed to fetch students");
                }

                const studentsData = await response.json();
                setData(studentsData);
            } catch (error) {
                console.error("Error fetching students:", error);
                toast.error("Failed to load students");
            } finally {
                setLoading(false);
            }
        }

        fetchStudents();
    }, []);

    // Filter students
    const filteredStudents = useMemo(() => {
        if (!data) return [];

        return data.students.filter((student) => {
            // Search filter
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch =
                student.name.toLowerCase().includes(searchLower) ||
                student.email.toLowerCase().includes(searchLower) ||
                (student.rollNumber && student.rollNumber.toLowerCase().includes(searchLower));

            if (!matchesSearch) return false;

            // Class filter
            if (selectedClass !== "all" && student.class.id !== selectedClass) {
                return false;
            }

            // Gender filter
            if (selectedGender !== "all" && student.gender !== selectedGender) {
                return false;
            }

            // Performance filter
            if (selectedPerformance !== "all") {
                const avg = student.performance.average;
                if (selectedPerformance === "excellent" && (avg < 90 || avg > 100)) return false;
                if (selectedPerformance === "good" && (avg < 70 || avg >= 90)) return false;
                if (selectedPerformance === "fair" && (avg < 50 || avg >= 70)) return false;
                if (selectedPerformance === "poor" && avg >= 50) return false;
            }

            // Attendance filter
            if (selectedAttendance !== "all") {
                const att = student.attendance.percentage;
                if (selectedAttendance === "good" && att < 80) return false;
                if (selectedAttendance === "average" && (att < 60 || att >= 80)) return false;
                if (selectedAttendance === "poor" && att >= 60) return false;
            }

            return true;
        });
    }, [data, searchQuery, selectedClass, selectedGender, selectedPerformance, selectedAttendance]);

    const activeFiltersCount = [
        selectedClass !== "all",
        selectedGender !== "all",
        selectedPerformance !== "all",
        selectedAttendance !== "all",
    ].filter(Boolean).length;

    const clearFilters = () => {
        setSearchQuery("");
        setSelectedClass("all");
        setSelectedGender("all");
        setSelectedPerformance("all");
        setSelectedAttendance("all");
    };

    return (
        <div className="space-y-6">
            <DashboardHeader
                heading="My Students"
                text="View and manage all students across your classes"
                showBanner={true}
                icon={<Users className="h-8 w-8 text-white" />}
            />

            {/* Stats Cards */}
            {!loading && data && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <Card className="border-none shadow-lg">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium uppercase">Total Students</p>
                                        <p className="text-2xl font-bold mt-1">{data.stats.total}</p>
                                    </div>
                                    <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                                        <Users className="h-6 w-6 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <Card className="border-none shadow-lg">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium uppercase">Male</p>
                                        <p className="text-2xl font-bold mt-1">{data.stats.male}</p>
                                    </div>
                                    <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center">
                                        <UserCheck className="h-6 w-6 text-green-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <Card className="border-none shadow-lg">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium uppercase">Female</p>
                                        <p className="text-2xl font-bold mt-1">{data.stats.female}</p>
                                    </div>
                                    <div className="h-12 w-12 rounded-xl bg-pink-50 flex items-center justify-center">
                                        <UserX className="h-6 w-6 text-pink-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                        <Card className="border-none shadow-lg">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium uppercase">Classes</p>
                                        <p className="text-2xl font-bold mt-1">{data.stats.activeClasses}</p>
                                    </div>
                                    <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center">
                                        <GraduationCap className="h-6 w-6 text-purple-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            )}

            {/* Filters */}
            <StudentFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedClass={selectedClass}
                onClassChange={setSelectedClass}
                selectedGender={selectedGender}
                onGenderChange={setSelectedGender}
                selectedPerformance={selectedPerformance}
                onPerformanceChange={setSelectedPerformance}
                selectedAttendance={selectedAttendance}
                onAttendanceChange={setSelectedAttendance}
                classes={data?.classes || []}
                onClearFilters={clearFilters}
                activeFiltersCount={activeFiltersCount}
            />

            {/* Results Count */}
            {!loading && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-600">
                        Showing <span className="font-semibold">{filteredStudents.length}</span> of{" "}
                        <span className="font-semibold">{data?.stats.total || 0}</span> students
                    </p>
                </div>
            )}

            {/* Students List */}
            <TeacherStudentsList students={filteredStudents} loading={loading} />
        </div>
    );
}
