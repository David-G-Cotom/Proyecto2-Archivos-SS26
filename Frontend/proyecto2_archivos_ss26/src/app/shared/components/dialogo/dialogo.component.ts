import { afterNextRender, Component, DestroyRef, ElementRef, inject, input, output, viewChild } from '@angular/core';

let contadorDialogos = 0;

@Component({
  selector: 'app-dialogo',
  imports: [],
  templateUrl: './dialogo.component.html',
  styleUrl: './dialogo.component.css',
})
export class DialogoComponent {

  readonly titulo = input.required<string>();
  readonly ancho = input<'sm' | 'md'>('md');
  readonly bloqueado = input(false);
  readonly cerrado = output<void>();

  protected readonly idTitulo = `dialogo-titulo-${contadorDialogos + 1}`;
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  constructor() {
    afterNextRender(() => {
      this.dialogo().nativeElement.showModal();
      document.body.style.overflow = 'hidden';
    });
    inject(DestroyRef).onDestroy(() => {
      document.body.style.overflow = '';
    });
  }

  protected cerrar(): void {
    this.dialogo().nativeElement.close();
  }

  protected alCancelar(evento: Event): void {
    if (this.bloqueado()) evento.preventDefault();
  }

  // Un clic sobre el fondo oscuro
  protected alHacerClic(evento: MouseEvent): void {
    if (evento.target === this.dialogo().nativeElement && !this.bloqueado()) this.cerrar();
  }

}
