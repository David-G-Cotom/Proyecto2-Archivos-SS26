import { Rol, ROLES } from "../constants/dominio.js";
import { DetalleValidacion, errorValidacion, esObjeto } from "../middlewares/validar.js";
import { validarPassword } from "./comunes.validacion.js";

export interface DatosCrearUsuario {
    username: string;
    nombreCompleto: string;
    correo: string;
    rol: Rol;
    password: string;
}

export interface DatosActualizarUsuario {
    nombreCompleto?: string;
    correo?: string;
    rol?: Rol;
}

export interface ConsultaUsuarios {
    busqueda?: string;
    rol?: Rol;
    activo?: boolean;
    pagina: number;
    limite: number;
}

export interface DatosCambiarEstado {
    activo: boolean;
}

export interface DatosRestablecerPassword {
    newPassword: string;
}

function esRol(valor: unknown): valor is Rol {
    return typeof valor === 'string' && (ROLES as readonly string[]).includes(valor);
}

function validarUsername(valor: unknown): string {
    const detalles: DetalleValidacion[] = [];

    if (typeof valor !== 'string') {
        errorValidacion([{ campo: 'username', mensaje: 'El nombre de usuario es obligatorio.' }]);
    }

    const username = valor.trim();

    if (username.length < 3) {
        detalles.push({ campo: 'username', mensaje: 'El nombre de usuario debe tener al menos 3 caracteres.' });
    }

    if (username.length > 40) {
        detalles.push({ campo: 'username', mensaje: 'El nombre de usuario no puede superar los 40 caracteres.' });
    }

    if (!/^[a-zA-Z0-9]+$/.test(username)) {
        detalles.push({ campo: 'username', mensaje: 'Solo se permiten letras y números' });
    }

    if (detalles.length > 0) {
        errorValidacion(detalles);
    }

    return username;
}

function validarNombreCompleto(valor: unknown): string {
    const detalles: DetalleValidacion[] = [];

    if (typeof valor !== 'string') {
        errorValidacion([{ campo: 'nombreCompleto', mensaje: 'El nombre completo es obligatorio.' }]);
    }

    const nombreCompleto = valor.trim();

    if (nombreCompleto.length > 120) {
        detalles.push({ campo: 'nombreCompleto', mensaje: 'El nombre completo no puede superar los 120 caracteres.' });
    }

    if (detalles.length > 0) {
        errorValidacion(detalles);
    }

    return nombreCompleto;
}

function validarCorreo(valor: unknown): string {
    if (typeof valor !== 'string') {
        errorValidacion([{ campo: 'correo', mensaje: 'El correo es obligatorio.' }]);
    }

    const correo = valor.trim();

    const formatoCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formatoCorreo.test(correo)) {
        errorValidacion([{ campo: 'correo', mensaje: 'Ingresa un correo válido.' }]);
    }

    return correo;
}

function validarRol(valor: unknown): Rol {
    if (!esRol(valor)) {
        errorValidacion([{ campo: 'rol', mensaje: 'El rol no es válido.' }]);
    }

    return valor;
}

export function validarCrearUsuario(datos: unknown): DatosCrearUsuario {
    if (!esObjeto(datos)) {
        errorValidacion([{ campo: '', mensaje: 'Los datos de la solicitud no son válidos.' }]);
    }

    const username = validarUsername(datos.username);

    const nombreCompleto = validarNombreCompleto(datos.nombreCompleto);

    const correo = validarCorreo(datos.correo);

    const rol = datos.rol === undefined ? 'usuario' : validarRol(datos.rol);

    const password = validarPassword(datos.password, 'password');

    return {
        username,
        nombreCompleto,
        correo,
        rol,
        password
    };
}

export function validarActualizarUsuario(datos: unknown): DatosActualizarUsuario {
    if (!esObjeto(datos)) {
        errorValidacion([{ campo: '', mensaje: 'Los datos de la solicitud no son válidos.' }]);
    }

    const resultado: DatosActualizarUsuario = {};

    if (datos.nombreCompleto !== undefined) {
        resultado.nombreCompleto = validarNombreCompleto(datos.nombreCompleto);
    }

    if (datos.correo !== undefined) {
        resultado.correo = validarCorreo(datos.correo);
    }

    if (datos.rol !== undefined) {
        resultado.rol = validarRol(datos.rol);
    }

    if (Object.keys(resultado).length === 0) {
        errorValidacion([{ campo: '', mensaje: 'Envía al menos un campo para actualizar.' }]);
    }

    return resultado;
}

export function validarCambiarEstado(datos: unknown): DatosCambiarEstado {
    if (!esObjeto(datos)) {
        errorValidacion([{ campo: '', mensaje: 'Los datos de la solicitud no son válidos.' }]);
    }

    if (typeof datos.activo !== 'boolean') {
        errorValidacion([{ campo: 'activo', mensaje: 'Indica si la cuenta debe quedar activa.' }]);
    }

    return { activo: datos.activo };
}

export function validarRestablecerPassword(datos: unknown): DatosRestablecerPassword {
    if (!esObjeto(datos)) {
        errorValidacion([{ campo: '', mensaje: 'Los datos de la solicitud no son válidos.' }]);
    }

    const newPassword = validarPassword(datos.newPassword, 'newPassword');

    return { newPassword };
}

function validarNumeroConsulta(
    valor: unknown,
    campo: string,
    valorPorDefecto: number,
    minimo: number,
    maximo?: number
): number {
    if (valor === undefined) {
        return valorPorDefecto;
    }

    const numero = Number(valor);

    if (!Number.isInteger(numero)) {
        errorValidacion([{ campo, mensaje: `${campo} debe ser un número entero.` }]);
    }

    if (numero < minimo) {
        errorValidacion([{ campo, mensaje: `${campo} debe ser mayor o igual a ${minimo}.` }]);
    }

    if (maximo !== undefined && numero > maximo) {
        errorValidacion([{ campo, mensaje: `${campo} no puede ser mayor que ${maximo}.` }]);
    }

    return numero;
}

export function validarConsultaUsuarios(datos: unknown): ConsultaUsuarios {
    if (!esObjeto(datos)) {
        errorValidacion([{ campo: '', mensaje: 'Los parámetros de consulta no son válidos.' }]);
    }

    const resultado: ConsultaUsuarios = {
        pagina: validarNumeroConsulta(datos.pagina, 'pagina', 1, 1),
        limite: validarNumeroConsulta(datos.limite, 'limite', 10, 1, 50)
    };

    if (datos.busqueda !== undefined) {
        if (typeof datos.busqueda !== 'string') {
            errorValidacion([{ campo: 'busqueda', mensaje: 'La búsqueda debe ser texto.' }]);
        }

        const busqueda = datos.busqueda.trim();

        resultado.busqueda = busqueda;
    }

    if (datos.rol !== undefined) {
        resultado.rol = validarRol(datos.rol);
    }

    if (datos.activo !== undefined) {
        if (datos.activo !== 'true' && datos.activo !== 'false') {
            errorValidacion([{ campo: 'activo', mensaje: 'El estado debe ser verdadero o falso.' }]);
        }

        resultado.activo = datos.activo === 'true';
    }

    return resultado;
}