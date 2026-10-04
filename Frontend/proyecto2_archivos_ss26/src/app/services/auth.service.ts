import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { CredencialesLogin, LoginResponse, Rol, Sesion, Usuario } from '../models/usuario.model';
import { tokenExpirado } from '../core/jwt';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly sesion = signal<Sesion | null>(this.leerSesionGuardada());

  public readonly usuario = computed<Usuario | null>(() => this.sesion()?.usuario ?? null);
  public readonly token = computed<string | null>(() => this.sesion()?.token ?? null);
  public readonly esAdministrador = computed<boolean>(() => this.usuario()?.rol === 'administrador');

  public iniciarSesion(credenciales: CredencialesLogin): Observable<Usuario> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, credenciales).pipe(
      tap((respuesta) => this.guardarSesion({ token: respuesta.token, usuario: respuesta.usuario })),
      map((respuesta) => respuesta.usuario),
    );
  }

  public changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/auth/change-password`, { currentPassword, newPassword });
  }

  public haySesionValida(): boolean {
    const token = this.token();
    if (!token) return false;
    if (tokenExpirado(token)) {
      this.limpiarSesion();
      return false;
    }
    return true;
  }

  public tieneRol(rolesPermitidos: Rol[]): boolean {
    const rol = this.usuario()?.rol;
    return rol !== undefined && rolesPermitidos.includes(rol);
  }

  public cerrarSesion(retorno?: string): void {
    this.limpiarSesion();
    this.router.navigate(['/login'], retorno ? { queryParams: { retorno } } : {});
  }

  private guardarSesion(sesion: Sesion): void {
    this.sesion.set(sesion);
    localStorage.setItem(environment.sessionKey, JSON.stringify(sesion));
  }

  private limpiarSesion(): void {
    this.sesion.set(null);
    localStorage.removeItem(environment.sessionKey);
  }

  private leerSesionGuardada(): Sesion | null {
    try {
      const texto = localStorage.getItem(environment.sessionKey);
      if (!texto) return null;
      const sesion = JSON.parse(texto) as Partial<Sesion>;
      return sesion.token && sesion.usuario ? (sesion as Sesion) : null;
    } catch {
      return null;
    }
  }

}
