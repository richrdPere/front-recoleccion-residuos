import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, map, of, switchMap, throwError } from 'rxjs';
import Swal from 'sweetalert2';

// Directives
import { UppercaseDirective } from 'src/app/shared/directives/uppercase.directive';

// Services
import { PersonalService } from 'src/app/features/personal/services/personal.service';
import { ConductorService } from 'src/app/features/personal/services/condutor.service';

// Interfaces
import { CreatePersonalOperativoRequest, EstadoLaboralPersonal, PersonalOperativoData, TipoContratoPersonal, TurnoPreferentePersonal } from '../../../models/personal_operativo';
import { UsuarioSelectorItem } from 'src/app/features/usuarios/interfaces';


// ============================================================
// TIPOS
// ============================================================
export interface UsuarioPersonalOption {
  id_usuario: number;
  nombre: string;
}

export interface PersonalSelectOption<T extends string> {
  value: T;
  label: string;
}

type PersonalIdentificador = PersonalOperativoData['id_personal'];

type CrearConductorPayload = Parameters<ConductorService['createConductor']>[1];

type ActualizarConductorPayload = Parameters<ConductorService['updateConductor']>[1];

// ============================================================
// VALIDADORES
// ============================================================

const textoNoVacio: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value;

  if (value === null || value === undefined || value === '') {
    return null;
  }

  return typeof value === 'string' && value.trim().length > 0
    ? null
    : { textoVacio: true };
};

const idValido: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value;

  if (value === null || value === undefined || value === '') {
    return null;
  }

  return /^\d+$/.test(String(value)) && Number(value) > 0
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

  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
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

const ordenFechasLicencia: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const emision = control.get('fecha_emision_licencia');
  const vencimiento = control.get('fecha_vencimiento_licencia');

  if (
    !emision?.value ||
    !vencimiento?.value ||
    emision.invalid ||
    vencimiento.invalid
  ) {
    return null;
  }

  return emision.value <= vencimiento.value
    ? null
    : { ordenFechasLicencia: true };
};

