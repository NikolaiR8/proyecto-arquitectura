"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useSearchParams } from "next/navigation";
import SuccessfulAuthentification from "./SuccessfulAuthentification";

export default function LoginComponent() {
    const searchParams = useSearchParams();
    const redirectTo = decodeURIComponent(searchParams.get("redirectTo") ?? "/");

    const [successful, setSuccessful] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [formErrors, setFormErrors] = useState({ email: false, password: false });
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const handleLogin = async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        const newFormErrors = {
            email: !email.trim(),
            password: !password.trim()
        };
        
        setFormErrors(newFormErrors);
        
        if (newFormErrors.email || newFormErrors.password) {
            return;
        }
        
        setIsLoading(true);
        setApiError(null);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setApiError(data.message || "Correo o contraseña incorrectos. Por favor, verifica tus datos.");
            } else {
                setSuccessful(true);
                setTimeout(() => {
                    window.location.href = redirectTo;
                }, 600);
            }
        
        } catch (error) {
            console.error('Error en el login:', error);
            setApiError("Error de conexión con el servidor. Intenta nuevamente.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="relative min-h-[calc(100vh-80px)] flex flex-col justify-center items-center px-4 py-12 bg-black font-sans overflow-hidden">
            {/* Vivid Stadium Background with Vignette */}
            <div 
                aria-hidden="true"
                className="absolute inset-0 bg-cover bg-center opacity-40 filter brightness-90 saturate-110 pointer-events-none"
                style={{ backgroundImage: "url('/stadium-bg.jpg')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/85 pointer-events-none" />

            {/* Clear Messi silhouette on the side */}
            <div 
                aria-hidden="true"
                className="absolute -right-8 bottom-0 w-80 sm:w-[420px] h-[520px] bg-contain bg-no-repeat bg-bottom opacity-70 pointer-events-none filter drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)] hidden lg:block"
                style={{ backgroundImage: "url('/messi-bg.jpg')" }}
            />

            {successful && <SuccessfulAuthentification authType="Login" />}

            <form onSubmit={handleLogin} className="relative z-10 flex flex-col text-center w-full max-w-md p-8 sm:p-10 gap-6 bg-black/75 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] border border-white/15 text-white">
                <div>
                    <img src="/favicon.png" alt="Logo CanchasDioguinho" className="w-12 h-12 mx-auto rounded-full object-cover border border-emerald-500/40 filter drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                    <h1 className="font-black text-3xl mt-3 text-white title-glow-hover">
                        Iniciar Sesión
                    </h1>
                    <p className="text-sm text-gray-300 mt-1 font-medium">Ingresa a tu cuenta para gestionar tus reservas</p>
                </div>
                
                <div className="flex flex-col text-sm text-left gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-gray-200">Correo Electrónico</label>
                        <input 
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="ejemplo@correo.com"
                            className={`text-base outline-none border rounded-xl p-3.5 bg-black/50 text-white placeholder-gray-500 transition-all ${formErrors.email ? "border-red-500 bg-red-950/20" : "border-white/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"}`}
                        />
                        {formErrors.email && <span className="text-xs text-red-400 font-medium">El correo no puede estar vacío</span>}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-gray-200">Contraseña</label>
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                className={`text-base outline-none border rounded-xl p-3.5 w-full pr-10 bg-black/50 text-white placeholder-gray-500 transition-all ${formErrors.password ? "border-red-500 bg-red-950/20" : "border-white/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"}`}
                                placeholder="Tu contraseña"
                            />
                            <button
                                type="button"
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                            </button>
                        </div>
                        {formErrors.password && <span className="text-xs text-red-400 font-medium">La contraseña no puede estar vacía</span>}
                    </div>
                </div>

                {apiError && (
                    <div className="p-3 text-sm text-red-300 bg-red-950/60 border border-red-500/40 rounded-xl font-medium">
                        {apiError}
                    </div>
                )}

                <div className="flex flex-col gap-4 mt-2">
                    <button
                        type="submit" 
                        disabled={isLoading}
                        className="text-base font-extrabold bg-emerald-500 hover:bg-emerald-400 text-gray-950 w-full py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.7)] disabled:opacity-50 cursor-pointer hover:scale-[1.02]"
                    >
                        {isLoading ? "Iniciando sesión..." : "Ingresar"}
                    </button>
                    
                    <p className="text-sm text-gray-300">
                        ¿No tienes una cuenta?{" "}
                        <Link href={`/register?redirectTo=${redirectTo}`} className="text-emerald-400 font-bold hover:underline text-glow-hover">
                            ¡Regístrate aquí!
                        </Link>
                    </p>
                </div>
            </form>
        </main>
    );
}