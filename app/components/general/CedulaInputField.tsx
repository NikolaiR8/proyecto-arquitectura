"use client";

import React, { useState, useEffect, useRef } from "react";
import { CreditCard, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { validarCedulaEcuatoriana, verificarExistenciaCedula } from "../../lib/cedula-validator";

export interface CedulaValidationState {
    cedula: string;
    isValidFormat: boolean;
    isAvailable: boolean;
    isChecking: boolean;
    errorMessage: string | null;
}

interface CedulaInputFieldProps {
    value?: string;
    onChange?: (state: CedulaValidationState) => void;
    disabled?: boolean;
    label?: string;
    placeholder?: string;
    id?: string;
    required?: boolean;
    className?: string;
}

export default function CedulaInputField({
    value = "",
    onChange,
    disabled = false,
    label = "Cédula de Identidad",
    placeholder = "Ej. 1710034065",
    id = "cedula-input",
    required = true,
    className = "",
}: CedulaInputFieldProps) {
    const [cedula, setCedula] = useState<string>(value);
    const [isChecking, setIsChecking] = useState<boolean>(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [existsInSystem, setExistsInSystem] = useState<boolean | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const latestCedulaRef = useRef<string>(cedula);

    useEffect(() => {
        if (value !== cedula) {
            setCedula(value.replace(/\D/g, "").slice(0, 10));
        }
    }, [value]);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // Restricción estricta frontend: únicamente dígitos numéricos y máximo 10 caracteres
        const rawValue = event.target.value;
        const numericOnly = rawValue.replace(/\D/g, "").slice(0, 10);
        
        setCedula(numericOnly);
        latestCedulaRef.current = numericOnly;
        setSuccessMessage(null);
        setExistsInSystem(null);

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Si el campo está incompleto (< 10 dígitos)
        if (numericOnly.length < 10) {
            setIsChecking(false);
            if (numericOnly.length === 0) {
                setValidationError(required ? "Campo requerido" : null);
            } else {
                setValidationError(`Faltan ${10 - numericOnly.length} dígitos (debe contener 10 dígitos)`);
            }
            
            onChange?.({
                cedula: numericOnly,
                isValidFormat: false,
                isAvailable: false,
                isChecking: false,
                errorMessage: numericOnly.length === 0 ? "Campo requerido" : "Cédula incompleta",
            });
            return;
        }

        // Longitud exacta de 10 dígitos: aplicar Algoritmo Módulo 10
        const result = validarCedulaEcuatoriana(numericOnly);
        
        if (!result.isValid) {
            setIsChecking(false);
            setValidationError(result.error || "Cédula ecuatoriana no válida.");
            onChange?.({
                cedula: numericOnly,
                isValidFormat: false,
                isAvailable: false,
                isChecking: false,
                errorMessage: result.error || "Cédula inválida",
            });
            return;
        }

        // Formato y Módulo 10 válidos -> iniciar verificación asíncrona de existencia
        setValidationError(null);
        setIsChecking(true);

        onChange?.({
            cedula: numericOnly,
            isValidFormat: true,
            isAvailable: false,
            isChecking: true,
            errorMessage: null,
        });

        debounceTimerRef.current = setTimeout(async () => {
            const currentCedula = latestCedulaRef.current;
            if (currentCedula !== numericOnly) return;

            try {
                const response = await verificarExistenciaCedula(currentCedula);
                if (latestCedulaRef.current !== currentCedula) return;

                setIsChecking(false);

                if (response.exists) {
                    setExistsInSystem(true);
                    setValidationError(response.message || "Esta cédula ya se encuentra registrada en el sistema.");
                    onChange?.({
                        cedula: currentCedula,
                        isValidFormat: true,
                        isAvailable: false,
                        isChecking: false,
                        errorMessage: response.message || "Cédula ya registrada",
                    });
                } else {
                    setExistsInSystem(false);
                    setValidationError(null);
                    setSuccessMessage(response.message || "Cédula válida y disponible para nuevo registro.");
                    onChange?.({
                        cedula: currentCedula,
                        isValidFormat: true,
                        isAvailable: true,
                        isChecking: false,
                        errorMessage: null,
                    });
                }
            } catch {
                if (latestCedulaRef.current !== currentCedula) return;
                setIsChecking(false);
                setValidationError("No fue posible verificar la cédula en tiempo real.");
                onChange?.({
                    cedula: currentCedula,
                    isValidFormat: true,
                    isAvailable: false,
                    isChecking: false,
                    errorMessage: "Error en verificación",
                });
            }
        }, 400);
    };

    const isCompleteAndValid = cedula.length === 10 && !validationError && !isChecking && existsInSystem === false;
    const hasError = Boolean(validationError);

    return (
        <div className={`flex flex-col gap-1.5 text-left w-full ${className}`}>
            <div className="flex items-center justify-between">
                <label htmlFor={id} className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span>{label}</span>
                </label>
                <div className="flex items-center gap-1.5 text-xs">
                    <span className="font-mono text-gray-400 font-medium">
                        {cedula.length}/10
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-semibold tracking-wide">
                        Ecuador
                    </span>
                </div>
            </div>

            <div className="relative">
                <input
                    id={id}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={10}
                    disabled={disabled}
                    value={cedula}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    className={`w-full text-base font-mono tracking-wider outline-none border rounded-xl py-3.5 pl-4 pr-11 bg-black/60 text-white placeholder-gray-500 transition-all ${
                        hasError
                            ? "border-red-500 bg-red-950/20 focus:ring-2 focus:ring-red-400/20"
                            : isCompleteAndValid
                            ? "border-emerald-500 bg-emerald-950/20 focus:ring-2 focus:ring-emerald-400/20"
                            : "border-white/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                    }`}
                />

                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                    {isChecking ? (
                        <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                    ) : isCompleteAndValid ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : hasError && cedula.length > 0 ? (
                        <AlertCircle className="w-5 h-5 text-red-400" />
                    ) : null}
                </div>
            </div>

            {/* Mensajes de validación y estado */}
            <div className="min-h-[20px] flex items-center text-xs transition-all">
                {isChecking && (
                    <span className="text-emerald-300 flex items-center gap-1.5 font-medium">
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        Verificando disponibilidad en el sistema...
                    </span>
                )}

                {!isChecking && hasError && cedula.length > 0 && (
                    <span className="text-red-400 font-medium flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {validationError}
                    </span>
                )}

                {!isChecking && !hasError && successMessage && (
                    <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        {successMessage}
                    </span>
                )}

                {!isChecking && !hasError && !successMessage && cedula.length === 0 && (
                    <span className="text-gray-400 text-[11px]">
                        Ingresa los 10 dígitos numéricos de tu cédula ecuatoriana.
                    </span>
                )}
            </div>
        </div>
    );
}
