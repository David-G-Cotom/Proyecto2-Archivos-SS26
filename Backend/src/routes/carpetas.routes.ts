import { Router } from "express";
import { requerirAutenticacion } from "../middlewares/autenticacion.js";
import { validarCuerpo, validarObjectId } from "../middlewares/validar.js";
import { validarCrearCarpeta, validarMoverCarpeta, validarRenombrarCarpeta } from "../validations/carpetas.validacion.js";
import * as controlador from "../controllers/carpetas.controller.js";

export const rutasCarpetas = Router();

rutasCarpetas.use(requerirAutenticacion);

rutasCarpetas.get('/contenido', controlador.contenido);
rutasCarpetas.get('/arbol', controlador.arbol);
rutasCarpetas.post('/', validarCuerpo(validarCrearCarpeta), controlador.crear);
rutasCarpetas.patch('/:id', validarObjectId(), validarCuerpo(validarRenombrarCarpeta), controlador.renombrar);
rutasCarpetas.patch('/:id/mover', validarObjectId(), validarCuerpo(validarMoverCarpeta), controlador.mover);