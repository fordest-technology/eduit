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
        <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center px-4">
                <div className="flex flex-1 items-center gap-4">
                    <h1 className="text-lg font-semibold">{getRoleName(user.role)}</h1>
                    <form className="hidden lg:block">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search..."
                                className="w-[200px] pl-8 lg:w-[300px]"
                            />
                        </div>
                    </form>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-4 w-4" />
                        <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                            2
                        </span>
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.profileImage} alt={user.name} />
                                    <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user.name}</p>
                                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/settings">Settings</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/api/auth/logout">Log out</Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
} 