@Component({
  selector: 'personal-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    UppercaseDirective,
  ],
  templateUrl: './personal-form.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonalFormComponent implements OnChanges {
  private readonly destroyRef = inject(DestroyRef);

  // ============================================================
  // INPUTS / OUTPUTS
  // ============================================================

  @Input() mostrarModal = false;
  @Input() modoEdicion = false;
  @Input() personalSeleccionado: PersonalOperativoData | null = null;
  @Input() usuariosDisponibles: UsuarioSelectorItem[] = [];

  @Input() tiposContrato: PersonalSelectOption<TipoContratoPersonal>[] = [];

  @Input() turnosPreferentes: PersonalSelectOption<TurnoPreferentePersonal>[] = [];

  @Input() estadosLaborales: PersonalSelectOption<EstadoLaboralPersonal>[] = [];

  @Input() nombreUsuarioSeleccionado = '';

  @Output() modalCerrado = new EventEmitter<void>();
  @Output() personalGuardado = new EventEmitter<void>();

  // ============================================================
  // ESTADO
  // ============================================================

  readonly formPersonal: FormGroup;

  isLoading = false;
  modalWidthClass = 'max-w-4xl';

  // Identifica si corresponde crear o actualizar el conductor.
  tienePerfilConductor = false;

  // Conserva el ID si se creó el personal y luego falló el conductor.
  private idPersonalPersistido: PersonalIdentificador | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly personalService: PersonalService,
    private readonly conductorService: ConductorService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.formPersonal = this.crearFormulario();

    this.formPersonal
      .get('habilitar_conductor')!
      .valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.sincronizarEstadoConductor();
        this.cdr.markForCheck();
      });

    this.sincronizarEstadoConductor();
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
      !!changes['personalSeleccionado'];

    if (!debeSincronizar || this.isLoading) {
      return;
    }

    if (this.modoEdicion && this.personalSeleccionado) {
      this.cargarPersonal(this.personalSeleccionado);
      this.setModalWidth('lg');
      return;
    }

    this.resetearFormulario();
    this.getCodigo();
    this.setModalWidth('lg');
  }

  // ============================================================
  // FORMULARIO
  // ============================================================

  private crearFormulario(): FormGroup {
    return this.fb.group({
      id_personal: [null],
      id_usuario: [null, [Validators.required, idValido]],
      codigo_empleado: ['', [Validators.required, textoNoVacio]],
      fecha_ingreso: ['', [Validators.required, fechaValida]],
      fecha_salida: ['', [Validators.required, fechaValida]],
      tipo_contrato: ['CONTRATADO', [Validators.required]],
      turno_preferente: [null],
      estado_laboral: [null],
      observacion: [''],

      habilitar_conductor: [false],

      conductor: this.fb.group(
        {
          numero_licencia: [
            '',
            [Validators.required, textoNoVacio],
          ],
          categoria_licencia: [
            '',
            [Validators.required, textoNoVacio],
          ],
          fecha_emision_licencia: [
            '',
            [Validators.required, fechaValida],
          ],
          fecha_vencimiento_licencia: [
            '',
            [Validators.required, fechaValida],
          ],
          estado_licencia: [
            '',
            [Validators.required, textoNoVacio],
          ],
          restricciones: [''],
          observacion: [''],
        },
        {
          validators: ordenFechasLicencia,
        },
      ),
    });
  }

  get formConductor(): FormGroup {
    return this.formPersonal.get('conductor') as FormGroup;
  }

  get conductorHabilitado(): boolean {
    return this.formPersonal.get('habilitar_conductor')?.value === true;
  }

  private sincronizarEstadoConductor(): void {
    if (!this.conductorHabilitado) {
      // Los campos ocultos no participan en la validación.
      this.formConductor.disable({ emitEvent: false });
      return;
    }

    this.formConductor.enable({ emitEvent: false });

    if (this.tienePerfilConductor) {
      this.formConductor
        .get('numero_licencia')
        ?.disable({ emitEvent: false });
    }

    this.formConductor.updateValueAndValidity({
      emitEvent: false,
    });
  }

  private resetearFormulario(): void {
    this.idPersonalPersistido = null;
    this.tienePerfilConductor = false;

    this.formPersonal.reset(
      {
        id_personal: null,
        id_usuario: null,
        codigo_empleado: '',
        fecha_ingreso: '',
        fecha_salida: '',
        tipo_contrato: 'CONTRATADO',
        turno_preferente: null,
        estado_laboral: null,
        observacion: '',

        habilitar_conductor: false,

        conductor: {
          numero_licencia: '',
          categoria_licencia: '',
          fecha_emision_licencia: '',
          fecha_vencimiento_licencia: '',
          estado_licencia: '',
          restricciones: '',
          observacion: '',
        },
      },
      { emitEvent: false },
    );

    this.sincronizarEstadoConductor();
  }

  private cargarPersonal(personal: PersonalOperativoData): void {
    const conductor = personal.conductor;

    this.idPersonalPersistido = personal.id_personal;
    this.tienePerfilConductor = !!conductor;

    this.formPersonal.reset(
      {
        id_personal: personal.id_personal,
        id_usuario: personal.id_usuario,
        codigo_empleado: personal.codigo_empleado,
        fecha_ingreso: personal.fecha_ingreso?.slice(0, 10) ?? '',
        fecha_salida: personal.fecha_salida?.slice(0, 10) ?? '',
        tipo_contrato: personal.tipo_contrato,
        turno_preferente: personal.turno_preferente ?? null,
        estado_laboral: personal.estado_laboral ?? null,
        observacion: personal.observacion ?? '',

        habilitar_conductor: !!conductor,

        conductor: {
          numero_licencia: conductor?.numero_licencia ?? '',
          categoria_licencia: conductor?.categoria_licencia ?? '',
          fecha_emision_licencia:
            conductor?.fecha_emision_licencia?.slice(0, 10) ?? '',
          fecha_vencimiento_licencia:
            conductor?.fecha_vencimiento_licencia?.slice(0, 10) ?? '',
          estado_licencia: conductor?.estado_licencia ?? '',
          restricciones: conductor?.restricciones ?? '',
          observacion: conductor?.observacion ?? '',
        },
      },
      { emitEvent: false },
    );

    this.sincronizarEstadoConductor();
  }

  // ============================================================
  // CREAR / ACTUALIZAR
  // ============================================================

  crearOEditarPersonal(): void {
    if (this.isLoading) {
      return;
    }

    this.normalizarCodigo();
    this.normalizarConductor();
    this.sincronizarEstadoConductor();

    if (this.formPersonal.invalid) {
      this.formPersonal.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }

    const form = this.formPersonal.getRawValue();

    const contratoValido = this.tiposContrato.some(
      (opcion) => opcion.value === form.tipo_contrato,
    );

    const turnoValido =
      form.turno_preferente === null ||
      this.turnosPreferentes.some(
        (opcion) => opcion.value === form.turno_preferente,
      );

    const estadoValido =
      form.estado_laboral === null ||
      this.estadosLaborales.some(
        (opcion) => opcion.value === form.estado_laboral,
      );

    if (!contratoValido || !turnoValido || !estadoValido) {
      void Swal.fire({
        icon: 'warning',
        title: 'Revisa las opciones seleccionadas',
        text: 'Selecciona un contrato, turno y estado válidos.',
      });

      return;
    }

    // Si una creación anterior guardó el personal pero falló el
    // conductor, el reintento actualizará ese mismo personal.
    const esActualizacion =
      this.modoEdicion || this.idPersonalPersistido !== null;

    const idPersonal =
      this.idPersonalPersistido ?? form.id_personal;

    if (
      esActualizacion &&
      !this.identificadorValido(idPersonal)
    ) {
      this.mostrarError(
        true,
        'Selecciona nuevamente el registro que deseas editar.',
      );

      return;
    }

    const payload: CreatePersonalOperativoRequest = {
      id_usuario: Number(form.id_usuario),
      codigo_empleado: form.codigo_empleado,
      fecha_ingreso: form.fecha_ingreso,
      fecha_salida: form.fecha_salida,
      tipo_contrato: form.tipo_contrato,
      turno_preferente: form.turno_preferente ?? null,
      observacion: String(form.observacion ?? '').trim() || null,

      ...(form.estado_laboral !== null
        ? { estado_laboral: form.estado_laboral }
        : {}),
    };

    // Se conserva tu contrato actual de actualización de personal.
    const solicitudPersonal$ = esActualizacion
      ? this.personalService.updatePersonal(idPersonal, payload)
      : this.personalService.createPersonal(payload);

    const guardarConductor = form.habilitar_conductor === true;
    const actualizarConductor = this.tienePerfilConductor;

    let personalGuardadoEnSolicitud = false;

    this.isLoading = true;
    this.cdr.markForCheck();

    solicitudPersonal$
      .pipe(
        switchMap((response) => {
          if (!response.success) {
            return throwError(
              () => new Error(
                response.message || 'No se pudo guardar el personal.',
              ),
            );
          }

          personalGuardadoEnSolicitud = true;

          const idGuardado = esActualizacion
            ? idPersonal
            : response.data?.id_personal;

          if (!this.identificadorValido(idGuardado)) {
            return throwError(
              () => new Error(
                'El backend guardó el personal, pero no devolvió un ID válido. ' +
                'Cierra el formulario y consulta el listado antes de reintentar.',
              ),
            );
          }

          this.idPersonalPersistido = idGuardado;

          this.formPersonal.patchValue(
            { id_personal: idGuardado },
            { emitEvent: false },
          );

          if (!guardarConductor) {
            return of(true);
          }

          const datosConductor = form.conductor;

          const payloadActualizacion: ActualizarConductorPayload = {
            categoria_licencia: datosConductor.categoria_licencia,
            fecha_emision_licencia: datosConductor.fecha_emision_licencia,
            fecha_vencimiento_licencia: datosConductor.fecha_vencimiento_licencia,
            estado_licencia: datosConductor.estado_licencia,
            restricciones: String(datosConductor.restricciones ?? '').trim() || null,
            observacion: String(datosConductor.observacion ?? '').trim() || null,
          };

          const payloadCreacion: CrearConductorPayload = {
            numero_licencia: datosConductor.numero_licencia,
            categoria_licencia: datosConductor.categoria_licencia,
            fecha_emision_licencia:              datosConductor.fecha_emision_licencia,
            fecha_vencimiento_licencia:              datosConductor.fecha_vencimiento_licencia,
            estado_licencia: datosConductor.estado_licencia,

            ...(payloadActualizacion.restricciones
              ? { restricciones: payloadActualizacion.restricciones }
              : {}),

            ...(payloadActualizacion.observacion
              ? { observacion: payloadActualizacion.observacion }
              : {}),
          };

          const solicitudConductor$ = actualizarConductor
            ? this.conductorService.updateConductor(
              idGuardado,
              payloadActualizacion,
            )
            : this.conductorService.createConductor(
              idGuardado,
              payloadCreacion,
            );

          return solicitudConductor$.pipe(
            map((responseConductor) => {
              if (!responseConductor.success) {
                throw new Error(
                  responseConductor.message ||
                  'No se pudo guardar el perfil de conductor.',
                );
              }

              this.tienePerfilConductor = true;
              return true;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.isLoading = false;

          void Swal.fire({
            icon: 'success',
            title: this.modoEdicion
              ? 'Personal operativo actualizado correctamente'
              : 'Personal operativo registrado correctamente',
            text: guardarConductor
              ? 'Los datos del conductor también fueron guardados.'
              : undefined,
          });

          this.cerrarModal();
          this.personalGuardado.emit();
        },

        error: (err) => {
          const mensaje = this.extraerMensajeError(err);

          if (personalGuardadoEnSolicitud) {
            // El personal ya existe aunque la segunda operación falle.
            this.personalGuardado.emit();

            void Swal.fire({
              icon: 'warning',
              title: 'El personal fue guardado',
              text:
                `${mensaje} ` +
                (this.idPersonalPersistido !== null
                  ? 'Puedes corregir los datos y volver a guardar; se utilizará el mismo personal.'
                  : 'Consulta el listado antes de volver a registrar el personal.'),
            });

            return;
          }

          this.mostrarError(esActualizacion, mensaje);
        },
      });
  }

  private mostrarError(esEdicion: boolean, mensaje: string): void {
    void Swal.fire({
      icon: 'error',
      title: esEdicion
        ? 'Error al actualizar personal'
        : 'Error al registrar personal',
      text: mensaje,
    });
  }

  private extraerMensajeError(error: any): string {
    const mensaje = error?.error?.message ?? error?.message;

    return typeof mensaje === 'string' && mensaje.trim()
      ? mensaje
      : 'No se pudo completar la operación.';
  }

  private identificadorValido(
    value: unknown,
  ): value is PersonalIdentificador {
    return (
      (typeof value === 'number' || typeof value === 'string') &&
      /^\d+$/.test(String(value)) &&
      Number(value) > 0
    );
  }

  // ============================================================
  // NORMALIZACIÓN
  // ============================================================

  normalizarCodigo(): void {
    const control = this.formPersonal.get('codigo_empleado');

    control?.setValue(
      String(control.value ?? '').trim().toUpperCase(),
      { emitEvent: false },
    );
  }

  private normalizarConductor(): void {
    if (!this.conductorHabilitado) {
      return;
    }

    const campos = [
      'numero_licencia',
      'categoria_licencia',
      'estado_licencia',
      'restricciones',
      'observacion',
    ];

    for (const campo of campos) {
      const control = this.formConductor.get(campo);

      control?.setValue(
        String(control.value ?? '').trim(),
        { emitEvent: false },
      );
    }
  }

  // ============================================================
  // HELPERS
  // ============================================================

  getCodigo(): void {
    this.personalService
      .getLastCodigoPersonal()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          if (
            !this.mostrarModal ||
            this.modoEdicion ||
            this.idPersonalPersistido !== null ||
            this.isLoading
          ) {
            return;
          }

          if (!resp.success || !resp.data?.codigo) {
            return;
          }

          this.formPersonal.patchValue(
            { codigo_empleado: resp.data.codigo },
            { emitEvent: false },
          );

          this.cdr.markForCheck();
        },

        error: (error) => {
          console.error(
            'Error al obtener el código del personal:',
            error,
          );
        },
      });
  }

  get usuarioSeleccionadoFueraDeLista(): boolean {
    const id = this.formPersonal.get('id_usuario')?.value;

    return (
      id !== null &&
      !this.usuariosDisponibles.some(
        (usuario) => String(usuario.id_usuario) === String(id),
      )
    );
  }

  campoInvalido(campo: string): boolean {
    const control = this.formPersonal.get(campo);

    return !!(
      control &&
      control.enabled &&
      control.invalid &&
      (control.touched || control.dirty)
    );
  }

  obtenerError(campo: string): string {
    const control = this.formPersonal.get(campo);

    if (!control || !this.campoInvalido(campo)) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }

    if (control.hasError('textoVacio')) {
      return 'Ingresa un valor válido.';
    }

    if (control.hasError('idInvalido')) {
      return 'Selecciona un usuario válido.';
    }

    if (control.hasError('fechaInvalida')) {
      return 'Ingresa una fecha válida.';
    }

    return 'Revisa el valor ingresado.';
  }

  get fechasLicenciaInvalidas(): boolean {
    return (
      this.conductorHabilitado &&
      this.formConductor.hasError('ordenFechasLicencia') &&
      (
        this.formConductor.get('fecha_emision_licencia')?.touched === true ||
        this.formConductor.get('fecha_vencimiento_licencia')?.touched === true
      )
    );
  }

  campoCompleto(campo: string): boolean {
    const control = this.formPersonal.get(campo);

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

  cerrarModal(): void {
    if (this.isLoading) {
      return;
    }

    this.resetearFormulario();
    this.modalCerrado.emit();
  }
}
// import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { finalize } from 'rxjs';
// import Swal from 'sweetalert2';

