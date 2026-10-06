import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize, Subscription } from 'rxjs';
import Swal from 'sweetalert2';

// Services
import { MantenimientoService } from '../../services/mantenimiento.service';

// Interfaces
import { MantenimientoDetalleData, MantenimientoPaginadoItem } from '../../interfaces';

@Component({
  selector: 'mantenimiento-view',
  imports: [CommonModule],
  templateUrl: './mantenimiento-view.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MantenimientoViewComponent implements OnChanges, OnDestroy {

  // INPUTS / OUTPUTS
  @Input() mostrarModal = false;
  @Input() mantenimiento_id: number | null = null;

  @Output() modalCerrado = new EventEmitter<void>();


  // ESTADO
  mantenimiento: MantenimientoDetalleData | null = null;

  loading = false;
  errorCarga: string | null = null;

  modalWidthClass = 'max-w-4xl';

  private cargaSubscription?: Subscription;
  private destruido = false;

  constructor(
    private readonly mantenimientoService: MantenimientoService,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.mostrarModal) {
      this.cancelarCarga();
      this.limpiarDatos();
      return;
    }

    // También carga cuando se reabre el modal con el mismo ID.
    if (changes['mantenimiento_id'] || changes['mostrarModal']) {
      this.cargarDatosUsuario();
    }
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.cancelarCarga();
  }

  // CARGAR INFORMACIÓN
  cargarDatosUsuario(): void {
    // Cancelar primero evita que una respuesta anterior
    // reemplace los datos del vehículo seleccionado.
    this.cancelarCarga();
    this.limpiarDatos();

    if (!this.mostrarModal) {
      return;
    }

    const idMantenimiento = this.mantenimiento_id;

    if (
      idMantenimiento === null ||
      !Number.isInteger(idMantenimiento) ||
      idMantenimiento <= 0
    ) {
      this.errorCarga = 'Selecciona un mantenimiento válido.';
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    this.cargaSubscription = this.mantenimientoService.getMantenimientoById(idMantenimiento)
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
              'No se pudo obtener la información del usuario.',
            );
            return;
          }

          this.mantenimiento = response.data;
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
    this.mantenimiento = null;
    this.errorCarga = mensaje;
    this.cdr.markForCheck();

    void Swal.fire({
      icon: 'error',
      title: 'No se pudo obtener el mantenimiento',
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

    const mensaje =
      detalle?.error?.message ??
      detalle?.message;

    return typeof mensaje === 'string' && mensaje.trim()
      ? mensaje
      : 'Ocurrió un error al cargar la información del vehículo.';
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
    this.mantenimiento = null;
    this.errorCarga = null;
  }
}
