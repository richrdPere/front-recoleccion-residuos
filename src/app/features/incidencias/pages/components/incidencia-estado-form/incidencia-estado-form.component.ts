import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, PLATFORM_ID, SimpleChanges, ViewChild, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { Subscription, finalize } from 'rxjs';

// Services
import { IncidenciasService } from '../../../services/incidencias.service';
import { AuthStorageService } from 'src/app/core/auth/auth-storage.service';

// Interfaces
import { ChangeIncidenciaEstadoRequest, IncidenciaDetalleData, IncidenciaEstado, IncidenciaId, IncidenciaListadoItem } from '../../../interfaces';

// ==========================================================
// TRANSICIONES DEL BACKEND
// ==========================================================
const TRANSICIONES: Record<
  IncidenciaEstado,
  readonly IncidenciaEstado[]
> = {
  REPORTADA: [
    'EN_REVISION',
    'EN_ATENCION',
    'RECHAZADA',
    'CANCELADA',
  ],

  EN_REVISION: [
    'EN_ATENCION',
    'RECHAZADA',
    'CANCELADA',
  ],

  EN_ATENCION: [
    'EN_REVISION',
    'RESUELTA',
    'CANCELADA',
  ],

  RESUELTA: [],
  RECHAZADA: [],
  CANCELADA: [],
};

const ESTADOS_TERMINALES: readonly IncidenciaEstado[] = [
  'RESUELTA',
  'RECHAZADA',
  'CANCELADA',
];

const detalleValido: ValidatorFn = control => {
  const texto = typeof control.value === 'string'
    ? control.value.trim()
    : '';

  return texto.length >= 3
    ? null
    : { textoMinimo: true };
};

