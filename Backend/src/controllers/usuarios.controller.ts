import { Request, Response } from "express";
import { DatosActualizarUsuario, DatosCrearUsuario, validarConsultaUsuarios } from "../validations/usuarios.validacion.js";
import { obtenerUsuarioActual } from "../middlewares/autenticacion.js";
import * as usuarios from "../services/usuarios.servicio.js";

export async function listar(req: Request, res: Response): Promise<void> {
    const consulta = validarConsultaUsuarios(req.query);
    res.json(await usuarios.listarUsuarios(consulta));
}

export async function obtener(req: Request, res: Response): Promise<void> {
    res.json(await usuarios.obtenerUsuario(req.params.id as string));
}

export async function crear(req: Request, res: Response): Promise<void> {
    const usuario = await usuarios.crearUsuario(req.body as DatosCrearUsuario, obtenerUsuarioActual(res));
    res.status(201).json(usuario);
}

export async function actualizar(req: Request, res: Response): Promise<void> {
    res.json(await usuarios.actualizarUsuario(req.params.id as string, req.body as DatosActualizarUsuario, obtenerUsuarioActual(res)));
}

export async function cambiarEstado(req: Request, res: Response): Promise<void> {
    const { activo } = req.body as { activo: boolean };
    res.json(await usuarios.cambiarEstadoUsuario(req.params.id as string, activo, obtenerUsuarioActual(res)));
}

export async function restablecerPassword(req: Request, res: Response): Promise<void> {
    const { newPassword } = req.body as { newPassword: string };
    await usuarios.restablecerPassword(req.params.id as string, newPassword, obtenerUsuarioActual(res));
    res.status(204).end();
}