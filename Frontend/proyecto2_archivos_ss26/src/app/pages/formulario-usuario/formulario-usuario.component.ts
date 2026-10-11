import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { erroresPorCampo, mensajeDeError } from '../../core/errores-api';
import { mensajeValidacion, strongPassword } from '../../core/validadores';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Rol, UsuarioAdministrado } from '../../models/usuario.model';
import { UsuariosService } from '../../services/usuarios.service';
import { AuthService } from '../../services/auth.service';
import { DialogoComponent } from '../../shared/components/dialogo/dialogo.component';

type Campo = 'username' | 'nombreCompleto' | 'correo' | 'rol' | 'password';

@Component({
  selector: 'app-formulario-usuario',
  imports: [ReactiveFormsModule, DialogoComponent],
  templateUrl: './formulario-usuario.component.html',
  styleUrl: './formulario-usuario.component.css',
})
export class FormularioUsuarioComponent implements OnInit {

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly servicio = inject(UsuariosService);
  private readonly sesion = inject(AuthService);

  readonly usuario = input<UsuarioAdministrado | null>(null);
  readonly guardado = output<UsuarioAdministrado>();
  readonly cerrado = output<void>();

  protected readonly esEdicion = computed(() => this.usuario() !== null);
  protected readonly esPropioUsuario = computed(() => this.usuario()?.id === this.sesion.usuario()?.id);

  protected readonly guardando = signal(false);
  protected readonly errorGeneral = signal<string | null>(null);
  protected readonly verPassword = signal(false);

  protected readonly formulario = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(40), Validators.pattern(/^[a-zA-Z0-9]+$/)]],
    nombreCompleto: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    correo: ['', [Validators.required, Validators.email]],
    rol: ['usuario' as Rol, [Validators.required]],
    password: ['', [Validators.required, strongPassword]],
  });

  ngOnInit(): void {
    const usuario = this.usuario();
    if (!usuario) return;

    this.formulario.patchValue({
      username: usuario.username,
      nombreCompleto: usuario.nombreCompleto,
      correo: usuario.correo,
      rol: usuario.rol,
    });
    this.formulario.controls.username.disable();
    this.formulario.controls.password.disable();
    if (this.esPropioUsuario()) this.formulario.controls.rol.disable();
  }

  protected error(campo: Campo): string | null {
    const etiquetas: Record<Campo, string> = {
      username: 'El nombre de usuario',
      nombreCompleto: 'El nombre completo',
      correo: 'El correo',
      rol: 'El rol',
      password: 'La contraseña',
    };
    return mensajeValidacion(
      this.formulario.controls[campo],
      etiquetas[campo],
      'solo admite minúsculas, números y mayusculas.',
    );
  }

  protected alternarPassword(): void {
    this.verPassword.update((visible) => !visible);
  }

  protected guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const { username, nombreCompleto, correo, rol, password } = this.formulario.getRawValue();
    const usuario = this.usuario();

    this.guardando.set(true);
    this.errorGeneral.set(null);

    const peticion = usuario
      ? this.servicio.actualizar(usuario.id, { nombreCompleto, correo, rol })
      : this.servicio.crear({ username, nombreCompleto, correo, rol, password });

    peticion.subscribe({
      next: (resultado) => this.guardado.emit(resultado),
      error: (error: unknown) => {
        this.guardando.set(false);
        this.mostrarErrorDelServidor(error);
      },
    });
  }

  private mostrarErrorDelServidor(error: unknown): void {
    const porCampo = erroresPorCampo(error);
    let marcoAlgunCampo = false;

    for (const [campo, mensaje] of Object.entries(porCampo)) {
      const control = this.formulario.get(campo);
      if (control) {
        control.setErrors({ servidor: mensaje });
        control.markAsTouched();
        marcoAlgunCampo = true;
      }
    }
    if (!marcoAlgunCampo) {
      this.errorGeneral.set(mensajeDeError(error, 'No se pudo guardar el usuario. Inténtalo de nuevo.'));
    }
  }

}
