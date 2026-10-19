import mongoose, { QueryFilter } from "mongoose";
import { COLACION_ES, Extension, EXTENSIONES_PERMITIDAS, TIPOS_MIME } from "../constants/dominio.js";
import { UsuarioAutenticado } from "../middlewares/autenticacion.js";
import { IArchivo } from "../models/archivo.js";
import { Archivo, Usuario } from "../models/index.js";
import { ErrorApp, ErrorConflicto, ErrorNoEncontrado, ErrorSolicitudInvalida } from "../utilities/errores.js";
import { abrirLectura, eliminarContenido, guardarContenido } from "../utilities/gridFs.js";
import { aArchivo } from "../utilities/presentadores.js";
import { registrarActividad } from "./actividad.servicio.js";
import { obtenerCarpetaPropia, obtenerRuta } from "./carpetas.servicio.js";

type Id = mongoose.Types.ObjectId;

export async function obtenerArchivoPropio(id: string, actor: UsuarioAutenticado) {
    const archivo = await Archivo.findOne({ _id: id, propietarioId: actor.id, eliminacion: null });
    if (!archivo) {
        throw new ErrorNoEncontrado('El archivo no existe o no tienes acceso a él.');
    }
    return archivo;
}

function exigirExtensionPermitida(nombre: string): Extension {
    const punto = nombre.lastIndexOf('.');
    const extension = punto > 0 ? nombre.slice(punto + 1).toLowerCase() : '';
    let permitida: Extension | undefined = undefined;
    for (const e of EXTENSIONES_PERMITIDAS) {
        if (e === extension) {
            permitida = e;
            break;
        }
    }
    if (!permitida) {
        throw new ErrorSolicitudInvalida('Solo se admiten archivos .txt y .md.', { campo: 'nombre' });
    }
    return permitida;
}

/**
 * Comprueba que el contenido sea TEXTO. La extensión la pone el usuario y se puede falsificar
 * (un ejecutable renombrado a "nota.txt"), así que se valida el contenido real
 */
function exigirTextoUtf8(contenido: Buffer): void {
    if (contenido.includes(0)) {
        throw new ErrorSolicitudInvalida('El archivo parece ser binario. Solo se admiten archivos de texto.');
    }
    try {
        new TextDecoder('utf-8', { fatal: true }).decode(contenido);
    } catch {
        throw new ErrorSolicitudInvalida('El archivo no está codificado en UTF-8 válido.');
    }
}

function buscarPorNombre(actor: UsuarioAutenticado, carpetaId: Id | null, nombre: string, excluirId?: Id) {
    const filtro: QueryFilter<IArchivo> = { propietarioId: actor.id, carpetaId, nombre, eliminacion: null };
    if (excluirId) filtro._id = { $ne: excluirId };
    return Archivo.findOne(filtro).collation(COLACION_ES);
}

export async function ajustarEspacioUsado(usuarioId: string, diferenciaBytes: number): Promise<void> {
    if (diferenciaBytes === 0) return;
    await Usuario.updateOne({ _id: usuarioId }, { $inc: { espacioUsadoBytes: diferenciaBytes } }, { timestamps: false });
}

export async function obtenerDetalle(id: string, actor: UsuarioAutenticado) {
    const archivo = await obtenerArchivoPropio(id, actor);
    const carpeta = archivo.carpetaId ? await obtenerCarpetaPropia(archivo.carpetaId, actor) : null;
    return { archivo: aArchivo(archivo), ruta: await obtenerRuta(carpeta) };
}

export async function abrirContenido(id: string, actor: UsuarioAutenticado, descargar: boolean) {
    const archivo = await obtenerArchivoPropio(id, actor);
    const flujo = abrirLectura(archivo.contenidoId);

    await registrarActividad({
        usuarioId: actor.id,
        username: actor.username,
        accion: descargar ? 'descargar' : 'ver',
        recursoTipo: 'archivo',
        recursoId: archivo._id,
        recursoNombre: archivo.nombre,
    });

    return { archivo, flujo };
}

interface DatosSubida {
    nombre: string;
    carpetaId?: string;
    reemplazar: boolean;
    contenido: Buffer;
}

