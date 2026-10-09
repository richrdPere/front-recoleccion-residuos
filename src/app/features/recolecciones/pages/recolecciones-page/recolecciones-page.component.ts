import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

// Interfaces
import { PuntoRecorridoRecoleccion } from '../../interfaces';

// Componentes
import { RecoleccionPuntosComponent } from '../components/recoleccion-puntos/recoleccion-puntos.component';
import { RecoleccionProgresoComponent } from '../components/recoleccion-progreso/recoleccion-progreso.component';
import { RecoleccionCapacidadComponent } from '../components/recoleccion-capacidad/recoleccion-capacidad.component';
import { RecoleccionEvidenciaComponent } from '../components/recoleccion-evidencia/recoleccion-evidencia.component';
import { RecoleccionViewComponent } from '../components/recoleccion-view/recoleccion-view.component';
import { RecoleccionAnularComponent } from '../components/recoleccion-anular/recoleccion-anular.component';

@Component({
  selector: 'app-recolecciones-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RecoleccionPuntosComponent,
    RecoleccionProgresoComponent,
    RecoleccionCapacidadComponent,
    RecoleccionEvidenciaComponent,
    RecoleccionViewComponent,
    RecoleccionAnularComponent,
  ],
  templateUrl: './recolecciones-page.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecoleccionesPageComponent {

  // ================================
  // Selección del recorrido
  // ================================
  recorridoBusqueda: number | null = null;
  recorrido_id: number | null = null;

  errorSeleccion: string | null = null;

  // Actualización de puntos, progreso y capacidad
  actualizacionRecolecciones = 0;

  // ================================
  // Evidencias
  // ================================
  recoleccion_id: number | null = null;
  actualizacionEvidencias = 0;

  // ================================
  // Modal de detalle
  // ================================
  mostrarModalView = false;
  recoleccionViewId: number | null = null;
  actualizacionDetalle = 0;

  // ================================
  // Modal de anulación
  // ================================
  mostrarModalAnular = false;
  recoleccionAnularId: number | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
  ) { }

  // ================================
  // Methods
  // ================================
  seleccionarRecorrido(): void {
    this.errorSeleccion = null;

    const id = this.recorridoBusqueda;

    if (!this.esIdentificadorValido(id)) {
      this.errorSeleccion =
        'Ingresa un identificador de recorrido válido.';
      this.cdr.markForCheck();
      return;
    }

    if (this.recorrido_id === id) {
      this.actualizarRecolecciones();
      return;
    }

    this.limpiarSeleccionRecoleccion();
    this.recorrido_id = id;

    // El cambio de ID activa las consultas de los hijos.
    this.cdr.markForCheck();
  }

  actualizarRecolecciones(): void {
    if (this.recorrido_id === null) {
      return;
    }

    this.actualizacionRecolecciones++;
    this.actualizacionEvidencias++;
    this.actualizacionDetalle++;

    this.cdr.markForCheck();
  }

  limpiarRecorrido(): void {
    this.recorridoBusqueda = null;
    this.recorrido_id = null;
    this.errorSeleccion = null;

    this.limpiarSeleccionRecoleccion();
    this.cdr.markForCheck();
  }

  abrirEvidenciasRecoleccion(idRecoleccion: number): void {
    if (
      this.recorrido_id === null ||
      !this.esIdentificadorValido(idRecoleccion)
    ) {
      return;
    }

    // Cierra el detalle para mostrar la sección de evidencias.
    this.cerrarModalView();

    if (this.recoleccion_id === idRecoleccion) {
      this.actualizacionEvidencias++;
    } else {
      this.recoleccion_id = idRecoleccion;
    }

    this.cdr.markForCheck();
  }

  cerrarEvidencias(): void {
    this.recoleccion_id = null;
    this.cdr.markForCheck();
  }

  onEvidenciasActualizadas(idRecoleccion: number): void {
    // El listado de evidencias ya se actualiza internamente.
    // Refrescamos el detalle si corresponde a esa recolección.
    if (
      this.mostrarModalView &&
      this.recoleccionViewId === idRecoleccion
    ) {
      this.actualizacionDetalle++;
    }

    this.cdr.markForCheck();
  }

  onRecoleccionAnulada(
    recoleccion: PuntoRecorridoRecoleccion,
  ): void {
    if (
      this.recoleccionAnularId === recoleccion.id_recoleccion
    ) {
      this.cerrarModalAnular();
    }

    // Una respuesta de otro recorrido no refresca la selección actual.
    if (recoleccion.id_recorrido !== this.recorrido_id) {
      return;
    }

    this.actualizacionRecolecciones++;

    if (this.recoleccion_id === recoleccion.id_recoleccion) {
      this.actualizacionEvidencias++;
    }

    if (
      this.mostrarModalView &&
      this.recoleccionViewId === recoleccion.id_recoleccion
    ) {
      this.actualizacionDetalle++;
    }

    this.cdr.markForCheck();
  }

  // ================================
  // Helpers methods
  // ================================
  private esIdentificadorValido(
    id: number | null,
  ): id is number {
    return typeof id === 'number' &&
      Number.isSafeInteger(id) &&
      id > 0;
  }

  private limpiarSeleccionRecoleccion(): void {
    this.recoleccion_id = null;

    this.mostrarModalView = false;
    this.recoleccionViewId = null;

    this.mostrarModalAnular = false;
    this.recoleccionAnularId = null;
  }

  // ================================
  // Modales methods
  // ================================
  abrirDetalleRecoleccion(idRecoleccion: number): void {
    if (
      this.recorrido_id === null ||
      !this.esIdentificadorValido(idRecoleccion)
    ) {
      return;
    }

    this.cerrarModalAnular();

    this.recoleccionViewId = idRecoleccion;
    this.mostrarModalView = true;

    this.cdr.markForCheck();
  }

  cerrarModalView(): void {
    this.mostrarModalView = false;
    this.recoleccionViewId = null;

    this.cdr.markForCheck();
  }

  abrirModalAnular(
    recoleccion: PuntoRecorridoRecoleccion,
  ): void {
    if (
      recoleccion.id_recorrido !== this.recorrido_id ||
      !this.esIdentificadorValido(recoleccion.id_recoleccion) ||
      recoleccion.fecha_anulacion !== null
    ) {
      return;
    }

    this.cerrarModalView();

    this.recoleccionAnularId = recoleccion.id_recoleccion;
    this.mostrarModalAnular = true;

    this.cdr.markForCheck();
  }

  cerrarModalAnular(): void {
    this.mostrarModalAnular = false;
    this.recoleccionAnularId = null;

    this.cdr.markForCheck();
  }
}
