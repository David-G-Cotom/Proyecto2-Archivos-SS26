import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Rol } from '../models/usuario.model';
import { NotificacionService } from '../services/notificacion.service';

export const rolGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const notificacion = inject(NotificacionService);

  const rolesPermitidos: Rol[] = route.data['rol'];

  if (auth.tieneRol(rolesPermitidos)) return true;

  notificacion.advertencia('No tienes permiso para acceder a esa sección.', 'Acceso restringido');
  return router.createUrlTree(['/inicio']);
};
