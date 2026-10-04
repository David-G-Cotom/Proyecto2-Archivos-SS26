import { Injectable, signal } from '@angular/core';
import { Notificacion, TipoNotificacion } from '../models/notificacion.model';

@Injectable({
  providedIn: 'root',
})
export class NotificacionService {

  private siguienteId = 0;
  public readonly lista = signal<Notificacion[]>([]);

  public exito(mensaje: string, titulo?: string): void {
    this.mostrar('exito', mensaje, 4000, titulo);
  }

  public info(mensaje: string, titulo?: string): void {
    this.mostrar('info', mensaje, 5000, titulo);
  }

  public advertencia(mensaje: string, titulo?: string): void {
    this.mostrar('advertencia', mensaje, 6000, titulo);
  }

  public error(mensaje: string, titulo?: string): void {
    this.mostrar('error', mensaje, 8000, titulo);
  }

  public cerrar(id: number): void {
    const listaActual = this.lista();
    for (let i = 0; i < listaActual.length; i++) {
      if (listaActual[i].id === id) {
        listaActual.splice(i, 1);
        break;
      }
    }
    this.lista.set(listaActual);
  }

  private mostrar(tipo: TipoNotificacion, mensaje: string, duracionMs: number, titulo?: string): void {
    const id = this.siguienteId + 1;
    const listaActual = this.lista();
    // Máximo 4 avisos simultáneos: al llegar uno nuevo se descarta el más antiguo
    if (listaActual.length >= 4) {
      listaActual.shift();
    }
    listaActual.push({ id, tipo, mensaje, titulo });
    this.lista.set(listaActual);
    setTimeout(() => this.cerrar(id), duracionMs);
  }

}
