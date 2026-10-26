import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Carpeta, ContenidoCarpeta, NodoArbol } from '../models/carpeta.model';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class CarpetasService {

  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/carpetas`;

  contenido(carpetaId: string | null): Observable<ContenidoCarpeta> {
    let params = new HttpParams();
    if (carpetaId) params = params.set('carpetaId', carpetaId);
    return this.http.get<ContenidoCarpeta>(`${this.url}/contenido`, { params });
  }

  arbol(): Observable<NodoArbol[]> {
    return this.http.get<NodoArbol[]>(`${this.url}/arbol`);
  }

  crear(nombre: string, carpetaPadreId: string | null): Observable<Carpeta> {
    return this.http.post<Carpeta>(this.url, { nombre, carpetaPadreId });
  }

  renombrar(id: string, nombre: string): Observable<Carpeta> {
    return this.http.patch<Carpeta>(`${this.url}/${id}`, { nombre });
  }

  mover(id: string, destinoId: string | null): Observable<Carpeta> {
    return this.http.patch<Carpeta>(`${this.url}/${id}/mover`, { destinoId });
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

}
