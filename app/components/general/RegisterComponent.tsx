"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Eye, EyeOff, Mail, AlertCircle, ArrowLeft, RefreshCw, KeyRound, Check, Info, ShieldCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import SuccessfulAuthentification from "./SuccessfulAuthentification";
import { motion } from "framer-motion";
import { validatePassword, validateRegisterEmail } from "../../lib/auth-validation";

export default function RegisterComponent() {
    const searchParams = useSearchParams();
    const rawRedirect = searchParams.get("redirectTo");
    const redirectTo = rawRedirect ? `/login?redirectTo=${decodeURIComponent(rawRedirect)}` : "/login";

    // Paso del flujo: 1 = Formulario de datos, 2 = Confirmación con código de 6 dígitos
    const [step, setStep] = useState<1 | 2>(1);

    // Campos del formulario
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Mensajes de error específicos por campo
    const [fieldErrors, setFieldErrors] = useState<{
        firstName?: string;
        lastName?: string;
        email?: string;
        password?: string;
        confirmPassword?: string;
    }>({});

    // Estado del código OTP de 6 dígitos
    const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [resendCooldown, setResendCooldown] = useState(0);

    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState<{ error: boolean; message: string }>({ error: false, message: "" });
    const [successful, setSuccessful] = useState(false);

    // Contador para reenviar código
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const interval = setInterval(() => {
            setResendCooldown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [resendCooldown]);

    // Función de validación exhaustiva de correo electrónico (exclusivo Gmail)
    const validateEmail = (value: string): string | null => {
        const res = validateRegisterEmail(value);
        return res.isValid ? null : (res.error || "Correo inválido.");
    };

    // Validar nombre y apellido
    const validateName = (name: string, fieldName: "nombre" | "apellido"): string | null => {
        const trimmed = name.trim();
        if (!trimmed) {
            return `El ${fieldName} es obligatorio.`;
        }
        if (trimmed.length < 2) {
            return `El ${fieldName} debe tener al menos 2 letras.`;
        }
        if (/[0-9]/.test(trimmed)) {
            return `El ${fieldName} no debe contener números.`;
        }
        if (/[#$%&!*^~`+=/\\|{}[\]:;"'<>?_]/.test(trimmed)) {
            return `El ${fieldName} no debe contener caracteres especiales.`;
        }
        return null;
    };

    // Validar en vivo al escribir o salir del campo
    const handleEmailChange = (val: string) => {
        setEmail(val);
        if (fieldErrors.email) {
            setFieldErrors((prev) => ({ ...prev, email: validateEmail(val) || undefined }));
        }
    };

    // Estado calculado de reglas de contraseña en vivo
    const passwordEvaluation = validatePassword(password);
    const passwordRules = passwordEvaluation.rules;

    // Manejar cambio de contraseña en vivo
    const handlePasswordChange = (val: string) => {
        setPassword(val);
        if (fieldErrors.password) {
            const check = validatePassword(val);
            if (check.isValid) {
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }
        }
    };

    // Paso 1: Validar todo y enviar código de confirmación
    const handleRequestCode = async (event: React.FormEvent) => {
        event.preventDefault();

        const emailErr = validateEmail(email);
        const firstErr = validateName(firstName, "nombre");
        const lastErr = validateName(lastName, "apellido");

        let passErr: string | undefined = undefined;
        if (!password.trim()) {
            passErr = "La contraseña es obligatoria.";
        } else {
            const passCheck = validatePassword(password);
            if (!passCheck.isValid) {
                passErr = passCheck.error;
            }
        }

        let confirmErr: string | undefined = undefined;
        if (!confirmPassword.trim()) {
            confirmErr = "Por favor confirma tu contraseña.";
        } else if (password !== confirmPassword) {
            confirmErr = "Las contraseñas no coinciden.";
        }

        const errors = {
            email: emailErr || undefined,
            firstName: firstErr || undefined,
            lastName: lastErr || undefined,
            password: passErr,
            confirmPassword: confirmErr,
        };

        setFieldErrors(errors);

        if (emailErr || firstErr || lastErr || passErr || confirmErr) {
            return;
        }

        setIsLoading(true);
        setApiError({ error: false, message: "" });

        try {
            const res = await fetch("/api/auth/send-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    firstName: firstName.trim()
                })
            });

            const data = await res.json();

            if (!res.ok) {
                setApiError({ error: true, message: data.error || "Error al enviar código de verificación." });
                return;
            }

            setStep(2);
            setResendCooldown(45);
            // Enfocar la primera casilla del código
            setTimeout(() => {
                otpRefs.current[0]?.focus();
            }, 100);

        } catch (err: any) {
            console.error(err);
            setApiError({ error: true, message: "Error al conectar con el servidor. Intenta de nuevo." });
        } finally {
            setIsLoading(false);
        }
    };

    // Manejo de casillas de código OTP
    const handleOtpChange = (index: number, value: string) => {
        const val = value.replace(/\D/g, ""); // Solo dígitos
        if (!val) {
            const newOtp = [...otp];
            newOtp[index] = "";
            setOtp(newOtp);
            return;
        }

        // Si se pega un código completo (ej: 6 dígitos)
        if (val.length > 1) {
            const chars = val.slice(0, 6).split("");
            const newOtp = [...otp];
            chars.forEach((c, i) => {
                newOtp[i] = c;
            });
            setOtp(newOtp);
            const nextIdx = Math.min(chars.length, 5);
            otpRefs.current[nextIdx]?.focus();
            return;
        }

        const newOtp = [...otp];
        newOtp[index] = val;
        setOtp(newOtp);

        if (index < 5 && val) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    // Reenviar código
    const handleResendCode = async () => {
        if (resendCooldown > 0 || isLoading) return;
        setIsLoading(true);
        setApiError({ error: false, message: "" });

        try {
            const res = await fetch("/api/auth/send-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    firstName: firstName.trim()
                })
            });
            const data = await res.json();
            if (res.ok) {
                setResendCooldown(45);
            } else {
                setApiError({ error: true, message: data.error || "No se pudo reenviar el código." });
            }
        } catch {
            setApiError({ error: true, message: "Error al reenviar el código." });
        } finally {
            setIsLoading(false);
        }
    };

    // Paso 2: Verificar código y registrar usuario
    const handleVerifyAndRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        const fullCode = otp.join("");
        if (fullCode.length < 6) {
            setApiError({ error: true, message: "Ingresa los 6 dígitos del código de confirmación." });
            return;
        }

        setIsLoading(true);
        setApiError({ error: false, message: "" });

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    email: email.trim().toLowerCase(),
                    password: password,
                    code: fullCode
                })
            });

            const data = await res.json();

            if (!res.ok) {
                setApiError({ error: true, message: data.error || "Error al verificar código." });
                return;
            }

            setSuccessful(true);
            setTimeout(() => {
                const directRedirect = rawRedirect ?? "/reservations";
                window.location.href = directRedirect;
            }, 900);

        } catch (err: any) {
            console.error(err);
            setApiError({ error: true, message: "Error al registrar la cuenta. Inténtalo de nuevo." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="relative min-h-[calc(100vh-80px)] flex flex-col justify-center items-center px-4 py-12 bg-black font-sans overflow-hidden">
            {/* Fondo de Estadio con Viñeta limpia y sin figuras */}
            <div
                aria-hidden="true"
                className="absolute inset-0 bg-cover bg-center opacity-30 filter brightness-85 saturate-110 pointer-events-none"
                style={{ backgroundImage: "url('/stadium-bg.jpg')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/90 pointer-events-none" />

            {successful && <SuccessfulAuthentification authType="Registration" />}

            <div className="relative z-10 w-full max-w-lg p-7 sm:p-10 bg-black/85 backdrop-blur-2xl rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] border border-white/15 text-white">
                {/* Paso 1: Formulario Principal de Datos */}
                {step === 1 && (
                    <form onSubmit={handleRequestCode} noValidate className="flex flex-col gap-5">
                        <div className="text-center flex flex-col items-center">
                            {/* Logo Oficial Canchas Dioguinho */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/logo.png"
                                alt="Canchas Dioguinho"
                                className="w-20 h-20 object-contain drop-shadow-[0_0_20px_rgba(52,211,153,0.5)] mb-2 hover:scale-105 transition-transform"
                            />
                            <h1 className="font-black text-3xl text-white title-glow-hover">
                                Crear Cuenta
                            </h1>
                            <p className="text-sm text-gray-300 mt-1 font-medium">
                                Completa tus datos para reservar turnos en Canchas Dioguinho
                            </p>
                        </div>

                        <div className="flex flex-col gap-4 text-left">
                            {/* Nombre y Apellido */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-200">
                                        Nombre
                                    </label>
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => {
                                            setFirstName(e.target.value);
                                            if (fieldErrors.firstName) {
                                                setFieldErrors(prev => ({ ...prev, firstName: validateName(e.target.value, "nombre") || undefined }));
                                            }
                                        }}
                                        onBlur={() => {
                                            const err = validateName(firstName, "nombre");
                                            setFieldErrors(prev => ({ ...prev, firstName: err || undefined }));
                                        }}
                                        placeholder="Ej: Nikolái"
                                        className={`text-sm sm:text-base outline-none border rounded-xl p-3 bg-black/60 text-white placeholder-gray-500 transition-all ${fieldErrors.firstName
                                                ? "border-red-500 bg-red-950/30 ring-1 ring-red-500/50"
                                                : "border-white/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                                            }`}
                                    />
                                    {fieldErrors.firstName && (
                                        <span className="text-xs text-red-400 font-medium flex items-center gap-1">
                                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                            {fieldErrors.firstName}
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-200">
                                        Apellido
                                    </label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => {
                                            setLastName(e.target.value);
                                            if (fieldErrors.lastName) {
                                                setFieldErrors(prev => ({ ...prev, lastName: validateName(e.target.value, "apellido") || undefined }));
                                            }
                                        }}
                                        onBlur={() => {
                                            const err = validateName(lastName, "apellido");
                                            setFieldErrors(prev => ({ ...prev, lastName: err || undefined }));
                                        }}
                                        placeholder="Ej: Molina"
                                        className={`text-sm sm:text-base outline-none border rounded-xl p-3 bg-black/60 text-white placeholder-gray-500 transition-all ${fieldErrors.lastName
                                                ? "border-red-500 bg-red-950/30 ring-1 ring-red-500/50"
                                                : "border-white/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                                            }`}
                                    />
                                    {fieldErrors.lastName && (
                                        <span className="text-xs text-red-400 font-medium flex items-center gap-1">
                                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                            {fieldErrors.lastName}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Aviso de Dominio Admitido */}
                            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-emerald-950/30 to-black/60 border border-emerald-500/40 flex items-start gap-3">
                                <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0 mt-0.5">
                                    <Info className="w-4 h-4" />
                                </div>
                                <div className="text-xs space-y-0.5 text-left">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-emerald-300">Dominio de Correo Admitido</p>
                                        <span className="bg-emerald-500/25 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-400/40">
                                            Únicamente @gmail.com
                                        </span>
                                    </div>
                                    <p className="text-gray-300 text-[11px] leading-relaxed">
                                        Sólo se admiten cuentas de correo @gmail.com.
                                    </p>
                                </div>
                            </div>

                            {/* Correo Electrónico con Validación Detallada */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-200 flex items-center justify-between">
                                    <span>Correo Electrónico (Gmail)</span>
                                    <span className="text-[11px] text-emerald-400 font-medium">debe ser @gmail.com</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => handleEmailChange(e.target.value)}
                                        onBlur={() => {
                                            const err = validateEmail(email);
                                            setFieldErrors(prev => ({ ...prev, email: err || undefined }));
                                        }}
                                        placeholder="ejemplo@gmail.com"
                                        className={`w-full text-sm sm:text-base outline-none border rounded-xl p-3 pr-10 bg-black/60 text-white placeholder-gray-500 transition-all ${fieldErrors.email
                                                ? "border-red-500 bg-red-950/30 ring-1 ring-red-500/50"
                                                : email && !fieldErrors.email
                                                    ? "border-emerald-500/50 focus:border-emerald-400"
                                                    : "border-white/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                                            }`}
                                    />
                                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                        {fieldErrors.email ? (
                                            <AlertCircle className="w-5 h-5 text-red-400" />
                                        ) : email ? (
                                            <Check className="w-5 h-5 text-emerald-400" />
                                        ) : (
                                            <Mail className="w-5 h-5 text-gray-400" />
                                        )}
                                    </div>
                                </div>
                                {fieldErrors.email && (
                                    <span className="text-xs text-red-400 font-semibold bg-red-950/40 p-2.5 rounded-lg border border-red-500/30 flex items-start gap-1.5">
                                        <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                                        <span>{fieldErrors.email}</span>
                                    </span>
                                )}
                            </div>

                            {/* Contraseña con Requisitos Estándar */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-200">
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => handlePasswordChange(e.target.value)}
                                        className={`w-full text-sm sm:text-base outline-none border rounded-xl p-3 pr-10 bg-black/60 text-white placeholder-gray-500 transition-all ${fieldErrors.password
                                                ? "border-red-500 bg-red-950/30 ring-1 ring-red-500/50"
                                                : "border-white/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                                            }`}
                                        placeholder="Crea una contraseña segura"
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                                    </button>
                                </div>
                                {fieldErrors.password && (
                                    <span className="text-xs text-red-400 font-medium flex items-center gap-1">
                                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                        {fieldErrors.password}
                                    </span>
                                )}

                                {/* Checklist interactivo de requisitos de contraseña */}
                                <div className="p-3 bg-black/50 rounded-xl border border-white/10 space-y-2 mt-1">
                                    <div className="flex items-center justify-between text-[11px] font-semibold text-gray-300">
                                        <span className="flex items-center gap-1.5">
                                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                            Requisitos de seguridad:
                                        </span>
                                        <span className={passwordEvaluation.isValid ? "text-emerald-400 font-bold" : "text-gray-400"}>
                                            {passwordEvaluation.isValid ? "¡Contraseña segura! ✓" : "Incompleta"}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                                        <div className={`flex items-center gap-1.5 transition-colors ${passwordRules.minLength ? "text-emerald-400 font-medium" : "text-gray-400"}`}>
                                            {passwordRules.minLength ? <Check className="w-3.5 h-3.5 shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-gray-600 mx-1 shrink-0" />}
                                            <span>Mínimo 8 caracteres</span>
                                        </div>
                                        <div className={`flex items-center gap-1.5 transition-colors ${passwordRules.hasNumber ? "text-emerald-400 font-medium" : "text-gray-400"}`}>
                                            {passwordRules.hasNumber ? <Check className="w-3.5 h-3.5 shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-gray-600 mx-1 shrink-0" />}
                                            <span>Al menos 1 número (0-9)</span>
                                        </div>
                                        <div className={`flex items-center gap-1.5 transition-colors ${passwordRules.hasUpper ? "text-emerald-400 font-medium" : "text-gray-400"}`}>
                                            {passwordRules.hasUpper ? <Check className="w-3.5 h-3.5 shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-gray-600 mx-1 shrink-0" />}
                                            <span>Una mayúscula (A-Z)</span>
                                        </div>
                                        <div className={`flex items-center gap-1.5 transition-colors ${passwordRules.hasLower ? "text-emerald-400 font-medium" : "text-gray-400"}`}>
                                            {passwordRules.hasLower ? <Check className="w-3.5 h-3.5 shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-gray-600 mx-1 shrink-0" />}
                                            <span>Una minúscula (a-z)</span>
                                        </div>
                                        <div className={`flex items-center gap-1.5 transition-colors sm:col-span-2 ${passwordRules.hasSpecial ? "text-emerald-400 font-medium" : "text-gray-400"}`}>
                                            {passwordRules.hasSpecial ? <Check className="w-3.5 h-3.5 shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-gray-600 mx-1 shrink-0" />}
                                            <span>Carácter especial (! @ # $ % * ? . &)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Confirmar Contraseña */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-200">
                                    Confirmar Contraseña
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => {
                                            setConfirmPassword(e.target.value);
                                            if (fieldErrors.confirmPassword && e.target.value === password) {
                                                setFieldErrors(prev => ({ ...prev, confirmPassword: undefined }));
                                            }
                                        }}
                                        className={`w-full text-sm sm:text-base outline-none border rounded-xl p-3 pr-10 bg-black/60 text-white placeholder-gray-500 transition-all ${fieldErrors.confirmPassword
                                                ? "border-red-500 bg-red-950/30 ring-1 ring-red-500/50"
                                                : "border-white/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                                            }`}
                                        placeholder="Repite tu contraseña"
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                                    </button>
                                </div>
                                {fieldErrors.confirmPassword && (
                                    <span className="text-xs text-red-400 font-medium flex items-center gap-1">
                                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                        {fieldErrors.confirmPassword}
                                    </span>
                                )}
                            </div>
                        </div>

                        {apiError.error && (
                            <div className="p-3 text-xs sm:text-sm text-red-300 bg-red-950/60 border border-red-500/40 rounded-xl font-medium flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                <span>{apiError.message}</span>
                            </div>
                        )}

                        <div className="flex flex-col gap-3.5 mt-1">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="text-base font-extrabold bg-emerald-500 hover:bg-emerald-400 text-gray-950 w-full py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.7)] disabled:opacity-50 cursor-pointer hover:scale-[1.02]"
                            >
                                {isLoading ? "Enviando código al correo..." : "Continuar y Enviar Código ➔"}
                            </button>

                            <p className="text-sm text-gray-300 text-center">
                                ¿Ya tienes una cuenta?{" "}
                                <Link href="/login" className="text-emerald-400 font-bold hover:underline text-glow-hover">
                                    Inicia sesión aquí
                                </Link>
                            </p>
                        </div>
                    </form>
                )}

                {/* Paso 2: Verificación de Código de 6 Dígitos */}
                {step === 2 && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col gap-5 text-center"
                    >
                        <button
                            type="button"
                            onClick={() => {
                                setStep(1);
                                setApiError({ error: false, message: "" });
                            }}
                            className="self-start text-xs font-bold text-gray-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" /> Modificar datos o correo
                        </button>

                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)] mb-3">
                                <KeyRound className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-black text-white">Revisa tu Bandeja de Correo</h2>
                            <p className="text-sm text-gray-300 mt-1 max-w-sm">
                                Hemos enviado un código de 6 dígitos a: <br />
                                <strong className="text-emerald-400 font-bold">{email}</strong>
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                (Revisa también en tu carpeta de Spam o No Deseados si no lo ves en tu bandeja principal).
                            </p>
                        </div>

                        <form onSubmit={handleVerifyAndRegister} className="flex flex-col gap-5">
                            {/* 6 Casillas de Código OTP */}
                            <div className="flex justify-center gap-2 sm:gap-3 my-2">
                                {otp.map((digit, idx) => (
                                    <input
                                        key={idx}
                                        ref={(el) => { otpRefs.current[idx] = el; }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                        className="w-11 h-14 sm:w-13 sm:h-16 text-center text-2xl font-black rounded-xl bg-black/60 border border-white/20 text-emerald-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 outline-none transition-all shadow-inner"
                                    />
                                ))}
                            </div>

                            {apiError.error && (
                                <div className="p-3 text-xs sm:text-sm text-red-300 bg-red-950/60 border border-red-500/40 rounded-xl font-medium flex items-center justify-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                                    <span>{apiError.message}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading || otp.join("").length < 6}
                                className="text-base font-extrabold bg-emerald-500 hover:bg-emerald-400 text-gray-950 w-full py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.7)] disabled:opacity-40 cursor-pointer hover:scale-[1.02]"
                            >
                                {isLoading ? "Verificando código..." : "Verificar y Activar Cuenta ✓"}
                            </button>

                            <div className="flex flex-col items-center gap-2 pt-2">
                                <p className="text-xs text-gray-400">¿No recibiste el correo o venció?</p>
                                <button
                                    type="button"
                                    onClick={handleResendCode}
                                    disabled={resendCooldown > 0 || isLoading}
                                    className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1.5 disabled:opacity-50 disabled:no-underline"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                                    {resendCooldown > 0 ? `Reenviar código en ${resendCooldown}s` : "Reenviar nuevo código"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </div>
        </main>
    );
}