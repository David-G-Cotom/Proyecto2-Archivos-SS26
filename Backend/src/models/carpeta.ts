import { model, Schema, Types } from "mongoose";
import { Eliminacion, esquemaEliminacion, REGEX_NOMBRE_VALIDO } from "./compartido.js";

export interface ICarpeta {
    nombre: string;
    propietarioId: Types.ObjectId;
    carpetaPadreId: Types.ObjectId | null;
    ancestros: Types.ObjectId[];
    eliminacion: Eliminacion | null;
    createdAt: Date;
    updatedAt: Date;
}

const esquemaCarpeta = new Schema<ICarpeta>(
    {
        nombre: { type: String, required: true, trim: true, maxlength: 120, match: [REGEX_NOMBRE_VALIDO, 'El nombre no puede contener "/" ni "\\".'] },
        propietarioId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
        carpetaPadreId: { type: Schema.Types.ObjectId, ref: 'Carpeta', default: null },
        ancestros: { type: [Schema.Types.ObjectId], default: [] },
        eliminacion: { type: esquemaEliminacion, default: null },
    },
    { collection: 'carpetas', timestamps: true, versionKey: false },
);

// No puede haber dos carpetas "activas" con el mismo nombre dentro del mismo padre
esquemaCarpeta.index(
    { propietarioId: 1, carpetaPadreId: 1, nombre: 1 },
    { unique: true, partialFilterExpression: { eliminacion: null } },
);

export const Carpeta = model<ICarpeta>('Carpeta', esquemaCarpeta);