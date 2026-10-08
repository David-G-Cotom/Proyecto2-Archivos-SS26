import { HydratedDocument } from "mongoose";
import { ICarpeta } from "../models/carpeta.js";
import { IUsuario } from "../models/usuario.js";

export function aUsuarioSesion(usuario: HydratedDocument<IUsuario>) {
    return {
        id: String(usuario._id),
        username: usuario.username,
        nombreCompleto: usuario.nombreCompleto,
        correo: usuario.correo,
        rol: usuario.rol,
    };
}

export function aUsuarioAdministrado(usuario: HydratedDocument<IUsuario>) {
    const sesion = aUsuarioSesion(usuario);
    return {
        id: sesion.id,
        username: sesion.username,
        nombreCompleto: sesion.nombreCompleto,
        correo: sesion.correo,
        rol: sesion.rol,
        activo: usuario.activo,
        espacioUsadoBytes: usuario.espacioUsadoBytes,
        createdAt: usuario.createdAt,
        ultimoAccesoEn: usuario.ultimoAccesoEn ?? null,
    };
}

export function aCarpeta(carpeta: HydratedDocument<ICarpeta>, cantidadSubcarpetas = 0) {
    return {
        id: String(carpeta._id),
        nombre: carpeta.nombre,
        carpetaPadreId: carpeta.carpetaPadreId ? String(carpeta.carpetaPadreId) : null,
        cantidadSubcarpetas,
        createdAt: carpeta.createdAt,
        updatedAt: carpeta.updatedAt,
    };
}