"use client"

import { ColumnDef, Row } from "@tanstack/react-table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash, GraduationCap, UsersRound, User2, ArrowUpDown } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export interface Student {
    id: string
    name: string
    email: string
    profileImage: string | null
    rollNumber?: string
    classes: Array<{
        id: string
        class: {
            id: string
            name: string
            section?: string
            level: {
                id: string
                name: string
            }
        }
    }>
    currentClass?: {
        id: string
        name: string
        section?: string
        level?: {
            id: string
            name: string
        }
        rollNumber?: string
        status: 'ACTIVE' | 'INACTIVE' | 'PENDING'
    }
    hasParents: boolean
    parentNames?: string
}

export const columns: ColumnDef<Student>[] = [
    {
        accessorKey: "name",
        header: "Student",
        cell: ({ row }) => {
            const student = row.original
            return (
                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={student.profileImage || ""} alt={student.name} />
                        <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-medium">{student.name}</div>
                        <div className="text-xs text-muted-foreground">{student.email}</div>
                    </div>
                </div>
            )
        },
    },
    {
        accessorKey: "class",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Class
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const student = row.original;
            if (!student.currentClass) {
                return <span className="text-muted-foreground">Not Assigned</span>;
            }

            const { name, section, level } = student.currentClass;
            return (
                <div>
                    {name} {section || ""}
                    {level?.name && ` (${level.name})`}
                </div>
            );
        },
    },
    {
        accessorKey: "level",
        header: "Level",
        cell: ({ row }) => {
            const student = row.original
            return student.currentClass?.level?.name || "Not Assigned"
        }
    },
    {
        accessorKey: "rollNumber",
        header: "Roll Number",
        cell: ({ row }) => {
            const student = row.original
            return student.currentClass?.rollNumber || "-"
        }
    },
    {
        accessorKey: "parentNames",
        header: "Parents",
        cell: ({ row }) => {
            const student = row.original
            return (
                <div>
                    {student.hasParents ? (
                        <div className="max-w-[200px] truncate" title={student.parentNames}>
                            {student.parentNames}
                        </div>
                    ) : (
                        <Badge variant="outline" className="text-muted-foreground">None</Badge>
                    )}
                </div>
            )
        },
    },
    {
        id: "actions",
        cell: ({ row }: { row: Row<Student> }) => {
            const student = row.original

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/students/${student.id}`}>
                                <User2 className="mr-2 h-4 w-4" />
                                View Profile
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/students/${student.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Student
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/students/${student.id}/attendance`}>
                                <GraduationCap className="mr-2 h-4 w-4" />
                                Attendance
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/students/${student.id}/parents`}>
                                <UsersRound className="mr-2 h-4 w-4" />
                                Manage Parents
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                                // Will implement delete functionality
                            }}
                        >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete Student
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
] 