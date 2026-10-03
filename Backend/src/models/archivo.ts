import { model, Schema, Types } from "mongoose";
import { Extension, EXTENSIONES_PERMITIDAS } from "../constants/dominio.js";
import { Eliminacion, esquemaEliminacion, REGEX_NOMBRE_VALIDO } from "./compartido.js";

export interface IArchivo {
    nombre: string;
    extension: Extension;
    tipoMime: string;
    bytesSize: number;
    propietarioId: Types.ObjectId;
    carpetaId: Types.ObjectId | null;
    // Referencia al contenido en GridFS (contenidos.files._id)
    contenidoId: Types.ObjectId;
    eliminacion: Eliminacion | null;
    createdAt: Date;
    updatedAt: Date;
}

const esquemaArchivo = new Schema<IArchivo>(
    {
        nombre: { type: String, required: true, trim: true, maxlength: 160, match: [REGEX_NOMBRE_VALIDO, 'El nombre no puede contener "/" ni "\\".'] },
        extension: { type: String, enum: EXTENSIONES_PERMITIDAS, required: true },
        tipoMime: { type: String, required: true },
        bytesSize: { type: Number, required: true, min: 0 },
        propietarioId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
        carpetaId: { type: Schema.Types.ObjectId, ref: 'Carpeta', default: null },
        contenidoId: { type: Schema.Types.ObjectId, required: true },
        eliminacion: { type: esquemaEliminacion, default: null },
    },
    { collection: 'archivos', timestamps: true, versionKey: false },
);

// No puede haber dos archivos "activos" con el mismo nombre dentro de la misma carpeta
esquemaArchivo.index(
    { propietarioId: 1, carpetaId: 1, nombre: 1 },
    { unique: true, partialFilterExpression: { eliminacion: null } },
);
esquemaArchivo.index({ extension: 1 }); // reporte por tipo
esquemaArchivo.index({ createdAt: 1 }); // reporte por rango de fechas

export const Archivo = model<IArchivo>('Archivo', esquemaArchivo);