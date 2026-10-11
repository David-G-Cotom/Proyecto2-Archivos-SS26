import { Component, DestroyRef, inject, signal } from '@angular/core';
import { formatearBytes } from '../../core/formato';
import { FiltrosUsuarios, Paginacion, Rol, UsuarioAdministrado } from '../../models/usuario.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, EMPTY, of, Subject, switchMap, tap } from 'rxjs';
import { mensajeDeError } from '../../core/errores-api';
import { NotificacionService } from '../../services/notificacion.service';
import { UsuariosService } from '../../services/usuarios.service';
import { AuthService } from '../../services/auth.service';
import { DatePipe } from '@angular/common';
import { DialogoComponent } from '../../shared/components/dialogo/dialogo.component';
import { RestablecerPasswordComponent } from '../restablecer-password/restablecer-password.component';
import { FormularioUsuarioComponent } from '../formulario-usuario/formulario-usuario.component';

const LIMITE_POR_PAGINA = 10;

@Component({
  selector: 'app-usuarios',
  imports: [
    DatePipe,
    DialogoComponent,
    RestablecerPasswordComponent,
    FormularioUsuarioComponent],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css',
})
export class UsuariosComponent {

  private readonly servicio = inject(UsuariosService);
  private readonly avisos = inject(NotificacionService);
  private readonly usuarioAutenticado = inject(AuthService).usuario;
  private readonly destruido = inject(DestroyRef);

  // Datos de la tabla
  protected readonly usuarios = signal<UsuarioAdministrado[]>([]);
  protected readonly paginacion = signal<Paginacion>({ pagina: 1, limite: LIMITE_POR_PAGINA, total: 0, totalPaginas: 1 });
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<string | null>(null);

  // Filtros
  protected readonly busqueda = signal('');
  protected readonly rol = signal<Rol | ''>('');
  protected readonly activo = signal<boolean | null>(null);
  protected readonly pagina = signal(1);

  // Dialogos
  protected readonly creando = signal(false);
  protected readonly usuarioEditando = signal<UsuarioAdministrado | null>(null);
  protected readonly usuarioPassword = signal<UsuarioAdministrado | null>(null);
  protected readonly usuarioEstado = signal<UsuarioAdministrado | null>(null);
  protected readonly cambiandoEstado = signal(false);

  /**
   * Cada vez que se pide cargar, switchMap CANCELA la petición anterior que siga en curso.
   * Así, nunca se muestra el resultado de una búsqueda vieja que llegó tarde y pisó a la más reciente.
   */
  private readonly cargar$ = new Subject<void>();
  private readonly busqueda$ = new Subject<string>();

  constructor() {
    this.cargar$.pipe(
      tap(() => {
        this.cargando.set(true);
        this.errorCarga.set(null);
      }),
      switchMap(() =>
        this.servicio.listar(this.filtrosActuales()).pipe(
          catchError((error: unknown) => {
            this.errorCarga.set(mensajeDeError(error, 'No se pudo cargar la lista de usuarios.'));
            return of(null);
          }),
        ),
      ),
      takeUntilDestroyed(this.destruido),
    ).subscribe((respuesta) => {
      this.cargando.set(false);
      if (respuesta) {
        this.usuarios.set(respuesta.datos);
        this.paginacion.set(respuesta.paginacion);
      }
    });

    // Búsqueda con retardo: espera 300 ms sin teclear antes de consultar al servidor
    this.busqueda$.pipe(
      debounceTime(300),
      takeUntilDestroyed(this.destruido)
    ).subscribe((texto) => {
      this.busqueda.set(texto);
      this.pagina.set(1);
      this.recargar();
    });

    this.recargar();
  }

  protected recargar(): void {
    this.cargar$.next();
  }

  private filtrosActuales(): FiltrosUsuarios {
    return {
      busqueda: this.busqueda(),
      rol: this.rol(),
      activo: this.activo(),
      pagina: this.pagina(),
      limite: LIMITE_POR_PAGINA,
    };
  }

  // ----- Eventos de filtros -----
  protected alBuscar(evento: Event): void {
    this.busqueda$.next((evento.target as HTMLInputElement).value.trim());
  }

  protected alCambiarRol(evento: Event): void {
    this.rol.set((evento.target as HTMLSelectElement).value as Rol | '');
    this.pagina.set(1);
    this.recargar();
  }

  protected alCambiarEstadoFiltro(evento: Event): void {
    const valor = (evento.target as HTMLSelectElement).value;
    this.activo.set(valor === '' ? null : valor === 'true');
    this.pagina.set(1);
    this.recargar();
  }

  protected irAPagina(numero: number): void {
    if (numero < 1 || numero > this.paginacion().totalPaginas) return;
    this.pagina.set(numero);
    this.recargar();
  }

  protected hayFiltros(): boolean {
    return this.busqueda() !== '' || this.rol() !== '' || this.activo() !== null;
  }

  protected limpiarFiltros(): void {
    this.busqueda.set('');
    this.rol.set('');
    this.activo.set(null);
    this.pagina.set(1);
    this.recargar();
  }

  // ----- Acciones sobre usuarios -----
  protected alGuardarUsuario(usuario: UsuarioAdministrado, eraEdicion: boolean): void {
    this.creando.set(false);
    this.usuarioEditando.set(null);
    this.avisos.exito(
      eraEdicion ? 'Los cambios se guardaron.' : `Se creó la cuenta de ${usuario.nombreCompleto}.`,
      eraEdicion ? 'Usuario actualizado' : 'Usuario creado',
    );
    this.recargar();
  }

  protected alRestablecerPassword(usuario: UsuarioAdministrado): void {
    this.usuarioPassword.set(null);
    this.avisos.exito(`Se definió una nueva contraseña para ${usuario.nombreCompleto}.`, 'Contraseña restablecida');
  }

  protected confirmarCambioEstado(): void {
    const usuario = this.usuarioEstado();
    if (!usuario) return;

    const activar = !usuario.activo;
    this.cambiandoEstado.set(true);

    this.servicio.cambiarEstado(usuario.id, activar).pipe(
      // Los errores 409/403 llegan con un mensaje claro del servidor; se muestran como aviso
      catchError((error: unknown) => {
        this.avisos.error(mensajeDeError(error, 'No se pudo cambiar el estado.'), 'No se pudo completar');
        this.cambiandoEstado.set(false);
        this.usuarioEstado.set(null);
        return EMPTY;
      }),
      takeUntilDestroyed(this.destruido),
    ).subscribe(() => {
      this.cambiandoEstado.set(false);
      this.usuarioEstado.set(null);
      this.avisos.exito(
        activar ? `${usuario.nombreCompleto} ya puede iniciar sesión.` : `${usuario.nombreCompleto} ya no puede iniciar sesión.`,
        activar ? 'Cuenta activada' : 'Cuenta desactivada',
      );
      this.recargar();
    });
  }

  // ----- Auxiliares de presentación -----
  protected esPropio(usuario: UsuarioAdministrado): boolean {
    return usuario.id === this.usuarioAutenticado()?.id;
  }

  protected formatearEspacio(bytes: number): string {
    return formatearBytes(bytes);
  }

  protected rangoMostrado(): string {
    const { pagina, limite, total } = this.paginacion();
    if (total === 0) return '0 usuarios';
    const desde = (pagina - 1) * limite + 1;
    const hasta = Math.min(pagina * limite, total);
    return `Mostrando ${desde}–${hasta} de ${total}`;
  }

}
