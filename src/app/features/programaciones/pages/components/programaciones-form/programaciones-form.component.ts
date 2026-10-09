import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import Swal from 'sweetalert2';

// Service
import { ProgramacionesService } from 'src/app/features/programaciones/services/programaciones.service';

// Interfaces
import { CreateProgramacionRequest, UpdateProgramacionRequest, ProgramacionPaginadaItem } from '../../../interfaces/programaciones';

// ============================================================
// OPCIONES DE LOS CATÁLOGOS
// ============================================================

export interface ProgramacionRutaOption {
  id_ruta: number;
  codigo: string;
  nombre: string;
}

export interface ProgramacionVersionOption {
  id_ruta_version: number;
  id_ruta: number;
  numero_version: number;
}

export interface ProgramacionVehiculoOption {
  id_vehiculo: number;
  codigo: string;
  placa: string;
}

export interface ProgramacionPersonalOption {
  // ID de PersonalOperativo.
  id_personal: number;
  nombre: string;
  codigo_empleado: string;
}

export interface ProgramacionTurnoOption {
  value: string;
  label: string;
}

// ============================================================
// VALIDADORES
// ============================================================

const idValido: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value;

  if (value === null || value === undefined || value === '') {
    return null;
  }

  return Number.isInteger(Number(value)) && Number(value) > 0
    ? null
    : { idInvalido: true };
};

const fechaValida: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value;

  if (!value) {
    return null;
  }

  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { fechaInvalida: true };
  }

  const fecha = new Date(`${value}T00:00:00Z`);

  return (
    Number.isFinite(fecha.getTime()) &&
    fecha.toISOString().slice(0, 10) === value
  )
    ? null
    : { fechaInvalida: true };
};

// const horaValida: ValidatorFn = (
//   control: AbstractControl,
// ): ValidationErrors | null => {
//   const value = control.value;

//   if (!value) {
//     return null;
//   }

//   return typeof value === 'string' &&
//     /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(value)
//     ? null
//     : { horaInvalida: true };
// };

const horaValida: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;

  if (!value) {
    return null;
  }

  return typeof value === 'string' &&
    /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value)
    ? null
    : { horaInvalida: true };
};

const supervisorValido: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  return control.value === null
    ? null
    : idValido(control);
};

const recolectoresValidos: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const ids = control.value;

  if (!Array.isArray(ids)) {
    return { recolectoresInvalidos: true };
  }

  const validos = ids.every(
    (id) => Number.isInteger(id) && id > 0,
  );

  return validos && new Set(ids).size === ids.length
    ? null
    : { recolectoresInvalidos: true };
};

