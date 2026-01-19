"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Mail, User } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface Student {
    id: string;
    userId: string;
    name: string;
    email: string;
    profileImage: string | null;
    rollNumber: string | null;
    gender: string | null;
    dateOfBirth: Date | null;
}

interface ClassStudentListProps {
    students: Student[];
}

export function ClassStudentList({ students }: ClassStudentListProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredStudents = students.filter((student) =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.rollNumber && student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <Card className="border-none shadow-xl">
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <CardTitle className="text-lg">Students ({students.length})</CardTitle>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search students..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 rounded-xl"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {filteredStudents.length === 0 ? (
                    <div className="text-center py-12">
                        <User className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">
                            {searchQuery ? "No students found matching your search" : "No students in this class"}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <AnimatePresence mode="popLayout">
                            {filteredStudents.map((student, index) => (
                                <motion.div
                                    key={student.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Link href={`/dashboard/students/${student.id}`}>
                                        <Card className="border border-slate-100 hover:border-primary/20 hover:shadow-md transition-all duration-300 cursor-pointer group">
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-12 w-12 ring-2 ring-slate-100 group-hover:ring-primary/20 transition-all">
                                                        <AvatarImage src={student.profileImage || undefined} />
                                                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                                            {student.name.split(" ").map((n) => n[0]).join("")}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold truncate group-hover:text-primary transition-colors">
                                                            {student.name}
                                                        </p>
                                                        {student.rollNumber && (
                                                            <Badge variant="secondary" className="text-xs mt-1">
                                                                Roll: {student.rollNumber}
                                                            </Badge>
                                                        )}
                                                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                                                            <Mail className="h-3 w-3" />
                                                            <span className="truncate">{student.email}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
