import { QueryFilter } from "mongoose";
import { UsuarioAutenticado } from "../middlewares/autenticacion.js";
import { Usuario } from "../models/index.js";
import { IUsuario } from "../models/usuario.js";
import { ErrorConflicto, ErrorNoEncontrado } from "../utilities/errores.js";
import { hashearPassword } from "../utilities/passwords.js";
import { aUsuarioAdministrado } from "../utilities/presentadores.js";
import { ConsultaUsuarios, DatosActualizarUsuario, DatosCrearUsuario } from "../validations/usuarios.validacion.js";
import { registrarActividad } from "./actividad.servicio.js";

// Escapa los caracteres especiales de regex para que lo que escribe el usuario se busque como texto literal
function escaparRegex(texto: string): string {
    return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function obtenerDocumento(id: string) {
    const usuario = await Usuario.findById(id);
    if (!usuario) {
        throw new ErrorNoEncontrado('El usuario no existe.');
    }
    return usuario;
}

export async function listarUsuarios(consulta: ConsultaUsuarios) {
    const filtro: QueryFilter<IUsuario> = {};

    if (consulta.busqueda) {
        const patron = new RegExp(escaparRegex(consulta.busqueda), 'i'); // 'i' = sin distinguir mayúsculas
        filtro.$or = [{ username: patron }, { nombreCompleto: patron }, { correo: patron }];
    }
    if (consulta.rol) filtro.rol = consulta.rol;
    if (consulta.activo !== undefined) filtro.activo = consulta.activo;

    // Conteo y página en paralelo: dos consultas independientes
    const [total, usuarios] = await Promise.all([
        Usuario.countDocuments(filtro),
        Usuario.find(filtro)
            .sort({ nombreCompleto: 1, _id: 1 })
            .skip((consulta.pagina - 1) * consulta.limite)  // Salta los registros de las paginas anteriores
            .limit(consulta.limite)
    ]);

    return {
        datos: usuarios.map(aUsuarioAdministrado),
        paginacion: {
            pagina: consulta.pagina,
            limite: consulta.limite,
            total,
            totalPaginas: Math.max(1, Math.ceil(total / consulta.limite)),
        },
    };
}

export async function obtenerUsuario(id: string) {
    return aUsuarioAdministrado(await obtenerDocumento(id));
}

export async function crearUsuario(datos: DatosCrearUsuario, actor: UsuarioAutenticado) {
    const existente = await Usuario.findOne({ $or: [{ username: datos.username }, { correo: datos.correo }] });
    if (existente) {
        const campo = existente.username === datos.username ? 'username' : 'correo';
        throw new ErrorConflicto(
            campo === 'username' ? 'Ya existe un usuario con ese nombre de usuario.' : 'Ya existe un usuario con ese correo.',
            { campo },
        );
    }

    const usuario = await Usuario.create({
        username: datos.username,
        nombreCompleto: datos.nombreCompleto,
        correo: datos.correo,
        rol: datos.rol,
        password: await hashearPassword(datos.password),
    });

    await registrarActividad({
        usuarioId: actor.id,
        username: actor.username,
        accion: 'crear',
        recursoTipo: 'usuario',
        recursoId: usuario._id,
        recursoNombre: usuario.username,
        detalle: 'rol: ' + usuario.rol,
    });

    return aUsuarioAdministrado(usuario);
}

export async function actualizarUsuario(id: string, datos: DatosActualizarUsuario, actor: UsuarioAutenticado) {
    const usuario = await obtenerDocumento(id);

    if (id === actor.id && datos.rol && datos.rol !== 'administrador') {
        throw new ErrorConflicto('No puedes quitarte a ti mismo el rol de administrador.', { campo: 'rol' });
    }

    if (datos.correo && datos.correo !== usuario.correo) {
        const correoEnUso = await Usuario.exists({ correo: datos.correo, _id: { $ne: usuario._id } });
        if (correoEnUso) {
            throw new ErrorConflicto('Ya existe un usuario con ese correo.', { campo: 'correo' });
        }
    }

    let detalleTexto = '';
    let cantidadCambios = 0;
    for (const campo of ['nombreCompleto', 'correo', 'rol'] as const) {
        const nuevo = datos[campo];
        if (nuevo !== undefined && nuevo !== usuario[campo]) {
            if (cantidadCambios > 0) {
                detalleTexto += ', ';
            }
            detalleTexto += `Se cambió el campo '${campo}' de '${usuario[campo]}' a '${nuevo}'`;
            usuario.set(campo, nuevo);
            cantidadCambios++;
        }
    }

    if (cantidadCambios > 0) {
        await usuario.save();
        await registrarActividad({
            usuarioId: actor.id,
            username: actor.username,
            accion: 'editar',
            recursoTipo: 'usuario',
            recursoId: usuario._id,
            recursoNombre: usuario.username,
            detalle: 'detalleTexto: ' + detalleTexto
        });
    }

    return aUsuarioAdministrado(usuario);
}

export async function cambiarEstadoUsuario(id: string, activo: boolean, actor: UsuarioAutenticado) {
    if (id === actor.id && !activo) {
        throw new ErrorConflicto('No puedes desactivar tu propia cuenta.');
    }

    const usuario = await obtenerDocumento(id);

    if (usuario.activo !== activo) {
        usuario.activo = activo;
        await usuario.save();
        await registrarActividad({
            usuarioId: actor.id,
            username: actor.username,
            accion: activo ? 'activar_usuario' : 'desactivar_usuario',
            recursoTipo: 'usuario',
            recursoId: usuario._id,
            recursoNombre: usuario.username,
        });
    }

    return aUsuarioAdministrado(usuario);
}

export async function restablecerPassword(id: string, passwrodNueva: string, actor: UsuarioAutenticado) {
    const usuario = await obtenerDocumento(id);

    usuario.password = await hashearPassword(passwrodNueva);
    await usuario.save();

    await registrarActividad({
        usuarioId: actor.id,
        username: actor.username,
        accion: 'restablecer_contraseña',
        recursoTipo: 'usuario',
        recursoId: usuario._id,
        recursoNombre: usuario.username,
    });
}