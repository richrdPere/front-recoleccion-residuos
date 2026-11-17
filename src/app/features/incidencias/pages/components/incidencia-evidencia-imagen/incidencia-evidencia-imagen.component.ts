import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  inject,
  signal,
} from '@angular/core';

import { Subscription } from 'rxjs';

import {
  IncidenciasService,
} from 'src/app/features/incidencias/services/incidencias.service';

import {
  IncidenciaId,
} from 'src/app/features/incidencias/interfaces';

@Component({
  selector: 'incidencia-evidencia-imagen',
  standalone: true,
  templateUrl: './incidencia-evidencia-imagen.component.html',
})
export class IncidenciaEvidenciaImagenComponent
  implements OnChanges, OnDestroy {

  @Input({ required: true })
  idIncidencia!: IncidenciaId;

  @Input({ required: true })
  idArchivo!: IncidenciaId;

  @Input()
  descripcion = 'Evidencia de la incidencia';

  private readonly service =
    inject(IncidenciasService);

  private consulta?: Subscription;

  readonly imagenUrl =
    signal<string | null>(null);

  readonly cargando = signal(false);

  readonly errorMensaje = signal('');

  ngOnChanges(): void {
    this.consulta?.unsubscribe();
    this.limpiarImagen();

    this.errorMensaje.set('');
    this.cargando.set(true);

    this.consulta = this.service
      .getArchivoContenido(
        this.idIncidencia,
        this.idArchivo,
      )
      .subscribe({
        next: blob => {
          this.cargando.set(false);

          const permitido = [
            'image/jpeg',
            'image/png',
            'image/webp',
          ].includes(blob.type);

          if (!permitido) {
            this.errorMensaje.set(
              'Este archivo no es una imagen compatible.',
            );

            return;
          }

          this.imagenUrl.set(
            URL.createObjectURL(blob),
          );
        },

        error: () => {
          this.cargando.set(false);

          this.errorMensaje.set(
            'No se pudo cargar la evidencia. ' +
            'Comprueba tu sesión y tus permisos.',
          );
        },
      });
  }

  private limpiarImagen(): void {
    const url = this.imagenUrl();

    if (url) {
      URL.revokeObjectURL(url);
    }

    this.imagenUrl.set(null);
  }

  ngOnDestroy(): void {
    this.consulta?.unsubscribe();
    this.limpiarImagen();
  }
}
