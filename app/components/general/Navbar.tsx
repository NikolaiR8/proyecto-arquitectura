"use client";

import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import LogoutButton from "../general/LogoutButton";
import LoginButton from "../general/LoginButton";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export default function Navbar() {
    const [open, setOpen] = useState(false);
    const { userRole, loading } = useAuth();
    const isLoggedIn = userRole !== null;
    
    const pathname = usePathname();
    const isActive = (href: string) => pathname === href;

    useEffect(() => {
        const handleChangePage = () => {
            setOpen(false);  
        };
        handleChangePage();
    }, [pathname]);

    return (
        <header className="bg-black/90 backdrop-blur-md border-b border-white/10 h-20 text-lg flex items-center px-6 md:px-10 text-white sticky top-0 z-50 shadow-2xl">
            <div className="flex items-center">
                <Link href="/" className="flex items-center gap-2 group">
                    <img src="/icon.png" alt="Logo CanchasDioguinho" className="w-8 h-8 rounded-full object-cover group-hover:scale-110 transition-transform border border-emerald-500/40" />
                    <h1 className="text-2xl font-black text-emerald-400 tracking-tight title-glow-hover">
                        CanchasDioguinho
                    </h1>
                </Link>
                {userRole === "admin" && 
                    <div className="flex items-center">
                        <div className="w-px h-8 mx-4 bg-white/20" /> 
                        <span className="text-xs uppercase font-extrabold tracking-widest bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                            Admin
                        </span>
                    </div>
                }
            </div>

            <nav className="hidden lg:flex items-center ml-auto text-base">
                <div className="px-4 py-1 border-r border-white/15 mr-6 gap-6 xl:gap-8 flex font-medium">
                    <Link href="/" className={`transition-all ${isActive("/") ? "font-bold text-emerald-400 text-glow" : "text-gray-300 hover:text-white"} text-glow-hover`}>
                        Inicio
                    </Link>
                    <Link href="/booking" className={`transition-all ${isActive("/booking") ? "font-bold text-emerald-400 text-glow" : "text-gray-300 hover:text-white"} text-glow-hover`}>
                        Reservar Cancha
                    </Link>
                    <Link href="/reservations" className={`transition-all ${isActive("/reservations") ? "font-bold text-emerald-400 text-glow" : "text-gray-300 hover:text-white"} text-glow-hover`}>
                        Mis Reservas
                    </Link>
                    {userRole === "admin" && 
                        <div className="flex gap-6 xl:gap-8">
                            <Link href="/admin/payments" className={`transition-all ${isActive("/admin/payments") ? "font-bold text-amber-400 text-glow" : "text-gray-300 hover:text-amber-300"} text-glow-hover flex items-center gap-1`}>
                                ⏳ Verificar Pagos
                            </Link>
                            <Link href="/admin/bookings" className={`transition-all ${isActive("/admin/bookings") ? "font-bold text-emerald-400 text-glow" : "text-gray-300 hover:text-white"} text-glow-hover`}>
                                Panel Reservas
                            </Link>
                            <Link href="/admin/stats" className={`transition-all ${isActive("/admin/stats") ? "font-bold text-emerald-400 text-glow" : "text-gray-300 hover:text-white"} text-glow-hover`}>
                                Estadísticas
                            </Link>
                        </div>
                    }
                </div>
                {loading ? <p className="text-sm text-gray-400">Cargando...</p> : (isLoggedIn ? <LogoutButton /> : <LoginButton />)}
            </nav>

            <div className="lg:hidden ml-auto">
                <HamburgerButton open={open} toggle={() => setOpen(!open)} />
            </div>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-20 left-0 right-0 bg-white border-b border-gray-200 shadow-xl flex flex-col px-8 py-6 gap-4 z-50"
                    >
                        <Link href="/" className={`text-lg ${isActive("/") ? "font-bold text-emerald-600" : "text-gray-700"}`}>
                            Inicio
                        </Link>
                        <Link href="/booking" className={`text-lg ${isActive("/booking") ? "font-bold text-emerald-600" : "text-gray-700"}`}>
                            Reservar Cancha
                        </Link>
                        <Link href="/reservations" className={`text-lg ${isActive("/reservations") ? "font-bold text-emerald-600" : "text-gray-700"}`}>
                            Mis Reservas
                        </Link>
                        {userRole === "admin" && 
                            <div className="flex flex-col gap-4 border-t pt-3">
                                <Link href="/admin/payments" className={`text-lg ${isActive("/admin/payments") ? "font-bold text-amber-600" : "text-gray-700"}`}>
                                    ⏳ Verificar Pagos
                                </Link>
                                <Link href="/admin/bookings" className={`text-lg ${isActive("/admin/bookings") ? "font-bold text-emerald-600" : "text-gray-700"}`}>
                                    Panel Reservas
                                </Link>
                                <Link href="/admin/stats" className={`text-lg ${isActive("/admin/stats") ? "font-bold text-emerald-600" : "text-gray-700"}`}>
                                    Estadísticas
                                </Link>
                            </div>
                        }
                        <div className="pt-2 border-t">
                            {loading ? <p className="text-sm text-gray-400">Cargando...</p> : (isLoggedIn ? <LogoutButton /> : <LoginButton />)}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}

function HamburgerButton({ open, toggle }: {open: boolean, toggle: () => void}) {
    return (
        <button onClick={toggle} aria-label="Menu" className="flex flex-col gap-1.5 p-2 rounded-lg hover:bg-gray-100">
            <motion.span
                animate={open ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
                className="block w-6 h-0.5 bg-gray-800 origin-center"
            />
            <motion.span
                animate={open ? { opacity: 0 } : { opacity: 1 }}
                className="block w-6 h-0.5 bg-gray-800"
            />
            <motion.span
                animate={open ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
                className="block w-6 h-0.5 bg-gray-800 origin-center"
            />
        </button>
    );
}