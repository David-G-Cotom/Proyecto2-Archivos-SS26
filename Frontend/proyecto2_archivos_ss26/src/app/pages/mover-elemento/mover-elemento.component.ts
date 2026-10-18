import { Component, computed, inject, input, output, signal } from '@angular/core';
import { DialogoComponent } from '../../shared/components/dialogo/dialogo.component';
import { mensajeDeError } from '../../core/errores-api';
import { Carpeta, NodoArbol } from '../../models/carpeta.model';
import { Archivo } from '../../models/archivo.model';
import { CarpetasService } from '../../services/carpetas.service';
import { ArchivosService } from '../../services/archivos.service';
import { Observable } from 'rxjs';

interface FilaArbol {
  id: string | null;
  nombre: string;
  nivel: number;
  expandible: boolean;
  expandida: boolean;
  deshabilitada: boolean;
  motivo: string | null;
}

@Component({
  selector: 'app-mover-elemento',
  imports: [DialogoComponent],
  templateUrl: './mover-elemento.component.html',
  styleUrl: './mover-elemento.component.css',
})
export class MoverElementoComponent {

  private readonly carpetasApi = inject(CarpetasService);
  private readonly archivosApi = inject(ArchivosService);

  readonly carpeta = input<Carpeta | null>(null);
  readonly archivo = input<Archivo | null>(null);

  readonly movido = output<string>();
  readonly cerrado = output<void>();

  protected readonly esCarpeta = computed(() => this.carpeta() !== null);
  protected readonly nombre = computed(() => this.carpeta()?.nombre ?? this.archivo()?.nombre ?? '');
  private readonly ubicacionActual = computed(() => this.carpeta()?.carpetaPadreId ?? this.archivo()?.carpetaId ?? null);

  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly guardando = signal(false);
  protected readonly errorGeneral = signal<string | null>(null);

  private readonly nodos = signal<NodoArbol[]>([]);
  protected readonly expandidas = signal<ReadonlySet<string>>(new Set());
  // undefined = aun no eligio - null = la raiz - string = id de una carpeta
  protected readonly destino = signal<string | null | undefined>(undefined);

  private readonly hijosPorPadre = computed(() => {
    const mapa = new Map<string | null, NodoArbol[]>();
    for (const nodo of this.nodos()) {
      const hermanos = mapa.get(nodo.carpetaPadreId) ?? [];
      hermanos.push(nodo);
      mapa.set(nodo.carpetaPadreId, hermanos);
    }
    return mapa;
  });

  // Filas visibles según qué ramas están expandidas
  protected readonly filas = computed<FilaArbol[]>(() => {
    const hijos = this.hijosPorPadre();
    const expandidas = this.expandidas();
    const idCarpetaMovida = this.carpeta()?.id ?? null;
    const actual = this.ubicacionActual();
    const filas: FilaArbol[] = [];

    filas.push({
      id: null,
      nombre: 'Mis archivos',
      nivel: 0,
      expandible: false,
      expandida: true,
      deshabilitada: actual === null,
      motivo: actual === null ? 'Ubicación actual' : null,
    });

    // Añade los los hijos en orden jerarquico solo si la carpeta padre esta expandida
    // Deshabilita la ubicacion donde ya se encuentra el elemento
    function recorrer(padreId: string | null, nivel: number): void {
      for (const nodo of hijos.get(padreId) ?? []) {
        const esLaMovida = nodo.id === idCarpetaMovida;
        const tieneHijos = !esLaMovida && (hijos.get(nodo.id)?.length ?? 0) > 0;
        const expandida = tieneHijos && expandidas.has(nodo.id);
        const esUbicacionActual = nodo.id === actual;

        filas.push({
          id: nodo.id,
          nombre: nodo.nombre,
          nivel,
          expandible: tieneHijos,
          expandida,
          deshabilitada: esLaMovida || esUbicacionActual,
          motivo: esLaMovida ? 'La que estás moviendo' : esUbicacionActual ? 'Ubicación actual' : null,
        });
        // La carpeta que se mueve NO se despliega: sus subcarpetas no son destinos válidos (formarian un ciclo)
        if (expandida) recorrer(nodo.id, nivel + 1);
      }
    };
    recorrer(null, 1);
    return filas;
  });

  constructor() {
    this.carpetasApi.arbol().subscribe({
      next: (nodos) => {
        this.nodos.set(nodos);
        this.expandirHastaUbicacionActual(nodos);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.errorCarga.set(mensajeDeError(error, 'No se pudieron cargar las carpetas.'));
        this.cargando.set(false);
      },
    });
  }

  // Abre las ramas que llevan a la ubicación actual, para que el usuario se oriente de un vistazo
  private expandirHastaUbicacionActual(nodos: NodoArbol[]): void {
    const porId = new Map<string, NodoArbol>();
    for (const n of nodos) {
      porId.set(n.id, n);
    }
    const abiertas = new Set<string>();
    let actual = this.ubicacionActual();
    while (actual) {
      abiertas.add(actual);
      actual = porId.get(actual)?.carpetaPadreId ?? null;
    }
    this.expandidas.set(abiertas);
  }

  protected alternarExpansion(id: string): void {
    const siguiente = new Set(this.expandidas());
    if (!siguiente.delete(id)) siguiente.add(id);
    this.expandidas.set(siguiente);
  }

  protected mover(): void {
    const destino = this.destino();
    if (destino === undefined) return;

    this.guardando.set(true);
    this.errorGeneral.set(null);

    const carpeta = this.carpeta();
    const archivo = this.archivo();
    const peticion: Observable<Carpeta | Archivo> = carpeta
      ? this.carpetasApi.mover(carpeta.id, destino)
      : this.archivosApi.mover(archivo!.id, destino);

    peticion.subscribe({
      next: () => {
        let nombreDestino = 'la carpeta elegida';
        if (destino === null) {
          nombreDestino = 'Mis archivos';
        } else {
          for (const n of this.nodos()) {
            if (n.id === destino) {
              nombreDestino = n.nombre;
              break;
            }
          }
        }
        this.movido.emit(nombreDestino);
      },
      error: (error: unknown) => {
        this.guardando.set(false);
        this.errorGeneral.set(mensajeDeError(error, 'No se pudo mover. Inténtalo de nuevo.'));
      },
    });
  }

}
