import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificacionService } from '../services/notificacion.service';
import { catchError, throwError } from 'rxjs';
import { mensajeDeError } from '../core/errores-api';

export const erroresHttpInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const avisos = inject(NotificacionService);
  const router = inject(Router);

  // El login muestra sus propios mensajes de error
  const evitarMensaje = req.url.endsWith('/auth/login');

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && !evitarMensaje) {
        if (error.status === 0) {
          avisos.error(mensajeDeError(error), 'Sin conexión');
        } else if (error.status === 401) {
          avisos.advertencia('Tu sesión expiró. Inicia sesión nuevamente.', 'Sesión finalizada');
          auth.cerrarSesion(router.url);
        } else if (error.status === 403) {
          avisos.error(mensajeDeError(error, 'No tienes permiso para realizar esta acción.'), 'Acceso denegado');
        } else if (error.status >= 500) {
          avisos.error(mensajeDeError(error), 'Error del servidor');
        }
      }
      return throwError(() => error);
    }),
  );
};
