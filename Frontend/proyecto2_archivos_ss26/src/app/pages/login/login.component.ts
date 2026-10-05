import { Component, inject, signal } from '@angular/core';
import { mensajeDeError } from '../../core/errores-api';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificacionService } from '../../services/notificacion.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  private readonly avisos = inject(NotificacionService);

  protected readonly formulario = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  protected readonly cargando = signal(false);
  protected readonly errorMensaje = signal<string | null>(null);
  protected readonly viewPassword = signal(false);

  protected campoInvalido(campo: 'username' | 'password'): boolean {
    const control = this.formulario.controls[campo];
    return control.invalid && (control.touched || control.dirty);
  }

  protected togglePassword(): void {
    this.viewPassword.update((visible) => !visible);
  }

  protected enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.errorMensaje.set(null);

    this.auth.iniciarSesion(this.formulario.getRawValue()).subscribe({
      next: (usuario) => {
        this.avisos.exito(`Hola, ${usuario.nombreCompleto}.`, 'Bienvenido');
        this.router.navigateByUrl(this.urlRetornoSegura());
      },
      error: (error: unknown) => {
        this.cargando.set(false);
        this.errorMensaje.set(mensajeDeError(error, 'No se pudo iniciar sesión. Inténtalo de nuevo.'));
      },
    });
  }

  /**
   * Solo se aceptan rutas internas (empiezan con una sola "/"): así nadie puede construir un enlace
   * de login que, al terminar, redirija a un sitio externo malicioso (open redirect)
   */
  private urlRetornoSegura(): string {
    const retorno = this.ruta.snapshot.queryParamMap.get('retorno');
    return retorno && retorno.startsWith('/') && !retorno.startsWith('//') ? retorno : '/inicio';
  }

}
