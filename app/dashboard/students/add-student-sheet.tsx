"use client"

import { useState, useRef, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { ResponsiveModal } from "@/components/ui/responsive-modal"
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
import { Loader2, Camera, Upload, X, CalendarIcon, Mail, Send, ArrowRight, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { generatePassword } from "@/lib/utils"
import Image from "next/image"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Stepper } from "@/components/ui/stepper"
import { Badge } from "@/components/ui/badge"

const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
];

const bloodGroupOptions = [
    { value: "A+", label: "A+" },
    { value: "A-", label: "A-" },
    { value: "B+", label: "B+" },
    { value: "B-", label: "B-" },
    { value: "AB+", label: "AB+" },
    { value: "AB-", label: "AB-" },
    { value: "O+", label: "O+" },
    { value: "O-", label: "O-" },
];

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    profileImage: z.any().optional(),
    admissionDate: z.date({
        required_error: "Admission date is required.",
    }),
    departmentId: z.string().optional(),
    address: z.string().min(1, "Address is required").max(200),
    city: z.string().min(1, "City is required").max(50),
    state: z.string().min(1, "State is required").max(50),
    country: z.string().min(1, "Country is required").max(50),
    phone: z.string().min(1, "Phone is required"),
    dateOfBirth: z.date({
        required_error: "Date of birth is required",
    }),
    gender: z.enum(["male", "female", "other"], {
        required_error: "Please select a gender",
    }),
    religion: z.string().min(1, "Religion is required").max(50),
    bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], {
        required_error: "Please select a blood group",
    }),
    levelId: z.string().optional(),
    classId: z.string().optional(),
    sessionId: z.string().optional(),
    rollNumber: z.string().optional(),
    sendCredentials: z.boolean().default(true),
    sendWelcomeEmail: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>

interface Department { id: string; name: string }
interface SchoolLevel { id: string; name: string }
interface Class { id: string; name: string; section?: string; levelId?: string }
interface AcademicSession { id: string; name: string; isCurrent: boolean }

interface AddStudentSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
    studentToEdit?: any
}

const STEPS = [
    { id: "personal", label: "Personal Info" },
    { id: "contact", label: "Contact Details" },
    { id: "academic", label: "Academic Info" },
];

