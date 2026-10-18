import { inject, Injectable, signal } from '@angular/core';
import { formatearBytes } from '../core/formato';
import { codigoDeError, mensajeDeError } from '../core/errores-api';
import { firstValueFrom } from 'rxjs';
import { ArchivosService } from './archivos.service';
import { EXTENSIONES_PERMITIDAS, SIZE_MAXIMO_ARCHIVO_BYTES } from '../core/configuracion';

export type EstadoSubida = 'espera' | 'subiendo' | 'subido' | 'reemplazado' | 'omitido' | 'error';
export type DecisionConflicto = 'reemplazar' | 'omitir';

export interface ElementoSubida {
  id: number;
  nombre: string;
  size: number;
  estado: EstadoSubida;
  detalle: string | null;
}

/** Un archivo con nombre repetido espera la decisión del usuario: se resuelve llamando a `resolver`. */
export interface ConflictoSubida {
  nombre: string;
  resolver: (decision: DecisionConflicto) => void;
}

export interface ResumenSubida {
  subidos: number;
  reemplazados: number;
  omitidos: number;
  conErrores: number;
}

@Injectable({
  providedIn: 'root',
})
export class SubidaArchivosService {

  private readonly api = inject(ArchivosService);

  readonly elementos = signal<ElementoSubida[]>([]);
  readonly conflicto = signal<ConflictoSubida | null>(null);
  readonly activa = signal(false);

  async subir(archivos: File[], carpetaId: string | null): Promise<ResumenSubida> {
    this.activa.set(true);
    const arrayElementos: ElementoSubida[] = [];
    for (let i = 0; i < archivos.length; i++) {
      arrayElementos.push({
        id: i,
        nombre: archivos[i].name,
        size: archivos[i].size,
        estado: 'espera',
        detalle: null,
      });
    }
    this.elementos.set(arrayElementos);

    const resumen: ResumenSubida = { subidos: 0, reemplazados: 0, omitidos: 0, conErrores: 0 };

    for (const [indice, archivo] of archivos.entries()) {
      const problema = this.validar(archivo);
      if (problema) {
        this.actualizar(indice, 'error', problema);
        resumen.conErrores++;
        continue;
      }

      this.actualizar(indice, 'subiendo');
      try {
        await firstValueFrom(this.api.subir(archivo, carpetaId, false));
        this.actualizar(indice, 'subido');
        resumen.subidos++;
      } catch (error) {
        if (codigoDeError(error) === 'ARCHIVO_EXISTENTE') {
          // Nombre repetido: se espera la decisión del usuario antes de seguir con el siguiente archivo
          const decision = await this.preguntar(archivo.name);
          if (decision === 'omitir') {
            this.actualizar(indice, 'omitido', 'Ya existe un archivo con ese nombre');
            resumen.omitidos++;
            continue;
          }
          try {
            await firstValueFrom(this.api.subir(archivo, carpetaId, true));
            this.actualizar(indice, 'reemplazado');
            resumen.reemplazados++;
          } catch (errorReemplazo) {
            this.actualizar(indice, 'error', mensajeDeError(errorReemplazo, 'No se pudo reemplazar el archivo.'));
            resumen.conErrores++;
          }
        } else {
          this.actualizar(indice, 'error', mensajeDeError(error, 'No se pudo subir el archivo.'));
          resumen.conErrores++;
        }
      }
    }

    this.activa.set(false);
    if (resumen.conErrores === 0 && resumen.omitidos === 0) {
      setTimeout(() => this.cerrarPanel(), 4000);
    }
    return resumen;
  }

  cerrarPanel(): void {
    if (!this.activa()) this.elementos.set([]);
  }

  private validar(archivo: File): string | null {
    const punto = archivo.name.lastIndexOf('.');
    const extension = punto > 0 ? archivo.name.slice(punto + 1).toLowerCase() : '';
    if (!(EXTENSIONES_PERMITIDAS as readonly string[]).includes(extension)) {
      return 'Solo se admiten archivos .txt y .md';
    }
    if (archivo.size > SIZE_MAXIMO_ARCHIVO_BYTES) {
      return `Supera el máximo de ${formatearBytes(SIZE_MAXIMO_ARCHIVO_BYTES)}`;
    }
    return null;
  }

  private actualizar(id: number, estado: EstadoSubida, detalle: string | null = null): void {
    this.elementos.update((lista) => {
      const nuevaLista: ElementoSubida[] = [];
      for (const element of lista) {
        if (element.id === id) {
          nuevaLista.push({
            id: element.id,
            nombre: element.nombre,
            size: element.size,
            estado: estado,
            detalle: detalle
          });
        } else {
          nuevaLista.push(element);
        }

      }
      return nuevaLista;
    });
  }

  /** Muestra el diálogo de conflicto y devuelve una promesa que se cumple cuando el usuario decide. */
  private preguntar(nombre: string): Promise<DecisionConflicto> {
    return new Promise((resolver) => {
      this.conflicto.set({
        nombre,
        resolver: (decision) => {
          this.conflicto.set(null);
          resolver(decision);
        },
      });
    });
  }

}
