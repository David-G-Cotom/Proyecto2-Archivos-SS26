import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificacionesComponent } from './shared/components/notificaciones/notificaciones.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NotificacionesComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

}
