import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, finalize } from 'rxjs';
import Swal from 'sweetalert2';

// Services
import { ProgramacionPersonalService } from 'src/app/features/programaciones/services/programacion_personal.service';

// Interfaces
import { ProgramacionPersonalAsignadoData } from 'src/app/features/programaciones/interfaces/programacion-personal';

// Componentes
import { ProgramacionesPersonalAgregarComponent, PersonalProgramacionOption } from './programaciones-personal-agregar/programaciones-personal-agregar.component';
import { ProgramacionesPersonalRetirarComponent } from './programaciones-personal-retirar/programaciones-personal-retirar.component';

@Component({
  selector: 'programaciones-personal',
  standalone: true,
  imports: [
    CommonModule,
    ProgramacionesPersonalAgregarComponent,
    ProgramacionesPersonalRetirarComponent
  ],
  templateUrl: './programaciones-personal.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramacionesPersonalComponent
  implements OnChanges, OnDestroy {

  // ============================================================
  // INPUTS / OUTPUTS
  // ============================================================

  @Input() mostrarModal = false;
  @Input() programacion_id: number | null = null;

  @Output() modalCerrado = new EventEmitter<void>();

  // ============================================================
  // AGREGAR PERSONAL
  // ============================================================

  @Input() personalDisponible: PersonalProgramacionOption[] = [];
  @Input() cargandoDisponibilidad = false;
  @Input() errorDisponibilidad: string | null = null;

  @Output() solicitarDisponibilidad = new EventEmitter<void>();
  @Output() personalActualizado = new EventEmitter<void>();

  vistaPersonal: 'listado' | 'agregar' | 'retirar' = 'listado';
  asignacionParaRetirar: ProgramacionPersonalAsignadoData | null = null;

  guardandoPersonal = false;

  // ============================================================
  // ESTADO
  // ============================================================

  personalAsignado: ProgramacionPersonalAsignadoData[] = [];

  loading = false;
  errorCarga: string | null = null;

  modalWidthClass = 'max-w-6xl';

  asignacionExpandidaId: number | null = null;

  private cargaSubscription?: Subscription;
  private destruido = false;

  constructor(
    private readonly programacionPersonalService:
      ProgramacionPersonalService,
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

    if (
      changes['programacion_id'] ||
      changes['mostrarModal']
    ) {
      this.cargarPersonal();
    }
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.cancelarCarga();
  }

  // ============================================================
  // CARGAR PERSONAL
  // ============================================================

  cargarPersonal(): void {
    if (this.destruido) {
      return;
    }

    this.cancelarCarga();
    this.limpiarDatos();

    if (!this.mostrarModal) {
      return;
    }

    const idProgramacion = this.programacion_id;

    if (
      idProgramacion === null ||
      !Number.isSafeInteger(idProgramacion) ||
      idProgramacion <= 0
    ) {
      this.errorCarga = 'Selecciona una programación válida.';
      this.actualizarVista();
      return;
    }

    this.loading = true;
    this.actualizarVista();

    this.cargaSubscription = this.programacionPersonalService
      .getPersonalByProgramacion(idProgramacion)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.actualizarVista();
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response.success || !Array.isArray(response.data)) {
            this.mostrarError(
              response.message ||
              'No se pudo obtener el personal de la programación.',
            );

            return;
          }

          // Conserva todas las asignaciones devueltas por el endpoint.
          this.personalAsignado = [...response.data];
          this.errorCarga = null;
          this.actualizarVista();
        },

        error: (error: unknown) => {
          this.mostrarError(this.obtenerMensajeError(error));
        },
      });
  }

  // ============================================================
  // AGREGAR PERSONAL
  // ============================================================
  abrirAgregarPersonal(): void {
    if (this.loading || this.guardandoPersonal) {
      return;
    }

    this.vistaPersonal = 'agregar';
    this.solicitarDisponibilidad.emit();
    this.cdr.markForCheck();
  }

  volverAlListado(): void {
    if (this.guardandoPersonal) {
      return;
    }

    this.asignacionParaRetirar = null;
    this.vistaPersonal = 'listado';
    this.cdr.markForCheck();
  }

  onPersonalAgregado(): void {
    this.guardandoPersonal = false;
    this.vistaPersonal = 'listado';

    this.cargarPersonal();
    this.personalActualizado.emit();
  }

  // ============================================================
  // REMOVER PERSONAL
  // ============================================================
  abrirRetirarPersonal(
    asignacion: ProgramacionPersonalAsignadoData,
  ): void {
    if (
      this.loading ||
      this.guardandoPersonal ||
      asignacion.id_programacion !== this.programacion_id
    ) {
      return;
    }

    this.asignacionParaRetirar = asignacion;
    this.vistaPersonal = 'retirar';
    this.cdr.markForCheck();
  }

  onPersonalRetirado(): void {
    this.guardandoPersonal = false;
    this.asignacionParaRetirar = null;
    this.vistaPersonal = 'listado';

    this.cargarPersonal();
    this.personalActualizado.emit();
  }

  // ============================================================
  // RESUMEN
  // ============================================================

  get totalAsignaciones(): number {
    return this.personalAsignado.length;
  }

  get totalConductores(): number {
    return this.contarFuncion('CONDUCTOR');
  }

  get totalRecolectores(): number {
    return this.contarFuncion('RECOLECTOR');
  }

  get totalSupervisores(): number {
    return this.contarFuncion('SUPERVISOR');
  }

  private contarFuncion(funcion: string): number {
    return this.personalAsignado.filter(
      (item) => item.funcion.trim().toUpperCase() === funcion,
    ).length;
  }

  // ============================================================
  // HELPERS PARA LA VISTA
  // ============================================================

  obtenerNombreCompleto(
    item: ProgramacionPersonalAsignadoData,
  ): string {
    const persona = item.personal?.usuario?.persona;

    const nombre = [
      persona?.nombres,
      persona?.apellidos,
    ]
      .map((valor) => String(valor ?? '').trim())
      .filter(Boolean)
      .join(' ');

    return nombre || 'Nombre no registrado';
  }

  obtenerEtiqueta(valor: string | null | undefined): string {
    return valor?.trim().replace(/_/g, ' ') || 'No registrado';
  }

  obtenerFuncion(funcion: string): {
    label: string;
    icon: string;
    class: string;
  } {
    const opciones: Record<
      string,
      { label: string; icon: string; class: string }
    > = {
      CONDUCTOR: {
        label: 'CONDUCTOR',
        icon: 'fa-truck',
        class: 'badge-info',
      },
      RECOLECTOR: {
        label: 'RECOLECTOR',
        icon: 'fa-recycle',
        class: 'badge-success',
      },
      SUPERVISOR: {
        label: 'SUPERVISOR',
        icon: 'fa-user-tie',
        class: 'badge-primary',
      },
    };

    return opciones[funcion.trim().toUpperCase()] ?? {
      label: this.obtenerEtiqueta(funcion),
      icon: 'fa-user',
      class: 'badge-neutral',
    };
  }

  alternarDetalle(idAsignacion: number): void {
    this.asignacionExpandidaId =
      this.asignacionExpandidaId === idAsignacion
        ? null
        : idAsignacion;

    this.actualizarVista();
  }

  // ============================================================
  // MANEJO DE ERRORES
  // ============================================================

  private mostrarError(mensaje: string): void {
    this.personalAsignado = [];
    this.errorCarga = mensaje;
    this.actualizarVista();

    void Swal.fire({
      icon: 'error',
      title: 'No se pudo obtener el personal',
      text: mensaje,
    });
  }

  private obtenerMensajeError(error: unknown): string {
    const detalle = error as {
      message?: unknown;
      error?: {
        message?: unknown;
      };
    } | null;

    const mensaje = detalle?.error?.message ?? detalle?.message;

    return typeof mensaje === 'string' && mensaje.trim()
      ? mensaje
      : 'Ocurrió un error al cargar el personal de la programación.';
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
    this.actualizarVista();
  }

  cerrarModal(): void {
    this.cancelarCarga();
    this.limpiarDatos();

    this.asignacionParaRetirar = null;
    this.vistaPersonal = 'listado';

    this.modalCerrado.emit();
    this.actualizarVista();
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
    this.personalAsignado = [];
    this.errorCarga = null;
    this.asignacionExpandidaId = null;
  }

  private actualizarVista(): void {
    if (!this.destruido) {
      this.cdr.markForCheck();
    }
  }
}
