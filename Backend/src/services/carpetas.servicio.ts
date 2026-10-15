import mongoose, { HydratedDocument, QueryFilter } from "mongoose";
import { UsuarioAutenticado } from "../middlewares/autenticacion.js";
import { Archivo, Carpeta } from "../models/index.js";
import { ErrorConflicto, ErrorNoEncontrado } from "../utilities/errores.js";
import { aArchivo, aCarpeta } from "../utilities/presentadores.js";
import { registrarActividad } from "./actividad.servicio.js";
import { ICarpeta } from "../models/carpeta.js";

type Id = mongoose.Types.ObjectId;

// Comparación de nombres ignorando mayúsculas
const COLACION_ES = { locale: 'es', strength: 2 } as const;

export async function obtenerCarpetaPropia(id: string | Id, actor: UsuarioAutenticado) {
    const carpeta = await Carpeta.findOne({ _id: id, propietarioId: actor.id, eliminacion: null });
    if (!carpeta) {
        throw new ErrorNoEncontrado('La carpeta no existe o no tienes acceso a ella.');
    }
    return carpeta;
}

async function verificarNombreDisponible(
    actor: UsuarioAutenticado,
    padreId: Id | null,
    nombre: string,
    excluirId?: Id,
): Promise<void> {
    const filtro: QueryFilter<ICarpeta> = { propietarioId: actor.id, carpetaPadreId: padreId, nombre, eliminacion: null };
    if (excluirId) filtro._id = { $ne: excluirId };

    if (await Carpeta.exists(filtro).collation(COLACION_ES)) {
        throw new ErrorConflicto(`Ya existe una carpeta llamada "${nombre}" en esta ubicación.`, { campo: 'nombre' });
    }
}

async function contarSubcarpetas(actor: UsuarioAutenticado, ids: Id[]): Promise<Map<string, number>> {
    if (ids.length === 0) return new Map();
    const conteos = await Carpeta.aggregate<{ _id: Id; total: number }>([
        { $match: { propietarioId: new mongoose.Types.ObjectId(actor.id), carpetaPadreId: { $in: ids }, eliminacion: null } },
        { $group: { _id: '$carpetaPadreId', total: { $sum: 1 } } },
    ]);
    const resultado = new Map<string, number>();
    for (const element of conteos) {
        resultado.set(String(element._id), element.total);
    }
    return resultado;
}

export async function obtenerRuta(carpeta: HydratedDocument<ICarpeta> | null) {
    const ruta: { id: string; nombre: string }[] = [];
    if (!carpeta) return ruta;

    const carpetasAncestros = await Carpeta.find({ _id: { $in: carpeta.ancestros } }).select('nombre');
    const nombrePorId = new Map<string, string>();
    for (const carpeta of carpetasAncestros) {
        nombrePorId.set(String(carpeta._id), carpeta.nombre);
    }
    for (const id of carpeta.ancestros) {
        ruta.push({ id: String(id), nombre: nombrePorId.get(String(id)) ?? '…' });
    }
    ruta.push({ id: String(carpeta._id), nombre: carpeta.nombre });
    return ruta;
}

export async function listarContenido(actor: UsuarioAutenticado, carpetaId?: string) {
    const carpetaActual = carpetaId ? await obtenerCarpetaPropia(carpetaId, actor) : null;

    const ruta = await obtenerRuta(carpetaActual);

    const subcarpetas = await Carpeta.find({
        propietarioId: actor.id,
        carpetaPadreId: carpetaActual?._id ?? null,
        eliminacion: null,
    }).sort({ nombre: 1 }).collation(COLACION_ES);

    const archivos = await Archivo.find({
        propietarioId: actor.id,
        carpetaId: carpetaActual?._id ?? null,
        eliminacion: null,
    }).sort({ nombre: 1 }).collation(COLACION_ES);

    const idsSubcarpetas: Id[] = [];
    for (const element of subcarpetas) {
        idsSubcarpetas.push(element._id);
    }
    const conteos = await contarSubcarpetas(actor, idsSubcarpetas);

    const subcarpetasLimpias = [];
    for (const element of subcarpetas) {
        subcarpetasLimpias.push(aCarpeta(element, conteos.get(String(element._id)) ?? 0));
    }
    const archivosLimpios = [];
    for (const element of archivos) {
        archivosLimpios.push(aArchivo(element));
    }
    return {
        carpetaActual: carpetaActual ? aCarpeta(carpetaActual, conteos.get(String(carpetaActual._id)) ?? 0) : null,
        ruta,
        subcarpetas: subcarpetasLimpias,
        archivos: archivosLimpios,
    };
}

export async function obtenerArbol(actor: UsuarioAutenticado) {
    const carpetas = await Carpeta.find({ propietarioId: actor.id, eliminacion: null })
        .select('nombre carpetaPadreId')
        .sort({ nombre: 1 })
        .collation(COLACION_ES);
    const resultado = [];
    for (const carpeta of carpetas) {
        resultado.push({
            id: String(carpeta._id),
            nombre: carpeta.nombre,
            carpetaPadreId: carpeta.carpetaPadreId ? String(carpeta.carpetaPadreId) : null,
        });
    }
    return resultado;
}

