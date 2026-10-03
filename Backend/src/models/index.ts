import { Actividad } from "./actividad.js";
import { Archivo } from "./archivo.js";
import { Carpeta } from "./carpeta.js";
import { Comentario } from "./comentario.js";
import { Comparticion } from "./comparticion.js";
import { Usuario } from "./usuario.js";

export { Actividad, Archivo, Carpeta, Comentario, Comparticion, Usuario };

// Crea las colecciones y construye los índices definidos en los esquemas
export async function inicializarIndices(): Promise<void> {
    await Promise.all([
        Usuario.init(),
        Carpeta.init(),
        Archivo.init(),
        Comparticion.init(),
        Comentario.init(),
        Actividad.init(),
    ]);
    console.log('[BD] Colecciones e índices listos');
}