import { Router } from "express";
import { requerirAutenticacion, requerirRol } from "../middlewares/autenticacion.js";
import { validarCuerpo, validarObjectId } from "../middlewares/validar.js";
import { validarActualizarUsuario, validarCambiarEstado, validarCrearUsuario, validarRestablecerPassword } from "../validations/usuarios.validacion.js";
import * as controlador from "../controllers/usuarios.controller.js";

export const rutasUsuarios = Router();

rutasUsuarios.use(requerirAutenticacion, requerirRol(['administrador']));

rutasUsuarios.get('/', controlador.listar);
rutasUsuarios.post('/', validarCuerpo(validarCrearUsuario), controlador.crear);
rutasUsuarios.get('/:id', validarObjectId(), controlador.obtener);
rutasUsuarios.patch('/:id', validarObjectId(), validarCuerpo(validarActualizarUsuario), controlador.actualizar);
rutasUsuarios.patch('/:id/estado', validarObjectId(), validarCuerpo(validarCambiarEstado), controlador.cambiarEstado);
rutasUsuarios.post(
    '/:id/restablecer-password',
    validarObjectId(),
    validarCuerpo(validarRestablecerPassword),
    controlador.restablecerPassword,
);