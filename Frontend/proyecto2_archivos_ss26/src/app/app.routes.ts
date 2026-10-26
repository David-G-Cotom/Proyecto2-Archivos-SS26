import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { invitadoGuard } from './guards/invitado-guard';
import { rolGuard } from './guards/rol-guard';

export const routes: Routes = [
    {
        path: 'login',
        title: 'Iniciar sesión',
        canActivate: [invitadoGuard],
        loadComponent: () => import('./pages/login/login.component').then((c) => c.LoginComponent),
    },
    {
        path: '',
        canActivate: [authGuard],
        loadComponent: () => import('./layout/main-layout/main-layout.component').then((m) => m.MainLayoutComponent,),
        children: [
            {
                path: '',
                pathMatch: 'full',
                redirectTo: 'inicio'
            },
            {
                path: 'inicio',
                title: 'Inicio',
                loadComponent: () => import('./pages/inicio/inicio.component').then((m) => m.InicioComponent),
            },
            {
                path: 'archivos',
                title: 'Mis archivos',
                loadComponent: () => import('./pages/archivos/archivos.component').then((m) => m.ArchivosComponent),
            },
            {
                path: 'archivos/ver/:archivoId',
                title: 'Ver archivo',
                loadComponent: () => import('./pages/visor-archivo/visor-archivo.component').then((m) => m.VisorArchivoComponent),
            },
            {
                path: 'archivos/:carpetaId',
                title: 'Mis archivos',
                loadComponent: () => import('./pages/archivos/archivos.component').then((m) => m.ArchivosComponent),
            },
            {
                path: 'papelera',
                title: 'Papelera',
                loadComponent: () => import('./paginas/papelera/papelera.componente').then((m) => m.PapeleraComponente),
            },
            {
                path: 'administracion/usuarios',
                title: 'Usuarios',
                canActivate: [rolGuard],
                data: { rol: ['administracion'] },
                loadComponent: () => import('./pages/usuarios/usuarios.component').then((m) => m.UsuariosComponent),
            },
        ],
    },
    {
        path: '**',
        title: 'Página no encontrada',
        loadComponent: () => import('./pages/no-encontrada/no-encontrada.component').then((m) => m.NoEncontradaComponent),
    }
];
