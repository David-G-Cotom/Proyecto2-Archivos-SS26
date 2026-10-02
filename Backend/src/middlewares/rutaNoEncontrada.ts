import type { Request, Response } from "express";
import { ErrorNoEncontrado } from "../utilities/errores.js";

export function rutaNoEncontrada(req: Request, _res: Response): never {
    throw new ErrorNoEncontrado(`La ruta ${req.method} ${req.originalUrl} no existe.`);
}