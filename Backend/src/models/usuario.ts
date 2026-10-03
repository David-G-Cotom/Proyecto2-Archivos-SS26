import { model, Schema } from "mongoose";
import { Rol, ROLES } from "../constants/dominio.js";

export interface IUsuario {
    username: string;
    nombreCompleto: string;
    correo: string;
    password: string;
    rol: Rol;
    activo: boolean;
    espacioUsadoBytes: number;
    ultimoAccesoEn?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const esquemaUsuario = new Schema<IUsuario>(
    {
        username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 40 },
        nombreCompleto: { type: String, required: true, trim: true, maxlength: 120 },
        correo: { type: String, required: true, unique: true, trim: true },
        // select:false -> nunca se devuelve en las consultas
        password: { type: String, required: true, select: false },
        rol: { type: String, enum: ROLES, default: 'usuario', required: true },
        activo: { type: Boolean, default: true },
        espacioUsadoBytes: { type: Number, default: 0, min: 0 },
        ultimoAccesoEn: { type: Date },
    },
    { collection: 'usuarios', timestamps: true, versionKey: false },
);

export const Usuario = model<IUsuario>('Usuario', esquemaUsuario);