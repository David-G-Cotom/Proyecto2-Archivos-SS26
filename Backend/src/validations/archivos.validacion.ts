import { ErrorSolicitudInvalida } from "../utilities/errores.js";
import { validarIdObjeto } from "./comunes.validacion.js";

function validarNombreArchivo(valor: unknown): string {
    if (typeof valor !== 'string') {
        throw new ErrorSolicitudInvalida('El nombre es obligatorio.');
    }

    const nombre = valor.trim();

    if (nombre.length === 0) {
        throw new ErrorSolicitudInvalida('El nombre es obligatorio.');
    }

    if (nombre.length > 160) {
        throw new ErrorSolicitudInvalida('El nombre no puede superar los 160 caracteres.');
    }

    if (/[/\\]/.test(nombre)) {
        throw new ErrorSolicitudInvalida('El nombre no puede contener "/" ni "\\".');
    }

    return nombre;
};

export interface DatosSubirArchivo {
    nombre: string;
    carpetaId?: string;
    reemplazar: boolean;
}

export interface DatosRenombrarArchivo {
    nombre: string;
}

export interface DatosMoverArchivo {
    destinoId: string | null;
}

export function validarSubirArchivo(datos: unknown): DatosSubirArchivo {
    if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
        throw new ErrorSolicitudInvalida('Los datos del archivo no son válidos.');
    }

    const entrada = datos as Record<string, unknown>;

    const resultado: DatosSubirArchivo = {
        nombre: validarNombreArchivo(entrada.nombre),
        reemplazar: false,
    };

    if (entrada.carpetaId !== undefined) {
        resultado.carpetaId = validarIdObjeto(entrada.carpetaId);
    }

    if (entrada.reemplazar !== undefined) {
        if (entrada.reemplazar !== 'true' && entrada.reemplazar !== 'false') {
            throw new ErrorSolicitudInvalida('El valor de reemplazar debe ser "true" o "false".');
        }

        resultado.reemplazar = entrada.reemplazar === 'true';
    }

    return resultado;
}

export function validarRenombrarArchivo(datos: unknown): DatosRenombrarArchivo {
    if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
        throw new ErrorSolicitudInvalida('Los datos del archivo no son válidos.');
    }

    const entrada = datos as Record<string, unknown>;

    return { nombre: validarNombreArchivo(entrada.nombre) };
}

export function validarMoverArchivo(datos: unknown): DatosMoverArchivo {
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
            : validarIdObjeto(entrada.destinoId),
    };
}