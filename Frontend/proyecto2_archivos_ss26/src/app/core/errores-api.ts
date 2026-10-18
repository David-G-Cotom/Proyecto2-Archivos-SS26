import { HttpErrorResponse } from "@angular/common/http";
import { ErrorApi } from "../models/usuario.model";

/**
 * Obtiene el cuerpo { error: { codigo, mensaje, detalles } } de una respuesta de error desde el servidor
 */
function leerCuerpoError(error: HttpErrorResponse): Partial<ErrorApi> | null {
    const cuerpo: unknown = error.error;
    if (typeof cuerpo === 'string') {
        try {
            return JSON.parse(cuerpo) as Partial<ErrorApi>;
        } catch {
            return null;
        }
    }
    return (cuerpo as Partial<ErrorApi> | null) ?? null;
}

//Convierte cualquier error en un mensaje legible para el usuario.
export function mensajeDeError(
    error: unknown,
    porDefecto = 'Ocurrió un error inesperado. Inténtalo de nuevo.',
): string {
    if (error instanceof HttpErrorResponse) {
        if (error.status === 0) {
            return 'No se pudo conectar con el servidor. Intentalo mas tarde';
        }
        if (error.status === 413) {
            return 'El archivo supera el tamaño máximo permitido (5 MB).';
        }
        const mensaje = leerCuerpoError(error)?.error?.mensaje;
        if (typeof mensaje === 'string' && mensaje.length > 0) return mensaje;
    }
    return porDefecto;
}

/** Codigo interno del error del servidor o null si no lo trae. */
export function codigoDeError(error: unknown): string | null {
    if (error instanceof HttpErrorResponse) {
        return leerCuerpoError(error)?.error?.codigo ?? null;
    }
    return null;
}

// Type Guard de TypeScript para verificar que el 'valor' se un objeto de TypeScript
function esObjeto(valor: unknown): valor is Record<string, unknown> {
    return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

/**
 * Extrae del error del servidor, que CAMPOS del formulario fallaron y con que mensaje: { campo: mensaje }.
 * Entiende los tres formatos de 'detalles' que envía la API:
 *   - lista de validacion
 *   - conflicto de un campo (usa el mensaje general del error)
 *   - indice unico de MongoDB (usa el mensaje general del error)
 * Devuelve un objeto vacio si el error no está asociado a ningun campo.
 */
export function erroresPorCampo(error: unknown): Record<string, string> {
    const resultado: Record<string, string> = {};
    if (!(error instanceof HttpErrorResponse)) return resultado;

    const detalles = leerCuerpoError(error)?.error?.detalles;
    const mensajeGeneral = mensajeDeError(error);

    // El backend envía: detalles: [ { campo: 'correo', mensaje: 'Invalido' }, { campo: 'edad', mensaje: 'Debe ser mayor' } ]
    if (Array.isArray(detalles)) {
        for (const detalle of detalles) {
            if (esObjeto(detalle) && typeof detalle['campo'] === 'string' && typeof detalle['mensaje'] === 'string') {
                resultado[detalle['campo']] = detalle['mensaje'];
            }
        }
    } else if (esObjeto(detalles)) {
        // El backend envia: detalles: { campo: 'username' }
        if (typeof detalles['campo'] === 'string') resultado[detalles['campo']] = mensajeGeneral;
        // El backend envia: detalles: { campos: ['correo', 'rut'] }
        if (Array.isArray(detalles['campos'])) {
            for (const campo of detalles['campos']) {
                if (typeof campo === 'string') resultado[campo] = mensajeGeneral;
            }
        }
    }
    return resultado;
}