"use client"

import { useState, useRef, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
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
import { PasswordInput } from "@/components/ui/password-input"
import { Button } from "@/components/ui/button"
import { Loader2, Camera, Upload, X, Mail, CheckCircle, AlertCircle, Sparkles, UserPlus, BookOpen, GraduationCap, MapPin, Phone, Briefcase } from "lucide-react"
import { UserRole } from "@prisma/client"
import { useRouter } from "next/navigation"
import { generatePassword } from "@/lib/utils"
import Image from "next/image"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Teacher } from "./columns"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(1, "Phone number is required"),
    employeeId: z.string().optional(),
    qualifications: z.string().optional(),
    specialization: z.string().optional(),
    dateOfBirth: z.date().optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER", "none"]).default("none"),
    address: z.string().optional(),
    departmentId: z.string().optional(),
    classId: z.string().optional(),
    password: z.string().min(6, "Password is required and must be at least 6 characters"),
})

interface AddTeacherModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
    teacherToEdit?: Teacher | null
}

export function AddTeacherModal({
    open,
    onOpenChange,
    onSuccess,
    teacherToEdit
}: AddTeacherModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [image, setImage] = useState<string | null>(null)
    const [viewingImage, setViewingImage] = useState<string | null>(null)
    const [allClasses, setAllClasses] = useState<any[]>([])
    const [allDepartments, setAllDepartments] = useState<any[]>([])
    const [allLevels, setAllLevels] = useState<any[]>([])
    
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()
    const isEditMode = Boolean(teacherToEdit);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            employeeId: "",
            qualifications: "",
            specialization: "",
            address: "",
            gender: "none",
            departmentId: "",
            classId: "",
            password: "",
        },
    })

    async function fetchMetadata() {
        try {
            const [classesRes, deptsRes, levelsRes] = await Promise.all([
                fetch("/api/classes"),
                fetch("/api/departments"),
                fetch("/api/school-levels")
            ])
            const classesData = await classesRes.json()
            const deptsData = await deptsRes.json()
            const levelsData = await levelsRes.json()
            
            setAllClasses(Array.isArray(classesData) ? classesData : [])
            setAllDepartments(Array.isArray(deptsData) ? deptsData : [])
            setAllLevels(Array.isArray(levelsData) ? levelsData : [])
        } catch (error) {
            console.error("Error fetching metadata:", error)
        }
    }

    useEffect(() => {
        if (open) {
            fetchMetadata()
            if (teacherToEdit) {
                form.reset({
                    name: teacherToEdit.name || "",
                    email: teacherToEdit.email || "",
                    phone: teacherToEdit.phone || "",
                    employeeId: teacherToEdit.employeeId || "",
                    qualifications: teacherToEdit.qualifications || "",
                    specialization: teacherToEdit.specialization || "",
                    address: teacherToEdit.address || "",
                    gender: (teacherToEdit.gender as any) || "none",
                    departmentId: teacherToEdit.departmentId || "",
                    classId: "", // Classes are complex to pre-fill on first load without a specific teacher-class junction fetch
                    password: "dummy-password", // Not needed for edit
                })
                setViewingImage(teacherToEdit.profileImage)
            } else {
                form.reset({
                    name: "",
                    email: "",
                    phone: "",
                    employeeId: "",
                    qualifications: "",
                    specialization: "",
                    address: "",
                    gender: "none",
                    departmentId: "",
                    classId: "",
                    password: generatePassword(),
                })
                setViewingImage(null)
                setImage(null)
            }
        }
    }, [open, teacherToEdit, form])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setImage(reader.result as string)
                setViewingImage(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            setIsLoading(true);
            const formData = new FormData();
            Object.entries(values).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== "") {
                    if (value instanceof Date) {
                        formData.append(key, value.toISOString());
                    } else {
                        formData.append(key, value as string);
                    }
                }
            });

            if (image && image.startsWith("data:")) {
                const blob = await (await fetch(image)).blob();
                formData.append("profileImage", blob, "profile.jpg");
            }

            const response = await fetch(isEditMode ? `/api/teachers/${teacherToEdit?.id}` : "/api/teachers", {
                method: isEditMode ? "PUT" : "POST",
                body: formData,
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Failed to save teacher");
            }

            toast.success(isEditMode ? "Teacher profile updated!" : "New teacher successfully onboarded!");
            onSuccess?.();
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    }

    // Grouping classes by name/base for better selection
    const groupedClasses = allClasses.reduce((acc: any, cls: any) => {
        if (!acc[cls.name]) acc[cls.name] = [];
        acc[cls.name].push(cls);
        return acc;
    }, {});

    return (
        <ResponsiveSheet 
            open={open} 
            onOpenChange={onOpenChange}
            title={isEditMode ? "Edit Profile" : "Staff Onboarding"}
            description={isEditMode ? "Update faculty member credentials and assignments." : "Provision a new academic educator for your institution."}
            className="sm:max-w-[750px]"
        >
            <div className="flex flex-col gap-8">
                {/* Profile Portrait Selection */}
                <div className="flex flex-col items-center group relative z-10 self-center">
                    <div 
                        className="h-28 w-28 rounded-[2rem] bg-slate-100 border-4 border-white shadow-xl overflow-hidden cursor-pointer hover:scale-105 transition-all relative"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {viewingImage ? (
                            <Image src={viewingImage} alt="Profile" fill className="object-cover" />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-slate-400">
                                <Camera className="h-8 w-8" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Upload className="h-6 w-6 text-white" />
                        </div>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    <Badge variant="secondary" className="mt-[-12px] relative z-20 px-3 py-1 bg-white border-slate-100 shadow-md font-black text-[10px] uppercase tracking-widest text-indigo-600">
                        Portrait
                    </Badge>
                </div>

                <Form {...form}>
                    <form className="space-y-12">
                        {/* Section: Identity */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2">
                                <div className="h-1 w-8 bg-indigo-600 rounded-full" />
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Faculty Identity</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="name" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold text-slate-500">Legal Name</FormLabel>
                                        <FormControl><Input placeholder="Johnathan Doe" className="h-14 rounded-2xl bg-white border-slate-100 shadow-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-100 transition-all font-bold text-lg" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="email" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold text-slate-500">Corporate Email</FormLabel>
                                        <FormControl><Input type="email" placeholder="j.doe@eduit.edu" className="h-14 rounded-2xl bg-white border-slate-100 shadow-sm transition-all font-bold" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="phone" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold text-slate-500">Primary Contact</FormLabel>
                                        <FormControl><Input placeholder="+234 ..." className="h-14 rounded-2xl bg-white border-slate-100 shadow-sm font-bold" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="gender" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold text-slate-500">Gender Identity</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger className="h-14 rounded-2xl bg-white border-slate-100 font-bold"><SelectValue placeholder="Identify gender" /></SelectTrigger></FormControl>
                                            <SelectContent className="rounded-2xl border-slate-50 shadow-2xl"><SelectItem value="MALE">Male</SelectItem><SelectItem value="FEMALE">Female</SelectItem><SelectItem value="OTHER">Other</SelectItem><SelectItem value="none">Prefer not to say</SelectItem></SelectContent>
                                        </Select>
                                    </FormItem>
                                )} />
                            </div>
                        </div>

                        {/* Section: Academic Routing */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2">
                                <div className="h-1 w-8 bg-indigo-600 rounded-full" />
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Institutional Assignment</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="departmentId" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold text-slate-500">Academic Department</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger className="h-14 rounded-2xl bg-white border-slate-100 font-bold"><SelectValue placeholder="Assign Department" /></SelectTrigger></FormControl>
                                            <SelectContent className="rounded-2xl border-slate-50 shadow-2xl">
                                                {allDepartments.map(dept => <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )} />
                                
                                {/* Class Assignment with Section/Arm logic built in */}
                                <FormField control={form.control} name="classId" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold text-slate-500">Primary Form Class (Arm/Section)</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger className="h-14 rounded-2xl bg-white border-slate-100 font-bold"><SelectValue placeholder="Assign specific arm" /></SelectTrigger></FormControl>
                                            <SelectContent className="rounded-2xl border-slate-50 shadow-2xl">
                                                {Object.entries(groupedClasses).map(([name, arms]: [string, any]) => (
                                                    <div key={name}>
                                                        <div className="px-2 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">Level: {name}</div>
                                                        {arms.map((arm: any) => (
                                                            <SelectItem key={arm.id} value={arm.id} className="rounded-xl px-4 py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-slate-700">{arm.name} {arm.section}</span>
                                                                    {arm.level?.name && <Badge variant="outline" className="text-[9px] font-black h-4 px-1">{arm.level.name}</Badge>}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </div>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Selection defines the teacher's primary form responsibility.</p>
                                    </FormItem>
                                )} />
                            </div>
                        </div>

                        {/* Section: Credentials (New Only) */}
                        {!isEditMode && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-2">
                                    <div className="h-1 w-8 bg-indigo-600 rounded-full" />
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Security Access</h3>
                                </div>
                                <FormField control={form.control} name="password" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold text-slate-500">Generated Passkey (Temporary)</FormLabel>
                                        <FormControl><PasswordInput className="h-14 rounded-2xl bg-white border-slate-100 font-mono font-bold" {...field} /></FormControl>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 italic flex items-center gap-1">
                                            <Mail className="h-3 w-3" /> Credentials will be dispatched to the corporate email automatically.
                                        </p>
                                    </FormItem>
                                )} />
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="h-16 px-8 rounded-2xl font-bold text-slate-500 hover:text-slate-800">Discard Changes</Button>
                            <Button 
                                onClick={form.handleSubmit(onSubmit)} 
                                disabled={isLoading}
                                className="h-16 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-xl shadow-indigo-100 flex items-center gap-2 transition-all active:scale-[0.98]"
                            >
                                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                                {isEditMode ? "Update Faculty Record" : "Finalize Staff Onboarding"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </ResponsiveSheet>
    )
} 