export async function crearCarpeta(actor: UsuarioAutenticado, nombre: string, carpetaPadreId?: string | null) {
    const padre = carpetaPadreId ? await obtenerCarpetaPropia(carpetaPadreId, actor) : null;
    await verificarNombreDisponible(actor, padre?._id ?? null, nombre);

    const carpeta = await Carpeta.create({
        nombre,
        propietarioId: actor.id,
        carpetaPadreId: padre?._id ?? null,
        ancestros: padre ? [...padre.ancestros, padre._id] : [],
    });

    await registrarActividad({
        usuarioId: actor.id,
        username: actor.username,
        accion: 'crear',
        recursoTipo: 'carpeta',
        recursoId: carpeta._id,
        recursoNombre: carpeta.nombre,
        detalle: 'carpetaPadreID: ' + (padre?._id.toString() ?? ''),
    });

    return aCarpeta(carpeta, 0);
}

export async function renombrarCarpeta(id: string, nombre: string, actor: UsuarioAutenticado) {
    const carpeta = await obtenerCarpetaPropia(id, actor);
    const subcarpetas = await contarSubcarpetas(actor, [carpeta._id]);

    if (nombre !== carpeta.nombre) {
        await verificarNombreDisponible(actor, carpeta.carpetaPadreId, nombre, carpeta._id);

        const nombreAnterior = carpeta.nombre;
        carpeta.nombre = nombre;
        await carpeta.save();

        await registrarActividad({
            usuarioId: actor.id,
            username: actor.username,
            accion: 'renombrar',
            recursoTipo: 'carpeta',
            recursoId: carpeta._id,
            recursoNombre: carpeta.nombre,
            detalle: nombreAnterior,
        });
    }

    return aCarpeta(carpeta, subcarpetas.get(String(carpeta._id)) ?? 0);
}

/**
 * Se actualizan los ancestros de todas las subcarpetas de la carpeta movida.
 * Se hace una actualización por pipeline de agregacion para que MongoDB lo resuelva en una sola operación (leer y modificar),
 * sin traer documentos al servidor (la operacion se hace directamente en el servidor de la DB),
 * esto permite modificar campos basandose en sus propios valores actuales
 * El `$slice` corta los ancestros hasta la posición donde está la carpeta movida.
 */
async function reescribirPrefijoAncestros(carpetaId: Id, longitudPrefijoActual: number, prefijoNuevo: Id[]): Promise<void> {
    // Buscar todas las SubCarpetas de la Carpeta Movida para actualizar
    await Carpeta.updateMany({ ancestros: carpetaId }, [{
        // Sobreescribe el campo "ancestros" de la subcarpeta con los nuevos ancestros.
        $set: {
            ancestros: {
                // Se reemplaza los ancestros antiguos por los nuevos (los ancestros despues de la carpeta movida no se tocan)
                $concatArrays: [prefijoNuevo, { $slice: ['$ancestros', longitudPrefijoActual, { $size: '$ancestros' }] }]
            }
        }
    }]);
}

export async function moverCarpeta(id: string, destinoId: string | null, actor: UsuarioAutenticado) {
    const carpeta = await obtenerCarpetaPropia(id, actor);

    let destino: HydratedDocument<ICarpeta> | null = null;
    if (destinoId) {
        if (destinoId === id) {
            throw new ErrorConflicto('No puedes mover una carpeta dentro de sí misma.');
        }
        destino = await obtenerCarpetaPropia(destinoId, actor);
        let esSubcarpeta = false;
        for (const ancestro of destino.ancestros) {
            if (ancestro.equals(carpeta._id)) {
                esSubcarpeta = true;
                break;
            }
        }
        if (esSubcarpeta) {
            throw new ErrorConflicto('No puedes mover una carpeta dentro de una de sus propias subcarpetas.');
        }
    }

    const padreActualId = carpeta.carpetaPadreId;
    const destinoid = destino?._id ?? null;
    if (String(padreActualId ?? '') === String(destinoid ?? '')) {
        throw new ErrorConflicto('La carpeta ya se encuentra en esa ubicación.');
    }
    await verificarNombreDisponible(actor, destinoid, carpeta.nombre, carpeta._id);

    const origen = padreActualId ? await Carpeta.findById(padreActualId).select('nombre') : null;

    // MongoDB (modo standalone) no tiene transacciones, así que se ordena el trabajo para poder deshacerlo:
    // 1) se reescriben los descendientes, 2) se mueve la carpeta. Si el paso 2 falla, se revierte el paso 1 y queda todo como estaba.
    const ancestrosViejos = carpeta.ancestros;
    const ancestrosNuevos = destino ? [...destino.ancestros, destino._id] : [];

    await reescribirPrefijoAncestros(carpeta._id, ancestrosViejos.length, ancestrosNuevos);
    try {
        carpeta.carpetaPadreId = destinoid;
        carpeta.ancestros = ancestrosNuevos;
        await carpeta.save();
    } catch (error) {
        await reescribirPrefijoAncestros(carpeta._id, ancestrosNuevos.length, ancestrosViejos);
        throw error;
    }

    await registrarActividad({
        usuarioId: actor.id,
        username: actor.username,
        accion: 'mover',
        recursoTipo: 'carpeta',
        recursoId: carpeta._id,
        recursoNombre: carpeta.nombre,
        detalle:
            'desdeId: ' + (padreActualId?.toString() ?? '') +
            'desdeNombre: ' + (origen?.nombre ?? 'Mis archivos') +
            'haciaId: ' + (destinoid?.toString() ?? '') +
            'haciaNombre: ' + (destino?.nombre ?? 'Mis archivos')
    });

    const subcarpetas = await contarSubcarpetas(actor, [carpeta._id]);
    return aCarpeta(carpeta, subcarpetas.get(String(carpeta._id)) ?? 0);
}