// // Directives
// import { UppercaseDirective } from 'src/app/shared/directives/uppercase.directive';


// // Services
// import { PersonalService } from 'src/app/features/personal/services/personal.service';

// // Interfaces
// import { CreatePersonalOperativoRequest, EstadoLaboralPersonal, PersonalOperativoData, TipoContratoPersonal, TurnoPreferentePersonal } from '../../../models/personal_operativo';
// import { UsuarioSelectorItem } from 'src/app/features/usuarios/interfaces';

// // ============================================================
// // OPCIONES PARA SELECTORES
// // ============================================================

// export interface UsuarioPersonalOption {
//   id_usuario: number;
//   nombre: string;
// }

// export interface PersonalSelectOption<T extends string> {
//   value: T;
//   label: string;
// }

// // ============================================================
// // VALIDADORES
// // ============================================================
// const textoNoVacio: ValidatorFn = (
//   control: AbstractControl,
// ): ValidationErrors | null => {
//   const value = control.value;

//   if (value === null || value === undefined || value === '') {
//     return null;
//   }

//   return typeof value === 'string' && value.trim().length > 0
//     ? null
//     : { textoVacio: true };
// };

// const idValido: ValidatorFn = (
//   control: AbstractControl,
// ): ValidationErrors | null => {
//   const value = control.value;

