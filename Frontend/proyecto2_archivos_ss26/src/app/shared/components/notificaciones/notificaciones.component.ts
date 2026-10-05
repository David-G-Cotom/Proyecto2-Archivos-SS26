import { Component, inject } from '@angular/core';
import { NotificacionService } from '../../../services/notificacion.service';
import { TipoNotificacion } from '../../../models/notificacion.model';

@Component({
  selector: 'app-notificaciones',
  imports: [],
  templateUrl: './notificaciones.component.html',
  styleUrl: './notificaciones.component.css',
})
export class NotificacionesComponent {

  protected readonly avisos = inject(NotificacionService);

  protected readonly iconos: Record<TipoNotificacion, string> = {
    exito: 'bi-check-circle-fill',
    error: 'bi-x-octagon-fill',
    info: 'bi-info-circle-fill',
    advertencia: 'bi-exclamation-triangle-fill',
  };

}
