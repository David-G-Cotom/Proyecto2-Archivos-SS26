import { model, Schema, Types } from "mongoose";
import { Accion, ACCIONES, TipoRecursoActividad, TIPOS_RECURSO_ACTIVIDAD } from "../constants/dominio.js";

export interface IActividad {
    usuarioId: Types.ObjectId;
    username: string;
    accion: Accion;
    recursoTipo: TipoRecursoActividad;
    recursoId: Types.ObjectId;
    recursoNombre: string;
    detalle: string;
    createdAt: Date;
}

const esquemaActividad = new Schema<IActividad>(
    {
        usuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
        username: { type: String, required: true },
        accion: { type: String, enum: ACCIONES, required: true },
        recursoTipo: { type: String, enum: TIPOS_RECURSO_ACTIVIDAD, required: true },
        recursoId: { type: Schema.Types.ObjectId, required: true },
        recursoNombre: { type: String, required: true },
        detalle: { type: String },
        createdAt: { type: Date, default: Date.now, required: true },
    },
    { collection: 'actividades', versionKey: false },
);

esquemaActividad.index({ usuarioId: 1 }); // historial de un usuario
esquemaActividad.index({ recursoId: 1 }); // historial de un recurso con más operaciones
esquemaActividad.index({ accion: 1 }); // reportes por tipo de operación
esquemaActividad.index({ createdAt: 1 }); // agrupación por período

export const Actividad = model<IActividad>('Actividad', esquemaActividad);