//   if (value === null || value === undefined || value === '') {
//     return null;
//   }

//   return Number.isInteger(Number(value)) && Number(value) > 0
//     ? null
//     : { idInvalido: true };
// };

// const fechaValida: ValidatorFn = (
//   control: AbstractControl,
// ): ValidationErrors | null => {
//   const value = control.value;

//   if (!value) {
//     return null;
//   }

//   if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
//     return { fechaInvalida: true };
//   }

//   const fecha = new Date(`${value}T00:00:00Z`);

//   return (
//     Number.isFinite(fecha.getTime()) &&
//     fecha.toISOString().slice(0, 10) === value
//   )
//     ? null
//     : { fechaInvalida: true };
// };

// @Component({
//   selector: 'personal-form',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     UppercaseDirective,
//   ],
//   templateUrl: './personal-form.component.html',
//   styles: ``,
//   changeDetection: ChangeDetectionStrategy.OnPush,
// })
// export class PersonalFormComponent implements OnChanges {
//   private readonly destroyRef = inject(DestroyRef);

//   // ============================================================
//   // INPUTS / OUTPUTS
//   // ============================================================
//   @Input() mostrarModal = false;
//   @Input() modoEdicion = false;
//   @Input() personalSeleccionado: PersonalOperativoData | null = null;
//   @Input() usuariosDisponibles: UsuarioSelectorItem[] = [];