export function AddStudentSheet({
    open,
    onOpenChange,
    onSuccess,
    studentToEdit
}: AddStudentSheetProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [profileImage, setProfileImage] = useState<File | null>(null)
    const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null)
    const [departments, setDepartments] = useState<Department[]>([])
    const [levels, setLevels] = useState<SchoolLevel[]>([])
    const [classes, setClasses] = useState<Class[]>([])
    const [sessions, setSessions] = useState<AcademicSession[]>([])
    const [filteredClasses, setFilteredClasses] = useState<Class[]>([])
    const [currentStep, setCurrentStep] = useState(0)
    const [isLoadingData, setIsLoadingData] = useState(false)
    const router = useRouter()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            password: generatePassword(),
            admissionDate: new Date(),
            phone: "",
            address: "",
            city: "",
            state: "",
            country: "",
            dateOfBirth: new Date(),
            gender: "male",
            religion: "",
            bloodGroup: "A+",
            departmentId: "none",
            levelId: "none",
            classId: "none",
            sessionId: "none",
            rollNumber: "",
            sendCredentials: true,
            sendWelcomeEmail: true,
        },
    })

    useEffect(() => {
        const fetchStudentDetails = async () => {
            if (!studentToEdit?.id || !open) return;
            try {
                // Initialize with available data
                form.reset({
                    name: studentToEdit.name || "",
                    email: studentToEdit.email || "",
                    password: "", 
                    admissionDate: new Date(),
                    phone: studentToEdit.phone || "",
                    address: studentToEdit.address || "",
                    city: studentToEdit.city || "",
                    state: studentToEdit.state || "",
                    country: studentToEdit.country || "",
                    gender: (studentToEdit.gender?.toLowerCase() as any) || "male",
                    religion: studentToEdit.religion || "",
                    bloodGroup: (studentToEdit.bloodGroup as any) || "A+",
                    departmentId: "none",
                    levelId: "none",
                    classId: studentToEdit.classId || "none",
                    sessionId: "none",
                    rollNumber: studentToEdit.rollNumber || "",
                    dateOfBirth: studentToEdit.dateOfBirth ? new Date(studentToEdit.dateOfBirth) : new Date(),
                    sendCredentials: false,
                    sendWelcomeEmail: false,
                });
                
                if (studentToEdit.profileImage) setProfileImageUrl(studentToEdit.profileImage);

                setIsLoadingData(true);
                const response = await fetch(`/api/students/${studentToEdit.id}`);
                if (response.ok) {
                    const data = await response.json();
                    const student = data.student;
                    
                    form.reset({
                        name: student.name || "",
                        email: student.email || "",
                        password: "",
                        admissionDate: student.admissionDate ? new Date(student.admissionDate) : new Date(),
                        phone: student.phone || "",
                        address: student.address || "",
                        city: student.city || "",
                        state: student.state || "",
                        country: student.country || "",
                        dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth) : new Date(),
                        gender: (student.gender?.toLowerCase() as any) || "male",
                        religion: student.religion || "",
                        bloodGroup: (student.bloodGroup as any) || "A+",
                        departmentId: student.departmentId || "none",
                        levelId: student.currentClass?.level?.id || "none",
                        classId: student.classId || "none",
                        sessionId: student.sessionId || "none",
                        rollNumber: student.rollNumber || "",
                        sendCredentials: false,
                        sendWelcomeEmail: false,
                    });
                     if (student.profileImage) setProfileImageUrl(student.profileImage);
                }
            } catch (error) {
                console.error("Error fetching student details:", error);
            } finally {
                setIsLoadingData(false);
            }
        };

        if (open) {
            if (studentToEdit) {
                fetchStudentDetails();
            } else {
                form.reset({
                    name: "",
                    email: "",
                    password: generatePassword(),
                    admissionDate: new Date(),
                    phone: "",
                    address: "",
                    city: "",
                    state: "",
                    country: "",
                    dateOfBirth: new Date(),
                    gender: "male",
                    religion: "",
                    bloodGroup: "A+",
                    departmentId: "none",
                    levelId: "none",
                    classId: "none",
                    sessionId: "none",
                    rollNumber: "",
                    sendCredentials: true,
                    sendWelcomeEmail: true,
                });
                setProfileImageUrl(null);
                setProfileImage(null);
                setCurrentStep(0);
            }
        }
    }, [studentToEdit, open, form]);

    useEffect(() => {
        const fetchData = async () => {
             if (!open) return;
             try {
                 const [deptRes, levelRes, classRes, sessionRes] = await Promise.all([
                     fetch("/api/departments"),
                     fetch("/api/school-levels"),
                     fetch("/api/classes"),
                     fetch("/api/academic-sessions")
                 ]);

                 if (deptRes.ok) setDepartments((await deptRes.json()).map((d: any) => ({ id: d.id, name: d.name })));
                 if (levelRes.ok) setLevels((await levelRes.json()).map((l: any) => ({ id: l.id, name: l.name })));
                 if (classRes.ok) {
                     const classData = await classRes.json();
                     setClasses(classData.map((c: any) => ({ id: c.id, name: c.name, section: c.section, levelId: c.level?.id })));
                 }
                 if (sessionRes.ok) {
                    const sessionData = await sessionRes.json();
                    setSessions(sessionData.map((s: any) => ({ id: s.id, name: s.name, isCurrent: s.isCurrent })));
                    if (!studentToEdit) {
                        const current = sessionData.find((s: any) => s.isCurrent);
                        if (current) form.setValue('sessionId', current.id);
                    }
                 }
             } catch (error) {
                 console.error("Error loading form data", error);
                 toast.error("Failed to load school data");
             }
        };
        fetchData();
    }, [open, studentToEdit, form]);

    useEffect(() => {
        const levelId = form.watch("levelId");
        if (levelId && levelId !== "none") {
            setFilteredClasses(classes.filter(cls => cls.levelId === levelId));
        } else {
            setFilteredClasses(classes);
        }
    }, [form.watch("levelId"), classes]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            setProfileImage(file);
            setProfileImageUrl(URL.createObjectURL(file));
        }
    };

    const nextStep = async () => {
        let fields: any[] = [];
        if (currentStep === 0) fields = ["name", "email", "password", "dateOfBirth", "gender", "religion", "bloodGroup"];
        if (currentStep === 1) fields = ["phone", "address", "city", "state", "country"];
        
        const isValid = await form.trigger(fields as any);
        if (isValid) setCurrentStep(prev => prev + 1);
    };

    const prevStep = () => setCurrentStep(prev => prev - 1);

    const onSubmit = async (values: FormValues) => {
        setIsLoading(true);
        try {
            const formData = new FormData();
            Object.entries(values).forEach(([key, value]) => {
                if (value instanceof Date) formData.append(key, value.toISOString());
                else if (value !== undefined && value !== null) {
                    const finalValue = value === "none" ? "" : value.toString();
                    formData.append(key, finalValue);
                }
            });
            if (profileImage) formData.append("profileImage", profileImage);

            const url = studentToEdit ? `/api/students/${studentToEdit.id}` : "/api/students";
            const method = studentToEdit ? "PATCH" : "POST";

            const response = await fetch(url, { method, body: formData });
            const data = await response.json();

            if (!response.ok) {
                 throw new Error(data.message || "Operation failed");
            }

            toast.success(studentToEdit ? "Student updated" : "Student enrolled successfully");
            onSuccess?.();
            onOpenChange(false);
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "Failed to save student");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ResponsiveModal 
            open={open} 
            onOpenChange={onOpenChange}
            title={studentToEdit ? "Edit Student Profile" : "Admit New Student"}
            description={studentToEdit 
                ? "Update student academic and personal records." 
                : "Complete the enrollment process to admit a student."}
        >
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                     <div className="flex-1"></div>
                     <Badge variant="outline" className="px-3 py-1 bg-indigo-50 text-indigo-700 border-indigo-100 hidden sm:flex">
                        {studentToEdit ? "Update Mode" : "Enrollment Mode"}
                    </Badge>
                 </div>

                {!studentToEdit && (
                    <div className="mb-8 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                        <Stepper steps={STEPS} currentStep={currentStep} />
                    </div>
                )}

                <div className="flex-1 overflow-y-auto pr-2">
                     <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* Step 1: Personal Info */}
                            {(currentStep === 0 || studentToEdit) && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="relative w-20 h-20 rounded-full overflow-hidden bg-white border-2 border-slate-200">
                                            {profileImageUrl ? (
                                                <Image src={profileImageUrl} alt="Profile" fill className="object-cover" />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-slate-300"><Camera className="w-8 h-8"/></div>
                                            )}
                                        </div>
                                        <div>
                                            <Label className="font-semibold">Profile Photo</Label>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById("profileImage")?.click()}>
                                                    <Upload className="w-3 h-3 mr-2"/> Upload
                                                </Button>
                                                {profileImageUrl && <Button type="button" variant="ghost" size="sm" onClick={() => {setProfileImage(null); setProfileImageUrl(null)}} className="text-red-500 hover:text-red-600"><X className="w-4 h-4"/></Button>}
                                                <input id="profileImage" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="name" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Full Name <span className="text-red-500">*</span></FormLabel>
                                                <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="email" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email Address <span className="text-red-500">*</span></FormLabel>
                                                <FormControl><Input placeholder="student@school.com" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>

                                    {!studentToEdit && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField control={form.control} name="password" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Password <span className="text-red-500">*</span></FormLabel>
                                                    <FormControl><PasswordInput {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <div className="flex items-end">
                                                <Button type="button" variant="secondary" onClick={() => form.setValue("password", generatePassword())} className="w-full">
                                                    Generate Strong Password
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <FormField control={form.control} name="gender" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Gender <span className="text-red-500">*</span></FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                                                    <SelectContent>{genderOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="bloodGroup" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Blood Group <span className="text-red-500">*</span></FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                                                    <SelectContent>{bloodGroupOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Date of Birth <span className="text-red-500">*</span></FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : "Pick a date"} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date()} initialFocus /></PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                    
                                    <FormField control={form.control} name="religion" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Religion <span className="text-red-500">*</span></FormLabel>
                                                <FormControl><Input placeholder="e.g. Christianity" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                    )} />
                                </div>
                            )}

                            {/* Step 2: Contact Info */}
                            {(currentStep === 1 || studentToEdit) && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <h3 className={`font-semibold text-lg flex items-center gap-2 ${studentToEdit ? 'pt-6 border-t mt-6' : ''}`}>
                                        <Mail className="h-4 w-4" /> Contact Information
                                    </h3>
                                    <FormField control={form.control} name="address" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Residential Address <span className="text-red-500">*</span></FormLabel>
                                            <FormControl><Input placeholder="Full street address" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="phone" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Phone Number <span className="text-red-500">*</span></FormLabel>
                                                <FormControl><Input placeholder="+123456789" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="city" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>City <span className="text-red-500">*</span></FormLabel>
                                                <FormControl><Input placeholder="City" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="state" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>State <span className="text-red-500">*</span></FormLabel>
                                                <FormControl><Input placeholder="State/Province" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="country" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Country <span className="text-red-500">*</span></FormLabel>
                                                <FormControl><Input placeholder="Country" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Academic Info */}
                            {(currentStep === 2 || studentToEdit) && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <h3 className={`font-semibold text-lg flex items-center gap-2 ${studentToEdit ? 'pt-6 border-t mt-6' : ''}`}>
                                        <CalendarIcon className="h-4 w-4" /> Academic Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="departmentId" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Department</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="none">None</SelectItem>
                                                        {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        
                                        <FormField control={form.control} name="levelId" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Level</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="none">None</SelectItem>
                                                        {levels.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )} />

                                        <FormField control={form.control} name="classId" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Class</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="none">None</SelectItem>
                                                        {filteredClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name} {c.section ? `(${c.section})` : ""}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )} />

                                        <FormField control={form.control} name="sessionId" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Session</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="none">None</SelectItem>
                                                        {sessions.map(s => <SelectItem key={s.id} value={s.id}>{s.name} {s.isCurrent ? "(Current)" : ""}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )} />

                                        <FormField control={form.control} name="admissionDate" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Admission Date</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : "Pick a date"} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date()} initialFocus /></PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )} />

                                        <FormField control={form.control} name="rollNumber" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Roll Number</FormLabel>
                                                <FormControl><Input placeholder="Optional" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                </div>
                            )}
                        </form>
                     </Form>
                </div>
                
                <div className="pt-4 border-t mt-4 flex justify-between items-center">
                    {currentStep > 0 && !studentToEdit ? (
                        <Button variant="outline" onClick={prevStep} className="rounded-xl px-6">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
                    ) : (
                         <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl px-6">
                            Cancel
                        </Button>
                    )}

                    {!studentToEdit && currentStep < STEPS.length - 1 ? (
                        <Button onClick={nextStep} className="rounded-xl px-6">
                            Next Step <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoading} className="rounded-xl px-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200">
                             {isLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                             {studentToEdit ? "Update Student" : "Complete Admission"}
                        </Button>
                    )}
                </div>
            </div>
        </ResponsiveModal>
    )
}