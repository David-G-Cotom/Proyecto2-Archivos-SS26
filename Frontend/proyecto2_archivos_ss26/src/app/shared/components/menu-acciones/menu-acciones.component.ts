import { Component, ElementRef, input, output, signal, viewChild } from '@angular/core';

export interface AccionMenu {
  id: string;
  etiqueta: string;
  icono: string;
  // Acción destructiva: se pinta en rojo
  peligro?: boolean;
}

@Component({
  selector: 'app-menu-acciones',
  imports: [],
  templateUrl: './menu-acciones.component.html',
  styleUrl: './menu-acciones.component.css',
})
export class MenuAccionesComponent {

  readonly acciones = input.required<AccionMenu[]>();
  // Texto para lectores de pantalla
  readonly etiquetaBoton = input('Más acciones');
  readonly seleccionada = output<string>();

  protected readonly abierto = signal(false);
  protected readonly posicion = signal({ arriba: 0, izquierda: 0 });

  private readonly boton = viewChild.required<ElementRef<HTMLButtonElement>>('boton');
  private readonly menu = viewChild<ElementRef<HTMLElement>>('menu');

  protected alternar(): void {
    if (this.abierto()) {
      this.cerrar();
      return;
    }

    // Se alinea el borde derecho del menú con el del botón; si no cabe abajo, se abre hacia arriba
    const rect = this.boton().nativeElement.getBoundingClientRect();
    const ancho = 190;
    const alto = this.acciones().length * 40 + 16;
    const abreHaciaArriba = rect.bottom + alto + 8 > window.innerHeight;
    this.posicion.set({
      arriba: abreHaciaArriba ? Math.max(8, rect.top - alto - 4) : rect.bottom + 4,
      izquierda: Math.max(8, rect.right - ancho),
    });
    this.abierto.set(true);
    // Foco en la primera opción (el menú se pinta en el siguiente ciclo)
    setTimeout(() => this.menu()?.nativeElement.querySelector<HTMLElement>('[role=menuitem]')?.focus());
  }

  protected cerrar(): void {
    if (!this.abierto()) return;
    this.abierto.set(false);
    this.boton().nativeElement.focus(); // devuelve el foco al botón para no perder la posición con el teclado
  }

  protected elegir(accion: AccionMenu): void {
    this.abierto.set(false);
    this.seleccionada.emit(accion.id);
  }

  /** Flechas arriba/abajo recorren las opciones (comportamiento estándar de un menú). */
  protected alTeclear(evento: KeyboardEvent): void {
    if (evento.key !== 'ArrowDown' && evento.key !== 'ArrowUp') return;
    evento.preventDefault();

    const opciones = Array.from(this.menu()?.nativeElement.querySelectorAll<HTMLElement>('[role=menuitem]') ?? []);
    if (opciones.length === 0) return;
    const actual = opciones.indexOf(document.activeElement as HTMLElement);
    const desplazamiento = evento.key === 'ArrowDown' ? 1 : -1;
    opciones[(actual + desplazamiento + opciones.length) % opciones.length]?.focus();
  }

}
