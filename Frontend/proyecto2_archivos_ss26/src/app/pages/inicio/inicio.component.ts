import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ElementoMenu, menuParaRol } from '../../core/navegacion';

@Component({
  selector: 'app-inicio',
  imports: [RouterLink],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css',
})
export class InicioComponent {

  private readonly usuario = inject(AuthService).usuario;

  protected readonly primerNombre = computed(() => this.usuario()?.nombreCompleto.split(' ')[0] ?? '');

  protected readonly secciones = computed(() => {
    const seccionesRol = menuParaRol(this.usuario()?.rol);
    const resultado: ElementoMenu[] = [];
    for (const element of seccionesRol) {
      if (element.ruta !== '/inicio') {
        resultado.push(element);
      }
    }
    return resultado;
  }
  );

}
