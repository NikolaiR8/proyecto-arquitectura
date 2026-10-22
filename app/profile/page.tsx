"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { 
    User, Mail, Phone, Lock, Camera, CheckCircle2, 
    Shield, Calendar, Trophy, Sparkles, AlertCircle, 
    Eye, EyeOff, Save, Trash2, ArrowRight
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface UserProfile {
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    avatarUrl: string | null;
    phone: string;
    bio: string;
    position: string;
    preferredFoot: string;
    favoriteCourt: string;
    emailVerified: boolean;
    createdAt: string;
}

interface Stats {
    total: number;
    active: number;
    completed: number;
    cancelled: number;
}

const PRESET_AVATARS = [
    { id: "ball", label: "Balón Clásico", emoji: "⚽", bg: "from-emerald-500 to-teal-700" },
    { id: "captain", label: "Capitán 10", emoji: "🎖️", bg: "from-amber-500 to-yellow-700" },
    { id: "striker", label: "Goleador", emoji: "⚡", bg: "from-rose-500 to-red-700" },
    { id: "keeper", label: "El Muro", emoji: "🧤", bg: "from-blue-500 to-indigo-700" },
    { id: "trophy", label: "Campeón", emoji: "🏆", bg: "from-yellow-400 to-amber-600" },
    { id: "fire", label: "Crack", emoji: "🔥", bg: "from-orange-500 to-amber-600" },
];

