import { model, Schema, Types } from "mongoose";
import { Permiso, PERMISOS, TipoRecurso, TIPOS_RECURSO } from "../constants/dominio.js";

export interface IComparticion {
    recursoTipo: TipoRecurso;
    recursoId: Types.ObjectId;
    propietarioId: Types.ObjectId;
    destinatarioId: Types.ObjectId;
    permiso: Permiso;
    createdAt: Date;
    updatedAt: Date;
}

const esquemaComparticion = new Schema<IComparticion>(
    {
        recursoTipo: { type: String, enum: TIPOS_RECURSO, required: true },
        recursoId: { type: Schema.Types.ObjectId, required: true },
        propietarioId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
        destinatarioId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
        permiso: { type: String, enum: PERMISOS, required: true },
    },
    { collection: 'comparticiones', timestamps: true, versionKey: false },
);

esquemaComparticion.index({ destinatarioId: 1 }); // "compartidos conmigo"
esquemaComparticion.index({ propietarioId: 1 }); // "compartidos por mí"

export const Comparticion = model<IComparticion>('Comparticion', esquemaComparticion);