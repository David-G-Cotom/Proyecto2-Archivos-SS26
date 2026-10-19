import { Router } from "express";
import { rutasAutenticacion } from "./autenticacion.routes.js";
import { rutasUsuarios } from "./usuarios.routes.js";
import { rutasCarpetas } from "./carpetas.routes.js";
import { rutasArchivos } from "./archivos.routes.js";

export const rutasApi = Router();

rutasApi.use('/auth', rutasAutenticacion);
rutasApi.use('/usuarios', rutasUsuarios);
rutasApi.use('/carpetas', rutasCarpetas);
rutasApi.use('/archivos', rutasArchivos);
rutasApi.use('/papelera', rutasPapelera);