//   @Input() tiposContrato: PersonalSelectOption<TipoContratoPersonal>[] = [];
//   @Input() turnosPreferentes: PersonalSelectOption<TurnoPreferentePersonal>[] = [];
//   @Input() estadosLaborales: PersonalSelectOption<EstadoLaboralPersonal>[] = [];

//   // Utilízalo si el usuario asignado ya no aparece en el listado.
//   @Input() nombreUsuarioSeleccionado = '';

//   @Output() modalCerrado = new EventEmitter<void>();

//   // Se emite tanto al crear como al actualizar.
//   @Output() personalGuardado = new EventEmitter<void>();

//   // ============================================================
//   // ESTADO
//   // ============================================================
//   readonly formPersonal: FormGroup;

//   isLoading = false;
//   modalWidthClass = 'max-w-4xl';

//   constructor(
//     private readonly fb: FormBuilder,
//     private readonly personalService: PersonalService,
//     private readonly cdr: ChangeDetectorRef,
//   ) {
//     this.formPersonal = this.crearFormulario();
//   }

//   // ============================================================
//   // CICLO DE VIDA
//   // ============================================================
//   ngOnChanges(changes: SimpleChanges): void {
//     if (!this.mostrarModal) {
//       if (changes['mostrarModal']) {
//         this.resetearFormulario();
//       }

