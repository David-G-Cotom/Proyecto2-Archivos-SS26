import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ElementoMenu, menuParaRol } from '../../core/navegacion';
import { ChangePasswordComponent } from '../../pages/change-password/change-password.component';

@Component({
  selector: 'app-main-layout',
  imports: [RouterLink, RouterOutlet, ChangePasswordComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
})
export class MainLayoutComponent implements OnInit {

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  protected tituloPagina = '';

  protected readonly usuario = this.auth.usuario;

  protected readonly menuAbierto = signal(false);
  protected readonly menuUsuarioAbierto = signal(false);
  protected readonly changingPassword = signal(false);

  // Grupos del menú ya filtrados por el rol del usuario
  protected readonly gruposMenu = computed(() => {
    const rol = this.usuario()?.rol;
    const menuEstructura = [
      { titulo: 'Documentos', elementos: menuParaRol(rol) },
      { titulo: 'Administración', elementos: menuParaRol(rol) },
    ];
    const resultado: { titulo: string, elementos: ElementoMenu[] }[] = [];
    for (const element of menuEstructura) {
      if (element.elementos.length > 0) {
        resultado.push(element);
      }
    }
    return resultado;
  });

  protected readonly etiquetaRol = computed(() =>
    this.usuario()?.rol === 'administrador' ? 'Administrador' : 'Usuario',
  );

  constructor() {
    this.router.events.pipe(
      filter((evento) => evento instanceof NavigationEnd),
      takeUntilDestroyed(),
    ).subscribe(() => {
      this.cerrarMenus();
      this.tituloPagina = this.leerTituloRuta();
    });
  }

  ngOnInit() {
    this.tituloPagina = this.leerTituloRuta();
  }

  protected alternarMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  protected alternarMenuUsuario(): void {
    this.menuUsuarioAbierto.update((abierto) => !abierto);
  }

  protected cerrarMenus(): void {
    this.menuAbierto.set(false);
    this.menuUsuarioAbierto.set(false);
  }

  protected abrirChangePassword(): void {
    this.cerrarMenus();
    this.changingPassword.set(true);
  }

  protected cerrarSesion(): void {
    this.cerrarMenus();
    this.auth.cerrarSesion();
  }

  private leerTituloRuta(): string {
    let ruta = this.activatedRoute;
    while (ruta.firstChild) ruta = ruta.firstChild;
    return ruta.snapshot.title ?? '';
  }

}
