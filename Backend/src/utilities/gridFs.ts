import mongoose from "mongoose";
import { obtenerBucketContenidos } from "../config/baseDatos.js";
import { once } from "events";

/** Guarda un contenido en GridFS y devuelve su id. */
export async function guardarContenido(
    contenido: Buffer,
    nombre: string,
    metadata: Record<string, unknown>,
): Promise<mongoose.Types.ObjectId> {
    const flujo = obtenerBucketContenidos().openUploadStream(nombre, { metadata });
    // once() espera el evento 'finish' y se rechaza si el flujo emite 'error'
    const terminado = once(flujo, 'finish');
    flujo.end(contenido);
    await terminado;
    return new mongoose.Types.ObjectId(String(flujo.id));
}

/**
 * Abre un flujo de lectura del contenido. El contenido se envia al cliente por partes (stream),
 * sin cargar el archivo completo en la memoria del servidor.
 */
export function abrirLectura(id: mongoose.Types.ObjectId) {
    return obtenerBucketContenidos().openDownloadStream(new mongoose.mongo.ObjectId(String(id)));
}

/**
 * Elimina un contenido de GridFS. Si falla solo se deja constancia en el log: un contenido huerfano
 * ocupa espacio pero no rompe la integridad de los datos
 */
export async function eliminarContenido(id: mongoose.Types.ObjectId): Promise<void> {
    try {
        await obtenerBucketContenidos().delete(new mongoose.mongo.ObjectId(String(id)));
    } catch (error) {
        console.error('[GRIDFS] No se pudo eliminar el contenido', String(id), error);
    }
}