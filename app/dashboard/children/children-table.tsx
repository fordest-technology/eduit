"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Eye, Mail, GraduationCap, ChevronRight, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

interface Student {
    id: string;
    user: {
        id: string;
        name: string;
        email: string;
        profileImage: string | null;
    };
    classes: Array<{
        classId: string;
        className: string;
        section: string | null;
    }>;
}

interface ChildrenTableProps {
    children: Student[]
}

export function ChildrenTable({ children }: ChildrenTableProps) {
    const router = useRouter();

    return (
        <div className="w-full">
            {children.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200">
                    <div className="h-16 w-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 text-slate-300">
                        <User className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-black font-sora text-slate-800">No children linked yet</h3>
                    <p className="text-slate-400 text-sm max-w-[300px] mt-2 font-medium">Please contact the school administration to synchronize your children with your parent profile.</p>
                </div>
            ) : (
                <div className="overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-slate-50">
                                <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] h-14">Student Entity</TableHead>
                                <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] h-14">Connectivity</TableHead>
                                <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] h-14">Academic Level</TableHead>
                                <TableHead className="text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] h-14 px-8">Analysis</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {children.map((child) => (
                                <TableRow key={child.id} className="group border-slate-50 hover:bg-slate-50/50 transition-colors duration-300">
                                    <TableCell className="py-5">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-12 w-12 rounded-2xl shadow-sm border-2 border-white group-hover:scale-110 transition-transform duration-500">
                                                <AvatarImage src={child.user.profileImage || undefined} className="object-cover" />
                                                <AvatarFallback className="bg-indigo-50 text-indigo-600 font-bold text-xs">
                                                    {child.user.name.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-black font-sora text-slate-800 tracking-tight">{child.user.name}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {child.id.substring(0, 8).toUpperCase()}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                                                <Mail className="h-4 w-4" />
                                            </div>
                                            <span className="text-xs font-bold text-slate-600 tracking-tight">{child.user.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1.5">
                                            {child.classes.length > 0 ? (
                                                child.classes.map((cls) => (
                                                    <Badge key={cls.classId} className="bg-white text-indigo-600 border border-indigo-100 px-3 py-0.5 rounded-lg font-bold text-[9px] tracking-widest uppercase shadow-sm">
                                                        {cls.className}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <Badge className="bg-slate-50 text-slate-300 border-none px-3 py-0.5 rounded-lg font-bold text-[9px] tracking-widest uppercase">
                                                    Level Pending
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right px-8">
                                        <Link href={`/dashboard/children/${child.id}`}>
                                            <Button variant="outline" size="sm" className="rounded-xl border-slate-200 font-bold text-xs h-9 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all duration-300 gap-2">
                                                Account Details <ChevronRight className="h-3 w-3" />
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    )
} 