export async function subirArchivo(actor: UsuarioAutenticado, datos: DatosSubida) {
    const extension = exigirExtensionPermitida(datos.nombre);
    exigirTextoUtf8(datos.contenido);

    const carpeta = datos.carpetaId ? await obtenerCarpetaPropia(datos.carpetaId, actor) : null;
    const carpetaId = carpeta?._id ?? null;

    const existente = await buscarPorNombre(actor, carpetaId, datos.nombre);
    if (existente && !datos.reemplazar) {
        throw new ErrorApp(409, `Ya existe un archivo llamado "${existente.nombre}" en esta carpeta.`, 'ARCHIVO_EXISTENTE', {
            campo: 'nombre',
            archivoId: String(existente._id),
        });
    }

    // MongoDB (modo standalone) no tiene transacciones. El orden de los pasos permite deshacer:
    //   1) el contenido nuevo se guarda primero en GridFS;
    //   2) se guarda el documento del archivo (si falla, se borra el contenido recién subido);
    //   3) solo entonces se hacen los pasos "no críticos" (borrar contenido viejo, contar espacio, historial).
    const contenidoId = await guardarContenido(datos.contenido, datos.nombre, {
        propietarioId: actor.id,
        tipoMime: TIPOS_MIME[extension],
    });

    const bytesSize = datos.contenido.length;

    if (existente) {
        const contenidoAnterior = existente.contenidoId;
        const sizeAnterior = existente.bytesSize;

        try {
            existente.contenidoId = contenidoId;
            existente.bytesSize = bytesSize;
            await existente.save();
        } catch (error) {
            await eliminarContenido(contenidoId);
            throw error;
        }

        await eliminarContenido(contenidoAnterior);
        await ajustarEspacioUsado(actor.id, bytesSize - sizeAnterior);
        await registrarActividad({
            usuarioId: actor.id,
            username: actor.username,
            accion: 'editar',
            recursoTipo: 'archivo',
            recursoId: existente._id,
            recursoNombre: existente.nombre,
            detalle: 'reemplazoDeContenido: true - ' + 'tamañoAnterior: ' + sizeAnterior + ' - ' + 'tamañoNuevo: ' + bytesSize
        });
        return { archivo: aArchivo(existente), reemplazado: true };
    }

    let nuevo;
    try {
        nuevo = await Archivo.create({
            nombre: datos.nombre,
            extension,
            tipoMime: TIPOS_MIME[extension],
            bytesSize,
            propietarioId: actor.id,
            carpetaId,
            contenidoId,
        });
    } catch (error) {
        await eliminarContenido(contenidoId);
        throw error;
    }

    await ajustarEspacioUsado(actor.id, bytesSize);
    await registrarActividad({
        usuarioId: actor.id,
        username: actor.username,
        accion: 'subir',
        recursoTipo: 'archivo',
        recursoId: nuevo._id,
        recursoNombre: nuevo.nombre,
        detalle: 'bytesSize: ' + bytesSize + ' - ' + 'carpetaId: ' + String(carpetaId)
    });
    return { archivo: aArchivo(nuevo), reemplazado: false };
}

export async function renombrarArchivo(id: string, nombre: string, actor: UsuarioAutenticado) {
    const archivo = await obtenerArchivoPropio(id, actor);
    const extension = exigirExtensionPermitida(nombre);

    if (nombre !== archivo.nombre) {
        if (await buscarPorNombre(actor, archivo.carpetaId, nombre, archivo._id)) {
            throw new ErrorConflicto(`Ya existe un archivo llamado "${nombre}" en esta carpeta.`, { campo: 'nombre' });
        }

        const nombreAnterior = archivo.nombre;
        archivo.nombre = nombre;
        archivo.extension = extension;
        archivo.tipoMime = TIPOS_MIME[extension];
        await archivo.save();

        await registrarActividad({
            usuarioId: actor.id,
            username: actor.username,
            accion: 'renombrar',
            recursoTipo: 'archivo',
            recursoId: archivo._id,
            recursoNombre: archivo.nombre,
            detalle: 'nombreAnterior: ' + nombreAnterior
        });
    }

    return aArchivo(archivo);
}

export async function moverArchivo(id: string, destinoId: string | null, actor: UsuarioAutenticado) {
    const archivo = await obtenerArchivoPropio(id, actor);
    const destino = destinoId ? await obtenerCarpetaPropia(destinoId, actor) : null;
    const nuevoDestinoId = destino?._id ?? null;

    if (String(archivo.carpetaId ?? '') === String(nuevoDestinoId ?? '')) {
        throw new ErrorConflicto('El archivo ya se encuentra en esa ubicación.');
    }
    if (await buscarPorNombre(actor, nuevoDestinoId, archivo.nombre, archivo._id)) {
        throw new ErrorConflicto(`Ya existe un archivo llamado "${archivo.nombre}" en la carpeta de destino.`, {
            campo: 'nombre',
        });
    }

    const origen = archivo.carpetaId ? await obtenerCarpetaPropia(archivo.carpetaId, actor) : null;
    const desdeId = archivo.carpetaId;

    archivo.carpetaId = nuevoDestinoId;
    await archivo.save();

    await registrarActividad({
        usuarioId: actor.id,
        username: actor.username,
        accion: 'mover',
        recursoTipo: 'archivo',
        recursoId: archivo._id,
        recursoNombre: archivo.nombre,
        detalle:
            'desdeId: ' + String(desdeId) + ' - ' +
            'desdeNombre: ' + (origen?.nombre ?? 'Mis archivos') + ' - ' +
            'haciaId: ' + String(nuevoDestinoId) + ' - ' +
            'haciaNombre: ' + (destino?.nombre ?? 'Mis archivos')
    });

    return aArchivo(archivo);
}