//       return;
//     }

//     const debeSincronizar =
//       !!changes['mostrarModal'] ||
//       !!changes['modoEdicion'] ||
//       !!changes['personalSeleccionado'];

//     if (!debeSincronizar) {
//       return;
//     }

//     if (this.modoEdicion && this.personalSeleccionado) {
//       this.cargarPersonal(this.personalSeleccionado);
//       return;
//     }

//     this.resetearFormulario();
//     this.getCodigo();
//     this.setModalWidth('lg');
//   }

//   // ============================================================
//   // FORMULARIO
//   // ============================================================

//   private crearFormulario(): FormGroup {
//     return this.fb.group({
//       id_personal: [null],
//       id_usuario: [null, [Validators.required, idValido]],
//       codigo_empleado: ['', [Validators.required, textoNoVacio]],
//       fecha_ingreso: ['', [Validators.required, fechaValida]],
//       fecha_salida: ['', [Validators.required, fechaValida]],
//       tipo_contrato: ['CONTRATADO', [Validators.required]],
//       turno_preferente: [null],
//       estado_laboral: [null],
//       observacion: [''],
//     });
//   }

//   private resetearFormulario(): void {
//     this.formPersonal.reset({
//       id_personal: null,
//       id_usuario: null,
//       codigo_empleado: '',
//       fecha_ingreso: '',
//       fecha_salida: '',
//       tipo_contrato: null,
//       turno_preferente: null,
//       estado_laboral: null,
//       observacion: '',
//     });
//   }

