import { Component, input, output } from '@angular/core';
import { DialogoComponent } from '../dialogo/dialogo.component';

@Component({
  selector: 'app-dialogo-confirmacion',
  imports: [DialogoComponent],
  templateUrl: './dialogo-confirmacion.component.html',
  styleUrl: './dialogo-confirmacion.component.css',
})
export class DialogoConfirmacionComponent {

  readonly titulo = input.required<string>();
  readonly etiquetaConfirmar = input('Confirmar');
  /** Acción destructiva: botón rojo e icono de advertencia. */
  readonly peligro = input(false);
  readonly icono = input('bi-exclamation-triangle-fill');
  /** Mientras es true (la operación está en curso) no se puede cancelar ni confirmar de nuevo. */
  readonly ocupado = input(false);

  readonly confirmado = output<void>();
  readonly cancelado = output<void>();

}
