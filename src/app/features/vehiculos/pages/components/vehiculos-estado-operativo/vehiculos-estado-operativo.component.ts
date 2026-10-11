import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, finalize, takeUntil } from 'rxjs';

// Services
import { VehiculosService } from '../../../services/vehiculos.service';

// Interfaces
import { ChangeVehiculoEstadoOperativoRequest, EstadoOperativoVehiculo, VehiculoData } from '../../../models';


@Component({
  selector: 'vehiculos-estado-operativo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vehiculos-estado-operativo.component.html',
})
export class VehiculosEstadoOperativoComponent implements OnChanges, OnDestroy {

  @Input() mostrarModal = false;
  @Input() vehiculo: VehiculoData | null = null;

  @Output() modalCerrado = new EventEmitter<void>();
  @Output() estadoActualizado = new EventEmitter<VehiculoData>();

  isSaving = false;
  modalWidthClass = 'max-w-4xl';
  errorMensaje = '';

  private destruido = false;
  private readonly destroy$ = new Subject<void>();

  readonly estadosOperativos: {
    value: EstadoOperativoVehiculo;
    label: string;
  }[] = [
      { value: 'DISPONIBLE', label: 'DISPONIBLE' },
      { value: 'EN_RUTA', label: 'EN RUTA' },
      { value: 'EN_MANTENIMIENTO', label: 'EN MANTENIMIENTO' },
      { value: 'FUERA_DE_SERVICIO', label: 'FUERA DE SERVICIO' },
    ];

  readonly formEstadoOperativo: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly vehiculosService: VehiculosService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.formEstadoOperativo = this.initFormulario();
  }

  // *********************************************************
  // 1. CARGAR DATOS AL ABRIR
  // *********************************************************
  ngOnChanges(changes: SimpleChanges): void {
    const debeSincronizar =
      !!changes['mostrarModal'] ||
      !!changes['vehiculo'];

    if (
      !debeSincronizar ||
      !this.mostrarModal ||
      !this.vehiculo ||
      this.isSaving
    ) {
      return;
    }

    this.setModalWidth('md');

    queueMicrotask(() => {
      if (
        this.destruido ||
        !this.mostrarModal ||
        !this.vehiculo ||
        this.isSaving
      ) {
        return;
      }

      this.errorMensaje = '';

      this.formEstadoOperativo.reset({
        estado_operativo: this.vehiculo.estado_operativo,
        observacion: this.vehiculo.observacion ?? '',
      });

      this.cdr.detectChanges();
    });
  }

  private initFormulario(): FormGroup {
    return this.fb.nonNullable.group({
      estado_operativo: ['', [Validators.required]],
      codigo: ['',],

    });
  }

  // *********************************************************
  // 2. GUARDAR ESTADO OPERATIVO
  // *********************************************************
  guardar(): void {
    if (this.isSaving || !this.vehiculo) {
      return;
    }

    this.errorMensaje = '';
    this.formEstadoOperativo.markAllAsTouched();

    if (this.formEstadoOperativo.invalid) {
      return;
    }

    const { estado_operativo, observacion } =
      this.formEstadoOperativo.getRawValue();

    const estadoValido = this.estadosOperativos.some(
      (opcion) => opcion.value === estado_operativo,
    );

    if (!estadoValido) {
      this.formEstadoOperativo
        .get('estado_operativo')
        ?.setErrors({ opcionInvalida: true });

      this.cdr.markForCheck();
      return;
    }

    const request: ChangeVehiculoEstadoOperativoRequest = {
      estado_operativo,
      observacion: String(observacion ?? '').trim() || null,
    };

    this.isSaving = true;
    this.formEstadoOperativo.disable({ emitEvent: false });

    this.vehiculosService
      .changeEstadoOperativo(this.vehiculo.id_vehiculo, request)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
          this.formEstadoOperativo.enable({ emitEvent: false });
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response.success || !response.data) {
            this.errorMensaje =
              response.message ||
              'No se pudo actualizar el estado operativo.';

            this.cdr.markForCheck();
            return;
          }

          this.estadoActualizado.emit(response.data);
          this.modalCerrado.emit();
        },
        error: (error) => {
          this.errorMensaje = this.obtenerMensajeError(error);
          this.cdr.markForCheck();
        },
      });
  }

  // *********************************************************
  // 3. CERRAR MODAL
  // *********************************************************
  cerrar(): void {
    if (this.isSaving) {
      return;
    }

    this.modalCerrado.emit();
  }

  // *********************************************************
  // 4. OBTENER MENSAJE DE ERROR
  // *********************************************************
  private obtenerMensajeError(error: unknown): string {
    const err = error as {
      error?: { message?: string };
      message?: string;
    } | null;

    return (
      err?.error?.message ||
      err?.message ||
      'No se pudo cambiar el estado operativo del vehículo.'
    );
  }

  // *********************************************************
  // 5. LIMPIAR SUSCRIPCIONES
  // *********************************************************
  ngOnDestroy(): void {
    this.destruido = true;

    this.destroy$.next();
    this.destroy$.complete();
  }

  // *********************************************************
  // 6. METHODS HELPERS
  // *********************************************************
  esRequerido(campo: string): boolean {
    return (
      this.formEstadoOperativo
        .get(campo)
        ?.hasValidator(Validators.required) ?? false
    );
  }

  campoInvalido(campo: string): boolean {
    const control = this.formEstadoOperativo.get(campo);

    return !!(
      control &&
      control.invalid &&
      (control.touched || control.dirty)
    );
  }

  campoCompleto(campo: string): boolean {
    const control = this.formEstadoOperativo.get(campo);

    if (!control || !control.valid) {
      return false;
    }

    const valor = control.value;

    if (typeof valor === 'string') {
      return valor.trim().length > 0;
    }

    if (Array.isArray(valor)) {
      return valor.length > 0;
    }

    return valor !== null && valor !== undefined;
  }

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
  }


}
