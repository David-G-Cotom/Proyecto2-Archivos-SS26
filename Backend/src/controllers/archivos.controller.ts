import { Request, Response } from "express";
import { obtenerUsuarioActual } from "../middlewares/autenticacion.js";
import { disposicionAdjunto } from "../utilities/http.js";
import { pipeline } from "stream";  // para trasmitir los archivos eficientemente
import { validarSubirArchivo } from "../validations/archivos.validacion.js";
import * as archivos from "../services/archivos.servicio.js"

export async function subir(req: Request, res: Response): Promise<void> {
    const consulta = validarSubirArchivo(req.query);
    // express.raw deja el cuerpo en un Buffer. Un archivo vacío (0 bytes) no genera cuerpo, de ahi el valor 0.
    const contenido = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);

    const resultado = await archivos.subirArchivo(obtenerUsuarioActual(res), { ...consulta, contenido });
    res.status(resultado.reemplazado ? 200 : 201).json(resultado);
}

export async function detalle(req: Request, res: Response): Promise<void> {
    res.json(await archivos.obtenerDetalle(req.params.id as string, obtenerUsuarioActual(res)));
}

export async function contenido(req: Request, res: Response): Promise<void> {
    const descargar = req.query.descargar === 'true';
    const { archivo, flujo } = await archivos.abrirContenido(req.params.id as string, obtenerUsuarioActual(res), descargar);

    res.setHeader('Content-Type', descargar ? `${archivo.tipoMime}; charset=utf-8` : 'text/plain; charset=utf-8');
    res.setHeader('Content-Length', String(archivo.bytesSize));
    res.setHeader('Content-Disposition', descargar ? disposicionAdjunto(archivo.nombre) : 'inline');
    res.setHeader('Cache-Control', 'no-store');

    // pipeline conecta los flujos y limpia los recursos si el cliente cancela o algo falla a mitad de camino
    await pipeline(flujo, res);
}

export async function renombrar(req: Request, res: Response): Promise<void> {
    const { nombre } = req.body as { nombre: string };
    res.json(await archivos.renombrarArchivo(req.params.id as string, nombre, obtenerUsuarioActual(res)));
}

export async function mover(req: Request, res: Response): Promise<void> {
    const { destinoId } = req.body as { destinoId: string | null };
    res.json(await archivos.moverArchivo(req.params.id as string, destinoId, obtenerUsuarioActual(res)));
}

export async function eliminar(req: Request, res: Response): Promise<void> {
    await papelera.enviarArchivoAPapelera(req.params.id as string, obtenerUsuarioActual(res));
    res.status(204).end();
}