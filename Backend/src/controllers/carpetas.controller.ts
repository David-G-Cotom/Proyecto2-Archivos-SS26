import { Request, Response } from "express";
import { obtenerUsuarioActual } from "../middlewares/autenticacion.js";
import { DatosCrearCarpeta, validarConsultaContenido } from "../validations/carpetas.validacion.js";
import * as carpetas from "../services/carpetas.servicio.js";

export async function contenido(req: Request, res: Response): Promise<void> {
    const { carpetaId } = validarConsultaContenido(req.query);
    res.json(await carpetas.listarContenido(obtenerUsuarioActual(res), carpetaId));
}

export async function arbol(req: Request, res: Response): Promise<void> {
    res.json(await carpetas.obtenerArbol(obtenerUsuarioActual(res)));
}

export async function crear(req: Request, res: Response): Promise<void> {
    const { nombre, carpetaPadreId } = req.body as DatosCrearCarpeta;
    res.status(201).json(await carpetas.crearCarpeta(obtenerUsuarioActual(res), nombre, carpetaPadreId));
}

export async function renombrar(req: Request, res: Response): Promise<void> {
    const { nombre } = req.body as { nombre: string };
    res.json(await carpetas.renombrarCarpeta(req.params.id as string, nombre, obtenerUsuarioActual(res)));
}

export async function mover(req: Request, res: Response): Promise<void> {
    const { destinoId } = req.body as { destinoId: string | null };
    res.json(await carpetas.moverCarpeta(req.params.id as string, destinoId, obtenerUsuarioActual(res)));
}