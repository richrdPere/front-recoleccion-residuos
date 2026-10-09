import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { finalize, Subscription } from 'rxjs';

// Service
import { RutasServices } from
  'src/app/features/rutas/services/rutas.service';

// Interfaces
import { RutaDetalleData } from '../../../interfaces/rutas/update-ruta.interface';

interface CampoDetalle {
  clave: string;
  etiqueta: string;
  valor: string;
}

@Component({
  selector: 'rutas-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ruta-view.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RutasViewComponent implements OnChanges, OnDestroy {

  // ============================================================
  // INPUTS / OUTPUTS
  // ============================================================

  @Input() mostrarModal = false;
  @Input() ruta_id: number | null = null;

  @Output() modalCerrado = new EventEmitter<void>();

  // ============================================================
  // ESTADO
  // ============================================================

  ruta: RutaDetalleData | null = null;

  loading = false;
  errorCarga: string | null = null;

  modalWidthClass = 'max-w-6xl';

  camposZona: CampoDetalle[] = [];
  camposVersion: CampoDetalle[] = [];
  horariosDetalle: CampoDetalle[][] = [];

  private cargaSubscription?: Subscription;
  private destruido = false;

  constructor(
    private readonly rutasService: RutasServices,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  // ============================================================
  // CICLO DE VIDA
  // ============================================================

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.mostrarModal) {
      this.cancelarCarga();
      this.limpiarDatos();
      return;
    }

    if (changes['mostrarModal'] || changes['ruta_id']) {
      this.cargarDatosRuta();
    }
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.cancelarCarga();
  }

  // ============================================================
  // CARGAR DETALLE
  // ============================================================

  cargarDatosRuta(): void {
    this.cancelarCarga();
    this.limpiarDatos();

    if (!this.mostrarModal) {
      return;
    }

    const idRuta = this.ruta_id;

    if (
      idRuta === null ||
      !Number.isInteger(idRuta) ||
      idRuta <= 0
    ) {
      this.errorCarga = 'Selecciona una ruta válida.';
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    this.cargaSubscription = this.rutasService
      .getRutaById(idRuta)
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
            this.errorCarga =
              response.message ||
              'No se pudo obtener la información de la ruta.';

            this.cdr.markForCheck();
            return;
          }

          this.ruta = response.data;

          this.camposZona = this.obtenerCampos(
            this.ruta.zona,
          );

          this.camposVersion = this.obtenerCampos(
            this.ruta.version_vigente,
            ['puntos'],
          );

          this.horariosDetalle = (this.ruta.horarios ?? [])
            .map((horario) => this.obtenerCampos(horario));

          this.cdr.markForCheck();
        },

        error: (error: unknown) => {
          this.limpiarDatos();
          this.errorCarga = this.obtenerMensajeError(error);
          this.cdr.markForCheck();
        },
      });
  }

  // ============================================================
  // HELPERS DE PRESENTACIÓN
  // ============================================================

  getEstadoRuta(estado: string): {
    label: string;
    class: string;
  } {
    const estados: Record<string, { label: string; class: string }> = {
      BORRADOR: {
        label: 'Borrador',
        class: 'badge-warning',
      },
      ACTIVA: {
        label: 'Activa',
        class: 'badge-success',
      },
      INACTIVA: {
        label: 'Inactiva',
        class: 'badge-neutral',
      },
    };

    return estados[estado] ?? {
      label: estado,
      class: 'badge-neutral',
    };
  }

  obtenerTipoPunto(tipo: string): string {
    const etiquetas: Record<string, string> = {
      INICIO: 'Inicio',
      RECOLECCION: 'Recolección',
      DESCARGA: 'Descarga',
      FINAL: 'Final',
      REFERENCIA: 'Referencia',
    };

    return etiquetas[tipo] ?? tipo;
  }

  get colorRuta(): string {
    const color = this.ruta?.color;

    return color && /^#[0-9A-Fa-f]{6}$/.test(color)
      ? color
      : '#2563EB';
  }

  // ============================================================
  // CAMPOS DE ZONA, VERSIÓN Y HORARIOS
  // ============================================================

  private obtenerCampos(
    datos: unknown,
    excluir: string[] = [],
  ): CampoDetalle[] {
    if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
      return [];
    }

    return Object.entries(datos as Record<string, unknown>)
      .filter(([clave]) => !excluir.includes(clave))
      .map(([clave, valor]) => ({
        clave,
        etiqueta: this.obtenerEtiquetaCampo(clave),
        valor: this.formatearValor(valor),
      }));
  }

  private obtenerEtiquetaCampo(clave: string): string {
    const etiquetas: Record<string, string> = {
      id_zona: 'ID de la zona',
      id_ruta: 'ID de la ruta',
      id_ruta_version: 'ID de la versión',
      numero_version: 'Número de versión',
      distancia_estimada_km: 'Distancia estimada (km)',
      duracion_estimada_min: 'Duración estimada (min)',
      vigente: 'Versión vigente',
      estado: 'Registro activo',
      created_at: 'Fecha de creación',
      updated_at: 'Fecha de actualización',
      deleted_at: 'Fecha de eliminación',
    };

    if (etiquetas[clave]) {
      return etiquetas[clave];
    }

    const texto = clave.replace(/_/g, ' ');

    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  private formatearValor(valor: unknown): string {
    if (valor === null || valor === undefined || valor === '') {
      return 'No registrado';
    }

    if (typeof valor === 'boolean') {
      return valor ? 'Sí' : 'No';
    }

    if (Array.isArray(valor)) {
      return valor.length
        ? valor.map((item) => this.formatearValor(item)).join(', ')
        : 'Sin datos';
    }

    if (typeof valor === 'object') {
      return Object.entries(valor as Record<string, unknown>)
        .map(([clave, value]) =>
          `${this.obtenerEtiquetaCampo(clave)}: ${this.formatearValor(value)}`,
        )
        .join(' · ');
    }

    return String(valor);
  }

  // ============================================================
  // ERRORES
  // ============================================================

  private obtenerMensajeError(error: unknown): string {
    const detalle = error as {
      message?: unknown;
      error?: { message?: unknown };
    } | null;

    const mensaje =
      detalle?.error?.message ??
      detalle?.message;

    return typeof mensaje === 'string' && mensaje.trim()
      ? mensaje
      : 'Ocurrió un error al cargar la información de la ruta.';
  }

  // ============================================================
  // MODAL / LIMPIEZA
  // ============================================================

  cerrarModal(): void {
    this.cancelarCarga();
    this.limpiarDatos();
    this.modalCerrado.emit();
    this.cdr.markForCheck();
  }

  private cancelarCarga(): void {
    this.cargaSubscription?.unsubscribe();
    this.cargaSubscription = undefined;
    this.loading = false;
  }

  private limpiarDatos(): void {
    this.ruta = null;
    this.errorCarga = null;
    this.camposZona = [];
    this.camposVersion = [];
    this.horariosDetalle = [];
  }
}