export default function ProfilePage() {
    const { refreshAuth } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [activeTab, setActiveTab] = useState<"general" | "sports" | "security">("general");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [passwordSaving, setPasswordSaving] = useState(false);

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [stats, setStats] = useState<Stats>({ total: 0, active: 0, completed: 0, cancelled: 0 });

    // Formularios editables
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        bio: "",
        position: "",
        preferredFoot: "",
        favoriteCourt: "",
        avatarUrl: "" as string | null
    });

    // Formulario de contraseña
    const [passwords, setPasswords] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [showPass, setShowPass] = useState({ current: false, next: false, confirm: false });

    // Mensajes y alertas
    const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [passAlert, setPassAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/profile");
            if (!res.ok) {
                if (res.status === 401) {
                    window.location.href = "/login?redirectTo=/profile";
                    return;
                }
                throw new Error("No se pudo cargar el perfil.");
            }
            const data = await res.json();
            setProfile(data.user);
            setStats(data.stats || { total: 0, active: 0, completed: 0, cancelled: 0 });

            setFormData({
                firstName: data.user.firstName || "",
                lastName: data.user.lastName || "",
                email: data.user.email || "",
                phone: data.user.phone || "",
                bio: data.user.bio || "",
                position: data.user.position || "Delantero",
                preferredFoot: data.user.preferredFoot || "Derecho",
                favoriteCourt: data.user.favoriteCourt || "Cancha 1",
                avatarUrl: data.user.avatarUrl || null
            });
        } catch (err: any) {
            console.error(err);
            setAlert({ type: "error", message: err.message || "Error al cargar datos del perfil." });
        } finally {
            setLoading(false);
        }
    };

    // Subida de imagen propia
    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            setAlert({ type: "error", message: "La imagen debe pesar menos de 2MB." });
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target?.result as string;
            setFormData(prev => ({ ...prev, avatarUrl: base64 }));
            setAlert({ type: "success", message: "Imagen cargada. Recuerda hacer clic en 'Guardar Cambios'." });
        };
        reader.readAsDataURL(file);
    };

    // Guardar información general y deportiva
    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setAlert(null);

        try {
            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "No se pudo actualizar el perfil.");
            }

            setAlert({ type: "success", message: "¡Perfil guardado correctamente!" });
            await refreshAuth();
            if (profile) {
                setProfile({
                    ...profile,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    phone: formData.phone,
                    bio: formData.bio,
                    position: formData.position,
                    preferredFoot: formData.preferredFoot,
                    favoriteCourt: formData.favoriteCourt,
                    avatarUrl: formData.avatarUrl
                });
            }
        } catch (err: any) {
            setAlert({ type: "error", message: err.message || "Error de conexión." });
        } finally {
            setSaving(false);
        }
    };

    // Cambiar contraseña
    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPassAlert(null);

        if (!passwords.currentPassword) {
            setPassAlert({ type: "error", message: "Ingresa tu contraseña actual." });
            return;
        }

        if (passwords.newPassword.length < 6) {
            setPassAlert({ type: "error", message: "La nueva contraseña debe tener mínimo 6 caracteres." });
            return;
        }

        if (passwords.newPassword !== passwords.confirmPassword) {
            setPassAlert({ type: "error", message: "Las contraseñas no coinciden." });
            return;
        }

        setPasswordSaving(true);
        try {
            const res = await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(passwords)
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Error al actualizar la contraseña.");
            }

            setPassAlert({ type: "success", message: "¡Contraseña actualizada con éxito!" });
            setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err: any) {
            setPassAlert({ type: "error", message: err.message || "Error al actualizar la contraseña." });
        } finally {
            setPasswordSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-80px)] bg-black flex items-center justify-center p-6 text-white font-sans">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />
                    <p className="text-gray-400 font-medium tracking-wide">Cargando tu perfil...</p>
                </div>
            </div>
        );
    }

    const initials = `${formData.firstName?.[0] || ""}${formData.lastName?.[0] || ""}`.toUpperCase() || "CD";

    return (
        <div className="min-h-[calc(100vh-80px)] bg-black text-white font-sans relative py-10 px-4 sm:px-6 lg:px-8 overflow-hidden">
            {/* Background Texture */}
            <div 
                aria-hidden="true" 
                className="absolute inset-0 bg-cover bg-center opacity-30 filter brightness-75 saturate-120 pointer-events-none"
                style={{ backgroundImage: "url('/stadium-bg.jpg')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black via-black/85 to-black pointer-events-none" />

            <div className="relative z-10 max-w-5xl mx-auto space-y-8">
                {/* Header Card del Perfil */}
                <div className="bg-gradient-to-r from-gray-900/90 via-black/90 to-emerald-950/60 border border-white/15 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8 text-center md:text-left">
                        {/* Avatar Interactivo */}
                        <div className="relative group">
                            <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.5)] bg-gradient-to-tr from-emerald-600 to-teal-900 flex items-center justify-center text-white relative">
                                {formData.avatarUrl ? (
                                    formData.avatarUrl.startsWith("preset:") ? (
                                        <span className="text-6xl select-none">
                                            {PRESET_AVATARS.find(p => p.id === formData.avatarUrl?.replace("preset:", ""))?.emoji || "⚽"}
                                        </span>
                                    ) : (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img 
                                            src={formData.avatarUrl} 
                                            alt="Foto de perfil" 
                                            className="w-full h-full object-cover" 
                                        />
                                    )
                                ) : (
                                    <span className="text-4xl sm:text-5xl font-black tracking-wider text-emerald-100 select-none">
                                        {initials}
                                    </span>
                                )}

                                {/* Overlay para cambiar foto */}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 cursor-pointer text-xs font-bold text-white"
                                >
                                    <Camera className="w-6 h-6 text-emerald-400" />
                                    Cambiar Foto
                                </button>
                            </div>

                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleImageUpload} 
                                accept="image/*" 
                                className="hidden" 
                            />

                            {/* Badge de Rol */}
                            <span className="absolute bottom-1 right-1 px-3 py-1 text-xs font-black uppercase tracking-wider rounded-full bg-emerald-500 text-black border-2 border-black shadow-lg">
                                {profile?.role === "admin" ? "Admin" : "Jugador"}
                            </span>
                        </div>

                        {/* Datos Básicos */}
                        <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                <h1 className="text-3xl sm:text-4xl font-black text-white title-glow-hover">
                                    {formData.firstName || "Usuario"} {formData.lastName || ""}
                                </h1>
                                {profile?.emailVerified ? (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 rounded-full">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Correo Verificado
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-500/40 rounded-full">
                                        <AlertCircle className="w-3.5 h-3.5" /> Verificación Pendiente
                                    </span>
                                )}
                            </div>

                            <p className="text-gray-300 text-sm font-medium flex items-center justify-center md:justify-start gap-2">
                                <Mail className="w-4 h-4 text-emerald-400" />
                                {formData.email}
                            </p>

                            {formData.bio && (
                                <p className="text-gray-300 text-sm italic max-w-xl pt-1">
                                    &ldquo;{formData.bio}&rdquo;
                                </p>
                            )}

                            {/* Selector rápido de Avatares Predeterminados */}
                            <div className="pt-3">
                                <label className="text-xs text-gray-400 font-semibold block mb-1.5 uppercase tracking-wider">
                                    Elige un avatar deportivo o sube el tuyo:
                                </label>
                                <div className="flex flex-wrap gap-2 items-center justify-center md:justify-start">
                                    {PRESET_AVATARS.map((preset) => (
                                        <button
                                            key={preset.id}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, avatarUrl: `preset:${preset.id}` }))}
                                            title={preset.label}
                                            className={`w-9 h-9 rounded-full bg-gradient-to-tr ${preset.bg} flex items-center justify-center text-lg hover:scale-115 transition-transform border ${formData.avatarUrl === `preset:${preset.id}` ? "ring-2 ring-emerald-400 border-white scale-110" : "border-white/20"}`}
                                        >
                                            {preset.emoji}
                                        </button>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-gray-200 flex items-center gap-1.5 transition-all"
                                    >
                                        <Camera className="w-3.5 h-3.5 text-emerald-400" />
                                        Subir foto
                                    </button>

                                    {formData.avatarUrl && (
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, avatarUrl: null }))}
                                            className="p-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg transition-colors"
                                            title="Quitar foto"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Estadísticas Rápidas */}
                        <div className="grid grid-cols-3 gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-white/15 md:pl-8">
                            <div className="bg-black/40 border border-white/10 rounded-2xl p-3 text-center">
                                <span className="block text-2xl font-black text-emerald-400">{stats.total}</span>
                                <span className="text-[11px] text-gray-400 font-semibold uppercase">Reservas</span>
                            </div>
                            <div className="bg-black/40 border border-white/10 rounded-2xl p-3 text-center">
                                <span className="block text-2xl font-black text-amber-400">{stats.active}</span>
                                <span className="text-[11px] text-gray-400 font-semibold uppercase">Activas</span>
                            </div>
                            <div className="bg-black/40 border border-white/10 rounded-2xl p-3 text-center">
                                <span className="block text-2xl font-black text-blue-400">{stats.completed}</span>
                                <span className="text-[11px] text-gray-400 font-semibold uppercase">Jugados</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navegación por Pestañas */}
                <div className="flex border-b border-white/15 gap-2 sm:gap-4 overflow-x-auto pb-1">
                    <button
                        onClick={() => setActiveTab("general")}
                        className={`flex items-center gap-2 px-5 py-3 font-bold text-sm sm:text-base rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
                            activeTab === "general"
                                ? "bg-emerald-500/15 text-emerald-400 border-b-2 border-emerald-400"
                                : "text-gray-400 hover:text-white hover:bg-white/5"
                        }`}
                    >
                        <User className="w-4 h-4" />
                        Información Personal
                    </button>

                    <button
                        onClick={() => setActiveTab("sports")}
                        className={`flex items-center gap-2 px-5 py-3 font-bold text-sm sm:text-base rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
                            activeTab === "sports"
                                ? "bg-emerald-500/15 text-emerald-400 border-b-2 border-emerald-400"
                                : "text-gray-400 hover:text-white hover:bg-white/5"
                        }`}
                    >
                        <Trophy className="w-4 h-4" />
                        Ficha de Jugador
                    </button>

                    <button
                        onClick={() => setActiveTab("security")}
                        className={`flex items-center gap-2 px-5 py-3 font-bold text-sm sm:text-base rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
                            activeTab === "security"
                                ? "bg-emerald-500/15 text-emerald-400 border-b-2 border-emerald-400"
                                : "text-gray-400 hover:text-white hover:bg-white/5"
                        }`}
                    >
                        <Lock className="w-4 h-4" />
                        Seguridad y Contraseña
                    </button>
                </div>

                {/* Alerta Global */}
                <AnimatePresence>
                    {alert && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={`p-4 rounded-2xl border text-sm font-semibold flex items-center justify-between ${
                                alert.type === "success" 
                                    ? "bg-emerald-950/70 border-emerald-500/40 text-emerald-300" 
                                    : "bg-red-950/70 border-red-500/40 text-red-300"
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                {alert.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
                                <span>{alert.message}</span>
                            </div>
                            <button onClick={() => setAlert(null)} className="text-xs hover:underline opacity-80">
                                Cerrar
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Contenido Pestaña 1: Información Personal */}
                {activeTab === "general" && (
                    <motion.form 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onSubmit={handleSaveProfile}
                        className="bg-black/70 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md space-y-6 shadow-xl"
                    >
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <div>
                                <h2 className="text-xl font-bold text-white">Datos de tu Cuenta</h2>
                                <p className="text-xs text-gray-400">Actualiza tus datos para personalizar tus reservas y notificaciones.</p>
                            </div>
                            <span className="text-xs font-semibold px-3 py-1 bg-white/10 text-gray-300 rounded-full">
                                ID de Usuario: #{profile?.userId}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-emerald-400" /> Nombre
                                </label>
                                <input
                                    type="text"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    required
                                    placeholder="Tu nombre"
                                    className="w-full bg-black/60 border border-white/20 rounded-xl p-3.5 text-white placeholder-gray-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-emerald-400" /> Apellido
                                </label>
                                <input
                                    type="text"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    required
                                    placeholder="Tu apellido"
                                    className="w-full bg-black/60 border border-white/20 rounded-xl p-3.5 text-white placeholder-gray-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                                    <Mail className="w-3.5 h-3.5 text-emerald-400" /> Correo Electrónico
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    placeholder="tu-correo@ejemplo.com"
                                    className="w-full bg-black/60 border border-white/20 rounded-xl p-3.5 text-white placeholder-gray-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                                    <Phone className="w-3.5 h-3.5 text-emerald-400" /> Teléfono / WhatsApp
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+593 98 434 3354"
                                    className="w-full bg-black/60 border border-white/20 rounded-xl p-3.5 text-white placeholder-gray-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Lema / Biografía Deportiva
                            </label>
                            <textarea
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                rows={3}
                                placeholder="Escribe una breve descripción personal o frase motivacional de fútbol..."
                                className="w-full bg-black/60 border border-white/20 rounded-xl p-3.5 text-white placeholder-gray-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all resize-none"
                            />
                        </div>

                        <div className="flex justify-end pt-4 border-t border-white/10">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-extrabold rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.7)] transition-all cursor-pointer disabled:opacity-50 hover:scale-105"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? "Guardando..." : "Guardar Cambios"}
                            </button>
                        </div>
                    </motion.form>
                )}

                {/* Contenido Pestaña 2: Ficha de Jugador */}
                {activeTab === "sports" && (
                    <motion.form 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onSubmit={handleSaveProfile}
                        className="bg-black/70 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md space-y-6 shadow-xl"
                    >
                        <div className="border-b border-white/10 pb-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-amber-400" />
                                Preferencias Deportivas en Fútbol 5
                            </h2>
                            <p className="text-xs text-gray-400">Personaliza tu perfil futbolístico dentro del complejo deportivo.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-300">
                                    Posición en Cancha
                                </label>
                                <select
                                    value={formData.position}
                                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                    className="w-full bg-black/80 border border-white/20 rounded-xl p-3.5 text-white focus:border-emerald-400 outline-none cursor-pointer"
                                >
                                    <option value="Delantero">⚽ Delantero / Goleador</option>
                                    <option value="Centrocampista">🎯 Centrocampista / Creador</option>
                                    <option value="Defensa">🛡️ Defensa / Muralla</option>
                                    <option value="Portero">🧤 Portero / Cerrajero</option>
                                    <option value="Polivalente">⭐ Jugador Polivalente</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-300">
                                    Pie Hábil
                                </label>
                                <select
                                    value={formData.preferredFoot}
                                    onChange={(e) => setFormData({ ...formData, preferredFoot: e.target.value })}
                                    className="w-full bg-black/80 border border-white/20 rounded-xl p-3.5 text-white focus:border-emerald-400 outline-none cursor-pointer"
                                >
                                    <option value="Derecho">👟 Pie Derecho (Diestro)</option>
                                    <option value="Izquierdo">👟 Pie Izquierdo (Zurdo)</option>
                                    <option value="Ambidiestro">⚡ Ambidiestro</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-300">
                                    Cancha Favorita
                                </label>
                                <select
                                    value={formData.favoriteCourt}
                                    onChange={(e) => setFormData({ ...formData, favoriteCourt: e.target.value })}
                                    className="w-full bg-black/80 border border-white/20 rounded-xl p-3.5 text-white focus:border-emerald-400 outline-none cursor-pointer"
                                >
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                        <option key={n} value={`Cancha ${n}`}>🏟️ Cancha {n} (Fútbol 5)</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Tarjeta Visual de Ficha Deportiva */}
                        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-black/60 to-gray-900 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <span className="text-4xl">🌟</span>
                                <div>
                                    <h4 className="font-extrabold text-emerald-300 text-lg">Tarjeta de Jugador Dioguinho</h4>
                                    <p className="text-xs text-gray-300">
                                        Posición: <strong className="text-white">{formData.position}</strong> · Pie: <strong className="text-white">{formData.preferredFoot}</strong> · Sede preferida: <strong className="text-white">{formData.favoriteCourt}</strong>
                                    </p>
                                </div>
                            </div>
                            <Link
                                href="/booking"
                                className="px-5 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap"
                            >
                                <Calendar className="w-4 h-4" /> Reservar {formData.favoriteCourt || "Cancha"}
                            </Link>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-white/10">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-extrabold rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.7)] transition-all cursor-pointer disabled:opacity-50 hover:scale-105"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? "Guardando..." : "Guardar Preferencias"}
                            </button>
                        </div>
                    </motion.form>
                )}

                {/* Contenido Pestaña 3: Seguridad y Contraseña */}
                {activeTab === "security" && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-black/70 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md space-y-6 shadow-xl"
                    >
                        <div className="border-b border-white/10 pb-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Shield className="w-5 h-5 text-emerald-400" />
                                Cambiar Contraseña
                            </h2>
                            <p className="text-xs text-gray-400">Protege tu cuenta actualizando periódicamente tu clave de acceso.</p>
                        </div>

                        {/* Alerta de Contraseña */}
                        <AnimatePresence>
                            {passAlert && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className={`p-4 rounded-2xl border text-sm font-semibold flex items-center justify-between ${
                                        passAlert.type === "success" 
                                            ? "bg-emerald-950/70 border-emerald-500/40 text-emerald-300" 
                                            : "bg-red-950/70 border-red-500/40 text-red-300"
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {passAlert.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
                                        <span>{passAlert.message}</span>
                                    </div>
                                    <button onClick={() => setPassAlert(null)} className="text-xs hover:underline opacity-80">
                                        Cerrar
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={handleChangePassword} className="space-y-5 max-w-lg">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-300">
                                    Contraseña Actual
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPass.current ? "text" : "password"}
                                        value={passwords.currentPassword}
                                        onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                                        required
                                        placeholder="Tu contraseña actual"
                                        className="w-full bg-black/60 border border-white/20 rounded-xl p-3.5 pr-12 text-white placeholder-gray-500 focus:border-emerald-400 outline-none transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass({ ...showPass, current: !showPass.current })}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                    >
                                        {showPass.current ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-300">
                                    Nueva Contraseña (mínimo 6 caracteres)
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPass.next ? "text" : "password"}
                                        value={passwords.newPassword}
                                        onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                        required
                                        placeholder="Mínimo 6 caracteres"
                                        className="w-full bg-black/60 border border-white/20 rounded-xl p-3.5 pr-12 text-white placeholder-gray-500 focus:border-emerald-400 outline-none transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass({ ...showPass, next: !showPass.next })}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                    >
                                        {showPass.next ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-300">
                                    Confirmar Nueva Contraseña
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPass.confirm ? "text" : "password"}
                                        value={passwords.confirmPassword}
                                        onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                        required
                                        placeholder="Repite la nueva contraseña"
                                        className="w-full bg-black/60 border border-white/20 rounded-xl p-3.5 pr-12 text-white placeholder-gray-500 focus:border-emerald-400 outline-none transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass({ ...showPass, confirm: !showPass.confirm })}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                    >
                                        {showPass.confirm ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={passwordSaving}
                                className="flex items-center gap-2 px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-extrabold rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.7)] transition-all cursor-pointer disabled:opacity-50 hover:scale-105"
                            >
                                <Lock className="w-4 h-4" />
                                {passwordSaving ? "Actualizando..." : "Actualizar Contraseña"}
                            </button>
                        </form>
                    </motion.div>
                )}

                {/* Acceso Rápido a Reservas */}
                <div className="bg-gradient-to-r from-emerald-950/50 via-black/80 to-gray-950 border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
                    <div className="flex items-center gap-4 text-center sm:text-left">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                            <Calendar className="w-7 h-7" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white">¿Listo para el próximo partido?</h3>
                            <p className="text-sm text-gray-300">Consulta tus turnos agendados o reserva una de nuestras 10 canchas profesionales.</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Link
                            href="/reservations"
                            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full border border-white/20 transition-all text-sm flex items-center gap-2"
                        >
                            Ver Mis Reservas
                        </Link>
                        <Link
                            href="/booking"
                            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-extrabold rounded-full transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] text-sm flex items-center gap-2 hover:scale-105"
                        >
                            Reservar Turno <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
