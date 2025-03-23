"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Pencil, Eye, Trash } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export type ParentColumn = {
    id: string
    name: string
    email: string
    phone: string
    children: string
    profileImage?: string
}

export const columns: ColumnDef<ParentColumn>[] = [
    {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => {
            const parent = row.original
            const initials = parent.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()

            return (
                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={parent.profileImage} alt={parent.name} />
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <span>{parent.name}</span>
                </div>
            )
        },
    },
    {
        accessorKey: "email",
        header: "Email",
    },
    {
        accessorKey: "phone",
        header: "Phone",
    },
    {
        accessorKey: "children",
        header: "Children",
        cell: ({ row }) => {
            const children = row.getValue("children") as string

            if (!children || children === "No children linked") {
                return <span className="text-muted-foreground">No children linked</span>
            }

            // If the string is too long, truncate it
            return children.length > 50
                ? <span title={children}>{children.substring(0, 50)}...</span>
                : <span>{children}</span>
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
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/parents/${parent.id}`} className="flex items-center cursor-pointer">
                                <Eye className="mr-2 h-4 w-4" /> View Details
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/parents/${parent.id}/edit`} className="flex items-center cursor-pointer">
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
] 