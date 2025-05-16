"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash2, Eye, UserPlus } from "lucide-react"
import Link from "next/link"

export interface ParentColumn {
    id: string
    name: string
    email: string
    profileImage?: string | null
    phone?: string | null
    childrenCount: number
}

export const columns: ColumnDef<ParentColumn>[] = [
    {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => {
            const parent = row.original
            return (
                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={parent.profileImage || undefined} alt={parent.name} />
                        <AvatarFallback>
                            {parent.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-medium">{parent.name}</div>
                        <div className="text-sm text-muted-foreground">{parent.email}</div>
                    </div>
                </div>
            )
        }
    },
    {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => row.original.phone || "Not provided"
    },
    {
        accessorKey: "childrenCount",
        header: "Children",
        cell: ({ row }) => {
            const count = row.original.childrenCount
            return (
                <div className="font-medium">
                    {count} {count === 1 ? "child" : "children"}
                </div>
            )
        }
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const parent = row.original

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/parents/${parent.id}`} className="flex items-center">
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/parents/${parent.id}/edit`} className="flex items-center">
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Parent
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/parents/${parent.id}`} className="flex items-center">
                                <UserPlus className="mr-2 h-4 w-4" />
                                Manage Children
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    }
] 