@Component({
  selector: 'programaciones-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './programaciones-form.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramacionesFormComponent implements OnChanges {
  private readonly destroyRef = inject(DestroyRef);

  // ============================================================
  // INPUTS / OUTPUTS
  // ============================================================

  @Input() mostrarModal = false;
  @Input() modoEdicion = false;

  @Input() programacionSeleccionada:
    ProgramacionPaginadaItem | null = null;

  @Input() rutas: ProgramacionRutaOption[] = [];
  @Input() versiones: ProgramacionVersionOption[] = [];
  @Input() vehiculos: ProgramacionVehiculoOption[] = [];

  @Input() conductores: ProgramacionPersonalOption[] = [];
  @Input() recolectores: ProgramacionPersonalOption[] = [];
  @Input() supervisores: ProgramacionPersonalOption[] = [];

  // Usa los valores exactos admitidos por tu backend.
  @Input() turnos: ProgramacionTurnoOption[] = [];

  @Output() modalCerrado = new EventEmitter<void>();
  @Output() programacionGuardada = new EventEmitter<void>();

  // ============================================================
  // ESTADO
  // ============================================================

  readonly formProgramacion: FormGroup;

  isLoading = false;
  modalWidthClass = 'max-w-6xl';

  // Permite conservar el equipo actual aunque ya no aparezca
  // en los catálogos de personal disponible.
  private equipoOriginal: ProgramacionPersonalOption[] = [];
  private conductorOriginalId: number | null = null;
  private supervisorOriginalId: number | null = null;
  private recolectoresOriginalesIds: number[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly programacionesService: ProgramacionesService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.formProgramacion = this.crearFormulario();
  }

  // ============================================================
  // CICLO DE VIDA
  // ============================================================

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.mostrarModal) {
      if (changes['mostrarModal']) {
        this.resetearFormulario();
      }

      return;
    }

    const debeSincronizar =
      !!changes['mostrarModal'] ||
      !!changes['modoEdicion'] ||
      !!changes['programacionSeleccionada'];

    // La llegada de catálogos no borra el formulario.
    if (!debeSincronizar) {
      return;
    }

    if (this.modoEdicion && this.programacionSeleccionada) {
      this.cargarProgramacion(this.programacionSeleccionada);
      return;
    }

    this.resetearFormulario();
  }

  // ============================================================
  // FORMULARIO
  // ============================================================

  private crearFormulario(): FormGroup {
    return this.fb.group({
      id_programacion: [null],

      id_ruta: [null, [Validators.required, idValido]],
      id_ruta_version: [null, [Validators.required, idValido]],
      id_vehiculo: [null, [Validators.required, idValido]],

      id_conductor: [null, [Validators.required, idValido]],
      recolectores: this.fb.control<number[]>([], recolectoresValidos),
      id_supervisor: [null, supervisorValido],

      fecha_programada: ['', [Validators.required, fechaValida]],

      hora_inicio_programada: [
        '',
        [Validators.required, horaValida],
      ],

      hora_fin_programada: [
        '',
        [Validators.required, horaValida],
      ],

      turno: ['', Validators.required],
      observacion: [''],
    });
  }

  private resetearFormulario(): void {
    this.equipoOriginal = [];
    this.conductorOriginalId = null;
    this.supervisorOriginalId = null;
    this.recolectoresOriginalesIds = [];

    this.formProgramacion.reset({
      id_programacion: null,
      id_ruta: null,
      id_ruta_version: null,
      id_vehiculo: null,
      id_conductor: null,
      recolectores: [],
      id_supervisor: null,
      fecha_programada: '',
      hora_inicio_programada: '',
      hora_fin_programada: '',
      turno: '',
      observacion: '',
    });
  }

  private cargarProgramacion(
    programacion: ProgramacionPaginadaItem,
  ): void {
    const equipo = programacion.personal_asignado ?? [];

    const conductor = equipo.find(
      (item) => item.funcion.toUpperCase() === 'CONDUCTOR',
    );

    const supervisor = equipo.find(
      (item) => item.funcion.toUpperCase() === 'SUPERVISOR',
    );

    const recolectores = equipo
      .filter((item) => item.funcion.toUpperCase() === 'RECOLECTOR')
      .map((item) => item.personal.id_personal);

    this.equipoOriginal = equipo.map((item) => {
      const personal = item.personal;
      const persona = personal.usuario.persona;

      return {
        id_personal: personal.id_personal,
        codigo_empleado: personal.codigo_empleado,
        nombre: [
          persona.nombres,
          persona.apellidos,
        ].filter(Boolean).join(' ').trim() ||
          personal.usuario.username,
      };
    });

    this.conductorOriginalId =
      conductor?.personal.id_personal ?? null;

    this.supervisorOriginalId =
      supervisor?.personal.id_personal ?? null;

    this.recolectoresOriginalesIds = [...new Set(recolectores)];

    this.formProgramacion.reset({
      id_programacion: programacion.id_programacion,
      id_ruta: programacion.id_ruta,
      id_ruta_version: programacion.id_ruta_version,
      id_vehiculo: programacion.id_vehiculo,

      id_conductor: this.conductorOriginalId,
      recolectores: [...this.recolectoresOriginalesIds],
      id_supervisor: this.supervisorOriginalId,

      fecha_programada: programacion.fecha_programada.slice(0, 10),
      hora_inicio_programada: programacion.hora_inicio_programada,
      hora_fin_programada: programacion.hora_fin_programada,

      turno: programacion.turno,
      observacion: programacion.observacion ?? '',
    });
  }

  // ============================================================
  // OPCIONES: CONSERVAR DATOS ACTUALES EN EDICIÓN
  // ============================================================

  get rutasDisponibles(): ProgramacionRutaOption[] {
    const actual = this.modoEdicion
      ? this.programacionSeleccionada
      : null;

    if (
      actual &&
      !this.rutas.some((ruta) => ruta.id_ruta === actual.id_ruta)
    ) {
      return [actual.ruta, ...this.rutas];
    }

    return this.rutas;
  }

  get versionesDisponibles(): ProgramacionVersionOption[] {
    const idRuta = this.formProgramacion.get('id_ruta')?.value;

    const opciones = this.versiones.filter(
      (version) => version.id_ruta === idRuta,
    );

    const actual = this.modoEdicion
      ? this.programacionSeleccionada
      : null;

    if (
      actual &&
      actual.id_ruta === idRuta &&
      !opciones.some(
        (version) => version.id_ruta_version === actual.id_ruta_version,
      )
    ) {
      return [
        {
          id_ruta: actual.id_ruta,
          id_ruta_version: actual.id_ruta_version,
          numero_version: actual.version_ruta.numero_version,
        },
        ...opciones,
      ];
    }

    return opciones;
  }

  get vehiculosDisponibles(): ProgramacionVehiculoOption[] {
    const actual = this.modoEdicion
      ? this.programacionSeleccionada
      : null;

    if (
      actual &&
      !this.vehiculos.some(
        (vehiculo) => vehiculo.id_vehiculo === actual.id_vehiculo,
      )
    ) {
      return [actual.vehiculo, ...this.vehiculos];
    }

    return this.vehiculos;
  }

  get conductoresDisponibles(): ProgramacionPersonalOption[] {
    return this.incluirPersonalOriginal(
      this.conductores,
      this.conductorOriginalId === null
        ? []
        : [this.conductorOriginalId],
    );
  }

  get supervisoresDisponibles(): ProgramacionPersonalOption[] {
    return this.incluirPersonalOriginal(
      this.supervisores,
      this.supervisorOriginalId === null
        ? []
        : [this.supervisorOriginalId],
    );
  }

  get recolectoresDisponibles(): ProgramacionPersonalOption[] {
    return this.incluirPersonalOriginal(
      this.recolectores,
      this.recolectoresOriginalesIds,
    );
  }

  get turnosDisponibles(): ProgramacionTurnoOption[] {
    const turno = this.modoEdicion
      ? this.programacionSeleccionada?.turno
      : null;

    if (turno && !this.turnos.some((item) => item.value === turno)) {
      return [{ value: turno, label: turno }, ...this.turnos];
    }

    return this.turnos;
  }

  private incluirPersonalOriginal(
    opciones: ProgramacionPersonalOption[],
    ids: number[],
  ): ProgramacionPersonalOption[] {
    const faltantes = this.equipoOriginal.filter(
      (personal) =>
        ids.includes(personal.id_personal) &&
        !opciones.some(
          (opcion) => opcion.id_personal === personal.id_personal,
        ),
    );

    return [...faltantes, ...opciones];
  }

  // ============================================================
  // RUTA / RECOLECTORES
  // ============================================================

  onRutaChange(): void {
    // La versión anterior pertenece a otra ruta.
    this.formProgramacion.get('id_ruta_version')?.reset(null);
  }

  recolectorSeleccionado(idPersonal: number): boolean {
    const ids: number[] =
      this.formProgramacion.get('recolectores')?.value ?? [];

    return ids.includes(idPersonal);
  }

  toggleRecolector(idPersonal: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const control = this.formProgramacion.get('recolectores');
    const ids: number[] = control?.value ?? [];

    control?.setValue(
      checked
        ? [...new Set([...ids, idPersonal])]
        : ids.filter((id) => id !== idPersonal),
    );

    control?.markAsDirty();
    control?.markAsTouched();
  }

  get cantidadRecolectores(): number {
    return this.formProgramacion.get('recolectores')?.value.length ?? 0;
  }

  // ============================================================
  // CREAR / ACTUALIZAR
  // ============================================================

  crearOEditarProgramacion(): void {
    if (this.isLoading) {
      return;
    }

    if (this.formProgramacion.invalid) {
      this.formProgramacion.markAllAsTouched();
      return;
    }

    const form = this.formProgramacion.getRawValue();

    const esEdicion = this.modoEdicion;
    const idProgramacion = Number(form.id_programacion);

    if (
      esEdicion &&
      (!Number.isInteger(idProgramacion) || idProgramacion <= 0)
    ) {
      this.mostrarError(
        'Selecciona nuevamente la programación que deseas editar.',
      );
      return;
    }

    const versionValida = this.versionesDisponibles.some(
      (version) =>
        version.id_ruta === form.id_ruta &&
        version.id_ruta_version === form.id_ruta_version,
    );

    const opcionesValidas =
      this.rutasDisponibles.some(
        (ruta) => ruta.id_ruta === form.id_ruta,
      ) &&
      versionValida &&
      this.vehiculosDisponibles.some(
        (vehiculo) => vehiculo.id_vehiculo === form.id_vehiculo,
      ) &&
      this.conductoresDisponibles.some(
        (personal) => personal.id_personal === form.id_conductor,
      ) &&
      (form.id_supervisor === null ||
        this.supervisoresDisponibles.some(
          (personal) => personal.id_personal === form.id_supervisor,
        )) &&
      (form.recolectores as number[]).every(
        (id) => this.recolectoresDisponibles.some(
          (personal) => personal.id_personal === id,
        ),
      ) &&
      this.turnosDisponibles.some(
        (turno) => turno.value === form.turno,
      );

    if (!opcionesValidas) {
      this.mostrarError(
        'Revisa la ruta, versión, vehículo, equipo y turno seleccionados.',
      );
      return;
    }

    if (form.hora_inicio_programada === form.hora_fin_programada) {
      this.mostrarError(
        'La hora de inicio y la hora de fin deben ser diferentes.',
      );
      return;
    }

    const payloadCrear: CreateProgramacionRequest = {
      id_ruta: Number(form.id_ruta),
      id_ruta_version: Number(form.id_ruta_version),
      id_vehiculo: Number(form.id_vehiculo),

      // IDs de PersonalOperativo.
      id_conductor: Number(form.id_conductor),
      recolectores: [...form.recolectores],
      id_supervisor:
        form.id_supervisor === null
          ? null
          : Number(form.id_supervisor),

      fecha_programada: form.fecha_programada,
      hora_inicio_programada: form.hora_inicio_programada,
      hora_fin_programada: form.hora_fin_programada,

      turno: form.turno,
      observacion: String(form.observacion ?? '').trim() || null,
    };

    // Todos estos campos están admitidos por UpdateProgramacionRequest.
    const payloadActualizar: UpdateProgramacionRequest = {
      ...payloadCrear,
      recolectores: [...payloadCrear.recolectores],
    };

    const solicitud$ = esEdicion
      ? this.programacionesService.updateProgramacion(
        idProgramacion,
        payloadActualizar,
      )
      : this.programacionesService.createProgramacion(payloadCrear);

    this.isLoading = true;

    // solicitud$
    //   .pipe(
    //     takeUntilDestroyed(this.destroyRef),
    //     finalize(() => {
    //       this.isLoading = false;
    //       this.cdr.markForCheck();
    //     }),
    //   )
    //   .subscribe({
    //     next: (response) => {
    //       if (!response.success) {
    //         this.mostrarError(
    //           response.message || 'La operación no fue completada.',
    //         );
    //         return;
    //       }

    //       this.isLoading = false;

    //       void Swal.fire({
    //         icon: 'success',
    //         title: esEdicion
    //           ? 'Programación actualizada correctamente'
    //           : 'Programación creada correctamente',
    //       });

    //       this.programacionGuardada.emit();
    //       this.cerrarModal();
    //     },

    //     error: (err) => {
    //       const mensaje = err?.error?.message ?? err?.message;

    //       this.mostrarError(
    //         typeof mensaje === 'string' && mensaje.trim()
    //           ? mensaje
    //           : 'No se pudo guardar la programación.',
    //       );
    //     },
    //   });
  }

  // ============================================================
  // VALIDACIÓN / MODAL
  // ============================================================

  campoInvalido(campo: string): boolean {
    const control = this.formProgramacion.get(campo);

    return !!(
      control &&
      control.invalid &&
      (control.touched || control.dirty)
    );
  }

  obtenerError(campo: string): string {
    const control = this.formProgramacion.get(campo);

    if (!control || !this.campoInvalido(campo)) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }

    if (control.hasError('idInvalido')) {
      return 'Selecciona una opción válida.';
    }

    if (control.hasError('fechaInvalida')) {
      return 'Ingresa una fecha válida.';
    }

    if (control.hasError('horaInvalida')) {
      return 'Ingresa una hora válida.';
    }

    if (control.hasError('recolectoresInvalidos')) {
      return 'Revisa los recolectores seleccionados.';
    }

    return 'Revisa el valor ingresado.';
  }

  private mostrarError(mensaje: string): void {
    void Swal.fire({
      icon: 'error',
      title: this.modoEdicion
        ? 'No se pudo actualizar la programación'
        : 'No se pudo crear la programación',
      text: mensaje,
    });
  }

  cerrarModal(): void {
    if (this.isLoading) {
      return;
    }

    this.resetearFormulario();
    this.modalCerrado.emit();
  }


}

