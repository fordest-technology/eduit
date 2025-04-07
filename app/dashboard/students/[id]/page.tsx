"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, UserIcon, School, GraduationCap, UserPlus, Mail, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StudentDetails } from "./student-details"
import { Pencil } from "lucide-react"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { User, Class, AcademicSession, AttendanceStatus, ExamType } from "@prisma/client"
import { DashboardHeader } from "@/app/components/dashboard-header"
import { Card, CardContent } from "@/components/ui/card"
import StudentModal from "../student-modal"
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
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert"
import {
    Checkbox,
} from "@/components/ui/checkbox"
import {
    AlertTriangle,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

interface StudentClassRecord {
    id: string;
    class: Class & {
        level?: {
            id: string;
            name: string;
            description?: string | null;
            order: number;
        } | null;
        section?: string | null;
    };
    session: AcademicSession;
    sessionId: string;
    classId: string;
    studentId: string;
    rollNumber?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

interface StudentParentRecord {
    id: string;
    parent: User;
    parentId: string;
    studentId: string;
    relation?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

interface AttendanceRecord {
    id: string;
    date: Date;
    status: AttendanceStatus;
    studentId: string;
    sessionId: string;
    remarks?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

interface ResultRecord {
    id: string;
    studentId: string;
    subjectId: string;
    sessionId: string;
    examType: ExamType;
    marks: number;
    totalMarks: number;
    grade?: string | null;
    remarks?: string | null;
    isApproved: boolean;
    createdAt: Date;
    updatedAt: Date;
    subject: {
        id: string;
        name: string;
    };
}

interface Department {
    id: string;
    name: string;
    description?: string | null;
    schoolId: string;
    createdAt: Date;
    updatedAt: Date;
}

type ComplexStudent = User & {
    department: Department | null;
    studentClass: StudentClassRecord[];
    parents: StudentParentRecord[];
    attendance: AttendanceRecord[];
    results: ResultRecord[];
};

// Form schema for adding student to class
const addToClassSchema = z.object({
    classId: z.string().min(1, "Please select a class"),
    sessionId: z.string().min(1, "Please select an academic session"),
    rollNumber: z.string().optional(),
    forceReassign: z.boolean().default(false),
})

// Create the action buttons component for the header
function ActionButtons({ onEditClick, onClassClick }: { onEditClick: () => void, onClassClick: () => void }) {
    return (
        <div className="flex gap-2 z-20">
            <Button
                variant="outline"
                onClick={onClassClick}
                className="z-20"
            >
                <UserPlus className="h-4 w-4 mr-2" />
                Add to Class
            </Button>
            <Button
                variant="default"
                onClick={onEditClick}
            >
                <Pencil className="h-4 w-4 mr-2" />
                Edit Student
            </Button>
        </div>
    );
}

// Create skeleton loading components
const StudentCardSkeleton = () => (
    <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
        <CardContent className="p-4 flex items-center">
            <Skeleton className="h-5 w-5 mr-2 rounded-full" />
            <div className="w-full">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-5 w-40" />
            </div>
        </CardContent>
    </Card>
)

const StudentDetailsSkeleton = () => (
    <div className="rounded-lg border shadow-sm p-6 space-y-4">
        <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-40" />
                </div>
            ))}
        </div>
    </div>
)

export default function StudentDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const [student, setStudent] = useState<ComplexStudent | null>(null)
    const [currentClass, setCurrentClass] = useState<Class | undefined>(undefined)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showClassModal, setShowClassModal] = useState(false)
    const [editingStudent, setEditingStudent] = useState<any>(null)
    const [departments, setDepartments] = useState<any[]>([])
    const [schoolInfo, setSchoolInfo] = useState<any>(null)
    const [currentSession, setCurrentSession] = useState<AcademicSession | null>(null)

    // Class assignment state
    const [classes, setClasses] = useState<any[]>([])
    const [sessions, setSessions] = useState<any[]>([])
    const [isAddingToClass, setIsAddingToClass] = useState(false)
    const [isFetchingClassData, setIsFetchingClassData] = useState(false)
    const [studentClassConflict, setStudentClassConflict] = useState<any>(null)

    // Setup form for adding student to class
    const form = useForm<z.infer<typeof addToClassSchema>>({
        resolver: zodResolver(addToClassSchema),
        defaultValues: {
            classId: "",
            sessionId: "",
            rollNumber: "",
            forceReassign: false,
        },
    })

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                // Fetch student data with detailed error handling
                console.log("Fetching student with ID:", params.id);
                const studentRes = await fetch(`/api/students/${params.id}`);

                if (!studentRes.ok) {
                    const errorData = await studentRes.json().catch(() => ({}));
                    console.error("API Error Response:", errorData);
                    throw new Error(errorData.message || `Failed to fetch student: ${studentRes.status} ${studentRes.statusText}`);
                }

                const responseData = await studentRes.json();
                console.log("API Response:", responseData);

                // The API returns data in { student: {...}, availableDepartments: [...], ... } format
                const studentData = responseData.student;
                const activeSession = responseData.currentSession;

                if (!studentData) {
                    console.error("No student data in response:", responseData);
                    throw new Error('Student data not found in response');
                }

                // Set current class and session directly from API response
                let currentClassObj = studentData.currentClass;
                setCurrentClass(currentClassObj);
                setCurrentSession(activeSession);
                
                // Set student data with all classes included
                const formattedStudent = {
                    ...studentData,
                    // Include nested properties at the top level for ComplexStudent type
                    id: studentData.id,
                    name: studentData.name,
                    email: studentData.email,
                    phone: studentData.phone,
                    gender: studentData.gender,
                    profileImage: studentData.profileImage,
                    dateOfBirth: studentData.dateOfBirth,
                    department: studentData.departmentId ? {
                        id: studentData.departmentId,
                        name: studentData.department?.name || 'Unknown Department',
                        schoolId: studentData.schoolId,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    } : null,
                    studentClass: studentData.classes || [],
                    // Set arrays for properties required by ComplexStudent type
                    parents: studentData.parents || [],
                    attendance: studentData.attendance || [],
                    results: studentData.results || [],
                }

                setStudent(formattedStudent);

                // Format student data for edit form
                if (studentData) {
                    const formattedStudentData = {
                        id: studentData.id,
                        name: studentData.name,
                        email: studentData.email,
                        phone: studentData.phone || "",
                        gender: studentData.gender || "MALE",
                        dateOfBirth: studentData.dateOfBirth,
                        profileImage: studentData.profileImage,
                        address: studentData.address || "",
                        city: studentData.city || "",
                        state: studentData.state || "",
                        country: studentData.country || "",
                        religion: studentData.religion || "",
                        department: studentData.department || null
                    }
                    setEditingStudent(formattedStudentData)
                }

                // Set available data from API response
                if (responseData.availableDepartments) {
                    setDepartments(responseData.availableDepartments)
                }

                // Fetch current school info for UI styling
                const schoolRes = await fetch('/api/schools/current')
                if (schoolRes.ok) {
                    const schoolData = await schoolRes.json()
                    setSchoolInfo(schoolData)
                }

            } catch (error) {
                console.error('Error fetching data:', error)
                setError(error instanceof Error ? error.message : 'Failed to load student data')
                toast.error('Error loading student details: ' + (error instanceof Error ? error.message : 'Unknown error'))
            } finally {
                setLoading(false)
            }
        }

        if (params.id) {
            fetchData()
        }
    }, [params.id])

    const refreshData = () => {
        setLoading(true);
        setError(null);
        fetch(`/api/students/${params.id}`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to refresh student data');
                return res.json();
            })
            .then(data => {
                const studentData = data.student;
                const activeSession = data.currentSession;
                
                if (studentData) {
                    // Set current class and session directly from API response
                    let currentClassObj = studentData.currentClass;
                    
                    // Map the nested student data to match the expected format
                    const formattedStudent = {
                        ...studentData,
                        id: studentData.id,
                        name: studentData.name,
                        email: studentData.email,
                        phone: studentData.phone,
                        gender: studentData.gender,
                        profileImage: studentData.profileImage,
                        dateOfBirth: studentData.dateOfBirth,
                        department: studentData.departmentId ? {
                            id: studentData.departmentId,
                            name: studentData.department?.name || 'Unknown Department',
                            schoolId: studentData.schoolId,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        } : null,
                        studentClass: studentData.classes || [],
                        parents: studentData.parents || [],
                        attendance: studentData.attendance || [],
                        results: studentData.results || [],
                    }

                    setStudent(formattedStudent);
                    setCurrentClass(currentClassObj);
                    setCurrentSession(activeSession);
                }
            })
            .catch(err => {
                console.error('Error refreshing data:', err);
                toast.error('Failed to refresh student data');
            })
            .finally(() => setLoading(false));
    };

    const handleAddToClass = () => {
        console.log("Opening add to class modal");
        setShowClassModal(true);
        setStudentClassConflict(null);
        setIsAddingToClass(false);

        // Reset form when opening the modal
        form.reset({
            classId: "",
            sessionId: "",
            rollNumber: "",
            forceReassign: false,
        });

        // Fetch available classes and sessions
        setIsFetchingClassData(true);
        fetch(`/api/students/${params.id}`)
            .then(res => res.json())
            .then(data => {
                const classesData = data.availableClasses || [];
                const sessionsData = data.availableSessions || [];
                
                setClasses(classesData);
                
                // If sessions not directly available, fetch them
                if (!sessionsData || sessionsData.length === 0) {
                    return fetch("/api/academic-sessions?active=true")
                        .then(res => res.json())
                        .then(sessions => {
                            setSessions(sessions);
                            // Set default session to current if available
                            const currentSession = sessions.find(s => s.isCurrent);
                            if (currentSession) {
                                form.setValue("sessionId", currentSession.id);
                            }
                        });
                } else {
                    setSessions(sessionsData);
                    // Set default session to current if available
                    const currentSession = sessionsData.find(s => s.isCurrent);
                    if (currentSession) {
                        form.setValue("sessionId", currentSession.id);
                    }
                    return Promise.resolve();
                }
            })
            .catch(err => {
                console.error("Error fetching data:", err);
                toast.error("Failed to load required data");
            })
            .finally(() => {
                setIsFetchingClassData(false);
            });
    };

    const onSubmit = async (values: z.infer<typeof addToClassSchema>) => {
        if (!student) return;

        setIsAddingToClass(true);
        try {
            const response = await fetch(`/api/students/${student.id}/class`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 409 && data.conflict) {
                    setStudentClassConflict({
                        message: data.message,
                        currentClass: data.currentClass,
                    });
                    return;
                }
                throw new Error(data.message || "Failed to add student to class");
            }

            toast.success("Student added to class successfully");
            setShowClassModal(false);
            setStudentClassConflict(null);
            router.refresh();
        } catch (error) {
            console.error("Error adding student to class:", error);
            toast.error(error instanceof Error ? error.message : "Failed to add student to class");
        } finally {
            setIsAddingToClass(false);
        }
    };

    if (error && !student) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <h2 className="text-xl font-semibold text-red-500 mb-2">
                    {error || "Student not found"}
                </h2>
                <Button onClick={() => router.push("/dashboard/students")}>
                    Back to Students
                </Button>
            </div>
        )
    }

    // Create a style object with school colors if available
    const cardStyle = schoolInfo?.primaryColor
        ? {
            borderColor: schoolInfo.primaryColor,
            boxShadow: `0 1px 3px 0 ${schoolInfo.primaryColor}20, 0 1px 2px 0 ${schoolInfo.primaryColor}06`
        }
        : {};

    return (
        <div className="space-y-8 pb-10">
            {/* Banner Header - Keeping this as is */}
            <DashboardHeader
                heading={student?.name || "Student Details"}
                text="View and manage student information"
                showBanner={true}
                icon={<GraduationCap className="h-6 w-6 mr-2" />}
                action={
                    loading ? (
                        <Button variant="outline" disabled>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading...
                        </Button>
                    ) : (
                        <ActionButtons
                            onEditClick={() => {
                                setShowEditModal(true)
                                setEditingStudent(student)
                            }}
                            onClassClick={handleAddToClass}
                        />
                    )
                }
            />

            <div className="container max-w-6xl mx-auto px-4">
                {/* Summary Cards - Using consistent design patterns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {loading ? (
                        <>
                            <StudentCardSkeleton />
                            <StudentCardSkeleton />
                            <StudentCardSkeleton />
                        </>
                    ) : (
                        <>
                            <Card className="overflow-hidden border border-slate-200 shadow-sm hover:shadow transition-all duration-200">
                                <div className="h-2 bg-blue-500" aria-hidden="true"></div>
                                <CardContent className="p-6">
                                    <div className="flex items-center mb-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                                            <Mail className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <h3 className="font-medium text-slate-900">Contact</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-slate-500">Email Address</p>
                                            <p className="font-medium text-slate-900 truncate max-w-[220px]" title={student?.email || ""}>
                                                {student?.email}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500">Phone Number</p>
                                            <p className="font-medium text-slate-900">
                                                {student?.phone || "Not provided"}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="overflow-hidden border border-slate-200 shadow-sm hover:shadow transition-all duration-200">
                                <div className="h-2 bg-emerald-500" aria-hidden="true"></div>
                                <CardContent className="p-6">
                                    <div className="flex items-center mb-4">
                                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mr-4">
                                            <School className="h-5 w-5 text-emerald-600" />
                                        </div>
                                        <h3 className="font-medium text-slate-900">Class Information</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-slate-500">Current Class</p>
                                            <p className="font-medium text-slate-900">
                                                {currentClass ? 
                                                  `${currentClass.name}${currentClass.section ? ` - ${currentClass.section}` : ''}` 
                                                  : "Not Assigned"}
                                            </p>
                                        </div>
                                        {currentClass && currentClass.level && (
                                            <div>
                                                <p className="text-sm text-slate-500">Level</p>
                                                <p className="font-medium text-slate-900">
                                                    {currentClass.level.name}
                                                </p>
                                            </div>
                                        )}
                                        {currentClass && (
                                            <div>
                                                <p className="text-sm text-slate-500">Roll Number</p>
                                                <p className="font-medium text-slate-900">
                                                    {currentClass.rollNumber || "Not assigned"}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="overflow-hidden border border-slate-200 shadow-sm hover:shadow transition-all duration-200">
                                <div className="h-2 bg-purple-500" aria-hidden="true"></div>
                                <CardContent className="p-6">
                                    <div className="flex items-center mb-4">
                                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-4">
                                            <GraduationCap className="h-5 w-5 text-purple-600" />
                                        </div>
                                        <h3 className="font-medium text-slate-900">Academic</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-slate-500">Department</p>
                                            <p className="font-medium text-slate-900">
                                                {student?.department?.name || "Not Assigned"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500">Session</p>
                                            <p className="font-medium text-slate-900">
                                                {currentSession?.name || currentClass?.session?.name || "Not Available"}
                                                {currentSession?.isCurrent && " (Current)"}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>

                {/* Main student details in a clean card with improved visual hierarchy */}
                <Card className="overflow-hidden border border-slate-200 shadow-sm">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">Student Information</h3>
                        {!loading && (
                            <div className="flex items-center space-x-2">
                                <div className="flex items-center bg-blue-50 text-blue-700 text-xs font-medium rounded-full px-3 py-1">
                                    <span>ID: {student?.id.slice(0, 8)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                    {loading ? (
                        <div className="p-6">
                            <StudentDetailsSkeleton />
                        </div>
                    ) : (
                        <StudentDetails
                            student={student as ComplexStudent}
                            currentClass={currentClass}
                            currentSession={currentSession}
                        />
                    )}
                </Card>

                {/* Quick Actions Section - Added for better usability */}
                {!loading && student && (
                    <div className="mt-8">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <Button 
                                variant="outline" 
                                className="h-auto py-6 flex flex-col items-center justify-center gap-2 border-slate-200 hover:bg-slate-50"
                                onClick={() => {
                                    setShowEditModal(true)
                                    setEditingStudent(student)
                                }}
                            >
                                <Pencil className="h-5 w-5 text-slate-600" />
                                <span className="text-sm font-medium">Edit Details</span>
                            </Button>
                            <Button 
                                variant="outline" 
                                className="h-auto py-6 flex flex-col items-center justify-center gap-2 border-slate-200 hover:bg-slate-50"
                                onClick={handleAddToClass}
                            >
                                <UserPlus className="h-5 w-5 text-slate-600" />
                                <span className="text-sm font-medium">Manage Class</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-auto py-6 flex flex-col items-center justify-center gap-2 border-slate-200 hover:bg-slate-50"
                                asChild
                            >
                                <Link href={`/dashboard/students/${student.id}/attendance`}>
                                    <Calendar className="h-5 w-5 text-slate-600" />
                                    <span className="text-sm font-medium">Attendance</span>
                                </Link>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-auto py-6 flex flex-col items-center justify-center gap-2 border-slate-200 hover:bg-slate-50"
                                asChild
                            >
                                <Link href={`/dashboard/students/${student.id}/results`}>
                                    <GraduationCap className="h-5 w-5 text-slate-600" />
                                    <span className="text-sm font-medium">Results</span>
                                </Link>
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Student Edit Modal */}
            {editingStudent && (
                <StudentModal
                    student={editingStudent}
                    departments={departments || []}
                    isOpen={showEditModal}
                    trigger={null}
                    onSuccess={() => {
                        setShowEditModal(false);
                        refreshData();
                    }}
                />
            )}

            {/* Add to Class Dialog - Improved for better user experience */}
            <Dialog open={showClassModal} onOpenChange={setShowClassModal}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Add Student to Class</DialogTitle>
                        <DialogDescription>
                            Select a class and academic session to add the student to.
                        </DialogDescription>
                    </DialogHeader>

                    {studentClassConflict && (
                        <Alert className="mb-4 border-amber-500 bg-amber-50">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            <AlertTitle className="text-amber-900">Student Already Assigned</AlertTitle>
                            <AlertDescription className="mt-2 text-amber-800">
                                <p>{studentClassConflict.message}</p>
                                <div className="flex items-center mt-4">
                                    <FormField
                                        control={form.control}
                                        name="forceReassign"
                                        render={({ field }) => (
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="forceReassign"
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                                <label
                                                    htmlFor="forceReassign"
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    Move student to this class
                                                </label>
                                            </div>
                                        )}
                                    />
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="classId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Class</FormLabel>
                                        <Select
                                            disabled={isFetchingClassData || isAddingToClass}
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a class" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {classes.map((cls) => (
                                                    <SelectItem key={cls.id} value={cls.id}>
                                                        {cls.name}{cls.section ? ` - ${cls.section}` : ""} 
                                                        {cls.level ? ` (${cls.level.name})` : ""}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="sessionId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Academic Session</FormLabel>
                                        <Select
                                            disabled={isFetchingClassData || isAddingToClass}
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a session" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {sessions.map((session) => (
                                                    <SelectItem key={session.id} value={session.id}>
                                                        {session.name} {session.isCurrent && "(Current)"}
                                                    </SelectItem>
                                                ))}
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
                                            <Input
                                                disabled={isAddingToClass}
                                                placeholder="Enter roll number"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowClassModal(false)}
                                    disabled={isAddingToClass}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isAddingToClass}>
                                    {isAddingToClass ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Adding...
                                        </>
                                    ) : (
                                        "Add to Class"
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    )
} 