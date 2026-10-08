import { DetalleValidacion, errorValidacion } from "../middlewares/validar.js";

/**
 * Política de contraseñas:
 *
 * - mínimo 8 caracteres;
 * - al menos una letra;
 * - al menos un número.
 */
export function validarPassword(valor: unknown, campo = 'password'): string {
    const detalles: DetalleValidacion[] = [];

    if (typeof valor !== 'string') {
        detalles.push({
            campo,
            mensaje: 'La contraseña es obligatoria.',
        });

        errorValidacion(detalles);
    }

    if (valor.length < 8) {
        detalles.push({
            campo,
            mensaje: 'La contraseña debe tener al menos 8 caracteres.',
        });
    }

    if (!/[A-Za-z]/.test(valor)) {
        detalles.push({
            campo,
            mensaje: 'La contraseña debe incluir al menos una letra.',
        });
    }

    if (!/\d/.test(valor)) {
        detalles.push({
            campo,
            mensaje: 'La contraseña debe incluir al menos un número.',
        });
    }

    if (detalles.length > 0) {
        errorValidacion(detalles);
    }

    return valor;
}