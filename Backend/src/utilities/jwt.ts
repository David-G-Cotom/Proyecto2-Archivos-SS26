import jwt, { SignOptions } from "jsonwebtoken";
import { entorno } from "../config/entorno.js";
import { ErrorNoAutenticado } from "./errores.js";

export function firmarToken(usuarioId: string): string {
    return jwt.sign({}, entorno.jwtSecreto, {
        subject: usuarioId,
        expiresIn: entorno.jwtExpiracionHoras as SignOptions['expiresIn'],
    });
}

export function verificarToken(token: string): string {
    try {
        const carga = jwt.verify(token, entorno.jwtSecreto);
        if (typeof carga === 'string' || !carga.sub) {
            throw new Error('Token sin sujeto');
        }
        return carga.sub;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new ErrorNoAutenticado('Tu sesión expiró. Inicia sesión nuevamente.');
        }
        throw new ErrorNoAutenticado('Sesión no válida. Inicia sesión nuevamente.');
    }
}