"use client"

import { useState, useRef, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
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
import { Button } from "@/components/ui/button"
import { Loader2, Camera, Upload, X, CalendarIcon } from "lucide-react"
import { UserRole } from "@prisma/client"
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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

// Add gender options array
const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
];

// Add blood group options
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

// Define the form schema with user and student fields separately
const formSchema = z.object({
    // User model fields
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: z.string().min(6).optional(),
    profileImage: z.any().optional(),

    // Student model fields
    admissionDate: z.date().optional(),
    departmentId: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    phone: z.string().optional(),
    dateOfBirth: z.date().optional(),
    gender: z.string().optional(),
    religion: z.string().optional(),
    bloodGroup: z.string().optional(),

    // StudentClass relationship
    levelId: z.string().optional(),
    classId: z.string().optional(),
    sessionId: z.string().optional(),
    rollNumber: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface Department {
    id: string
    name: string
}

interface SchoolLevel {
    id: string
    name: string
    description: string | null
}

interface Class {
    id: string
    name: string
    section?: string | null
    levelId?: string | null
}

interface AcademicSession {
    id: string
    name: string
    isCurrent: boolean
}

interface AddStudentModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
    studentToEdit?: any // For editing existing student
}

export function AddStudentModal({
    open,
    onOpenChange,
    onSuccess,
    studentToEdit
}: AddStudentModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [profileImage, setProfileImage] = useState<File | null>(null)
    const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null)
    const [departments, setDepartments] = useState<Department[]>([])
    const [levels, setLevels] = useState<SchoolLevel[]>([])
    const [classes, setClasses] = useState<Class[]>([])
    const [sessions, setSessions] = useState<AcademicSession[]>([])
    const [filteredClasses, setFilteredClasses] = useState<Class[]>([])
    const router = useRouter()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            // User fields
            name: "",
            email: "",
            password: "",

            // Student fields
            admissionDate: new Date(),
            phone: "",
            address: "",
            city: "",
            state: "",
            country: "",
            dateOfBirth: undefined,
            gender: "male",
            religion: "",
            bloodGroup: "",

            // Relationships
            departmentId: "",
            levelId: "",
            classId: "",
            sessionId: "",
            rollNumber: "",
        },
    })

    // Set form values when editing a student
    useEffect(() => {
        if (studentToEdit && open) {
            // Set existing user data to the form
            form.reset({
                // User fields
                name: studentToEdit.name || "",
                email: studentToEdit.email || "",
                // Don't set password for editing

                // Student fields
                admissionDate: studentToEdit.admissionDate ? new Date(studentToEdit.admissionDate) : new Date(),
                phone: studentToEdit.phone || "",
                address: studentToEdit.address || "",
                city: studentToEdit.city || "",
                state: studentToEdit.state || "",
                country: studentToEdit.country || "",
                dateOfBirth: studentToEdit.dateOfBirth ? new Date(studentToEdit.dateOfBirth) : undefined,
                gender: studentToEdit.gender || "male",
                religion: studentToEdit.religion || "",
                bloodGroup: studentToEdit.bloodGroup || "",

                // Relationships
                departmentId: studentToEdit.departmentId || "",
                levelId: studentToEdit.levelId || studentToEdit.class?.levelId || "",
                classId: studentToEdit.classId || "",
                sessionId: studentToEdit.sessionId || "",
                rollNumber: studentToEdit.rollNumber || "",
            });

            // If there's a profile image, set it
            if (studentToEdit.profileImage) {
                setProfileImageUrl(studentToEdit.profileImage);
            }
        }
    }, [studentToEdit, open, form]);

    // Fetch departments, school levels, and classes
    useEffect(() => {
        const fetchDataAndSetDefaults = async () => {
            try {
                // Fetch departments
                const departmentsResponse = await fetch('/api/departments');
                if (departmentsResponse.ok) {
                    const departmentsData = await departmentsResponse.json();
                    setDepartments(departmentsData);
                }

                // Fetch school levels
                const levelsResponse = await fetch('/api/school-levels');
                if (levelsResponse.ok) {
                    const levelsData = await levelsResponse.json();
                    setLevels(levelsData);
                }

                // Fetch classes
                const classesResponse = await fetch('/api/classes');
                if (classesResponse.ok) {
                    const classesData = await classesResponse.json();
                    setClasses(classesData);
                    setFilteredClasses(classesData);
                }

                // Fetch academic sessions
                const sessionsResponse = await fetch('/api/sessions');
                if (sessionsResponse.ok) {
                    const sessionsData = await sessionsResponse.json();
                    setSessions(sessionsData);

                    // If there's a current session, set it as default for new students
                    if (!studentToEdit) {
                        const currentSession = sessionsData.find((session: AcademicSession) => session.isCurrent);
                        if (currentSession) {
                            form.setValue('sessionId', currentSession.id);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                toast.error("Failed to load data");
            }
        };

        if (open) {
            fetchDataAndSetDefaults();
        }
    }, [open, form, studentToEdit]);

    // Filter classes based on selected level
    useEffect(() => {
        const levelId = form.watch('levelId');
        if (levelId) {
            const filtered = classes.filter(cls => cls.levelId === levelId);
            setFilteredClasses(filtered);

            // If current classId is not in filtered classes, reset it
            const currentClassId = form.getValues('classId');
            if (currentClassId && !filtered.some(cls => cls.id === currentClassId)) {
                form.setValue('classId', filtered[0]?.id || '');
            }
        } else {
            setFilteredClasses(classes);
        }
    }, [form.watch('levelId'), classes, form]);

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            setProfileImage(file);
            const imageUrl = URL.createObjectURL(file);
            setProfileImageUrl(imageUrl);
        }
    }

    function clearImage() {
        setProfileImage(null);
        setProfileImageUrl(null);
    }

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            setIsLoading(true)

            const formData = new FormData();

            // Add user fields
            formData.append('name', values.name);
            formData.append('email', values.email);
            if (values.password) formData.append('password', values.password);
            formData.append('role', UserRole.STUDENT);

            // Add student fields
            if (values.admissionDate) formData.append('admissionDate', values.admissionDate.toISOString());
            if (values.phone) formData.append('phone', values.phone);
            if (values.address) formData.append('address', values.address);
            if (values.city) formData.append('city', values.city);
            if (values.state) formData.append('state', values.state);
            if (values.country) formData.append('country', values.country);
            if (values.dateOfBirth) formData.append('dateOfBirth', values.dateOfBirth.toISOString());
            if (values.gender) formData.append('gender', values.gender);
            if (values.religion) formData.append('religion', values.religion);
            if (values.bloodGroup) formData.append('bloodGroup', values.bloodGroup);

            // Add relationships
            if (values.departmentId) formData.append('departmentId', values.departmentId);
            if (values.classId) formData.append('classId', values.classId);
            if (values.sessionId) formData.append('sessionId', values.sessionId);
            if (values.rollNumber) formData.append('rollNumber', values.rollNumber);

            // Append the profile image if it exists
            if (profileImage) {
                formData.append('profileImage', profileImage);
            }

            let url = "/api/students";
            let method = "POST";

            // If editing existing student
            if (studentToEdit?.id) {
                url = `/api/students/${studentToEdit.id}`;
                method = "PUT";
                formData.append('id', studentToEdit.id);
            }

            const response = await fetch(url, {
                method: method,
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to process student data");
            }

            toast.success(studentToEdit ? "Student updated successfully" : "Student added successfully");

            // Force an immediate page refresh to show new student
            router.refresh();

            if (onSuccess) onSuccess();
            form.reset();
            setProfileImage(null);
            setProfileImageUrl(null);
            onOpenChange(false);
        } catch (error) {
            console.error("Error processing student data:", error);
            toast.error(error instanceof Error ? error.message : "Failed to process student data");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >
            <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>{studentToEdit ? "Edit Student" : "Add New Student"}</DialogTitle>
                    <DialogDescription>
                        {studentToEdit ? "Update student details in the system." : "Enter student details to add them to the system."}
                    </DialogDescription>
                </DialogHeader>

                <div className="mb-6">
                    <div className="flex items-center gap-6">
                        <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100">
                            {profileImageUrl ? (
                                <>
                                    <Image
                                        src={profileImageUrl}
                                        alt="Profile"
                                        width={96}
                                        height={96}
                                        className="object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={clearImage}
                                        className="absolute top-0 right-0 bg-red-500 p-1 rounded-full"
                                    >
                                        <X className="h-3 w-3 text-white" />
                                    </button>
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-full bg-muted">
                                    <Camera className="h-8 w-8 text-muted-foreground" />
                                </div>
                            )}
                        </div>
                        <div>
                            <Label htmlFor="profileImage">Profile Photo</Label>
                            <Input
                                id="profileImage"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="mt-2"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Upload a profile photo (optional)
                            </p>
                        </div>
                    </div>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Basic Info Section */}
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John Doe" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="john.doe@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {!studentToEdit && (
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="text"
                                                    {...field}
                                                    value={field.value || generatePassword(8)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+1234567890" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="departmentId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Department</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select department" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {departments.map((dept) => (
                                                    <SelectItem key={dept.id} value={dept.id}>
                                                        {dept.name}
                                                    </SelectItem>
                                                ))}
                                                {departments.length === 0 && (
                                                    <SelectItem value="no-departments" disabled>
                                                        No departments available
                                                    </SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="levelId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>School Level</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select school level" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {levels.map((level) => (
                                                    <SelectItem key={level.id} value={level.id}>
                                                        {level.name}
                                                    </SelectItem>
                                                ))}
                                                {levels.length === 0 && (
                                                    <SelectItem value="no-levels" disabled>
                                                        No levels available
                                                    </SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Class Selection */}
                            <FormField
                                control={form.control}
                                name="classId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Class</FormLabel>
                                        <Select
                                            disabled={isLoading}
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select class" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {filteredClasses.map((cls) => (
                                                    <SelectItem key={cls.id} value={cls.id}>
                                                        {cls.name}{cls.section ? ` - ${cls.section}` : ''}
                                                    </SelectItem>
                                                ))}
                                                {filteredClasses.length === 0 && (
                                                    <SelectItem value="no-classes" disabled>
                                                        {form.watch('levelId')
                                                            ? "No classes in this level"
                                                            : "Select a level first"}
                                                    </SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Academic Session Selection */}
                            {sessions.length > 0 && (
                                <FormField
                                    control={form.control}
                                    name="sessionId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Academic Session</FormLabel>
                                            <Select
                                                disabled={isLoading}
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select academic session" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {sessions.map((session) => (
                                                        <SelectItem key={session.id} value={session.id}>
                                                            {session.name}{session.isCurrent ? " (Current)" : ""}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <FormField
                                control={form.control}
                                name="rollNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Roll Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="S001" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="gender"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Gender</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select gender" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {genderOptions.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
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
                                name="dateOfBirth"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Date of Birth</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP")
                                                        ) : (
                                                            <span>Pick a date</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date > new Date() || date < new Date("1900-01-01")
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="admissionDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Admission Date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP")
                                                        ) : (
                                                            <span>Pick a date</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date > new Date() || date < new Date("1900-01-01")
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="bloodGroup"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Blood Group</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select blood group" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {bloodGroupOptions.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
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
                                name="religion"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Religion</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Religion" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Address Section */}
                        <div className="border-t pt-4">
                            <h3 className="text-lg font-medium mb-4">Address Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Address</FormLabel>
                                            <FormControl>
                                                <Input placeholder="123 Main St" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>City</FormLabel>
                                            <FormControl>
                                                <Input placeholder="New York" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="state"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>State/Province</FormLabel>
                                            <FormControl>
                                                <Input placeholder="NY" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="country"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Country</FormLabel>
                                            <FormControl>
                                                <Input placeholder="United States" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {studentToEdit ? "Updating..." : "Adding..."}
                                    </>
                                ) : (
                                    studentToEdit ? "Update Student" : "Add Student"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}