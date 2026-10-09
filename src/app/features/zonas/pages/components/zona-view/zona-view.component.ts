import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize, Subscription } from 'rxjs';
import Swal from 'sweetalert2';

// Services
import { ZonasServices } from '../../../services/zonas.service';

// Interfaces
import { ZonaDetalleData } from '../../../interfaces';

// Componentes
import { MapaBaseComponent } from 'src/app/shared/components/mapa-base/mapa-base.component';

@Component({
  selector: 'zona-view',
  imports: [CommonModule, MapaBaseComponent],
  templateUrl: './zona-view.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZonaViewComponent implements OnChanges, OnDestroy {

  // INPUTS / OUTPUTS
  @Input() mostrarModal = false;
  @Input() zona_id: number | null = null;

  @Output() modalCerrado = new EventEmitter<void>();


  // ESTADO
  // zona: ZonaData | null = null;
  zona: ZonaDetalleData | null = null;

  loading = false;
  errorCarga: string | null = null;

  modalWidthClass = 'max-w-4xl';

  private cargaSubscription?: Subscription;
  private destruido = false;

  constructor(
    private readonly zonaService: ZonasServices,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.mostrarModal) {
      this.cancelarCarga();
      this.limpiarDatos();
      return;
    }

    // También carga cuando se reabre el modal con el mismo ID.
    if (changes['zona_id'] || changes['mostrarModal']) {
      this.cargarDatosZona();
    }
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.cancelarCarga();
  }

  // CARGAR INFORMACIÓN
  cargarDatosZona(): void {
    // Cancelar primero evita que una respuesta anterior
    // reemplace los datos del vehículo seleccionado.
    this.cancelarCarga();
    this.limpiarDatos();

    if (!this.mostrarModal) {
      return;
    }

    const idZona = this.zona_id;

    if (
      idZona === null ||
      !Number.isInteger(idZona) ||
      idZona <= 0
    ) {
      this.errorCarga = 'Selecciona una zona válida.';
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    this.cargaSubscription = this.zonaService.getZonaById(idZona)
      .pipe(
        finalize(() => {
          this.loading = false;

          if (!this.destruido) {
            this.cdr.markForCheck();
          }
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response.success || !response.data) {
            this.mostrarError(
              response.message ||
              'No se pudo obtener la información de la zona.',
            );
            return;
          }

          this.zona = response.data;
          this.errorCarga = null;
          this.cdr.markForCheck();
        },

        error: (error: unknown) => {
          this.mostrarError(this.obtenerMensajeError(error));
        },
      });
  }

  // ============================================================
  // MANEJO DE ERRORES
  // ============================================================
  private mostrarError(mensaje: string): void {
    this.zona = null;
    this.errorCarga = mensaje;
    this.cdr.markForCheck();

    void Swal.fire({
      icon: 'error',
      title: 'No se pudo obtener la zona',
      text: mensaje,
    });
  }

  private obtenerMensajeError(error: unknown): string {
    // Admite tanto el error normalizado por HttpServiceHelper
    // como un HttpErrorResponse con error.message.
    const detalle = error as {
      message?: unknown;
      error?: {
        message?: unknown;
      };
    } | null;

    const mensaje = detalle?.error?.message ?? detalle?.message;

    // Mensaje por defecto de obtenerMensajeError():
    return typeof mensaje === 'string' && mensaje.trim()
      ? mensaje
      : 'Ocurrió un error al cargar la información de la zona.';
  }

  // ============================================================
  // MODAL
  // ============================================================
  setModalWidth(
    size: 'sm' | 'md' | 'lg' | 'xl' | 'full',
  ): void {
    const clases = {
      sm: 'max-w-md',
      md: 'max-w-xl',
      lg: 'max-w-4xl',
      xl: 'max-w-6xl',
      full: 'max-w-full w-[95vw]',
    };

    this.modalWidthClass = clases[size];
    this.cdr.markForCheck();
  }

  cerrarModal(): void {
    this.cancelarCarga();
    this.limpiarDatos();

    // El padre controla mostrarModal.
    this.modalCerrado.emit();
    this.cdr.markForCheck();
  }

  // ============================================================
  // LIMPIEZA
  // ============================================================
  private cancelarCarga(): void {
    this.cargaSubscription?.unsubscribe();
    this.cargaSubscription = undefined;
    this.loading = false;
  }

  private limpiarDatos(): void {
    this.zona = null;
    this.errorCarga = null;
  }
}
