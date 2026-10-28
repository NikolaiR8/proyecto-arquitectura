/**
 * Utilidades compartidas para validación de contraseñas y correos admitidos.
 * Satisface los requisitos de seguridad estándar:
 * - Contraseña con longitud mínima de 8 caracteres, al menos un número, una mayúscula,
 *   una minúscula y un carácter especial.
 * - Validación y aviso de dominio admitido únicamente para Gmail (@gmail.com).
 */

export interface PasswordRulesState {
    minLength: boolean;
    hasUpper: boolean;
    hasLower: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
}

export interface PasswordValidationResult {
    isValid: boolean;
    rules: PasswordRulesState;
    error?: string;
}

export interface EmailValidationResult {
    isValid: boolean;
    error?: string;
}

export const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/;

/**
 * Valida la robustez de una contraseña según los estándares habituales de la web.
 */
export function validatePassword(password: string): PasswordValidationResult {
    const rules: PasswordRulesState = {
        minLength: (password || "").length >= 8,
        hasUpper: /[A-Z]/.test(password || ""),
        hasLower: /[a-z]/.test(password || ""),
        hasNumber: /[0-9]/.test(password || ""),
        hasSpecial: SPECIAL_CHAR_REGEX.test(password || "")
    };

    const isValid = Object.values(rules).every(Boolean);

    if (isValid) {
        return { isValid: true, rules };
    }

    // Mensaje descriptivo con el requisito faltante principal
    let error = "La contraseña debe cumplir con todos los requisitos de seguridad.";
    if (!rules.minLength) {
        error = "La contraseña debe tener al menos 8 caracteres.";
    } else if (!rules.hasUpper) {
        error = "La contraseña debe incluir al menos una letra mayúscula (A-Z).";
    } else if (!rules.hasLower) {
        error = "La contraseña debe incluir al menos una letra minúscula (a-z).";
    } else if (!rules.hasNumber) {
        error = "La contraseña debe incluir al menos un número (0-9).";
    } else if (!rules.hasSpecial) {
        error = "La contraseña debe incluir al menos un carácter especial (ej: ! @ # $ % * ?).";
    }

    return { isValid: false, rules, error };
}

/**
 * Verifica si una dirección de correo pertenece al dominio permitido (@gmail.com).
 */
export function isGmailDomain(email: string): boolean {
    const clean = (email || "").trim().toLowerCase();
    return clean.endsWith("@gmail.com") || clean.endsWith("@googlemail.com");
}

/**
 * Valida exhaustivamente el correo para registro o actualización,
 * asegurando que cumpla el formato y pertenezca exclusivamente a Gmail.
 */
export function validateRegisterEmail(value: string): EmailValidationResult {
    const trimmed = (value || "").trim();

    if (!trimmed) {
        return { isValid: false, error: "El correo electrónico es obligatorio." };
    }

    if (/\s/.test(trimmed)) {
        return { isValid: false, error: "El correo no puede contener espacios en blanco." };
    }

    // Caracteres prohibidos en la dirección
    const forbiddenCharMatch = trimmed.match(/[#$%&!*^~`+=/\\|{}[\]:;"'<>?]/);
    if (forbiddenCharMatch) {
        return {
            isValid: false,
            error: `El correo contiene un carácter no permitido ('${forbiddenCharMatch[0]}'). Solo se permiten letras, números, puntos y @.`
        };
    }

    // Validar arroba
    const atCount = (trimmed.match(/@/g) || []).length;
    if (atCount === 0) {
        return { isValid: false, error: "Falta el símbolo '@' en el correo electrónico (ej: usuario@gmail.com)." };
    }
    if (atCount > 1) {
        return { isValid: false, error: "El correo electrónico solo puede contener un símbolo '@'." };
    }

    const [localPart, domainPart] = trimmed.split("@");

    if (!localPart) {
        return { isValid: false, error: "Falta el nombre de usuario antes del '@'." };
    }

    if (!domainPart) {
        return { isValid: false, error: "Falta el dominio después del '@' (ej: gmail.com)." };
    }

    const generalRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!generalRegex.test(trimmed)) {
        return { isValid: false, error: "El formato del correo no es válido. Verifica que esté bien escrito." };
    }

    // REGLA CLAVE: Solo se admiten correos Gmail
    if (!isGmailDomain(trimmed)) {
        return {
            isValid: false,
            error: "Únicamente se admiten correos de Gmail (@gmail.com). Actualmente otros proveedores (Hotmail, Outlook, Yahoo) no están admitidos para la entrega de códigos."
        };
    }

    return { isValid: true };
}
