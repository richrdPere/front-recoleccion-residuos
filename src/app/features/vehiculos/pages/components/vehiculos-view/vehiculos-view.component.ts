import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize, Subscription } from 'rxjs';
import Swal from 'sweetalert2';

// Services
import { VehiculosService } from 'src/app/features/vehiculos/services/vehiculos.service';

// Interfaces
import { VehiculoData } from '../../../models';

@Component({
  selector: 'vehiculos-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vehiculos-view.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehiculosViewComponent implements OnChanges, OnDestroy {

  // INPUTS / OUTPUTS
  @Input() mostrarModal = false;
  @Input() vehiculo_id: number | null = null;

  @Output() modalCerrado = new EventEmitter<void>();


  // ESTADO
  vehiculo: VehiculoData | null = null;

  loading = false;
  errorCarga: string | null = null;

  modalWidthClass = 'max-w-4xl';

  private cargaSubscription?: Subscription;
  private destruido = false;

  constructor(
    private readonly vehiculosService: VehiculosService,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.mostrarModal) {
      this.cancelarCarga();
      this.limpiarDatos();
      return;
    }

    // También carga cuando se reabre el modal con el mismo ID.
    if (changes['vehiculo_id'] || changes['mostrarModal']) {
      this.cargarDatosVehiculo();
    }
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.cancelarCarga();
  }


  // CARGAR INFORMACIÓN
  cargarDatosVehiculo(): void {
    // Cancelar primero evita que una respuesta anterior
    // reemplace los datos del vehículo seleccionado.
    this.cancelarCarga();
    this.limpiarDatos();

    if (!this.mostrarModal) {
      return;
    }

    const idVehiculo = this.vehiculo_id;

    if (
      idVehiculo === null ||
      !Number.isInteger(idVehiculo) ||
      idVehiculo <= 0
    ) {
      this.errorCarga = 'Selecciona un vehículo válido.';
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    this.cargaSubscription = this.vehiculosService.getVehiculoById(idVehiculo)
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
              'No se pudo obtener la información del vehículo.',
            );
            return;
          }

          this.vehiculo = response.data;
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
    this.vehiculo = null;
    this.errorCarga = mensaje;
    this.cdr.markForCheck();

    void Swal.fire({
      icon: 'error',
      title: 'No se pudo obtener el vehículo',
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
  // ETIQUETAS PARA LA VISTA
  // ============================================================
  obtenerTipoVehiculo(
    tipo: VehiculoData['tipo_vehiculo'],
  ): string {
    const etiquetas: Record<VehiculoData['tipo_vehiculo'], string> = {
      CAMION_COMPACTADOR: 'Camión compactador',
      CAMION_BARANDA: 'Camión baranda',
      CAMION_VOLQUETE: 'Camión volquete',
      MOTOFURGON: 'Motofurgón',
      OTRO: 'Otro',
    };

    return etiquetas[tipo] ?? 'No registrado';
  }

  obtenerEstadoOperativo(
    estado: VehiculoData['estado_operativo'],
  ): string {
    const etiquetas: Record<VehiculoData['estado_operativo'], string> = {
      DISPONIBLE: 'Disponible',
      EN_RUTA: 'En ruta',
      EN_MANTENIMIENTO: 'En mantenimiento',
      FUERA_DE_SERVICIO: 'Fuera de servicio',
    };

    return etiquetas[estado] ?? 'No registrado';
  }

  obtenerUnidadCapacidad(
    unidad: VehiculoData['unidad_capacidad'],
  ): string {
    const etiquetas: Record<VehiculoData['unidad_capacidad'], string> = {
      TONELADA: 't',
      KILOGRAMO: 'kg',
      METRO_CUBICO: 'm³',
    };

    return etiquetas[unidad] ?? '';
  }

  obtenerClaseEstadoOperativo(
    estado: VehiculoData['estado_operativo'],
  ): string {
    const clases: Record<VehiculoData['estado_operativo'], string> = {
      DISPONIBLE: 'badge-success',
      EN_RUTA: 'badge-info',
      EN_MANTENIMIENTO: 'badge-warning',
      FUERA_DE_SERVICIO: 'badge-error',
    };

    return clases[estado] ?? 'badge-neutral';
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
    this.vehiculo = null;
    this.errorCarga = null;
  }
}
