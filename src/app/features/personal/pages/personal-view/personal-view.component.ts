import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize, Subscription } from 'rxjs';

// Service
import { PersonalService } from 'src/app/features/personal/services/personal.service';

// Interfaces
import { PersonalOperativoData } from '../../models/personal_operativo/data/personal-operativo-data.model';

interface CampoDetalle {
  clave: string;
  etiqueta: string;
  valor: unknown;
}

@Component({
  selector: 'personal-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './personal-view.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonalViewComponent implements OnChanges, OnDestroy {

  // ============================================================
  // INPUTS / OUTPUTS
  // ============================================================
  @Input() mostrarModal = false;
  @Input() personal_id: number | null = null;

  @Output() modalCerrado = new EventEmitter<void>();

  // ============================================================
  // ESTADO
  // ============================================================

  personal: PersonalOperativoData | null = null;

  loading = false;
  errorCarga: string | null = null;

  modalWidthClass = 'max-w-4xl';

  private cargaSubscription?: Subscription;
  private destruido = false;

  // ============================================================
  // ETIQUETAS
  // ============================================================

  private readonly etiquetas: Record<string, string> = {
    NOMBRADO: 'Nombrado',
    CONTRATADO: 'Contratado',
    CAS: 'CAS',
    LOCADOR: 'Locador',
    TERCERO: 'Tercero',
    OTRO: 'Otro',

    MANANA: 'Mañana',
    TARDE: 'Tarde',
    NOCHE: 'Noche',
    ROTATIVO: 'Rotativo',

    ACTIVO: 'Activo',
    VACACIONES: 'Vacaciones',
    DESCANSO_MEDICO: 'Descanso médico',
    SUSPENDIDO: 'Suspendido',
    CESADO: 'Cesado',

    VIGENTE: 'Vigente',
    POR_VENCER: 'Por vencer',
    VENCIDA: 'Vencida',
    SUSPENDIDA: 'Suspendida',
    CANCELADA: 'Cancelada',

    SUPER_ADMIN: 'Superadministrador',
    ADMIN: 'Administrador',
    SUPERVISOR: 'Supervisor',
    OPERADOR: 'Operador',
    CONDUCTOR: 'Conductor',
    RECOLECTOR: 'Recolector',
  };

  constructor(
    private readonly personalService: PersonalService,
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

    if (changes['mostrarModal'] || changes['personal_id']) {
      this.cargarDatosPersonal();
    }
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.cancelarCarga();
  }

  // ============================================================
  // CARGAR INFORMACIÓN
  // ============================================================

  cargarDatosPersonal(): void {
    this.cancelarCarga();
    this.limpiarDatos();

    if (!this.mostrarModal) {
      return;
    }

    const idPersonal = this.personal_id;

    if (
      idPersonal === null ||
      !Number.isInteger(idPersonal) ||
      idPersonal <= 0
    ) {
      this.errorCarga = 'Selecciona un registro de personal válido.';
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    this.cargaSubscription = this.personalService
      .getPersonalById(idPersonal)
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
              'No se pudo obtener la información del personal.';
          } else {
            this.personal = response.data;
          }

          this.cdr.markForCheck();
        },

        error: (error: unknown) => {
          this.personal = null;
          this.errorCarga = this.obtenerMensajeError(error);
          this.cdr.markForCheck();
        },
      });
  }

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
      : 'Ocurrió un error al cargar el personal operativo.';
  }

  // ============================================================
  // HELPERS DE PRESENTACIÓN
  // ============================================================

  obtenerEtiqueta(value: string | null | undefined): string {
    if (!value) {
      return 'No registrado';
    }

    return this.etiquetas[value] ?? value;
  }

  obtenerClaseEstadoLaboral(
    estado: PersonalOperativoData['estado_laboral'],
  ): string {
    const clases: Record<
      PersonalOperativoData['estado_laboral'],
      string
    > = {
      ACTIVO: 'badge-success',
      VACACIONES: 'badge-info',
      DESCANSO_MEDICO: 'badge-warning',
      SUSPENDIDO: 'badge-error',
      CESADO: 'badge-neutral',
    };

    return clases[estado] ?? 'badge-neutral';
  }

  // ============================================================
  // DATOS RELACIONADOS: USUARIO / CONDUCTOR
  // Permite mostrar sus campos sin asumir sus interfaces.
  // ============================================================

  esObjeto(value: unknown): boolean {
    return (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value)
    );
  }

  esLista(value: unknown): boolean {
    return Array.isArray(value);
  }

  obtenerLista(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
  }

  obtenerCampos(value: unknown): CampoDetalle[] {
    if (!this.esObjeto(value)) {
      return [];
    }

    return Object.entries(value as Record<string, unknown>)
      .map(([clave, valor]) => ({
        clave,
        etiqueta: this.obtenerNombreCampo(clave),
        valor,
      }));
  }

  private obtenerNombreCampo(clave: string): string {
    const nombres: Record<string, string> = {
      id_usuario: 'ID del usuario',
      id_persona: 'ID de la persona',
      id_conductor: 'ID del conductor',
      documento_identidad: 'Documento de identidad',
      tipo_documento: 'Tipo de documento',
      email_acceso: 'Correo de acceso',
      fecha_nacimiento: 'Fecha de nacimiento',
      estado_licencia: 'Estado de la licencia',
      created_at: 'Fecha de creación',
      updated_at: 'Fecha de actualización',
      deleted_at: 'Fecha de eliminación',
    };

    if (nombres[clave]) {
      return nombres[clave];
    }

    const texto = clave
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ');

    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  mostrarValor(value: unknown): string {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return 'No registrado';
    }

    if (typeof value === 'boolean') {
      return value ? 'Sí' : 'No';
    }

    if (typeof value === 'string') {
      return this.obtenerEtiqueta(value);
    }

    return String(value);
  }

  // ============================================================
  // MODAL / LIMPIEZA
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
    this.modalCerrado.emit();
    this.cdr.markForCheck();
  }

  private cancelarCarga(): void {
    this.cargaSubscription?.unsubscribe();
    this.cargaSubscription = undefined;
    this.loading = false;
  }

  private limpiarDatos(): void {
    this.personal = null;
    this.errorCarga = null;
  }
}
