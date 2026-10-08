import { Request, Response } from "express";
import { obtenerUsuarioActual } from "../middlewares/autenticacion.js";
import { DatosCambiarPassword, DatosLogin } from "../validations/autenticacion.validacion.js";
import * as autenticacion from "../services/autenticacion.servicio.js";

export async function iniciarSesion(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body as DatosLogin;
    res.json(await autenticacion.iniciarSesion(username, password));
}

export async function cambiarPassword(req: Request, res: Response): Promise<void> {
    const { currentPassword, newPassword } = req.body as DatosCambiarPassword;
    await autenticacion.cambiarPassword(obtenerUsuarioActual(res).id, currentPassword, newPassword);
    res.status(204).end();
}