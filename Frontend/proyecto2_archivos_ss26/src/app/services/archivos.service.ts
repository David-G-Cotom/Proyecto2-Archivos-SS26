import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { Observable } from 'rxjs';
import { Archivo, DetalleArchivo, RespuestaSubida } from '../models/archivo.model';

@Injectable({
  providedIn: 'root',
})
export class ArchivosService {

  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/archivos`;

  /**
   * La URL se arma a mano con encodeURIComponent para asegurar que caracteres especiales o espacios no rompan la URL
   * La cabecera indica que el archivo se envia al servidor sin procesar (flujo de bytes)
   */
  subir(archivo: File, carpetaId: string | null, reemplazar: boolean): Observable<RespuestaSubida> {
    const consulta = [`nombre=${encodeURIComponent(archivo.name)}`];
    if (carpetaId) consulta.push(`carpetaId=${encodeURIComponent(carpetaId)}`);
    if (reemplazar) consulta.push('reemplazar=true');

    return this.http.post<RespuestaSubida>(`${this.url}?${consulta.join('&')}`, archivo, {
      headers: { 'Content-Type': 'application/octet-stream' },
    });
  }

  detalle(id: string): Observable<DetalleArchivo> {
    return this.http.get<DetalleArchivo>(`${this.url}/${id}`);
  }

  texto(id: string): Observable<string> {
    return this.http.get(`${this.url}/${id}/contenido`, { responseType: 'text' });
  }

  descargar(id: string): Observable<Blob> {
    return this.http.get(`${this.url}/${id}/contenido`, { params: { descargar: 'true' }, responseType: 'blob' });
  }

  renombrar(id: string, nombre: string): Observable<Archivo> {
    return this.http.patch<Archivo>(`${this.url}/${id}`, { nombre });
  }

  mover(id: string, destinoId: string | null): Observable<Archivo> {
    return this.http.patch<Archivo>(`${this.url}/${id}/mover`, { destinoId });
  }

}