//   private cargarPersonal(personal: PersonalOperativoData): void {
//     this.formPersonal.reset({
//       id_personal: personal.id_personal,
//       id_usuario: personal.id_usuario,
//       codigo_empleado: personal.codigo_empleado,
//       fecha_ingreso: personal.fecha_ingreso?.slice(0, 10) ?? '',
//       fecha_salida: personal.fecha_salida?.slice(0, 10) ?? '',
//       tipo_contrato: personal.tipo_contrato,
//       turno_preferente: personal.turno_preferente ?? null,
//       estado_laboral: personal.estado_laboral ?? null,
//       observacion: personal.observacion ?? '',
//     });
//   }

//   // ============================================================
//   // CREAR / ACTUALIZAR
//   // ============================================================
//   crearOEditarPersonal(): void {
//     if (this.isLoading) {
//       return;
//     }

//     this.normalizarCodigo();

//     if (this.formPersonal.invalid) {
//       this.formPersonal.markAllAsTouched();
//       return;
//     }

//     const form = this.formPersonal.getRawValue();

//     // Comprueba que los selectores contienen opciones permitidas.
//     const contratoValido = this.tiposContrato.some(
//       (opcion) => opcion.value === form.tipo_contrato,
//     );

//     const turnoValido = form.turno_preferente === null ||
//       this.turnosPreferentes.some(
//         (opcion) => opcion.value === form.turno_preferente,
//       );

//     const estadoValido = form.estado_laboral === null ||
//       this.estadosLaborales.some(
//         (opcion) => opcion.value === form.estado_laboral,
//       );

//     if (!contratoValido || !turnoValido || !estadoValido) {
//       void Swal.fire({
//         icon: 'warning',
//         title: 'Revisa las opciones seleccionadas',
//         text: 'Selecciona un contrato, turno y estado válidos.',
//       });

//       return;
//     }

//     const esEdicion = this.modoEdicion;
//     const idPersonal = Number(form.id_personal);

//     if (
//       esEdicion &&
//       (!Number.isInteger(idPersonal) || idPersonal <= 0)
//     ) {
//       void Swal.fire({
//         icon: 'error',
//         title: 'No se pudo identificar el personal',
//         text: 'Selecciona nuevamente el registro que deseas editar.',
//       });

//       return;
//     }

//     const payload: CreatePersonalOperativoRequest = {
//       id_usuario: Number(form.id_usuario),
//       codigo_empleado: form.codigo_empleado,
//       fecha_ingreso: form.fecha_ingreso,
//       fecha_salida: form.fecha_salida,
//       tipo_contrato: form.tipo_contrato,
//       turno_preferente: form.turno_preferente ?? null,
//       observacion: String(form.observacion ?? '').trim() || null,

//       // Si no se selecciona un estado, se omite para que
//       // el backend aplique su valor predeterminado.
//       ...(form.estado_laboral !== null
//         ? { estado_laboral: form.estado_laboral }
//         : {}),
//     };

//     // Supone que UpdatePersonalOperativoRequest acepta
//     // los campos presentes en CreatePersonalOperativoRequest.
//     const solicitud$ = esEdicion
//       ? this.personalService.updatePersonal(idPersonal, payload)
//       : this.personalService.createPersonal(payload);

//     this.isLoading = true;

//     solicitud$
//       .pipe(
//         takeUntilDestroyed(this.destroyRef),
//         finalize(() => {
//           this.isLoading = false;
//           this.cdr.markForCheck();
//         }),
//       )
//       .subscribe({
//         next: (response) => {
//           if (!response.success) {
//             this.mostrarError(
//               esEdicion,
//               response.message || 'La operación no fue completada.',
//             );
//             return;
//           }

//           this.isLoading = false;

