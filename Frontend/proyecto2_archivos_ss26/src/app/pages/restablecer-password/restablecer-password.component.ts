import { Component, inject, input, output, signal } from '@angular/core';
import { erroresPorCampo, mensajeDeError } from '../../core/errores-api';
import { mensajeValidacion, strongPassword } from '../../core/validadores';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuarioAdministrado } from '../../models/usuario.model';
import { UsuariosService } from '../../services/usuarios.service';
import { DialogoComponent } from '../../shared/components/dialogo/dialogo.component';

@Component({
  selector: 'app-restablecer-password',
  imports: [ReactiveFormsModule, DialogoComponent],
  templateUrl: './restablecer-password.component.html',
  styleUrl: './restablecer-password.component.css',
})
export class RestablecerPasswordComponent {

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly servicio = inject(UsuariosService);

  readonly usuario = input.required<UsuarioAdministrado>();
  readonly restablecida = output<UsuarioAdministrado>();
  readonly cerrado = output<void>();

  protected readonly guardando = signal(false);
  protected readonly errorGeneral = signal<string | null>(null);
  protected readonly verPassword = signal(false);

  protected readonly formulario = this.fb.group({
    newPassword: ['', [Validators.required, strongPassword]],
  });

  protected error(): string | null {
    return mensajeValidacion(this.formulario.controls.newPassword, 'La contraseña');
  }

  protected guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.errorGeneral.set(null);

    this.servicio.restablecerPassword(this.usuario().id, this.formulario.getRawValue().newPassword).subscribe({
      next: () => this.restablecida.emit(this.usuario()),
      error: (error: unknown) => {
        this.guardando.set(false);
        const mensaje = erroresPorCampo(error)['newPassword'];
        if (mensaje) {
          this.formulario.controls.newPassword.setErrors({ servidor: mensaje });
        } else {
          this.errorGeneral.set(mensajeDeError(error, 'No se pudo restablecer la contraseña.'));
        }
      },
    });
  }

}
