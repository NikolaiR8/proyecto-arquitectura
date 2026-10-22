"use client";

import LoginButton from "./components/general/LoginButton";
import { useAuth } from "./context/AuthContext";
import Link from "next/link";
import { Calendar, ShieldCheck, Clock, Award } from "lucide-react";

export default function Home() {
    const { userRole, loading } = useAuth();
    const isLoggedIn = userRole !== null;

    return (
        <div className="relative min-h-[calc(100vh-80px)] flex flex-col justify-center items-center px-4 py-16 overflow-hidden font-sans bg-black">
            {/* Background Stadium - High Prominence with Cinematic Vignette (Inspired by Sybarite reference) */}
            <div 
                className="absolute inset-0 bg-cover bg-center opacity-60 filter brightness-90 saturate-110 pointer-events-none scale-100 transition-all duration-700"
                style={{ backgroundImage: "url('/stadium-bg.jpg')" }}
            />
            {/* Radial & linear dark gradients to guarantee text legibility while displaying the stadium clearly */}
            <div className="absolute inset-0 bg-radial from-black/40 via-black/75 to-black/95 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80 pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center justify-center max-w-4xl text-center">
                {/* Logo Oficial Canchas Dioguinho */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                    src="/logo.png" 
                    alt="Logo Canchas Dioguinho" 
                    className="w-28 h-28 sm:w-36 sm:h-36 object-contain drop-shadow-[0_0_35px_rgba(52,211,153,0.6)] mb-6 hover:scale-105 transition-transform"
                />

                <span className="inline-flex items-center gap-2 px-5 py-2 mb-6 text-xs sm:text-sm font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 rounded-full uppercase tracking-widest backdrop-blur-md shadow-[0_4px_20px_rgba(16,185,129,0.25)] hover:border-emerald-400 hover:text-white transition-all cursor-default text-glow-hover">
                    COMPLEJO DEPORTIVO DIOGUINHO · FÚTBOL DE ÉLITE
                </span>

                <h1 className="font-black text-4xl sm:text-6xl lg:text-7xl text-white mb-6 tracking-tight leading-[1.1] title-glow-hover cursor-default">
                    JUEGA COMO LOS GRANDES: <br className="hidden sm:inline" />
                    RESERVA EN <span className="text-emerald-400 drop-shadow-[0_0_25px_rgba(52,211,153,0.8)]">FÚTBOL 5</span>
                </h1>

                <p className="text-lg sm:text-2xl text-gray-200 mb-10 max-w-2xl font-medium leading-relaxed text-glow hover:text-white transition-colors duration-300">
                    10 canchas sintéticas de última generación. Consulta disponibilidad en tiempo real, reserva tu turno y vive la experiencia profesional.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-5 mb-16">
                    {loading ? (
                        <div className="h-14 w-48 bg-gray-800/80 animate-pulse rounded-full border border-gray-700" />
                    ) : isLoggedIn ? (
                        <Link
                            href="/booking"
                            className="bg-emerald-500 hover:bg-emerald-400 text-gray-950 text-base sm:text-lg font-extrabold px-10 py-4 rounded-full transition-all duration-300 shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:shadow-[0_0_45px_rgba(16,185,129,0.8)] hover:-translate-y-1 hover:scale-105"
                        >
                            + RESERVAR UNA CANCHA
                        </Link>
                    ) : (
                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                            <Link
                                href="/booking"
                                className="bg-emerald-500 hover:bg-emerald-400 text-gray-950 text-base sm:text-lg font-extrabold px-10 py-4 rounded-full transition-all duration-300 shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:shadow-[0_0_45px_rgba(16,185,129,0.8)] hover:-translate-y-1 hover:scale-105"
                            >
                                RESERVAR CANCHA
                            </Link>
                            <LoginButton />
                        </div>
                    )}
                    {isLoggedIn && (
                        <Link
                            href="/reservations"
                            className="bg-black/70 hover:bg-black/90 text-white border-2 border-white/30 hover:border-emerald-400 text-base sm:text-lg font-bold px-8 py-3.5 rounded-full transition-all shadow-lg backdrop-blur-md text-glow-hover hover:-translate-y-0.5"
                        >
                            Ver Mis Reservas
                        </Link>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl text-left">
                    <div className="p-6 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-2xl border border-white/10 hover:border-emerald-500/50 shadow-2xl flex flex-col gap-2 transition-all duration-300 hover:-translate-y-1 group">
                        <div className="w-12 h-12 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <h2 className="font-extrabold text-xl text-white group-hover:text-emerald-300 transition-colors title-glow-hover">
                            10 Canchas Pro
                        </h2>
                        <p className="text-sm text-gray-300 font-medium group-hover:text-gray-100 transition-colors">
                            Grama sintética profesional con iluminación LED nocturna de potencia de estadio.
                        </p>
                    </div>

                    <div className="p-6 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-2xl border border-white/10 hover:border-emerald-500/50 shadow-2xl flex flex-col gap-2 transition-all duration-300 hover:-translate-y-1 group">
                        <div className="w-12 h-12 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Clock className="w-6 h-6" />
                        </div>
                        <h2 className="font-extrabold text-xl text-white group-hover:text-emerald-300 transition-colors title-glow-hover">
                            Horarios Flexibles
                        </h2>
                        <p className="text-sm text-gray-300 font-medium group-hover:text-gray-100 transition-colors">
                            De 08:00 a 22:00 todos los días con disponibilidad en vivo por turnos.
                        </p>
                    </div>

                    <div className="p-6 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-2xl border border-white/10 hover:border-emerald-500/50 shadow-2xl flex flex-col gap-2 transition-all duration-300 hover:-translate-y-1 group">
                        <div className="w-12 h-12 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <h2 className="font-extrabold text-xl text-white group-hover:text-emerald-300 transition-colors title-glow-hover">
                            Pago Seguro
                        </h2>
                        <p className="text-sm text-gray-300 font-medium group-hover:text-gray-100 transition-colors">
                            Transferencias Banco Pichincha con verificación y confirmación inmediata.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
