import mongoose from "mongoose";
import { entorno } from "./entorno.js";
import { NOMBRE_BUCKET_CONTENIDOS } from "../constants/dominio.js";

let bucketContenidos: mongoose.mongo.GridFSBucket | null = null;

/**
 * Conecta con MongoDB y prepara el bucket GridFS donde se guarda el contenido de los archivos.
 */
export async function conectarBaseDatos(): Promise<void> {
    // Si MongoDB no responde en 5 s, falla en lugar de quedarse esperando indefinidamente
    await mongoose.connect(entorno.mongoUri, { serverSelectionTimeoutMS: 5000 });

    const db = mongoose.connection.db;
    if (!db) throw new Error('La conexión a MongoDB no expone la base de datos.');

    bucketContenidos = new mongoose.mongo.GridFSBucket(db, { bucketName: NOMBRE_BUCKET_CONTENIDOS });
    console.log(`[BD] Conectado a MongoDB (${mongoose.connection.name})`);
}

/**
 * Devuelve el bucket GridFS (colecciones contenidos.files y contenidos.chunks).
 */
export function obtenerBucketContenidos(): mongoose.mongo.GridFSBucket {
    if (!bucketContenidos) throw new Error('El bucket GridFS aún no está inicializado.');
    return bucketContenidos;
}

export async function desconectarBaseDatos(): Promise<void> {
    await mongoose.disconnect();
}

export function baseDatosConectada(): boolean {
    return mongoose.connection.readyState === 1;
}