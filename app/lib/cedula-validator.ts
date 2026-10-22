/**
 * Utilidades de validación y verificación de Cédula de Identidad Ecuatoriana
 * Implementa el algoritmo Módulo 10 según la normativa del Registro Civil del Ecuador.
 */

export interface CedulaValidationResult {
    isValid: boolean;
    error?: string;
}

export interface CedulaVerificationResponse {
    exists: boolean;
    message: string;
}

/**
 * Valida estrictamente una cédula de identidad ecuatoriana mediante el Algoritmo Módulo 10.
 * Reglas:
 * 1. Exactamente 10 dígitos numéricos.
 * 2. Los dos primeros dígitos corresponden a una provincia válida (01 a 24) o 30 (consular/exterior).
 * 3. El tercer dígito debe ser menor a 6 (personas naturales: 0, 1, 2, 3, 4, 5).
 * 4. Algoritmo Módulo 10: coeficientes [2, 1, 2, 1, 2, 1, 2, 1, 2], si producto >= 10 se resta 9.
 *    Dígito verificador = (10 - (suma % 10)) % 10.
 */
export function validarCedulaEcuatoriana(cedula: string): CedulaValidationResult {
    const cleanCedula = cedula.trim();

    // 1. Debe tener exactamente 10 dígitos numéricos
    if (!/^\d{10}$/.test(cleanCedula)) {
        return {
            isValid: false,
            error: "La cédula debe contener exactamente 10 dígitos numéricos.",
        };
    }

    // 2. Validación de código de provincia (01 a 24 o 30)
    const provincia = parseInt(cleanCedula.substring(0, 2), 10);
    if ((provincia < 1 || provincia > 24) && provincia !== 30) {
        return {
            isValid: false,
            error: "Código de provincia no válido (primeros 2 dígitos deben ser 01-24 o 30).",
        };
    }

    // 3. Tercer dígito menor a 6 para personas naturales
    const tercerDigito = parseInt(cleanCedula.charAt(2), 10);
    if (tercerDigito < 0 || tercerDigito > 5) {
        return {
            isValid: false,
            error: "Tercer dígito no válido para persona natural (debe ser menor a 6).",
        };
    }

    // 4. Algoritmo Módulo 10
    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    const digitoVerificador = parseInt(cleanCedula.charAt(9), 10);
    let suma = 0;

    for (let i = 0; i < 9; i++) {
        let producto = parseInt(cleanCedula.charAt(i), 10) * coeficientes[i];
        if (producto >= 10) {
            producto -= 9;
        }
        suma += producto;
    }

    const residuo = suma % 10;
    const digitoCalculado = residuo === 0 ? 0 : 10 - residuo;

    if (digitoCalculado !== digitoVerificador) {
        return {
            isValid: false,
            error: "El dígito verificador es incorrecto (validación Módulo 10 fallida).",
        };
    }

    return { isValid: true };
}

/**
 * Lista mock de cédulas ecuatorianas previamente registradas para pruebas de simulación offline.
 */
const MOCK_REGISTERED_CEDULAS = new Set<string>([
    "1710034065", // Cédula ecuatoriana válida de prueba (Pichincha)
    "1715421523",
    "0926687856", // Cédula ecuatoriana válida de prueba (Guayas)
    "1722334455",
]);

/**
 * Verifica asíncronamente en tiempo real si una cédula ya existe en el sistema.
 * Realiza una consulta al endpoint `/api/auth/check-cedula` con respaldo de simulación mock.
 */
export async function verificarExistenciaCedula(cedula: string): Promise<CedulaVerificationResponse> {
    const validation = validarCedulaEcuatoriana(cedula);
    if (!validation.isValid) {
        return {
            exists: false,
            message: validation.error || "Cédula inválida.",
        };
    }

    try {
        const response = await fetch(`/api/auth/check-cedula?cedula=${encodeURIComponent(cedula.trim())}`, {
            method: "GET",
            headers: {
                "Accept": "application/json",
            },
            cache: "no-store",
        });

        if (response.ok) {
            const data = await response.json();
            return {
                exists: Boolean(data.exists),
                message: data.message || (data.exists ? "Esta cédula ya se encuentra registrada en el sistema." : "Cédula disponible para registro."),
            };
        }
    } catch {
        // En caso de que el backend o la base de datos no estén disponibles, recurre al mock formal
    }

    // Mock con latencia simulada para garantizar demostración visual fluida de estados de carga
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (MOCK_REGISTERED_CEDULAS.has(cedula.trim())) {
        return {
            exists: true,
            message: "Esta cédula de identidad ya se encuentra registrada en el sistema.",
        };
    }

    return {
        exists: false,
        message: "Cédula válida y disponible para nuevo registro.",
    };
}
