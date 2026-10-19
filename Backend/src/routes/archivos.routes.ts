import express, { Router } from "express";
import { requerirAutenticacion } from "../middlewares/autenticacion.js";
import { SIZE_MAXIMO_ARCHIVO_BYTES } from "../constants/dominio.js";
import { validarCuerpo, validarObjectId } from "../middlewares/validar.js";
import { validarMoverArchivo, validarRenombrarArchivo } from "../validations/archivos.validacion.js";
import * as controlador from "../controllers/archivos.controller.js"

export const rutasArchivos = Router();

rutasArchivos.use(requerirAutenticacion);

// Subida: el contenido viaja "crudo" en el cuerpo (el nombre y la carpeta en la URL)
// express.raw(...) es un middleware que intercepta la peticion antes de llegar al controlador
// type: () => true acepta cualquier Content-Type (tipo de archivo); limit: detiene la subida si se supera el tamaño permitido
rutasArchivos.post('/', express.raw({ type: () => true, limit: SIZE_MAXIMO_ARCHIVO_BYTES }), controlador.subir);

rutasArchivos.get('/:id', validarObjectId(), controlador.detalle);
rutasArchivos.get('/:id/contenido', validarObjectId(), controlador.contenido);
rutasArchivos.patch('/:id', validarObjectId(), validarCuerpo(validarRenombrarArchivo), controlador.renombrar);
rutasArchivos.patch('/:id/mover', validarObjectId(), validarCuerpo(validarMoverArchivo), controlador.mover);
rutasArchivos.delete('/:id', validarObjectId(), controlador.eliminar);