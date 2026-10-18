import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { erroresPorCampo, mensajeDeError } from '../../core/errores-api';
import { mensajeValidacion } from '../../core/validadores';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Carpeta } from '../../models/carpeta.model';
import { CarpetasService } from '../../services/carpetas.service';
import { DialogoComponent } from '../../shared/components/dialogo/dialogo.component';

@Component({
  selector: 'app-dialogo-nombre-carpeta',
  imports: [DialogoComponent, ReactiveFormsModule],
  templateUrl: './dialogo-nombre-carpeta.component.html',
  styleUrl: './dialogo-nombre-carpeta.component.css',
})
export class DialogoNombreCarpetaComponent implements OnInit {

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly servicio = inject(CarpetasService);

  // Carpeta a renombrar; null -> se está creando una nueva
  readonly carpeta = input<Carpeta | null>(null);
  // Solo se utiliza para crear una Carpeta
  readonly carpetaPadreId = input<string | null>(null);

  readonly guardada = output<Carpeta>();
  readonly cerrado = output<void>();

  protected readonly esRenombrar = computed(() => this.carpeta() !== null);
  protected readonly guardando = signal(false);
  protected readonly errorGeneral = signal<string | null>(null);

  protected readonly formulario = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(120), Validators.pattern(/^[^/\\]+$/)]],
  });

  ngOnInit(): void {
    const carpeta = this.carpeta();
    if (carpeta) this.formulario.controls.nombre.setValue(carpeta.nombre);
  }

  protected error(): string | null {
    return mensajeValidacion(this.formulario.controls.nombre, 'El nombre', 'no puede contener "/" ni "\\".');
  }

  protected seleccionarTexto(evento: FocusEvent): void {
    (evento.target as HTMLInputElement).select();
  }

  protected guardar(): void {
    const nombre = this.formulario.controls.nombre.value.trim();
    this.formulario.controls.nombre.setValue(nombre);

    if (this.formulario.invalid || nombre === '') {
      this.formulario.controls.nombre.markAsTouched();
      if (nombre === '') this.formulario.controls.nombre.setErrors({ required: true });
      return;
    }

    const carpeta = this.carpeta();
    // Renombrar sin cambiar nada: se cierra sin molestar al servidor
    if (carpeta && carpeta.nombre === nombre) {
      this.cerrado.emit();
      return;
    }

    this.guardando.set(true);
    this.errorGeneral.set(null);

    const peticion = carpeta
      ? this.servicio.renombrar(carpeta.id, nombre)
      : this.servicio.crear(nombre, this.carpetaPadreId());

    peticion.subscribe({
      next: (resultado) => this.guardada.emit(resultado),
      error: (error: unknown) => {
        this.guardando.set(false);
        const mensaje = erroresPorCampo(error)['nombre'];
        if (mensaje) {
          this.formulario.controls.nombre.setErrors({ servidor: mensaje });
          this.formulario.controls.nombre.markAsTouched();
        } else {
          this.errorGeneral.set(mensajeDeError(error, 'No se pudo guardar la carpeta. Inténtalo de nuevo.'));
        }
      },
    });
  }

}