@Component({
  selector: 'incidencia-estado-form',
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],

  templateUrl: './incidencia-estado-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidenciaEstadoFormComponent
  implements OnChanges, AfterViewInit, OnDestroy {

  // ==========================================================
  // ENTRADAS Y EVENTOS
  // ==========================================================
  @Input() mostrarModal = false;
  @Input() incidencia: IncidenciaListadoItem | null = null;

  @Output() modalCerrado = new EventEmitter<void>();

  @Output() guardado =
    new EventEmitter<IncidenciaDetalleData>();

  @ViewChild('dialogo', { static: true })
  private dialogo?: ElementRef<HTMLDialogElement>;

  // ==========================================================
  // ESTADO
  // ==========================================================
  incidenciaActual: IncidenciaListadoItem | null = null;

  isSaving = false;
  errorMensaje = '';

  private esGestor = false;
  private usuarioId: IncidenciaId | null = null;

  private consultaGuardado?: Subscription;
  private destruido = false;

  private readonly platformId = inject(PLATFORM_ID);
  private readonly fb = inject(FormBuilder);

  readonly estadoForm = this.fb.nonNullable.group({
    estado_incidencia:
      this.fb.nonNullable.control<IncidenciaEstado | ''>(
        '',
        Validators.required,
      ),

    detalle_resolucion: [''],
  });

  constructor(
    private readonly incidenciasService: IncidenciasService,
    private readonly authStorage: AuthStorageService,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  // ==========================================================
  // CICLO DE VIDA
  // ==========================================================
  ngOnChanges(changes: SimpleChanges): void {
    if (!this.mostrarModal) {
      this.sincronizarDialogo();
      return;
    }

    if (this.isSaving) return;

    const seAbrio =
      changes['mostrarModal']?.currentValue === true;

    if (seAbrio || changes['incidencia']) {
      this.incidenciaActual = this.incidencia
        ? { ...this.incidencia }
        : null;

      this.cargarPermisos();
      this.reiniciarFormulario();
    }

    this.sincronizarDialogo();
  }

  ngAfterViewInit(): void {
    this.sincronizarDialogo();
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.consultaGuardado?.unsubscribe();

    if (
      isPlatformBrowser(this.platformId) &&
      this.dialogo?.nativeElement.open
    ) {
      this.dialogo.nativeElement.close();
    }
  }

  // ==========================================================
  // PERMISOS Y ESTADOS DISPONIBLES
  // ==========================================================
  private cargarPermisos(): void {
    const roles = this.authStorage.getRoles();

    this.esGestor = roles.some(
      rol => [
        'SUPER_ADMIN',
        'ADMIN',
        'SUPERVISOR',
      ].includes(rol),
    );

    const usuario = this.authStorage.getUser<{
      id_usuario?: IncidenciaId;
    }>();

    this.usuarioId = usuario?.id_usuario ?? null;
  }

  get estadosDisponibles(): readonly IncidenciaEstado[] {
    const incidencia = this.incidenciaActual;

    if (
      !incidencia ||
      !incidencia.estado ||
      !this.idValido(incidencia.id_incidencia)
    ) {
      return [];
    }

    const transiciones =
      TRANSICIONES[incidencia.estado_incidencia] ?? [];

    if (this.esGestor) {
      return transiciones;
    }

    const esPropia = this.usuarioId !== null &&
      String(this.usuarioId) ===
      String(incidencia.id_usuario_reporte);

    if (
      esPropia &&
      ['REPORTADA', 'EN_REVISION'].includes(
        incidencia.estado_incidencia,
      )
    ) {
      return ['CANCELADA'];
    }

    return [];
  }

  get puedeCambiar(): boolean {
    return this.estadosDisponibles.length > 0;
  }

  get requiereDetalle(): boolean {
    const estado = this.estadoForm.controls
      .estado_incidencia.value;

    return estado !== '' &&
      ESTADOS_TERMINALES.includes(estado);
  }

  get requiereResponsable(): boolean {
    const estado = this.estadoForm.controls
      .estado_incidencia.value;

    return estado === 'EN_ATENCION' ||
      estado === 'RESUELTA';
  }

  get faltaResponsable(): boolean {
    return this.requiereResponsable &&
      this.incidenciaActual?.id_responsable == null;
  }

  get puedeGuardar(): boolean {
    const estado = this.estadoForm.controls
      .estado_incidencia.value;

    return this.puedeCambiar &&
      !this.isSaving &&
      this.estadoForm.valid &&
      !this.faltaResponsable &&
      estado !== '' &&
      this.estadosDisponibles.includes(estado);
  }

  get mensajeBloqueo(): string {
    const incidencia = this.incidenciaActual;

    if (!incidencia) {
      return 'Selecciona una incidencia válida.';
    }

    if (!incidencia.estado) {
      return 'La incidencia está deshabilitada administrativamente.';
    }

    if (
      ESTADOS_TERMINALES.includes(
        incidencia.estado_incidencia,
      )
    ) {
      return 'La incidencia está cerrada y no permite cambios de estado.';
    }

    return 'Tu usuario no tiene una transición de estado disponible para esta incidencia.';
  }

  // ==========================================================
  // FORMULARIO
  // ==========================================================
  private reiniciarFormulario(): void {
    this.errorMensaje = '';

    this.estadoForm.controls.detalle_resolucion
      .clearValidators();

    this.estadoForm.reset({
      estado_incidencia: '',
      detalle_resolucion: '',
    });

    this.estadoForm.controls.detalle_resolucion
      .updateValueAndValidity();
  }

  onEstadoChange(): void {
    this.errorMensaje = '';

    const control = this.estadoForm.controls
      .detalle_resolucion;

    if (this.requiereDetalle) {
      control.setValidators([
        detalleValido,
        Validators.maxLength(15000),
      ]);
    } else {
      control.clearValidators();
      control.reset('');
    }

    control.updateValueAndValidity();
  }

  // ==========================================================
  // GUARDAR
  // ==========================================================
  guardar(): void {
    if (this.isSaving || !this.mostrarModal) return;

    this.errorMensaje = '';

    const detalle = this.estadoForm.controls
      .detalle_resolucion.value.trim();

    this.estadoForm.controls.detalle_resolucion
      .setValue(detalle);

    this.estadoForm.markAllAsTouched();

    if (!this.puedeCambiar || !this.incidenciaActual) {
      this.errorMensaje = this.mensajeBloqueo;
      return;
    }

    if (this.faltaResponsable) {
      this.errorMensaje =
        'Debes asignar un responsable antes de atender o resolver la incidencia.';

      return;
    }

    if (!this.puedeGuardar) {
      this.errorMensaje =
        'Selecciona un estado permitido y completa los campos requeridos.';

      return;
    }

    const estado = this.estadoForm.controls
      .estado_incidencia.value;

    if (estado === '') return;

    const request: ChangeIncidenciaEstadoRequest = {
      estado_incidencia: estado,
    };

    // El backend rechaza este campo en estados no terminales.
    if (this.requiereDetalle) {
      request.detalle_resolucion = detalle;
    }

    const id = this.incidenciaActual.id_incidencia;

    this.isSaving = true;

    this.consultaGuardado = this.incidenciasService
      .changeIncidenciaEstado(id, request)
      .pipe(
        finalize(() => {
          this.isSaving = false;

          if (!this.destruido) {
            this.cdr.markForCheck();
          }
        }),
      )
      .subscribe({
        next: response => {
          if (!response.success || !response.data) {
            this.errorMensaje = response.message ||
              'No se pudo actualizar el estado.';

            return;
          }

          // El padre cierra el modal y actualiza el listado.
          this.guardado.emit(response.data);
        },

        error: (error: unknown) => {
          this.errorMensaje = this.obtenerMensajeError(
            error,
            'No se pudo actualizar el estado de la incidencia.',
          );
        },
      });
  }

  // ==========================================================
  // PRESENTACIÓN
  // ==========================================================
  getEstadoLabel(estado: IncidenciaEstado): string {
    const etiquetas: Record<IncidenciaEstado, string> = {
      REPORTADA: 'Reportada',
      EN_REVISION: 'En revisión',
      EN_ATENCION: 'En atención',
      RESUELTA: 'Resuelta',
      RECHAZADA: 'Rechazada',
      CANCELADA: 'Cancelada',
    };

    return etiquetas[estado] ?? estado;
  }

  getEstadoBadge(estado: IncidenciaEstado): string {
    switch (estado) {
      case 'REPORTADA':
        return 'badge-info';

      case 'EN_REVISION':
        return 'badge-warning';

      case 'EN_ATENCION':
        return 'badge-primary';

      case 'RESUELTA':
        return 'badge-success';

      case 'RECHAZADA':
        return 'badge-error';

      default:
        return 'badge-neutral';
    }
  }

  // ==========================================================
  // MODAL
  // ==========================================================
  private sincronizarDialogo(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const dialogo = this.dialogo?.nativeElement;

    if (!dialogo) return;

    if (this.mostrarModal && !dialogo.open) {
      dialogo.showModal();
    } else if (!this.mostrarModal && dialogo.open) {
      dialogo.close();
    }
  }

  cerrarModal(event?: Event): void {
    event?.preventDefault();

    if (this.isSaving) return;

    this.dialogo?.nativeElement.close();
  }

  notificarCierre(): void {
    if (!this.destruido && this.mostrarModal) {
      this.modalCerrado.emit();
    }
  }

  // ==========================================================
  // HELPERS
  // ==========================================================
  private idValido(id: IncidenciaId): boolean {
    return typeof id === 'number'
      ? Number.isSafeInteger(id) && id > 0
      : /^[1-9]\d*$/.test(id);
  }

  private obtenerMensajeError(
    error: unknown,
    respaldo: string,
  ): string {
    const texto = (valor: unknown): string | null =>
      typeof valor === 'string' && valor.trim()
        ? valor.trim()
        : null;

    const mensajeDe = (valor: unknown): string | null =>
      valor && typeof valor === 'object'
        ? texto((valor as { message?: unknown }).message)
        : null;

    if (!error || typeof error !== 'object') {
      return texto(error) ?? respaldo;
    }

    const objeto = error as {
      details?: unknown;
      error?: unknown;
      message?: unknown;
    };

    return mensajeDe(objeto.details) ??
      mensajeDe(objeto.error) ??
      texto(objeto.message) ??
      texto(objeto.error) ??
      respaldo;
  }
}
