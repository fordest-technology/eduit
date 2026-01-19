"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, BookOpen, GraduationCap, Users, Plus, Layers, Mail, Settings, MoreHorizontal, UserPlus, Loader2, Save } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { DashboardHeader } from "@/app/components/dashboard-header"
import { DashboardStatsCard, DashboardStatsGrid } from "@/components/dashboard-stats-card"
import { AddStudentClassModal } from "@/components/add-student-class-modal"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ResponsiveSheet } from "@/components/ui/responsive-sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface User {
    id: string
    name: string
    email: string
    profileImage: string | null
}

interface Department {
    id: string
    name: string
}

interface Teacher {
    id: string
    user: User
    department: Department | null
}

interface Student {
    user: User
    department: Department | null
}

interface Subject {
    id: string
    name: string
    code: string | null
}

interface OtherArm {
    id: string
    section: string | null
    _count: {
        students: number
    }
}

interface ClassDetails {
    id: string
    name: string
    section: string | null
    levelId: string | null
    teacherId: string | null
    teacher: Teacher | null
    level: {
        id: string
        name: string
    } | null
    subjects: Array<{
        subject: Subject
    }>
    students: Array<{
        student: Student
    }>
    otherArms: OtherArm[]
}

export default function ClassDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [classDetails, setClassDetails] = useState<ClassDetails | null>(null)
    const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [isCreateArmOpen, setIsCreateArmOpen] = useState(false)
    
    // Settings Form State
    const [editForm, setEditForm] = useState({
        name: "",
        section: "",
        levelId: "",
        teacherId: ""
    })
    const [allTeachers, setAllTeachers] = useState<any[]>([])
    const [allLevels, setAllLevels] = useState<any[]>([])
    const [isSavingSettings, setIsSavingSettings] = useState(false)
    
    const [newArmSection, setNewArmSection] = useState("")
    const [isCreatingArm, setIsCreatingArm] = useState(false)

    async function fetchClassDetails() {
        try {
            setLoading(true)
            const response = await fetch(`/api/classes/${params.id}`)
            if (!response.ok) {
                throw new Error("Failed to fetch class details")
            }
            const data = await response.json()
            setClassDetails(data)
            setEditForm({
                name: data.name,
                section: data.section || "",
                levelId: data.levelId || "none",
                teacherId: data.teacherId || "none"
            })
            setError(null)
        } catch (error) {
            console.error("Error fetching class details:", error)
            setError("Failed to load class details")
            toast.error("Failed to load class details")
        } finally {
            setLoading(false)
        }
    }

    async function fetchMetadata() {
        try {
            const [teachersRes, levelsRes] = await Promise.all([
                fetch("/api/teachers"),
                fetch("/api/school-levels")
            ])
            const teachersData = await teachersRes.json()
            const levelsData = await levelsRes.json()
            setAllTeachers(teachersData.teachers || [])
            setAllLevels(levelsData || [])
        } catch (error) {
            console.error("Error fetching metadata:", error)
        }
    }

    useEffect(() => {
        if (params.id) {
            fetchClassDetails()
            fetchMetadata()
        }
    }, [params.id])

    const handleUpdateClass = async () => {
        if (!editForm.name.trim()) {
            toast.error("Class name is required")
            return
        }

        try {
            setIsSavingSettings(true)
            const response = await fetch(`/api/classes/${params.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editForm.name.trim(),
                    section: editForm.section.trim() || null,
                    levelId: editForm.levelId === "none" ? null : editForm.levelId,
                    teacherId: editForm.teacherId === "none" ? null : editForm.teacherId,
                }),
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Failed to update class")

            toast.success("Class updated successfully!")
            setIsSettingsOpen(false)
            fetchClassDetails()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsSavingSettings(false)
        }
    }

    const handleCreateArm = async () => {
        if (!newArmSection.trim()) {
            toast.error("Section/Arm label is required (e.g., B, C, Gold)")
            return
        }

        if (!classDetails) return

        try {
            setIsCreatingArm(true)
            const response = await fetch("/api/classes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: classDetails.name,
                    section: newArmSection.trim(),
                    levelId: classDetails.levelId,
                }),
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Failed to create arm")

            toast.success(`Arm ${newArmSection.trim()} created successfully!`)
            setIsCreateArmOpen(false)
            setNewArmSection("")
            fetchClassDetails()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsCreatingArm(false)
        }
    }

    if (loading) {
        return (
            <div className="space-y-6 p-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
                </div>
                <Skeleton className="h-[400px] w-full rounded-3xl" />
            </div>
        )
    }

    if (error || !classDetails) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-bold">
                    {error || "Class not found"}
                </div>
                <Button variant="outline" onClick={() => router.push("/dashboard/classes")} className="rounded-xl">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Classes
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-10 font-poppins bg-[#F8FAFC]">
            <DashboardHeader
                heading={classDetails.name}
                text={`${classDetails.students?.length || 0} Students currently enrolled in this arm`}
                showBanner={true}
                icon={<Layers className="h-6 w-6" />}
                action={
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setIsSettingsOpen(true)}
                            className="h-12 px-5 rounded-2xl border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-md font-bold shadow-sm transition-all"
                        >
                            <Settings className="mr-2 h-5 w-5" />
                            Manage Class
                        </Button>
                        <Button
                            onClick={() => setIsAddStudentModalOpen(true)}
                            className="h-12 px-6 rounded-2xl bg-white text-primary hover:bg-white/90 font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <UserPlus className="mr-2 h-5 w-5" />
                            Enroll Student
                        </Button>
                    </div>
                }
            >
                <div className="flex items-center gap-2 -mt-4 mb-4 relative z-10">
                    <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-md px-3 py-1 rounded-lg font-bold text-xs uppercase tracking-widest">
                        {classDetails.level?.name || "No Level"}
                    </Badge>
                    {classDetails.section && (
                        <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-md px-3 py-1 rounded-lg font-bold text-xs uppercase tracking-widest">
                            Section {classDetails.section}
                        </Badge>
                    )}
                </div>
            </DashboardHeader>

            <div className="px-8 max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left Column: Quick Stats & Arms */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Educator Card */}
                    <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white text-wrap ">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-50">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Class Educator</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            {classDetails.teacher ? (
                                <div className="flex flex-col items-center text-center space-y-4">
                                    <Avatar className="h-24 w-24 rounded-3xl border-4 border-white shadow-xl shadow-primary/10">
                                        <AvatarImage src={classDetails.teacher.user.profileImage || ""} />
                                        <AvatarFallback className="bg-primary text-white text-2xl font-black">
                                            {classDetails.teacher.user.name[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800 ">{classDetails.teacher.user.name}</h3>
                                        <p className="text-sm text-primary font-black uppercase tracking-tighter mt-1">
                                            {classDetails.teacher.department?.name || "General Educator"}
                                        </p>
                                    </div>
                                    <Button 
                                        onClick={() => setIsSettingsOpen(true)}
                                        variant="ghost" 
                                        className="w-full h-12 rounded-xl text-slate-500 hover:text-primary hover:bg-primary/5 font-bold transition-all"
                                    >
                                        <Settings className="mr-2 h-4 w-4" /> Change Teacher
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-center space-y-4 py-4">
                                    <div className="h-20 w-20 rounded-3xl bg-amber-50 flex items-center justify-center text-amber-500">
                                        <Users className="h-10 w-10" />
                                    </div>
                                    <p className="text-slate-500 font-medium">No teacher assigned to this arm yet.</p>
                                    <Button 
                                        onClick={() => setIsSettingsOpen(true)}
                                        variant="outline" 
                                        className="w-full rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50 font-bold"
                                    >
                                        Assign Teacher
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Other Arms Card */}
                    <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-50 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Other Sections</CardTitle>
                            <Dialog open={isCreateArmOpen} onOpenChange={setIsCreateArmOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-primary hover:bg-primary/5">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="rounded-[2rem] p-8 border-none shadow-2xl">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl font-black font-sora">Create New Section</DialogTitle>
                                        <DialogDescription className="font-medium">
                                            Add a new section for <span className="font-bold text-primary">{classDetails.name}</span>.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-6 space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Section Identifier</Label>
                                            <Input 
                                                placeholder="e.g., B, Blue, Delta, Gold" 
                                                value={newArmSection}
                                                className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white"
                                                onChange={(e) => setNewArmSection(e.target.value)}
                                            />
                                            <p className="text-[10px] text-slate-400 font-medium">This section will inherit all level-based subjects automatically.</p>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button 
                                            onClick={handleCreateArm} 
                                            disabled={isCreatingArm}
                                            className="w-full h-14 rounded-2xl font-bold shadow-lg shadow-primary/20"
                                        >
                                            {isCreatingArm ? "Creating..." : "Generate New Section"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="space-y-2">
                                {classDetails.otherArms.length === 0 ? (
                                    <p className="text-xs text-center text-slate-400 py-4 font-medium italic">No other sections exist for this class.</p>
                                ) : (
                                    classDetails.otherArms.map((arm) => (
                                        <Link key={arm.id} href={`/dashboard/classes/${arm.id}`}>
                                            <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors group">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-600 group-hover:bg-primary group-hover:text-white transition-all">
                                                        {arm.section?.charAt(0) || "?"}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-700 group-hover:text-primary truncate max-w-[120px]">
                                                            {classDetails.name} {arm.section}
                                                        </h4>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{arm._count.students} Students</p>
                                                    </div>
                                                </div>
                                                <ArrowLeft className="h-4 w-4 text-slate-300 group-hover:text-indigo-400 rotate-180 transition-all" />
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Main Content */}
                <div className="lg:col-span-3 space-y-8">
                    {/* Performance Overview */}
                    <DashboardStatsGrid columns={2}>
                        <DashboardStatsCard
                            title="Active Curriculum"
                            value={classDetails.subjects?.length || 0}
                            icon={BookOpen}
                            color="indigo"
                            description="Subjects currently tracked for this section"
                        />
                        <DashboardStatsCard
                            title="Enrollment Status"
                            value={classDetails.students?.length || 0}
                            icon={Users}
                            color="purple"
                            description="Confirmed student seats occupied"
                        />
                    </DashboardStatsGrid>

                    {/* Tabs Section */}
                    <Tabs defaultValue="students" className="w-full">
                        <div className="flex items-center justify-between mb-6">
                            <TabsList className="bg-slate-100/50 p-1.5 rounded-[1.25rem]">
                                <TabsTrigger 
                                    value="students" 
                                    className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm font-bold transition-all"
                                >
                                    <Users className="mr-2 h-4 w-4" /> Students
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="subjects" 
                                    className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm font-bold transition-all"
                                >
                                    <BookOpen className="mr-2 h-4 w-4" /> Subjects
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="students" className="mt-0">
                            <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
                                <Table>
                                    <TableHeader className="bg-slate-50/50">
                                        <TableRow className="border-b border-slate-100">
                                            <TableHead className="px-8 py-5 font-black text-slate-400 tracking-widest text-[10px] uppercase">Student Profile</TableHead>
                                            <TableHead className="px-8 py-5 font-black text-slate-400 tracking-widest text-[10px] uppercase">Department</TableHead>
                                            <TableHead className="px-8 py-5 font-black text-slate-400 tracking-widest text-[10px] uppercase">Email Address</TableHead>
                                            <TableHead className="px-8 py-5 font-black text-slate-400 tracking-widest text-[10px] uppercase text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {classDetails.students.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-20">
                                                    <div className="flex flex-col items-center space-y-3">
                                                        <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-200">
                                                            <Users className="h-8 w-8" />
                                                        </div>
                                                        <p className="text-slate-400 font-bold">No students currently enrolled in this arm.</p>
                                                        <Button variant="link" onClick={() => setIsAddStudentModalOpen(true)} className="text-primary hover:text-primary/80">Start Enrollment</Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            classDetails.students.map((enrollment) => (
                                                <TableRow key={enrollment.student.user.email} className="border-b border-slate-50 transition-colors hover:bg-slate-50/30">
                                                    <TableCell className="px-8 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-10 w-10 rounded-xl shadow-sm border border-white">
                                                                <AvatarImage src={enrollment.student.user.profileImage || ""} />
                                                                <AvatarFallback className="bg-primary/5 text-primary font-black">
                                                                    {enrollment.student.user.name[0]}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span className="font-bold text-slate-800">{enrollment.student.user.name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-8 py-5">
                                                        <Badge variant="outline" className="rounded-lg border-slate-200 font-bold text-[10px] uppercase px-2 py-0.5 text-slate-500">
                                                            {enrollment.student.department?.name || "General"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="px-8 py-5">
                                                        <span className="text-sm font-medium text-slate-500">{enrollment.student.user.email}</span>
                                                    </TableCell>
                                                    <TableCell className="px-8 py-5 text-right">
                                                        <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-white border border-transparent hover:border-slate-100 text-slate-400 hover:text-primary transition-all">
                                                            <MoreHorizontal className="h-5 w-5" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </Card>
                        </TabsContent>

                        <TabsContent value="subjects" className="mt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {classDetails.subjects.length === 0 ? (
                                    <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] shadow-sm border border-slate-100">
                                        <div className="flex flex-col items-center space-y-3">
                                            <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-200">
                                                <BookOpen className="h-8 w-8" />
                                            </div>
                                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No subjects mapped to this level yet.</p>
                                        </div>
                                    </div>
                                ) : (
                                    classDetails.subjects.map((item) => (
                                        <Card key={item.subject.id} className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 bg-white p-6 hover:translate-y-[-4px] transition-all cursor-pointer group">
                                            <div className="flex items-start justify-between">
                                                <div className="h-12 w-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                                                    <BookOpen className="h-6 w-6" />
                                                </div>
                                                {item.subject.code && (
                                                    <span className="text-[10px] font-black font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded-md uppercase">
                                                        {item.subject.code}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-6">
                                                <h4 className="text-lg font-black text-slate-800 tracking-tight leading-tight group-hover:text-primary transition-colors">
                                                    {item.subject.name}
                                                </h4>
                                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Active Curriculum</p>
                                            </div>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Manage Class Sheet (Drawer) */}
            <ResponsiveSheet
                open={isSettingsOpen}
                onOpenChange={setIsSettingsOpen}
                title={`Manage ${classDetails.name}`}
                description="Adjust the core properties and academic routing for this specific class arm."
            >
                <div className="space-y-8">
                    {/* Class Name */}
                    <div className="space-y-3">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Class Signature</Label>
                        <Input 
                            value={editForm.name}
                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                            className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white text-lg font-bold"
                        />
                    </div>

                    {/* Section / Arm */}
                    <div className="space-y-3">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Arm Identifier (e.g. Gold, B)</Label>
                        <Input 
                            value={editForm.section}
                            onChange={(e) => setEditForm({...editForm, section: e.target.value})}
                            className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white text-lg font-bold"
                        />
                    </div>

                    {/* Level */}
                    <div className="space-y-3">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Academic Level</Label>
                        <Select 
                            value={editForm.levelId} 
                            onValueChange={(v) => setEditForm({...editForm, levelId: v})}
                        >
                            <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white font-bold text-lg">
                                <SelectValue placeholder="Select rank" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl shadow-2xl border-slate-50">
                                <SelectItem value="none">General / Unassigned</SelectItem>
                                {allLevels.map(lvl => (
                                    <SelectItem key={lvl.id} value={lvl.id}>{lvl.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Form Teacher */}
                    <div className="space-y-3">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Assigned Form Teacher</Label>
                        <div className="relative group">
                            <Select 
                                value={editForm.teacherId} 
                                onValueChange={(v) => setEditForm({...editForm, teacherId: v})}
                            >
                                <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white font-bold text-lg">
                                    <SelectValue placeholder="Assign Educator" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl shadow-2xl border-slate-50">
                                    <SelectItem value="none">Unassigned</SelectItem>
                                    {allTeachers.map(t => (
                                        <SelectItem key={t.id} value={t.id}>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6 rounded-lg overflow-hidden">
                                                    <AvatarImage src={t.user.profileImage || ""} />
                                                    <AvatarFallback className="bg-slate-200 text-[10px] font-black">{t.name[0]}</AvatarFallback>
                                                </Avatar>
                                                {t.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium italic mt-1">Changing the teacher will update the class primary contact across all reports.</p>
                    </div>

                    <Button 
                        onClick={handleUpdateClass}
                        disabled={isSavingSettings}
                        className="w-full h-16 rounded-[1.5rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg tracking-tight shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] mt-8"
                    >
                        {isSavingSettings ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="mr-2 h-6 w-6" />}
                        Update Class Profile
                    </Button>
                </div>
            </ResponsiveSheet>

            <AddStudentClassModal
                open={isAddStudentModalOpen}
                onOpenChange={setIsAddStudentModalOpen}
                classId={params.id as string}
                onSuccess={() => {
                    fetchClassDetails()
                }}
            />
        </div>
    )
} 