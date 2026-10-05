import { Rol } from "../models/usuario.model";

export interface ElementoMenu {
    etiqueta: string;
    ruta: string;
    icono: string;
    descripcion: string;
    roles?: Rol[];
}

export const ELEMENTOS_MENU: readonly ElementoMenu[] = [
    {
        etiqueta: 'Inicio',
        ruta: '/inicio',
        icono: 'bi-house-door',
        descripcion: 'Resumen y accesos rápidos.',
    },
    {
        etiqueta: 'Mis archivos',
        ruta: '/archivos',
        icono: 'bi-folder2-open',
        descripcion: 'Organiza tus documentos en carpetas, súbelos, edítalos y descárgalos.',
    },
    {
        etiqueta: 'Compartidos conmigo',
        ruta: '/compartidos',
        icono: 'bi-people',
        descripcion: 'Archivos y carpetas que otros usuarios han compartido contigo.',
    },
    {
        etiqueta: 'Papelera',
        ruta: '/papelera',
        icono: 'bi-trash3',
        descripcion: 'Restaura o elimina definitivamente lo que borraste.',
    },
    {
        etiqueta: 'Actividad',
        ruta: '/actividad',
        icono: 'bi-clock-history',
        descripcion: 'Consulta el historial de operaciones realizadas.',
    },
    {
        etiqueta: 'Reportes',
        ruta: '/reportes',
        icono: 'bi-bar-chart-line',
        descripcion: 'Estadísticas de archivos, usuarios, comparticiones y actividad.',
        roles: ['administrador'],
    },
    {
        etiqueta: 'Usuarios',
        ruta: '/administracion/usuarios',
        icono: 'bi-person-gear',
        descripcion: 'Crea usuarios y actívalos o desactívalos.',
        roles: ['administrador'],
    },
];

export function menuParaRol(rol?: Rol): ElementoMenu[] {
    const resultado: ElementoMenu[] = [];
    for (const element of ELEMENTOS_MENU) {
        if (!element.roles || (rol && element.roles.includes(rol))) {
            resultado.push(element);
        }
    }
    return resultado;
}