import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { DialogoComponent } from '../../shared/components/dialogo/dialogo.component';
import { erroresPorCampo, mensajeDeError } from '../../core/errores-api';
import { mensajeValidacion } from '../../core/validadores';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Archivo } from '../../models/archivo.model';
import { ArchivosService } from '../../services/archivos.service';

@Component({
  selector: 'app-dialogo-renombrar-archivo',
  imports: [ReactiveFormsModule, DialogoComponent],
  templateUrl: './dialogo-renombrar-archivo.component.html',
  styleUrl: './dialogo-renombrar-archivo.component.css',
})
export class DialogoRenombrarArchivoComponent implements OnInit {

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly servicio = inject(ArchivosService);

  readonly archivo = input.required<Archivo>();
  readonly renombrado = output<Archivo>();
  readonly cerrado = output<void>();

  protected readonly guardando = signal(false);
  protected readonly errorGeneral = signal<string | null>(null);

  protected readonly formulario = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(160), Validators.pattern(/^[^/\\]+\.(txt|md)$/i)]],
  });

  ngOnInit(): void {
    this.formulario.controls.nombre.setValue(this.archivo().nombre);
  }

  protected error(): string | null {
    return mensajeValidacion(
      this.formulario.controls.nombre,
      'El nombre',
      'debe terminar en .txt o .md y no puede contener "/" ni "\\".',
    );
  }

  protected seleccionarNombreSinExtension(evento: FocusEvent): void {
    const campo = evento.target as HTMLInputElement;
    const punto = campo.value.lastIndexOf('.');
    campo.setSelectionRange(0, punto > 0 ? punto : campo.value.length);
  }

  protected guardar(): void {
    const nombre = this.formulario.controls.nombre.value.trim();
    this.formulario.controls.nombre.setValue(nombre);

    if (this.formulario.invalid) {
      this.formulario.controls.nombre.markAsTouched();
      return;
    }
    // Sin cambios: se cierra sin molestar al servidor
    if (nombre === this.archivo().nombre) {
      this.cerrado.emit();
      return;
    }

    this.guardando.set(true);
    this.errorGeneral.set(null);

    this.servicio.renombrar(this.archivo().id, nombre).subscribe({
      next: (resultado) => this.renombrado.emit(resultado),
      error: (error: unknown) => {
        this.guardando.set(false);
        const mensaje = erroresPorCampo(error)['nombre'];
        if (mensaje) {
          this.formulario.controls.nombre.setErrors({ servidor: mensaje });
          this.formulario.controls.nombre.markAsTouched();
        } else {
          this.errorGeneral.set(mensajeDeError(error, 'No se pudo renombrar el archivo.'));
        }
      },
    });
  }

}
