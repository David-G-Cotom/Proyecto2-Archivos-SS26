import { Component, DestroyRef, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { formatearBytes } from '../../core/formato';
import { Archivo } from '../../models/archivo.model';
import { Carpeta, ContenidoCarpeta } from '../../models/carpeta.model';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, map, merge, of, Subject, switchMap, tap } from 'rxjs';
import { mensajeDeError } from '../../core/errores-api';
import { AccionMenu, MenuAccionesComponent } from '../../shared/components/menu-acciones/menu-acciones.component';
import { CarpetasService } from '../../services/carpetas.service';
import { Router, RouterLink } from '@angular/router';
import { NotificacionService } from '../../services/notificacion.service';
import { DialogoNombreCarpetaComponent } from '../dialogo-nombre-carpeta/dialogo-nombre-carpeta.component';
import { DatePipe } from '@angular/common';
import { ArchivosService } from '../../services/archivos.service';
import { SubidaArchivosService } from '../../services/subida-archivos.service';
import { descargarBlob } from '../../core/descarga';
import { PanelSubidaComponent } from '../panel-subida/panel-subida.component';
import { MoverElementoComponent } from '../mover-elemento/mover-elemento.component';
import { DialogoRenombrarArchivoComponent } from '../dialogo-renombrar-archivo/dialogo-renombrar-archivo.component';

type Vista = 'lista' | 'cuadricula';
const CLAVE_VISTA = 'gestor-documental-vista-archivos';

function leerVistaGuardada(): Vista {
  try {
    return localStorage.getItem(CLAVE_VISTA) === 'lista' ? 'lista' : 'cuadricula';
  } catch {
    return 'cuadricula';
  }
}

function traeArchivos(evento: DragEvent): boolean {
  return evento.dataTransfer?.types.includes('Files') ?? false;
}

@Component({
  selector: 'app-archivos',
  imports: [
    DialogoNombreCarpetaComponent,
    MenuAccionesComponent,
    PanelSubidaComponent,
    MoverElementoComponent,
    DialogoRenombrarArchivoComponent,
    DatePipe,
    RouterLink
  ],
  templateUrl: './archivos.component.html',
  styleUrl: './archivos.component.css',
})
export class ArchivosComponent {

  readonly carpetaId = input<string>();

  private readonly carpetasApi = inject(CarpetasService);
  private readonly archivosApi = inject(ArchivosService);
  private readonly router = inject(Router);
  private readonly avisos = inject(NotificacionService);
  private readonly destruido = inject(DestroyRef);
  private readonly subida = inject(SubidaArchivosService);

  /** <input type="file"> oculto: el botón "Subir archivo" lo abre. */
  private readonly entradaArchivos = viewChild.required<ElementRef<HTMLInputElement>>('entradaArchivos');

  protected readonly contenido = signal<ContenidoCarpeta | null>(null);
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly vista = signal<Vista>(leerVistaGuardada());
  protected readonly arrastrando = signal(false);

  protected readonly creando = signal(false);
  protected readonly carpetaRenombrando = signal<Carpeta | null>(null);
  protected readonly carpetaMoviendo = signal<Carpeta | null>(null);
  protected readonly archivoRenombrando = signal<Archivo | null>(null);
  protected readonly archivoMoviendo = signal<Archivo | null>(null);

  protected readonly accionesCarpeta: AccionMenu[] = [
    { id: 'abrir', etiqueta: 'Abrir', icono: 'bi-folder2-open' },
    { id: 'renombrar', etiqueta: 'Renombrar', icono: 'bi-pencil' },
    { id: 'mover', etiqueta: 'Mover a…', icono: 'bi-folder-symlink' },
  ];

