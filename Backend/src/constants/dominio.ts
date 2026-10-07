export const ROLES = ['administrador', 'usuario'] as const;
export type Rol = (typeof ROLES)[number];

export const EXTENSIONES_PERMITIDAS = ['txt', 'md'] as const;
export type Extension = (typeof EXTENSIONES_PERMITIDAS)[number];

export const TIPOS_MIME: Record<Extension, string> = {
    txt: 'text/plain',
    md: 'text/markdown',
};

export const TIPOS_RECURSO = ['archivo', 'carpeta'] as const;
export type TipoRecurso = (typeof TIPOS_RECURSO)[number];

export const PERMISOS = ['lectura', 'comentar', 'edicion'] as const;
export type Permiso = (typeof PERMISOS)[number];

export const NIVEL_PERMISO: Record<Permiso, number> = {
    lectura: 1,
    comentar: 2,
    edicion: 3,
};

export const TIPOS_RECURSO_ACTIVIDAD = [
    'archivo',
    'carpeta',
    'usuario',
    'comparticion',
    'comentario',
    'sesion',
] as const;
export type TipoRecursoActividad = (typeof TIPOS_RECURSO_ACTIVIDAD)[number];

export const ACCIONES = [
    'iniciar_sesion',
    'crear',
    'subir',
    'ver',
    'descargar',
    'editar',
    'renombrar',
    'mover',
    'eliminar',
    'restaurar',
    'eliminar_definitivo',
    'compartir',
    'modificar_permiso',
    'retirar_permiso',
    'comentar',
    'activar_usuario',
    'desactivar_usuario',
    'cambiar_contraseña',
    'restablecer_contraseña',
] as const;
export type Accion = (typeof ACCIONES)[number];

/** Bucket GridFS: genera las colecciones contenidos.files y contenidos.chunks */
export const NOMBRE_BUCKET_CONTENIDOS = 'contenidos';