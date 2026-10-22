"use client";

import Link from "next/link";
import { GraduationCap, Code2, Heart, MapPin, Clock, Phone } from "lucide-react";

export default function Footer() {
    const students = [
        { name: "Nikolái Molina" },
        { name: "Erick Vilela" },
        { name: "Diogo Sánchez" },
        { name: "Germán Frías" },
        { name: "Cristhian Delgado" },
    ];

    return (
        <footer className="relative bg-black text-white border-t border-white/10 font-sans overflow-hidden z-20">
            {/* Subtle background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-emerald-500/10 blur-3xl pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 py-14 sm:py-16">
                {/* Apartado Principal de Autores / ULEAM */}
                <div className="mb-14 p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-black/80 to-gray-950 border border-emerald-500/30 shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-md">
                    <div className="text-center max-w-3xl mx-auto mb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 text-xs font-black uppercase tracking-widest text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.25)]">
                            <GraduationCap className="w-4 h-4 text-emerald-400" />
                            PROYECTO ACADÉMICO · INGENIERÍA DE SOFTWARE
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black text-white title-glow-hover tracking-tight">
                            Universidad Laica Eloy Alfaro de Manabí
                        </h2>
                        <p className="text-sm sm:text-base text-gray-300 mt-2 font-medium">
                            Facultad de Ciencias de la Vida y Tecnologías · Quinto Semestre (5to Semestre)
                            <br className="hidden sm:inline" />
                            <span className="text-emerald-400 font-semibold"> Cátedra de Arquitectura de Software · Manta, Manabí, Ecuador</span>
                        </p>

                        {/* Docente / Tutor */}
                        <div className="mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-xs sm:text-sm text-gray-200 shadow-md">
                            <span className="text-amber-400 font-extrabold uppercase tracking-wider text-[11px] sm:text-xs">Docente:</span>
                            <span className="text-white font-bold">Ing. Carlos Anchundia</span>
                        </div>
                    </div>

                    {/* Tarjetas de los 5 Integrantes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {students.map((student, idx) => (
                            <div 
                                key={idx}
                                className="group relative p-4 sm:p-5 rounded-2xl bg-black/60 hover:bg-black/90 border border-white/10 hover:border-emerald-500/50 transition-all duration-300 shadow-lg hover:-translate-y-1 flex flex-col justify-between"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-900 border border-emerald-400/50 flex items-center justify-center text-lg font-black text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] group-hover:scale-105 transition-transform shrink-0">
                                        ⚽
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-sm sm:text-base font-black text-white group-hover:text-emerald-300 transition-colors truncate">
                                            {student.name}
                                        </h3>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-[11px] pt-2.5 border-t border-white/10 text-gray-400">
                                    <span className="font-semibold text-emerald-400/90 flex items-center gap-1">
                                        <Code2 className="w-3 h-3" /> 5to Semestre
                                    </span>
                                    <span className="bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded font-bold">
                                        Fullstack
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sección Informativa del Complejo y Enlaces */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12 text-sm text-gray-300">
                    {/* Columna 1: Complejo */}
                    <div className="md:col-span-2 space-y-4">
                        <div className="flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                                src="/logo.png" 
                                alt="Canchas Dioguinho" 
                                className="w-11 h-11 object-contain drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" 
                            />
                            <span className="text-2xl font-black text-emerald-400 tracking-tight">
                                CanchasDioguinho
                            </span>
                        </div>
                        <p className="text-gray-400 leading-relaxed max-w-md">
                            Complejo deportivo de fútbol 5 con 10 canchas sintéticas profesionales, iluminación LED de estadio, reserva en tiempo real y pagos verificados al instante.
                        </p>
                        <div className="flex flex-wrap gap-4 text-xs text-gray-300 pt-1">
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-emerald-400" /> Lun - Dom: 08:00 a 22:00
                            </span>
                            <span className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-emerald-400" /> Manta, Manabí, Ecuador
                            </span>
                        </div>
                    </div>

                    {/* Columna 2: Navegación Rápida */}
                    <div className="space-y-3">
                        <h4 className="text-xs uppercase font-extrabold tracking-wider text-white">Navegación</h4>
                        <ul className="space-y-2 text-gray-400">
                            <li><Link href="/" className="hover:text-emerald-400 transition-colors">Inicio</Link></li>
                            <li><Link href="/booking" className="hover:text-emerald-400 transition-colors">Reservar Cancha</Link></li>
                            <li><Link href="/reservations" className="hover:text-emerald-400 transition-colors">Mis Reservas</Link></li>
                            <li><Link href="/profile" className="hover:text-emerald-400 transition-colors">Mi Perfil</Link></li>
                        </ul>
                    </div>

                    {/* Columna 3: Información de Contacto */}
                    <div className="space-y-3">
                        <h4 className="text-xs uppercase font-extrabold tracking-wider text-white">Atención y Soporte</h4>
                        <ul className="space-y-2 text-gray-400">
                            <li className="flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5 text-emerald-400" /> +593 98 434 3354
                            </li>
                            <li>ULEAM - Campus Central</li>
                            <li>Facultad de Ingeniería</li>
                            <li className="text-xs text-emerald-400 font-semibold pt-1">Sistema Web 100% Funcional</li>
                        </ul>
                    </div>
                </div>

                {/* Barra Inferior de Copyright */}
                <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
                    <p>
                        © 2026 CanchasDioguinho. Todos los derechos reservados.
                    </p>
                    <p className="flex items-center gap-1 text-gray-400">
                        Diseñado con pasión por el software y el fútbol <Heart className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" /> ULEAM 2026
                    </p>
                </div>
            </div>
        </footer>
    );
}
