import { Usuario } from "../models/index.js";
import { ErrorNoAutenticado, ErrorNoEncontrado, ErrorProhibido, ErrorSolicitudInvalida } from "../utilities/errores.js";
import { firmarToken } from "../utilities/jwt.js";
import { compararPassword, hashearPassword } from "../utilities/passwords.js";
import { aUsuarioSesion } from "../utilities/presentadores.js";
import { registrarActividad } from "./actividad.servicio.js";

export async function iniciarSesion(username: string, password: string) {
    const usuario = await Usuario.findOne({ username }).select('+password');

    let coincide: boolean = false;
    if (usuario) {
        coincide = await compararPassword(password, usuario.password);
    }
    if (!usuario || !coincide) {
        throw new ErrorNoAutenticado('Usuario o contraseña incorrectos.');
    }
    if (!usuario.activo) {
        throw new ErrorProhibido('Tu cuenta está desactivada. Contacta al administrador.');
    }

    await Usuario.updateOne({ _id: usuario._id }, { ultimoAccesoEn: new Date() }, { timestamps: false });

    await registrarActividad({
        usuarioId: usuario._id,
        username: usuario.username,
        accion: 'iniciar_sesion',
        recursoTipo: 'sesion',
        recursoId: usuario._id,
        recursoNombre: usuario.username,
    });

    return { token: firmarToken(String(usuario._id)), usuario: aUsuarioSesion(usuario) };
}

export async function cambiarPassword(usuarioId: string, passwrodActual: string, passwrodNueva: string,): Promise<void> {
    const usuario = await Usuario.findById(usuarioId).select('+password');
    if (!usuario) {
        throw new ErrorNoEncontrado('El usuario no existe.');
    }

    if (!(await compararPassword(passwrodActual, usuario.password))) {
        throw new ErrorSolicitudInvalida('La contraseña actual no es correcta.', { campo: 'currentPassword' });
    }

    usuario.password = await hashearPassword(passwrodNueva);
    await usuario.save();

    await registrarActividad({
        usuarioId: usuario._id,
        username: usuario.username,
        accion: 'cambiar_contraseña',
        recursoTipo: 'usuario',
        recursoId: usuario._id,
        recursoNombre: usuario.username,
    });
}