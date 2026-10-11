import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { DatosEdicionUsuario, DatosNuevoUsuario, FiltrosUsuarios, PaginadaResponse, UsuarioAdministrado } from '../models/usuario.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UsuariosService {

  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/usuarios`;

  listar(filtros: FiltrosUsuarios): Observable<PaginadaResponse<UsuarioAdministrado>> {
    let params = new HttpParams().set('pagina', filtros.pagina).set('limite', filtros.limite);
    if (filtros.busqueda) params = params.set('busqueda', filtros.busqueda);
    if (filtros.rol) params = params.set('rol', filtros.rol);
    if (filtros.activo !== null) params = params.set('activo', String(filtros.activo));
    return this.http.get<PaginadaResponse<UsuarioAdministrado>>(this.url, { params });
  }

  crear(datos: DatosNuevoUsuario): Observable<UsuarioAdministrado> {
    return this.http.post<UsuarioAdministrado>(this.url, datos);
  }

  actualizar(id: string, datos: DatosEdicionUsuario): Observable<UsuarioAdministrado> {
    return this.http.patch<UsuarioAdministrado>(`${this.url}/${id}`, datos);
  }

  cambiarEstado(id: string, activo: boolean): Observable<UsuarioAdministrado> {
    return this.http.patch<UsuarioAdministrado>(`${this.url}/${id}/estado`, { activo });
  }

  restablecerPassword(id: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.url}/${id}/restablecer-password`, { newPassword });
  }

}
