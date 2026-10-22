"use client";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

interface AuthContextType {
    userRole: string | null;
    loading: boolean;
    userName: string | null;
    userEmail: string | null;
    userAvatar: string | null;
    refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    userRole: null,
    loading: true,
    userName: null,
    userEmail: null,
    userAvatar: null,
    refreshAuth: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [userRole, setUserRole] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [userAvatar, setUserAvatar] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshAuth = useCallback(async () => {
        try {
            const res = await fetch("/api/auth/status", { cache: "no-store" });
            const data = await res.json();
            if (data.authenticated) {
                setUserRole(data.role);
                const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ");
                setUserName(fullName || data.email || null);
                setUserEmail(data.email || null);
                setUserAvatar(data.avatarUrl || null);
            } else {
                setUserRole(null);
                setUserName(null);
                setUserEmail(null);
                setUserAvatar(null);
            }
        } catch {
            setUserRole(null);
            setUserName(null);
            setUserEmail(null);
            setUserAvatar(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshAuth();
    }, [pathname, refreshAuth]);

    return (
        <AuthContext.Provider value={{ userRole, loading, userName, userEmail, userAvatar, refreshAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}