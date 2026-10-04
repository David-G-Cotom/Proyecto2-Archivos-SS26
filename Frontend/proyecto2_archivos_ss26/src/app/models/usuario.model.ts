export interface Usuario {
    id: string;
    username: string;
    nombreCompleto: string;
    correo: string;
    rol: Rol;
}

export type Rol = 'administrador' | 'usuario';

export interface CredencialesLogin {
    username: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    usuario: Usuario;
}

export interface Sesion {
    token: string;
    usuario: Usuario;
}

// Formato uniforme de error que devuelve el servidor: { error: { codigo, mensaje, detalles } }
export interface ErrorApi {
    error: {
        codigo: string;
        mensaje: string;
        detalles?: unknown;
    };
}

// Usuario tal como lo ve el administrador
export interface UsuarioAdministrado extends Usuario {
    activo: boolean;
    espacioUsadoBytes: number;
    createdAt: string;
    ultimoAccesoEn: string | null;
}

export interface Paginacion {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
}

export interface PaginadaReponse<T> {
    datos: T[];
    paginacion: Paginacion;
}

export interface FiltrosUsuarios {
    busqueda: string;
    rol: Rol | '';
    activo: boolean | null;
    pagina: number;
    limite: number;
}

export interface DatosNuevoUsuario {
    username: string;
    nombreCompleto: string;
    correo: string;
    rol: Rol;
    password: string;
}

export interface DatosEdicionUsuario {
    nombreCompleto: string;
    correo: string;
    rol: Rol;
}
