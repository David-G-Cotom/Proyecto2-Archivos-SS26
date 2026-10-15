import { ErrorSolicitudInvalida } from "../utilities/errores.js";
import { validarIdObjeto } from "./comunes.validacion.js";

function validarNombreCarpeta(valor: unknown): string {
    if (typeof valor !== 'string') {
        throw new ErrorSolicitudInvalida('El nombre es obligatorio.');
    }

    const nombre = valor.trim();

    if (nombre.length === 0) {
        throw new ErrorSolicitudInvalida('El nombre es obligatorio.');
    }

    if (nombre.length > 120) {
        throw new ErrorSolicitudInvalida('El nombre no puede superar los 120 caracteres.');
    }

    if (/[/\\]/.test(nombre)) {
        throw new ErrorSolicitudInvalida('El nombre no puede contener "/" ni "\\".');
    }

    return nombre;
};

export interface DatosCrearCarpeta {
    nombre: string;
    carpetaPadreId?: string | null;
}

export interface DatosRenombrarCarpeta {
    nombre: string;
}

export interface DatosMoverCarpeta {
    destinoId: string | null;
}

export interface DatosConsultaContenido {
    carpetaId?: string;
}

export function validarCrearCarpeta(datos: unknown): DatosCrearCarpeta {
    if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
        throw new ErrorSolicitudInvalida('Los datos de la carpeta no son válidos.');
    }

    const entrada = datos as Record<string, unknown>;

    const resultado: DatosCrearCarpeta = { nombre: validarNombreCarpeta(entrada.nombre) };

    if (entrada.carpetaPadreId !== undefined) {
        if (entrada.carpetaPadreId === null) {
            resultado.carpetaPadreId = null;
        } else {
            resultado.carpetaPadreId = validarIdObjeto(entrada.carpetaPadreId);
        }
    }

    return resultado;
}

export function validarRenombrarCarpeta(datos: unknown): DatosRenombrarCarpeta {
    if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
        throw new ErrorSolicitudInvalida('Los datos de la carpeta no son válidos.');
    }

    const entrada = datos as Record<string, unknown>;

    return { nombre: validarNombreCarpeta(entrada.nombre) };
}

export function validarMoverCarpeta(datos: unknown): DatosMoverCarpeta {
    if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
        throw new ErrorSolicitudInvalida('Los datos de movimiento no son válidos.');
    }

    const entrada = datos as Record<string, unknown>;

    if (entrada.destinoId === undefined) {
        throw new ErrorSolicitudInvalida('El destino es obligatorio.');
    }

    return {
        destinoId: entrada.destinoId === null
            ? null
            : validarIdObjeto(entrada.destinoId)
    };
}

export function validarConsultaContenido(datos: unknown): DatosConsultaContenido {
    if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
        throw new ErrorSolicitudInvalida('Los parámetros de consulta no son válidos.');
    }

    const entrada = datos as Record<string, unknown>;

    const resultado: DatosConsultaContenido = {};

    if (entrada.carpetaId !== undefined) {
        resultado.carpetaId = validarIdObjeto(entrada.carpetaId);
    }

    return resultado;
}