  protected readonly accionesArchivo: AccionMenu[] = [
    { id: 'abrir', etiqueta: 'Ver', icono: 'bi-eye' },
    { id: 'descargar', etiqueta: 'Descargar', icono: 'bi-download' },
    { id: 'renombrar', etiqueta: 'Renombrar', icono: 'bi-pencil' },
    { id: 'mover', etiqueta: 'Mover a…', icono: 'bi-folder-symlink' },
  ];

  private readonly esTactil = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

  private readonly recargar$ = new Subject<void>();

  private contadorArrastre = 0;

  constructor() {
    // Se carga al cambiar la carpeta de la URL y cada vez que se pide recargar (tras crear, renombrar, mover, subir...)
    merge(toObservable(this.carpetaId), this.recargar$.pipe(map(() => this.carpetaId())))
      .pipe(
        tap(() => {
          this.cargando.set(true);
          this.errorCarga.set(null);
        }),
        // switchMap cancela la peticion anterior si el usuario navega rapido entre carpetas
        switchMap((id) =>
          this.carpetasApi.contenido(id ?? null).pipe(
            catchError((error: unknown) => {
              this.errorCarga.set(mensajeDeError(error, 'No se pudo cargar la carpeta.'));
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(this.destruido),
      )
      .subscribe((resultado) => {
        this.cargando.set(false);
        if (resultado) this.contenido.set(resultado);
      });
  }

  // ----- Navegacion -----
  protected abrirCarpeta(carpeta: Carpeta): void {
    void this.router.navigate(['/archivos', carpeta.id]);
  }

  protected abrirArchivo(archivo: Archivo): void {
    void this.router.navigate(['/archivos/ver', archivo.id]);
  }

  protected alClicElemento(evento: MouseEvent, abrir: () => void): void {
    if (this.esTactil || evento.detail === 0) abrir();
  }

  protected recargar(): void {
    this.recargar$.next();
  }

  // ----- Vista -----
  protected cambiarVista(vista: Vista): void {
    this.vista.set(vista);
    localStorage.setItem(CLAVE_VISTA, vista);
  }

  // ----- Acciones sobre carpetas -----
  protected alElegirAccionCarpeta(accionId: string, carpeta: Carpeta): void {
    if (accionId === 'abrir') this.abrirCarpeta(carpeta);
    else if (accionId === 'renombrar') this.carpetaRenombrando.set(carpeta);
    else if (accionId === 'mover') this.carpetaMoviendo.set(carpeta);
  }

  protected alCrearCarpeta(carpeta: Carpeta): void {
    this.creando.set(false);
    this.avisos.exito(`Se creó la carpeta <<${carpeta.nombre}>>.`, 'Carpeta creada');
    this.recargar();
  }

  protected alRenombrarCarpeta(carpeta: Carpeta): void {
    this.carpetaRenombrando.set(null);
    this.avisos.exito(`La carpeta ahora se llama <<${carpeta.nombre}>>.`, 'Carpeta renombrada');
    this.recargar();
  }

  protected alMoverCarpeta(carpeta: Carpeta, nombreDestino: string): void {
    this.carpetaMoviendo.set(null);
    this.avisos.exito(`<<${carpeta.nombre}>> ahora está en <<${nombreDestino}>>.`, 'Carpeta movida');
    this.recargar();
  }

  // ----- Acciones sobre archivos -----
  protected alElegirAccionArchivo(accionId: string, archivo: Archivo): void {
    if (accionId === 'abrir') this.abrirArchivo(archivo);
    else if (accionId === 'descargar') this.descargar(archivo);
    else if (accionId === 'renombrar') this.archivoRenombrando.set(archivo);
    else if (accionId === 'mover') this.archivoMoviendo.set(archivo);
  }

  private descargar(archivo: Archivo): void {
    this.archivosApi.descargar(archivo.id).subscribe({
      next: (blob) => descargarBlob(blob, archivo.nombre),
      error: () => this.avisos.error('No se pudo descargar el archivo. Inténtalo de nuevo.', 'Descarga fallida'),
    });
  }

  protected alRenombrarArchivo(archivo: Archivo): void {
    this.archivoRenombrando.set(null);
    this.avisos.exito(`El archivo ahora se llama <<${archivo.nombre}>>.`, 'Archivo renombrado');
    this.recargar();
  }

  protected alMoverArchivo(archivo: Archivo, nombreDestino: string): void {
    this.archivoMoviendo.set(null);
    this.avisos.exito(`«${archivo.nombre}» ahora está en <<${nombreDestino}>>.`, 'Archivo movido');
    this.recargar();
  }

  // ----- Subida de archivos -----
  protected abrirSelectorArchivos(): void {
    this.entradaArchivos().nativeElement.click();
  }

  protected alElegirArchivos(evento: Event): void {
    const entrada = evento.target as HTMLInputElement;
    const archivos = Array.from(entrada.files ?? []);
    entrada.value = '';
    void this.iniciarSubida(archivos);
  }

  private async iniciarSubida(archivos: File[]): Promise<void> {
    if (archivos.length === 0) return;
    if (this.subida.activa()) {
      this.avisos.advertencia('Espera a que termine la subida actual para subir más archivos.', 'Subida en curso');
      return;
    }

    const resumen = await this.subida.subir(archivos, this.carpetaId() ?? null);

    const partes: string[] = [];
    if (resumen.subidos > 0) partes.push(`${resumen.subidos} subido${resumen.subidos === 1 ? '' : 's'}`);
    if (resumen.reemplazados > 0) partes.push(`${resumen.reemplazados} reemplazado${resumen.reemplazados === 1 ? '' : 's'}`);
    if (resumen.omitidos > 0) partes.push(`${resumen.omitidos} omitido${resumen.omitidos === 1 ? '' : 's'}`);
    if (resumen.conErrores > 0) partes.push(`${resumen.conErrores} con error`);

    if (resumen.conErrores > 0) this.avisos.advertencia(`${partes.join(' - ')}. Revisa el detalle en el panel.`, 'Subida finalizada');
    else if (resumen.subidos + resumen.reemplazados > 0) this.avisos.exito(partes.join(' - ') + '.', 'Subida finalizada');

    this.recargar();
  }

  // ----- Arrastrar y soltar -----
  protected alArrastrarEntrar(evento: DragEvent): void {
    if (!traeArchivos(evento)) return;
    evento.preventDefault();
    this.contadorArrastre++;
    this.arrastrando.set(true);
  }

  protected alArrastrarSobre(evento: DragEvent): void {
    if (!traeArchivos(evento)) return;
    evento.preventDefault();
    if (evento.dataTransfer) evento.dataTransfer.dropEffect = 'copy';
  }

  protected alArrastrarSalir(evento: DragEvent): void {
    if (!traeArchivos(evento)) return;
    this.contadorArrastre = Math.max(0, this.contadorArrastre - 1);
    if (this.contadorArrastre === 0) this.arrastrando.set(false);
  }

  protected alSoltar(evento: DragEvent): void {
    if (!traeArchivos(evento)) return;
    evento.preventDefault();
    this.contadorArrastre = 0;
    this.arrastrando.set(false);
    void this.iniciarSubida(Array.from(evento.dataTransfer?.files ?? []));
  }

  protected evitarApertura(evento: DragEvent): void {
    if (traeArchivos(evento)) evento.preventDefault();
  }

  // ----- Presentación -----
  protected textoSubcarpetas(carpeta: Carpeta): string {
    const n = carpeta.cantidadSubcarpetas;
    return n === 0 ? 'Sin subcarpetas' : n === 1 ? '1 subcarpeta' : `${n} subcarpetas`;
  }

  protected size(archivo: Archivo): string {
    return formatearBytes(archivo.bytesSize);
  }

  protected iconoArchivo(archivo: Archivo): string {
    return archivo.extension === 'md' ? 'bi-markdown-fill' : 'bi-file-earmark-text-fill';
  }

}
