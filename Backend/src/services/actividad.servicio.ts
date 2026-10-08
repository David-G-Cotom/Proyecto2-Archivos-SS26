import mongoose from "mongoose";
import { Accion, TipoRecursoActividad } from "../constants/dominio.js";
import { Actividad } from "../models/index.js";

export interface DatosActividad {
    usuarioId: string | mongoose.Types.ObjectId;
    username: string;
    accion: Accion;
    recursoTipo: TipoRecursoActividad;
    recursoId: string | mongoose.Types.ObjectId;
    recursoNombre: string;
    detalle?: string;
}

export async function registrarActividad(datos: DatosActividad): Promise<void> {
    try {
        await Actividad.create({
            usuarioId: new mongoose.Types.ObjectId(datos.usuarioId),
            username: datos.username,
            accion: datos.accion,
            recursoTipo: datos.recursoTipo,
            recursoId: new mongoose.Types.ObjectId(datos.recursoId),
            recursoNombre: datos.recursoNombre,
            detalle: datos.detalle ?? '',
        });
    } catch (error) {
        console.error('[ACTIVIDAD] No se pudo registrar la actividad:', error);
    }
}