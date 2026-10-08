import { NextFunction, Request, Response } from "express";
import { ErrorApp } from "../utilities/errores.js";
import mongoose from "mongoose";

function responder(res: Response, estado: number, codigo: string, mensaje: string, detalles?: unknown): void {
    res.status(estado).json({ error: { codigo, mensaje, ...(detalles !== undefined && { detalles }) } });
}

/**
 * Errores que lanza el body parser de Express (JSON malformado o cuerpo demasiado grande).
 */
function tipoErrorBodyParser(err: unknown): string | null {
    if (typeof err === 'object' && err !== null && 'type' in err && typeof err.type === 'string') {
        return err.type;
    }
    return null;
}

// Express reconoce un middleware de errores únicamente si tiene 4 parámetros (aunque no use el último).
export function manejadorErrores(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
    // 1. Errores controlados lanzados por nuestro código
    if (err instanceof ErrorApp) {
        responder(res, err.codigoHttp, err.codigo, err.message, err.detalles);
        return;
    }

    // 2. Validación del esquema de Mongoose: se traduce a una lista campo/mensaje
    if (err instanceof mongoose.Error.ValidationError) {
        const detalles: Array<{ campo: string; mensaje: string }> = [];
        for (const clave in err.errors) {
            const e = err.errors[clave];
            detalles.push({
                campo: e.path,
                mensaje: e.message
            });
        }
        responder(res, 400, 'VALIDACION', 'Hay datos inválidos en la solicitud.', detalles);
        return;
    }

    // 3. ObjectId con formato inválido (por ejemplo /api/archivos/abc)
    if (err instanceof mongoose.Error.CastError) {
        responder(res, 400, 'ID_INVALIDO', `El valor del campo "${err.path}" no es válido.`);
        return;
    }

    // 4. Violación de un índice único (código 11000 de MongoDB), p. ej. nombre duplicado en una carpeta
    if (err instanceof mongoose.mongo.MongoServerError && err.code === 11000) {
        const campos = Object.keys(err.keyPattern ?? {});
        responder(res, 409, 'DUPLICADO', 'Ya existe un registro con esos datos.', { campos });
        return;
    }

    // 5. Errores del parser del cuerpo de la petición
    const tipoBodyParser = tipoErrorBodyParser(err);
    if (tipoBodyParser === 'entity.parse.failed') {
        responder(res, 400, 'JSON_INVALIDO', 'El cuerpo de la solicitud no es un JSON válido.');
        return;
    }
    if (tipoBodyParser === 'entity.too.large') {
        responder(res, 413, 'CUERPO_DEMASIADO_GRANDE', 'El contenido enviado supera el tamaño permitido.');
        return;
    }

    // 6. Error no previsto: se registra completo en el servidor, pero al cliente no se le filtran detalles internos
    console.error('[ERROR]', err);
    responder(
        res,
        500,
        'ERROR_INTERNO',
        'Ocurrió un error inesperado. Inténtalo de nuevo.',
    );
}