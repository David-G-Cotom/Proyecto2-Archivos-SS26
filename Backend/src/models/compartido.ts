import { Schema, Types } from "mongoose";

/**
 * raizId: _id del elemento que el usuario "elimino". Si se elimina una carpeta,
 *    ella y todo su contenido comparten el mismo raizId; así se restaura o elimina el bloque completo.
 */
export interface Eliminacion {
    fecha: Date;
    raizId: Types.ObjectId;
    usuarioId: Types.ObjectId;
}

export const esquemaEliminacion = new Schema<Eliminacion>(
    {
        fecha: { type: Date, required: true },
        raizId: { type: Schema.Types.ObjectId, required: true },
        usuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    },
    { _id: false }, // Configura el Schema como subdocumento embebido que no necesita generar ID propio
);

esquemaEliminacion.index({ raizId: 1 }); // restaurar/eliminar definitivamente un bloque

// Nombres válidos para archivos y carpetas
export const REGEX_NOMBRE_VALIDO = /^[^/\\]+$/;