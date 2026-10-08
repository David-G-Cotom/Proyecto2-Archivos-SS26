import { NextFunction, Request, RequestHandler, Response } from "express";
import { Rol } from "../constants/dominio.js";
import { ErrorNoAutenticado, ErrorProhibido } from "../utilities/errores.js";
import { verificarToken } from "../utilities/jwt.js";
import { Usuario } from "../models/index.js";

export interface UsuarioAutenticado {
    id: string;
    username: string;
    nombreCompleto: string;
    rol: Rol;
}

export async function requerirAutenticacion(req: Request, res: Response, next: NextFunction): Promise<void> {
    const cabecera = req.headers.authorization;
    if (!cabecera?.startsWith('Bearer ')) {
        throw new ErrorNoAutenticado();
    }

    const usuarioId = verificarToken(cabecera.slice('Bearer '.length));
    const usuario = await Usuario.findById(usuarioId).select('username nombreCompleto rol activo');

    if (!usuario || !usuario.activo) {
        throw new ErrorNoAutenticado('Tu cuenta no está disponible. Contacta al administrador.');
    }

    // Guardar al usuario autenticado en la sesion temporal
    res.locals.usuario = {
        id: String(usuario._id),
        username: usuario.username,
        nombreCompleto: usuario.nombreCompleto,
        rol: usuario.rol,
    } as UsuarioAutenticado;
    next();
}

export function obtenerUsuarioActual(res: Response): UsuarioAutenticado {
    const usuario = res.locals.usuario as UsuarioAutenticado | undefined;
    if (!usuario) {
        throw new ErrorNoAutenticado();
    }
    return usuario;
}

export function requerirRol(rolesPermitidos: Rol[]): RequestHandler {
    return (_req, res, next) => {
        if (!rolesPermitidos.includes(obtenerUsuarioActual(res).rol)) {
            throw new ErrorProhibido('Solo un administrador puede realizar esta acción.');
        }
        next();
    };
}