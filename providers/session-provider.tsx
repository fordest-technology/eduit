"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { UserRole } from "@/lib/auth";

interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    schoolId?: string;
    profileImage?: string;
}

interface SessionContextType {
    user: User | null;
    loading: boolean;
}

const SessionContext = createContext<SessionContextType>({
    user: null,
    loading: true,
});

export function useSession() {
    return useContext(SessionContext);
}

export function CustomSessionProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const pathname = usePathname();

    useEffect(() => {
        async function loadSession() {
            try {
                const response = await fetch('/api/auth/session');
                if (response.ok) {
                    const data = await response.json();
                    setUser(data);
                }
            } catch (error) {
                console.error('Failed to load session:', error);
            } finally {
                setLoading(false);
            }
        }

        loadSession();
    }, []);

    // For public paths, we don't need to check authentication
    const isPublicPath = pathname.startsWith("/api/public") ||
        pathname === "/api/auth/session" ||
        pathname === "/login" ||
        pathname === "/register";

    if (isPublicPath) {
        return <>{children}</>;
    }

    return (
        <SessionContext.Provider value={{ user, loading }}>
            {children}
        </SessionContext.Provider>
    );
} 