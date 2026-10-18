import { MigaPan } from "./carpeta.model";

export type ExtensionArchivo = 'txt' | 'md';

export interface Archivo {
    id: string;
    nombre: string;
    extension: ExtensionArchivo;
    tipoMime: string;
    bytesSize: number;
    carpetaId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface RespuestaSubida {
    archivo: Archivo;
    reemplazado: boolean;
}

export interface DetalleArchivo {
    archivo: Archivo;
    ruta: MigaPan[];
}
