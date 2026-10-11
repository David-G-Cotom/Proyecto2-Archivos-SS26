import { Router } from "express";
import { validarCuerpo } from "../middlewares/validar.js";
import { requerirAutenticacion } from "../middlewares/autenticacion.js";
import * as controlador from "../controllers/autenticacion.controller.js";
import { validarCambiarPassword, validarLogin } from "../validations/autenticacion.validacion.js";

export const rutasAutenticacion = Router();

rutasAutenticacion.post('/login', validarCuerpo(validarLogin), controlador.iniciarSesion);

rutasAutenticacion.post(
    '/change-password',
    requerirAutenticacion,
    validarCuerpo(validarCambiarPassword),
    controlador.cambiarPassword,
);