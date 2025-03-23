"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
    Users,
    GraduationCap,
    BookOpen,
    Mail,
    Phone,
    MapPin
} from "lucide-react";

interface SchoolDetailsProps {
    schoolId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface SchoolDetails {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
    logo: string | null;
    shortName: string;
    createdAt: string;
    teacherCount: number;
    studentCount: number;
    parentCount: number;
    subjectCount: number;
    recentTeachers: User[];
    recentStudents: User[];
    subjects: Subject[];
}

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    profileImage: string | null;
}

interface Subject {
    id: string;
    name: string;
    code: string;
}

async function fetchSchoolDetails(id: string): Promise<SchoolDetails> {
    const response = await fetch(`/api/admin/schools/${id}`);
    if (!response.ok) {
        throw new Error('Failed to fetch school details');
    }
    return response.json();
}

export function SchoolDetailsDialog({ schoolId, open, onOpenChange }: SchoolDetailsProps) {
    const { data: school, isLoading } = useQuery({
        queryKey: ['school', schoolId],
        queryFn: () => fetchSchoolDetails(schoolId),
        enabled: open,
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>School Details</DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                ) : school ? (
                    <div className="space-y-6">
                        {/* School Header */}
                        <div className="flex items-start gap-4">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={school.logo || ''} alt={school.name} />
                                <AvatarFallback>{school.shortName}</AvatarFallback>
                            </Avatar>
                            <div>
                                <h2 className="text-2xl font-bold">{school.name}</h2>
                                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        {school.email}
                                    </div>
                                    {school.phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4" />
                                            {school.phone}
                                        </div>
                                    )}
                                    {school.address && (
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            {school.address}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Statistics */}
                        <div className="grid gap-4 md:grid-cols-4">
                            <StatsCard
                                title="Teachers"
                                value={school.teacherCount}
                                icon={<Users className="h-4 w-4 text-blue-600" />}
                            />
                            <StatsCard
                                title="Students"
                                value={school.studentCount}
                                icon={<GraduationCap className="h-4 w-4 text-purple-600" />}
                            />
                            <StatsCard
                                title="Parents"
                                value={school.parentCount}
                                icon={<Users className="h-4 w-4 text-orange-600" />}
                            />
                            <StatsCard
                                title="Subjects"
                                value={school.subjectCount}
                                icon={<BookOpen className="h-4 w-4 text-emerald-600" />}
                            />
                        </div>

                        {/* Detailed Information */}
                        <Tabs defaultValue="teachers" className="w-full">
                            <TabsList>
                                <TabsTrigger value="teachers">Teachers</TabsTrigger>
                                <TabsTrigger value="students">Students</TabsTrigger>
                                <TabsTrigger value="subjects">Subjects</TabsTrigger>
                            </TabsList>

                            <TabsContent value="teachers" className="mt-4">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium">Recent Teachers</h3>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {school.recentTeachers.map((teacher) => (
                                            <UserCard key={teacher.id} user={teacher} />
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="students" className="mt-4">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium">Recent Students</h3>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {school.recentStudents.map((student) => (
                                            <UserCard key={student.id} user={student} />
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="subjects" className="mt-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    {school.subjects.map((subject) => (
                                        <Card key={subject.id}>
                                            <CardHeader>
                                                <CardTitle className="text-sm">
                                                    {subject.name}
                                                    <span className="ml-2 text-xs text-muted-foreground">
                                                        {subject.code}
                                                    </span>
                                                </CardTitle>
                                            </CardHeader>
                                        </Card>
                                    ))}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}

function StatsCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    );
}

function UserCard({ user }: { user: User }) {
    return (
        <Card>
            <CardContent className="flex items-center gap-4 py-4">
                <Avatar>
                    <AvatarImage src={user.profileImage || ''} alt={user.name} />
                    <AvatarFallback>
                        {user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
            </CardContent>
        </Card>
    );
} 