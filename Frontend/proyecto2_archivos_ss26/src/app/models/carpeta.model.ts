import { Archivo } from "./archivo.model";

export interface Carpeta {
    id: string;
    nombre: string;
    carpetaPadreId: string | null;
    cantidadSubcarpetas: number;
    createdAt: string;
    updatedAt: string;
}

export interface MigaPan {
    id: string;
    nombre: string;
}

export interface ContenidoCarpeta {
    carpetaActual: Carpeta | null;
    ruta: MigaPan[];
    subcarpetas: Carpeta[];
    archivos: Archivo[];
}

export interface NodoArbol {
    id: string;
    nombre: string;
    carpetaPadreId: string | null;
}
