import { Component, inject, output, signal } from '@angular/core';
import { erroresPorCampo, mensajeDeError } from '../../core/errores-api';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { NotificacionService } from '../../services/notificacion.service';
import { camposCoinciden, mensajeValidacion, strongPassword } from '../../core/validadores';
import { DialogoComponent } from '../../shared/components/dialogo/dialogo.component';

type Campo = 'currentPassword' | 'newPassword' | 'confirmacion';

@Component({
  selector: 'app-change-password',
  imports: [ReactiveFormsModule, DialogoComponent],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css',
})
export class ChangePasswordComponent {

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly avisos = inject(NotificacionService);

  readonly cerrado = output<void>();

  protected readonly guardando = signal(false);
  protected readonly errorGeneral = signal<string | null>(null);
  protected readonly viewPassword = signal(false);

  protected readonly formulario = this.fb.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8), strongPassword]],
      confirmacion: ['', [Validators.required]],
    },
    // La coincidencia se valida a nivel de GRUPO porque depende de dos campos a la vez
    { validators: camposCoinciden('newPassword', 'confirmacion') },
  );

  protected error(campo: Campo): string | null {
    if (campo === 'confirmacion') {
      const control = this.formulario.controls.confirmacion;
      if (control.errors) return mensajeValidacion(control, 'La confirmación');
      if (control.touched && this.formulario.hasError('noCoinciden')) return 'Las contraseñas no coinciden.';
      return null;
    }
    const etiqueta = campo === 'currentPassword' ? 'La contraseña actual' : 'La contraseña nueva';
    return mensajeValidacion(this.formulario.controls[campo], etiqueta);
  }

  protected guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword } = this.formulario.getRawValue();
    this.guardando.set(true);
    this.errorGeneral.set(null);

    this.auth.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.avisos.exito('Tu contraseña se actualizó correctamente.', 'Contraseña cambiada');
        this.cerrado.emit();
      },
      error: (error: unknown) => {
        this.guardando.set(false);
        // El servidor indica qué campo falló (p. ej. contraseña actual incorrecta)
        const porCampo = erroresPorCampo(error);
        let marcado = false;
        for (const [campo, mensaje] of Object.entries(porCampo)) {
          const control = this.formulario.get(campo);
          if (control) {
            control.setErrors({ servidor: mensaje });
            control.markAsTouched();
            marcado = true;
          }
        }
        if (!marcado) this.errorGeneral.set(mensajeDeError(error, 'No se pudo cambiar la contraseña.'));
      },
    });
  }

}
