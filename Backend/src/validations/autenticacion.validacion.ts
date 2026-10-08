import { DetalleValidacion, errorValidacion, esObjeto } from "../middlewares/validar.js";
import { validarPassword } from "./comunes.validacion.js";

export interface DatosLogin {
    username: string;
    password: string;
}

export interface DatosCambiarPassword {
    currentPassword: string;
    newPassword: string;
}

export function validarLogin(datos: unknown): DatosLogin {
    if (!esObjeto(datos)) {
        errorValidacion([{ campo: '', mensaje: 'Los datos de la solicitud no son válidos.' }]);
    }

    const detalles: DetalleValidacion[] = [];

    let username = '';
    let password = '';

    if (typeof datos.username !== 'string') {
        detalles.push({ campo: 'username', mensaje: 'El nombre de usuario es obligatorio.' });
    } else {
        username = datos.username.trim();

        if (username.length < 1) {
            detalles.push({ campo: 'username', mensaje: 'El nombre de usuario es obligatorio.' });
        }
    }

    if (typeof datos.password !== 'string') {
        detalles.push({ campo: 'password', mensaje: 'La contraseña es obligatoria.' });
    } else {
        password = datos.password;

        if (password.length < 1) {
            detalles.push({ campo: 'password', mensaje: 'La contraseña es obligatoria.' });
        }
    }

    if (detalles.length > 0) {
        errorValidacion(detalles);
    }

    return { username, password };
}

export function validarCambiarPasswrod(datos: unknown): DatosCambiarPassword {
    if (!esObjeto(datos)) {
        errorValidacion([{ campo: '', mensaje: 'Los datos de la solicitud no son válidos.' }]);
    }

    const detalles: DetalleValidacion[] = [];

    let currentPassword = '';
    let newPassword = '';

    if (typeof datos.currentPassword !== 'string') {
        detalles.push({ campo: 'currentPassword', mensaje: 'La contraseña actual es obligatoria.' });
    } else {
        currentPassword = datos.currentPassword;

        if (currentPassword.length < 1) {
            detalles.push({ campo: 'currentPassword', mensaje: 'La contraseña actual es obligatoria.' });
        }
    }

    if (typeof datos.newPassword !== 'string') {
        detalles.push({ campo: 'newPassword', mensaje: 'La contraseña nueva es obligatoria.' });
    } else {
        newPassword = datos.newPassword;
    }

    if (detalles.length > 0) {
        errorValidacion(detalles);
    }

    validarPassword(newPassword, 'newPassword');

    if (currentPassword === newPassword) {
        errorValidacion([{ campo: 'newPassword', mensaje: 'La contraseña nueva debe ser distinta de la actual.' }]);
    }

    return { currentPassword, newPassword };
}