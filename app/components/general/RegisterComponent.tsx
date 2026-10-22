"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useSearchParams } from "next/navigation";
import SuccessfulAuthentification from "./SuccessfulAuthentification";
import CedulaInputField, { CedulaValidationState } from "./CedulaInputField";

export default function RegisterComponent() {
    const searchParams = useSearchParams();
    const rawRedirect = searchParams.get("redirectTo");
    const redirectTo = rawRedirect ? `/login?redirectTo=${decodeURIComponent(rawRedirect)}` : "/login";
    const initialCedula = searchParams.get("cedula") || "";

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [cedulaState, setCedulaState] = useState<CedulaValidationState>({
        cedula: initialCedula,
        isValidFormat: false,
        isAvailable: false,
        isChecking: false,
        errorMessage: null,
    });
    const [formErrors, setFormErrors] = useState({
        firstName: false,
        lastName: false,
        email: false,
        password: false,
        cedula: false,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState({ error: false, message: "" });
    const [successful, setSuccessful] = useState(false);

    const handleRegister = async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const isCedulaValid = cedulaState.isValidFormat && cedulaState.isAvailable && !cedulaState.isChecking;

        const newFormErrors = {
            firstName: !firstName.trim(),
            lastName: !lastName.trim(),
            email: !email.trim() || !emailRegex.test(email.trim()),
            password: !password.trim() || password.length < 6,
            cedula: !isCedulaValid,
        };
            
        setFormErrors(newFormErrors);
        
        if (
            newFormErrors.firstName || 
            newFormErrors.lastName || 
            newFormErrors.email || 
            newFormErrors.password || 
            newFormErrors.cedula
        ) {
            if (newFormErrors.cedula) {
                setApiError({
                    error: true,
                    message: cedulaState.errorMessage || "Por favor ingresa una cédula ecuatoriana válida de 10 dígitos que no esté registrada.",
                });
            }
            return;
        }
        
        setIsLoading(true);
        setApiError({ error: false, message: "" });

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName: firstName,
                    lastName: lastName,
                    password: password,
                    email: email,
                    cedula: cedulaState.cedula,
                })
            });

            const data = await res.json();

            if (!res.ok) {
                const errMsg = data.error === "Email already exist" 
                    ? "Este correo electrónico ya está registrado." 
                    : (data.error ?? "Error al registrarse.");
                setApiError({ error: true, message: errMsg });
            } else {
                setSuccessful(true);
                try {
                    const loginRes = await fetch("/api/auth/login", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            email: email,
                            password: password
                        })
                    });

                    if (!loginRes.ok) {
                        setTimeout(() => {
                            window.location.href = redirectTo;
                        }, 750);
                    } else {
                        setTimeout(() => {
                            const directRedirect = rawRedirect ?? "/reservations";
                            window.location.href = directRedirect;
                        }, 750);
                    }
                
                } catch (error) {
                    console.error('Error al iniciar sesión tras registrar:', error);
                }
            }

        } catch (error) {
            console.error('Error en el registro:', error);
            setApiError({ error: true, message: "Error de conexión al registrar. Inténtalo de nuevo." });
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

            {/* Clear Cristiano Ronaldo silhouette on the side */}
            <div 
                aria-hidden="true"
                className="absolute -left-8 bottom-0 w-80 sm:w-[420px] h-[520px] bg-contain bg-no-repeat bg-bottom opacity-70 pointer-events-none filter drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)] hidden lg:block"
                style={{ backgroundImage: "url('/cr7-bg.jpg')" }}
            />

            {successful && <SuccessfulAuthentification authType="Registration" />}

            <form onSubmit={handleRegister} className="relative z-10 flex flex-col text-center w-full max-w-lg p-8 sm:p-10 gap-6 bg-black/75 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] border border-white/15 text-white">
                <div>
                    <img 
                        src="/favicon.png" 
                        alt="Logo CanchasDioguinho" 
                        className="w-12 h-12 mx-auto rounded-full object-cover border border-emerald-500/40 filter drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" 
                    />
                    <h1 className="font-black text-3xl mt-3 text-white title-glow-hover">
                        Crear Cuenta
                    </h1>
                    <p className="text-sm text-gray-300 mt-1 font-medium">Regístrate para reservar canchas y acceder a tus horarios</p>
                </div>
                
                <div className="flex flex-col text-sm text-left gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-gray-200">Nombre</label>
                            <input 
                                type="text"
                                value={firstName}
                                onChange={(event) => setFirstName(event.target.value)}
                                placeholder="Tu nombre"
                                className={`text-base outline-none border rounded-xl p-3.5 bg-black/50 text-white placeholder-gray-500 transition-all ${formErrors.firstName ? "border-red-500 bg-red-950/20" : "border-white/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"}`}
                            />
                            {formErrors.firstName && <span className="text-xs text-red-400 font-medium">Campo obligatorio</span>}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-gray-200">Apellido</label>
                            <input 
                                type="text"
                                value={lastName}
                                onChange={(event) => setLastName(event.target.value)}
                                placeholder="Tu apellido"
                                className={`text-base outline-none border rounded-xl p-3.5 bg-black/50 text-white placeholder-gray-500 transition-all ${formErrors.lastName ? "border-red-500 bg-red-950/20" : "border-white/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"}`}
                            />
                            {formErrors.lastName && <span className="text-xs text-red-400 font-medium">Campo obligatorio</span>}
                        </div>
                    </div>

                    {/* Nuevo Campo Cédula de Identidad con Validación Módulo 10 y Asíncrona */}
                    <div className="flex flex-col gap-1.5">
                        <CedulaInputField
                            id="register-cedula-input"
                            value={cedulaState.cedula}
                            onChange={(state) => {
                                setCedulaState(state);
                                if (state.isValidFormat && state.isAvailable) {
                                    setFormErrors((prev) => ({ ...prev, cedula: false }));
                                }
                            }}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-gray-200">Correo Electrónico</label>
                        <input 
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="ejemplo@correo.com"
                            className={`text-base outline-none border rounded-xl p-3.5 bg-black/50 text-white placeholder-gray-500 transition-all ${formErrors.email ? "border-red-500 bg-red-950/20" : "border-white/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"}`}
                        />
                        {formErrors.email && <span className="text-xs text-red-400 font-medium">Ingresa un correo electrónico válido</span>}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-gray-200">Contraseña (Mínimo 6 caracteres)</label>
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                className={`text-base outline-none border rounded-xl p-3.5 w-full pr-10 bg-black/50 text-white placeholder-gray-500 transition-all ${formErrors.password ? "border-red-500 bg-red-950/20" : "border-white/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"}`}
                                placeholder="Mínimo 6 caracteres"
                            />
                            <button
                                type="button"
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                            </button>
                        </div>
                        {formErrors.password && <span className="text-xs text-red-400 font-medium">La contraseña debe tener al menos 6 caracteres</span>}
                    </div>
                </div>

                {apiError.error && (
                    <div className="p-3 text-sm text-red-300 bg-red-950/60 border border-red-500/40 rounded-xl font-medium">
                        {apiError.message}
                    </div>
                )}

                <div className="flex flex-col gap-4 mt-2">
                    <button
                        type="submit" 
                        disabled={isLoading || cedulaState.isChecking}
                        className="text-base font-extrabold bg-emerald-500 hover:bg-emerald-400 text-gray-950 w-full py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.7)] disabled:opacity-50 cursor-pointer hover:scale-[1.02]"
                    >
                        {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
                    </button>
                    
                    <p className="text-sm text-gray-300">
                        ¿Ya tienes una cuenta?{" "}
                        <Link href="/login" className="text-emerald-400 font-bold hover:underline text-glow-hover">
                            Inicia sesión aquí
                        </Link>
                    </p>
                </div>
            </form>
        </main>
    );
}