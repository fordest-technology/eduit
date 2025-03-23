import Link from "next/link"
import { Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { UserRole } from "@/lib/auth"

interface Session {
    id: string
    name: string
    email: string
    role: UserRole
    schoolId?: string
    profileImage?: string | null
}

interface DashboardNavProps {
    user: Session
}

export function DashboardNav({ user }: DashboardNavProps) {
    const getRoleName = (role: string) => {
        switch (role) {
            case "SUPER_ADMIN":
                return "Super Admin Dashboard"
            case "SCHOOL_ADMIN":
                return "School Admin Dashboard"
            case "TEACHER":
                return "Teacher Dashboard"
            case "STUDENT":
                return "Student Dashboard"
            case "PARENT":
                return "Parent Dashboard"
            default:
                return "Dashboard"
        }
    }

    return (
        <header className="sticky top-0 z-30 w-full border-b bg-white">
            <div className="flex h-16 items-center px-6">
                <div className="flex flex-1 items-center gap-4">
                    <h1 className="text-lg font-semibold text-gray-900">{getRoleName(user.role)}</h1>
                    <form className="hidden lg:block">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                type="search"
                                placeholder="Search..."
                                className="w-[200px] pl-8 lg:w-[300px] border-gray-300 focus:border-gray-400 focus:ring-gray-400"
                            />
                        </div>
                    </form>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="relative text-gray-500 hover:bg-gray-100">
                        <Bell className="h-5 w-5" />
                        <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white">
                            2
                        </span>
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                <Avatar className="h-8 w-8 border border-gray-200">
                                    {user.profileImage ? (
                                        <AvatarImage src={user.profileImage} alt={user.name} />
                                    ) : (
                                        <AvatarFallback className="bg-gray-200 text-gray-700">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                                    )}
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user.name}</p>
                                    <p className="text-xs leading-none text-gray-500">{user.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild className="hover:bg-gray-100">
                                <Link href="/dashboard/settings">Settings</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="hover:bg-red-50 text-red-600">
                                <Link href="/api/auth/logout">Log out</Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
} 