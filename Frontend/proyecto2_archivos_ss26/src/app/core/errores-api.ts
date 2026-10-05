import { HttpErrorResponse } from "@angular/common/http";
import { ErrorApi } from "../models/usuario.model";

//Convierte cualquier error en un mensaje legible para el usuario.
export function mensajeDeError(
    error: unknown,
    porDefecto = 'Ocurrió un error inesperado. Inténtalo de nuevo.',
): string {
    if (error instanceof HttpErrorResponse) {
        if (error.status === 0) {
            return 'No se pudo conectar con el servidor. Intentalo mas tarde';
        }
        const cuerpo = error.error as Partial<ErrorApi> | null;
        const mensaje = cuerpo?.error?.mensaje;
        if (typeof mensaje === 'string' && mensaje.length > 0) return mensaje;
    }
    return porDefecto;
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
    return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

/**
 * Extrae del error del servidor, qué CAMPOS del formulario fallaron y con qué mensaje: { campo: mensaje }.
 * Entiende los tres formatos de `detalles` que envía la API:
 *   - lista de validación
 *   - conflicto de un campo (usa el mensaje general del error)
 *   - índice único de MongoDB (usa el mensaje general del error)
 * Devuelve un objeto vacío si el error no está asociado a ningún campo.
 */
export function erroresPorCampo(error: unknown): Record<string, string> {
    const resultado: Record<string, string> = {};
    if (!(error instanceof HttpErrorResponse)) return resultado;

    const detalles = (error.error as Partial<ErrorApi> | null)?.error?.detalles;
    const mensajeGeneral = mensajeDeError(error);

    // El backend envía: detalles: [ { campo: 'correo', mensaje: 'Inválido' }, { campo: 'edad', mensaje: 'Debe ser mayor' } ]
    if (Array.isArray(detalles)) {
        for (const detalle of detalles) {
            if (esObjeto(detalle) && typeof detalle['campo'] === 'string' && typeof detalle['mensaje'] === 'string') {
                resultado[detalle['campo']] = detalle['mensaje'];
            }
        }
    } else if (esObjeto(detalles)) {
        // El backend envía: detalles: { campo: 'username' }
        if (typeof detalles['campo'] === 'string') resultado[detalles['campo']] = mensajeGeneral;
        // El backend envía: detalles: { campos: ['correo', 'rut'] }
        if (Array.isArray(detalles['campos'])) {
            for (const campo of detalles['campos']) {
                if (typeof campo === 'string') resultado[campo] = mensajeGeneral;
            }
        }
    }
    return resultado;
}