import { Component, computed, DestroyRef, inject, input, signal } from '@angular/core';
import { marked } from 'marked';
import { descargarBlob } from '../../core/descarga';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, of, switchMap, tap } from 'rxjs';
import { mensajeDeError } from '../../core/errores-api';
import { formatearBytes } from '../../core/formato';
import { DetalleArchivo } from '../../models/archivo.model';
import { ArchivosService } from '../../services/archivos.service';
import { NotificacionService } from '../../services/notificacion.service';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';

type Modo = 'renderizado' | 'original';

/**
 * Convierte Markdown a HTML. El resultado se muestra con [innerHTML], y Angular lo SANITIZA siempre
 * (elimina <script>, atributos onclick=…, enlaces javascript:, etc.), así que un .md malicioso
 * subido por otro usuario no puede ejecutar código en el navegador.
 */
function renderizarMarkdown(texto: string): string {
  const html = marked.parse(texto, { gfm: true, async: false }) as string;
  // Los enlaces se abren en otra pestaña para no sacar al usuario de la aplicación
  return html.replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" ');
}

@Component({
  selector: 'app-visor-archivo',
  imports: [RouterLink, DatePipe],
  templateUrl: './visor-archivo.component.html',
  styleUrl: './visor-archivo.component.css',
})
export class VisorArchivoComponent {

  // Parámetro :archivoId de la ruta
  readonly archivoId = input.required<string>();

  private readonly api = inject(ArchivosService);
  private readonly avisos = inject(NotificacionService);
  private readonly destruido = inject(DestroyRef);

  protected readonly detalle = signal<DetalleArchivo | null>(null);
  protected readonly texto = signal('');
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly modo = signal<Modo>('renderizado');
  protected readonly descargando = signal(false);

  protected readonly esMarkdown = computed(() => this.detalle()?.archivo.extension === 'md');

  /** Solo se convierte cuando hace falta (archivo .md en modo renderizado); el resultado se guarda hasta que cambie algo. */
  protected readonly htmlRenderizado = computed(() =>
    this.esMarkdown() && this.modo() === 'renderizado' ? renderizarMarkdown(this.texto()) : '',
  );

  /** Carpeta que contiene al archivo, para el botón "Volver". */
  protected readonly enlaceCarpeta = computed(() => {
    const ruta = this.detalle()?.ruta ?? [];
    const ultima = ruta[ruta.length - 1];
    return ultima ? ['/archivos', ultima.id] : ['/archivos'];
  });

  protected readonly size = computed(() => formatearBytes(this.detalle()?.archivo.bytesSize ?? 0));

  constructor() {
    toObservable(this.archivoId)
      .pipe(
        tap(() => {
          this.cargando.set(true);
          this.error.set(null);
          this.modo.set('renderizado');
        }),
        // Metadatos y contenido se piden a la vez; si cambia el archivo, la petición anterior se cancela
        switchMap((id) =>
          forkJoin({ detalle: this.api.detalle(id), texto: this.api.texto(id) }).pipe(
            catchError((error: unknown) => {
              this.error.set(mensajeDeError(error, 'No se pudo abrir el archivo.'));
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(this.destruido),
      )
      .subscribe((resultado) => {
        this.cargando.set(false);
        if (resultado) {
          this.detalle.set(resultado.detalle);
          this.texto.set(resultado.texto);
        }
      });
  }

  protected cambiarModo(modo: Modo): void {
    this.modo.set(modo);
  }

  protected descargar(): void {
    const archivo = this.detalle()?.archivo;
    if (!archivo) return;

    this.descargando.set(true);
    this.api.descargar(archivo.id).subscribe({
      next: (blob) => {
        descargarBlob(blob, archivo.nombre);
        this.descargando.set(false);
      },
      error: () => {
        this.descargando.set(false);
        this.avisos.error('No se pudo descargar el archivo. Inténtalo de nuevo.', 'Descarga fallida');
      },
    });
  }

}
