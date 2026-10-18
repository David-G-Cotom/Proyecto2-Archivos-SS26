import { Component, computed, inject } from '@angular/core';
import { DialogoComponent } from '../../shared/components/dialogo/dialogo.component';
import { formatearBytes } from '../../core/formato';
import { EstadoSubida, SubidaArchivosService } from '../../services/subida-archivos.service';

@Component({
  selector: 'app-panel-subida',
  imports: [DialogoComponent],
  templateUrl: './panel-subida.component.html',
  styleUrl: './panel-subida.component.css',
})
export class PanelSubidaComponent {

  protected readonly subida = inject(SubidaArchivosService);

  protected readonly iconos: Record<EstadoSubida, string> = {
    espera: 'bi-clock',
    subiendo: 'bi-arrow-repeat',
    subido: 'bi-check-circle-fill',
    reemplazado: 'bi-check-circle-fill',
    omitido: 'bi-dash-circle',
    error: 'bi-x-circle-fill',
  };

  protected readonly etiquetas: Record<EstadoSubida, string> = {
    espera: 'En espera',
    subiendo: 'Subiendo...',
    subido: 'Subido',
    reemplazado: 'Contenido reemplazado',
    omitido: 'Omitido',
    error: 'Error',
  };

  protected readonly titulo = computed(() => {
    const lista = this.subida.elementos();
    let terminados = 0;
    for (const e of lista) {
      if (e.estado !== 'espera' && e.estado !== 'subiendo') {
        terminados++;
      }
    }
    return this.subida.activa()
      ? `Subiendo archivos (${terminados}/${lista.length})`
      : `Subida finalizada (${terminados}/${lista.length})`;
  });

  protected size(bytes: number): string {
    return formatearBytes(bytes);
  }

}
