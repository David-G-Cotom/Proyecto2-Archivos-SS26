import { RequestHandler } from "express";
import mongoose from "mongoose";
import { ErrorSolicitudInvalida } from "../utilities/errores.js";

export interface DetalleValidacion {
    campo: string;
    mensaje: string;
}

/**
 * Una función validadora recibe datos desconocidos y devuelve los datos validados si son correctos
 * de lo contrario lanza ErrorSolicitudInvalida si son incorrectos.
 */
export type Validador<T> = (datos: unknown) => T;

export function errorValidacion(detalles: DetalleValidacion[]): never {
    throw new ErrorSolicitudInvalida('Hay datos inválidos en la solicitud.', detalles);
}

export function esObjeto(valor: unknown): valor is Record<string, unknown> {
    return typeof valor === 'object'
        && valor !== null
        && !Array.isArray(valor);
}

/**
 * Middleware: valida req.body y lo reemplaza por la versión validada.
 */
export function validarCuerpo<T>(validador: Validador<T>): RequestHandler {
    return (req, _res, next) => {
        req.body = validador(req.body);
        next();
    };
}

export function validarObjectId(nombreParametro = 'id'): RequestHandler {
    return (req, _res, next) => {
        const valor = req.params[nombreParametro];

        if (typeof valor !== 'string' || !mongoose.isValidObjectId(valor)) {
            throw new ErrorSolicitudInvalida(`El identificador "${nombreParametro}" no es válido.`);
        }

        next();
    };
}