//           void Swal.fire({
//             icon: 'success',
//             title: esEdicion
//               ? 'Personal operativo actualizado correctamente'
//               : 'Personal operativo registrado correctamente',
//           });

//           this.personalGuardado.emit();
//           this.cerrarModal();
//         },

//         error: (err) => {
//           const mensaje =
//             err?.error?.message ??
//             err?.message;

//           this.mostrarError(
//             esEdicion,
//             typeof mensaje === 'string' && mensaje.trim()
//               ? mensaje
//               : 'No se pudo guardar el personal operativo.',
//           );
//         },
//       });
//   }

//   private mostrarError(esEdicion: boolean, mensaje: string): void {
//     void Swal.fire({
//       icon: 'error',
//       title: esEdicion
//         ? 'Error al actualizar personal'
//         : 'Error al registrar personal',
//       text: mensaje,
//     });
//   }

//   // ============================================================
//   // HELPERS
//   // ============================================================
//   getCodigo(): void {
//     this.personalService
//       .getLastCodigoPersonal()
//       .subscribe({
//         next: (resp) => {
//           // Evita aplicar la respuesta si se cerró el modal
//           // o se cambió a modo edición mientras cargaba.
//           if (!this.mostrarModal || this.modoEdicion) {
//             return;
//           }

//           if (!resp.success || !resp.data?.codigo) {
//             return;
//           }

//           this.formPersonal.patchValue({
//             codigo_empleado: resp.data.codigo,
//           });

//           this.cdr.markForCheck();
//         },

//         error: (error) => {
//           console.error('Error al obtener el código del vehículo:', error);
//         },
//       });
//   }

//   normalizarCodigo(): void {
//     const control = this.formPersonal.get('codigo_empleado');

//     control?.setValue(
//       String(control.value ?? '').trim().toUpperCase(),
//       { emitEvent: false },
//     );
//   }

//   get usuarioSeleccionadoFueraDeLista(): boolean {
//     const id = this.formPersonal.get('id_usuario')?.value;

//     return (
//       id !== null &&
//       !this.usuariosDisponibles.some(
//         (usuario) => usuario.id_usuario === Number(id),
//       )
//     );
//   }

//   campoInvalido(campo: string): boolean {
//     const control = this.formPersonal.get(campo);

//     return !!(
//       control &&
//       control.invalid &&
//       (control.touched || control.dirty)
//     );
//   }

//   obtenerError(campo: string): string {
//     const control = this.formPersonal.get(campo);

//     if (!control || !this.campoInvalido(campo)) {
//       return '';
//     }

//     if (control.hasError('required')) {
//       return 'Este campo es obligatorio.';
//     }

//     if (control.hasError('textoVacio')) {
//       return 'Ingresa un valor válido.';
//     }

//     if (control.hasError('idInvalido')) {
//       return 'Selecciona un usuario válido.';
//     }

//     if (control.hasError('fechaInvalida')) {
//       return 'Ingresa una fecha válida.';
//     }

//     return 'Revisa el valor ingresado.';
//   }

//   setModalWidth(
//     size: 'sm' | 'md' | 'lg' | 'xl' | 'full',
//   ): void {
//     const clases = {
//       sm: 'max-w-md',
//       md: 'max-w-xl',
//       lg: 'max-w-4xl',
//       xl: 'max-w-6xl',
//       full: 'max-w-full w-[95vw]',
//     };

//     this.modalWidthClass = clases[size];
//   }

//   campoCompleto(campo: string): boolean {
//     const control = this.formPersonal.get(campo);

//     if (!control || !control.valid) {
//       return false;
//     }

//     const valor = control.value;

//     if (typeof valor === 'string') {
//       return valor.trim().length > 0;
//     }

//     if (Array.isArray(valor)) {
//       return valor.length > 0;
//     }

//     return valor !== null && valor !== undefined;
//   }

//   cerrarModal(): void {
//     if (this.isLoading) {
//       return;
//     }

//     this.resetearFormulario();
//     this.modalCerrado.emit();
//   }
// }
