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
import { MoreHorizontal, Eye } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { Student } from "@/types"

interface ChildrenTableProps {
    children: Student[]
}

export function ChildrenTable({ children }: ChildrenTableProps) {
    const router = useRouter();

    const handleViewChild = (id: string) => {
        router.push(`/dashboard/children/${id}`);
    };

    return (
        <div>
            {children.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg">
                    <p className="text-muted-foreground">No children found. Please contact the school administration.</p>
                </div>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Classes</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {children.map((child) => (
                                <TableRow key={child.id}>
                                    <TableCell className="font-medium">{child.user.name}</TableCell>
                                    <TableCell>{child.user.email}</TableCell>
                                    <TableCell>
                                        {child.classes.length > 0
                                            ? child.classes.map((cls: { className: string; section: string | null }) =>
                                                `${cls.className}${cls.section ? ` - ${cls.section}` : ''}`).join(', ')
                                            : 'No classes assigned'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/dashboard/children/${child.id}`}>
                                            <Button variant="ghost" size="icon">
                                                <Eye className="h-4 w-4" />
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