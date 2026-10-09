import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

// Directives
import { UppercaseDirective } from 'src/app/shared/directives/uppercase.directive';

// Services
import { UsuarioService } from '../../../services/usuario.service';

// Interfaces
import { CreateUsuarioPersonaRequest, CreateUsuarioRequest, UpdateUsuarioRequest, UsuarioGenero, UsuarioIdentificador, UsuarioPaginadoItem, UsuarioRolOpcion, UsuarioTipoDocumento } from '../../../interfaces';

// ============================================================
// VALIDADORES
// ============================================================
const textoNoVacio: ValidatorFn = (control) => {
  const value = control.value;

  // Validators.required maneja los valores vacíos.
  if (value === null || value === undefined || value === '') {
    return null;
  }

  return typeof value === 'string' && value.trim().length > 0
    ? null
    : { textoVacio: true };
};

const opcionPermitida = (opciones: readonly string[]): ValidatorFn => (control) => {
  const value = control.value;

  // Permite campos opcionales y delega los obligatorios a required.
  if (value === null || value === undefined || value === '') {
    return null;
  }

  return opciones.includes(value)
    ? null
    : { opcionInvalida: true };
};

const identificadorValido = (value: unknown): value is UsuarioIdentificador => {
  if (typeof value !== 'number' && typeof value !== 'string') {
    return false;
  }

  if (typeof value === 'number' && !Number.isSafeInteger(value)) {
    return false;
  }

  const text = String(value);

  if (!/^[1-9]\d{0,18}$/.test(text)) {
    return false;
  }

  // Rango máximo de BIGINT firmado, sin convertir a Number.
  return text.length < 19 || text <= '9223372036854775807';
};

const rolesValidos: ValidatorFn = (control) => {
  const value = control.value;

  if (!Array.isArray(value)) {
    return { rolesInvalidos: true };
  }

  return value.every(identificadorValido)
    ? null
    : { rolesInvalidos: true };
};

const fechaValida: ValidatorFn = (control) => {
  const value = control.value;

  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { fechaInvalida: true };
  }

  const [anio, mes, dia] = value.split('-').map(Number);
  const fecha = new Date(0);

  fecha.setUTCHours(0, 0, 0, 0);
  fecha.setUTCFullYear(anio, mes - 1, dia);

  return (
    anio >= 1 &&
    fecha.getUTCFullYear() === anio &&
    fecha.getUTCMonth() === mes - 1 &&
    fecha.getUTCDate() === dia
  )
    ? null
    : { fechaInvalida: true };
};

const passwordValida: ValidatorFn = (control) => {
  const value = control.value;

  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    return { passwordInvalida: true };
  }

  if (value.length < 8) {
    return { passwordCorta: true };
  }

  // bcrypt admite como máximo 72 bytes.
  return new TextEncoder().encode(value).length <= 72
    ? null
    : { passwordLarga: true };
};

// ============================================================
// CATÁLOGO DE ROLES PARA EL SELECT O CHECKBOXES
// ============================================================
@Component({
  selector: 'usuario-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    UppercaseDirective,
  ],
  templateUrl: './usuario-form.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsuarioFormComponent implements OnChanges {

  // ============================================================
  // INPUTS / OUTPUTS
  // ============================================================
  @Input() mostrarModal = false;
  @Input() modoEdicion = false;
  @Input() usuarioSeleccionado: UsuarioPaginadoItem | null = null;

  // Enviar el catálogo real de roles desde el componente padre.
  @Input() rolesDisponibles: readonly UsuarioRolOpcion[] = [];

  // Se emite tanto después de crear como de actualizar.
  @Output() usuarioCreado = new EventEmitter<void>();
  @Output() modalCerrado = new EventEmitter<void>();

  // ============================================================
  // ESTADO
  // ============================================================

  private readonly destroyRef = inject(DestroyRef);
  readonly formUsuario: FormGroup;

  isLoading = false;
  mostrarPassword = false;
  modalWidthClass = 'max-w-4xl';

  // ============================================================
  // SELECTORES
  // ============================================================

  readonly tiposDocumento: {
    value: UsuarioTipoDocumento;
    label: string;
  }[] = [
      { value: 'DNI', label: 'DNI' },
      { value: 'RUC', label: 'RUC' },
      { value: 'CE', label: 'Carné de extranjería' },
      { value: 'PASAPORTE', label: 'Pasaporte' },
    ];

  readonly generos: {
    value: UsuarioGenero;
    label: string;
  }[] = [
      { value: 'M', label: 'Masculino' },
      { value: 'F', label: 'Femenino' },
      { value: 'OTRO', label: 'Otro' },
    ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly usuarioService: UsuarioService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.formUsuario = this.initFormulario();
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
      !!changes['usuarioSeleccionado'];

    if (!debeSincronizar) {
      return;
    }

    this.setModalWidth('lg');

    if (this.modoEdicion && this.usuarioSeleccionado) {
      this.cargarUsuario(this.usuarioSeleccionado);
    } else {
      this.resetearFormulario();
    }

    this.configurarCamposPorModo();
  }

  // ============================================================
  // FORMULARIO
  // ============================================================

  private initFormulario(): FormGroup {
    // Campos planos para simplificar los formControlName del HTML.
    // El objeto persona se construye al enviar el request.
    return this.fb.group({
      id_usuario: [null],

      username: ['', [Validators.required, textoNoVacio, Validators.maxLength(50)]],
      email_acceso: ['', [Validators.required, textoNoVacio, Validators.email, Validators.maxLength(150),]],
      password: ['', [Validators.required, passwordValida]],
      estado: [true],
      roles_ids: [[], [Validators.required, rolesValidos]],
      nombres: ['', [Validators.required, textoNoVacio, Validators.maxLength(100),]],
      apellidos: ['', [Validators.required, textoNoVacio, Validators.maxLength(100),]],
      tipo_documento: ['DNI', [Validators.required, opcionPermitida(this.tiposDocumento.map(opcion => opcion.value)),]],
      numero_documento: ['', [Validators.required, textoNoVacio, Validators.maxLength(20),]],
      email_contacto: ['', [Validators.email, Validators.maxLength(150)]],
      fecha_nacimiento: ['', fechaValida],
      celular: ['', Validators.maxLength(20)],
      direccion: ['', Validators.maxLength(255)],
      foto_url: ['', Validators.maxLength(255)],
      genero: [null, opcionPermitida(this.generos.map(opcion => opcion.value))],
    });
  }

  private resetearFormulario(): void {
    this.formUsuario.reset({
      id_usuario: null,

      username: '',
      email_acceso: '',
      password: '',
      estado: true,
      roles_ids: [],

      nombres: '',
      apellidos: '',
      tipo_documento: 'DNI',
      numero_documento: '',

      email_contacto: '',
      fecha_nacimiento: '',
      celular: '',
      direccion: '',
      foto_url: '',
      genero: null,
    });

    this.mostrarPassword = false;
    this.configurarCamposPorModo();
  }

  private cargarUsuario(usuario: UsuarioPaginadoItem): void {
    const persona = usuario.persona;

    this.formUsuario.reset({
      id_usuario: usuario.id_usuario,

      username: usuario.username,
      email_acceso: usuario.email_acceso,
      password: '',
      estado: usuario.estado,

      roles_ids: usuario.roles
        .filter(rol => rol.estado && rol.estado_asignacion)
        .map(rol => rol.id_rol),

      nombres: persona.nombres,
      apellidos: persona.apellidos,
      tipo_documento: persona.tipo_documento,
      numero_documento: persona.numero_documento,

      email_contacto: persona.email_contacto ?? '',
      fecha_nacimiento: persona.fecha_nacimiento ?? '',
      celular: persona.celular ?? '',
      direccion: persona.direccion ?? '',
      foto_url: persona.foto_url ?? '',
      genero: persona.genero ?? null,
    });

    this.mostrarPassword = false;
  }

  private configurarCamposPorModo(): void {
    for (const campo of ['password', 'roles_ids', 'estado']) {
      const control = this.formUsuario.get(campo);

      if (this.modoEdicion) {
        control?.disable({ emitEvent: false });
      } else {
        control?.enable({ emitEvent: false });
      }
    }
  }

  // ============================================================
  // CREAR / ACTUALIZAR
  // ============================================================
  crearOEditarUsuario(): void {
    if (this.isLoading) {
      return;
    }

    this.normalizarCamposTexto();

    if (this.formUsuario.invalid) {
      this.formUsuario.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }

    const form = this.formUsuario.getRawValue();
    const esEdicion = this.modoEdicion;

    if (esEdicion && !identificadorValido(form.id_usuario)) {
      void Swal.fire({
        icon: 'error',
        title: 'No se pudo identificar al usuario',
        text: 'Selecciona nuevamente el usuario que deseas editar.',
      });

      return;
    }

    const persona: CreateUsuarioPersonaRequest = {
      nombres: form.nombres,
      apellidos: form.apellidos,
      tipo_documento: form.tipo_documento,
      numero_documento: form.numero_documento,

      email_contacto: this.textoONull(form.email_contacto),
      fecha_nacimiento: this.textoONull(form.fecha_nacimiento),
      celular: this.textoONull(form.celular),
      direccion: this.textoONull(form.direccion),
      foto_url: this.textoONull(form.foto_url),
      genero: form.genero || null,
    };

    const payloadCrear: CreateUsuarioRequest = {
      username: form.username,
      email_acceso: form.email_acceso,
      password: form.password,
      estado: form.estado === true,
      roles_ids: [...form.roles_ids],
      persona,
    };

    const payloadActualizar: UpdateUsuarioRequest = {
      username: form.username,
      email_acceso: form.email_acceso,
      persona,
    };

    // Se conserva el identificador como number|string.
    // No convertir BIGINT a Number.
    const solicitud$ = esEdicion
      ? this.usuarioService.updateUsuario(
        form.id_usuario,
        payloadActualizar,
      )
      : this.usuarioService.createUsuario(payloadCrear);

    this.isLoading = true;

    solicitud$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response.success) {
            void Swal.fire({
              icon: 'error',
              title: esEdicion
                ? 'No se pudo actualizar el usuario'
                : 'No se pudo crear el usuario',
              text: response.message || 'La operación no fue completada.',
            });

            return;
          }

          this.isLoading = false;
          this.cerrarModal();
          this.usuarioCreado.emit();

          void Swal.fire({
            icon: 'success',
            title: esEdicion
              ? 'Usuario actualizado correctamente'
              : 'Usuario registrado correctamente',
          });
        },

        error: (error: unknown) => {
          void Swal.fire({
            icon: 'error',
            title: esEdicion
              ? 'Error al actualizar usuario'
              : 'Error al crear usuario',
            text: this.obtenerMensajeError(error),
          });
        },
      });
  }

  // ============================================================
  // ROLES
  // ============================================================
  rolSeleccionado(idRol: UsuarioIdentificador): boolean {
    const seleccionados: UsuarioIdentificador[] =
      this.formUsuario.get('roles_ids')?.value ?? [];

    return seleccionados.some(id => String(id) === String(idRol));
  }

  toggleRol(idRol: UsuarioIdentificador, event: Event): void {
    const control = this.formUsuario.get('roles_ids');
    const input = event.target as HTMLInputElement | null;

    if (!control || control.disabled || !input) {
      return;
    }

    const seleccionados: UsuarioIdentificador[] = control.value ?? [];

    const siguientes = input.checked
      ? this.rolSeleccionado(idRol)
        ? seleccionados
        : [...seleccionados, idRol]
      : seleccionados.filter(id => String(id) !== String(idRol));

    control.setValue(siguientes);
    control.markAsDirty();
    control.markAsTouched();
  }

  // ============================================================
  // NORMALIZACIÓN
  // ============================================================
  private normalizarCamposTexto(): void {
    for (const campo of ['nombres', 'apellidos', 'direccion']) {
      this.normalizarCampo(campo);
    }

    const form = this.formUsuario.getRawValue();

    this.formUsuario.patchValue(
      {
        username: String(form.username ?? '').trim().toLowerCase(),
        email_acceso: String(form.email_acceso ?? '').trim().toLowerCase(),
        email_contacto: String(form.email_contacto ?? '').trim().toLowerCase(),

        numero_documento: String(form.numero_documento ?? '')
          .trim()
          .toUpperCase(),

        celular: String(form.celular ?? '').trim(),
        foto_url: String(form.foto_url ?? '').trim(),
      },
      { emitEvent: false },
    );

    // La contraseña se conserva exactamente como fue ingresada.
  }

  normalizarCampo(
    campo: string,
    convertirMayusculas = false,
  ): void {
    if (campo === 'password') {
      return;
    }

    const control = this.formUsuario.get(campo);

    if (!control || typeof control.value !== 'string') {
      return;
    }

    const texto = control.value.trim().replace(/\s+/g, ' ');

    control.setValue(
      convertirMayusculas ? texto.toUpperCase() : texto,
      { emitEvent: false },
    );
  }

  private textoONull(value: unknown): string | null {
    const texto = String(value ?? '').trim();
    return texto || null;
  }

  // ============================================================
  // VALIDACIONES PARA EL HTML
  // ============================================================
  campoInvalido(campo: string): boolean {
    const control = this.formUsuario.get(campo);

    return !!(
      control &&
      control.enabled &&
      control.invalid &&
      (control.touched || control.dirty)
    );
  }

  campoCompleto(campo: string): boolean {
    const control = this.formUsuario.get(campo);

    if (!control || control.disabled || !control.valid) {
      return false;
    }

    const value = control.value;

    if (typeof value === 'string') {
      return value.trim().length > 0;
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return value !== null && value !== undefined;
  }

  esRequerido(campo: string): boolean {
    const control = this.formUsuario.get(campo);

    return !!(
      control?.enabled &&
      control.hasValidator(Validators.required)
    );
  }

  obtenerError(campo: string): string {
    const control = this.formUsuario.get(campo);

    if (!control || !this.campoInvalido(campo)) {
      return '';
    }

    if (control.hasError('required')) {
      return campo === 'roles_ids'
        ? 'Selecciona al menos un rol.'
        : 'Este campo es obligatorio.';
    }

    if (control.hasError('textoVacio')) {
      return 'Ingresa un valor válido.';
    }

    if (control.hasError('email')) {
      return 'Ingresa un correo electrónico válido.';
    }

    if (control.hasError('maxlength')) {
      const limite = control.getError('maxlength').requiredLength;
      return `Se permiten como máximo ${limite} caracteres.`;
    }

    if (control.hasError('opcionInvalida')) {
      return 'Selecciona una opción válida.';
    }

    if (control.hasError('rolesInvalidos')) {
      return 'Los identificadores de los roles no son válidos.';
    }

    if (control.hasError('fechaInvalida')) {
      return 'Ingresa una fecha válida en formato YYYY-MM-DD.';
    }

    if (control.hasError('passwordCorta')) {
      return 'La contraseña debe tener al menos 8 caracteres.';
    }

    if (control.hasError('passwordLarga')) {
      return 'La contraseña no puede superar los 72 bytes.';
    }

    return 'Revisa el valor ingresado.';
  }

  private obtenerMensajeError(error: unknown): string {
    const err = error as {
      error?: { message?: unknown } | string;
      message?: unknown;
    } | null;

    const mensajeBackend =
      typeof err?.error === 'string'
        ? err.error
        : err?.error?.message;

    const mensaje = mensajeBackend ?? err?.message;

    return typeof mensaje === 'string' && mensaje.trim()
      ? mensaje
      : 'No se pudo guardar el usuario. Intenta nuevamente.';
  }

  // ============================================================
  // HELPERS DEL MODAL
  // ============================================================

  get tituloModal(): string {
    return this.modoEdicion
      ? 'Editar usuario'
      : 'Registrar usuario';
  }

  get textoBotonGuardar(): string {
    if (this.isLoading) {
      return 'Guardando...';
    }

    return this.modoEdicion
      ? 'Actualizar usuario'
      : 'Registrar usuario';
  }

  soloNumeros(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  toggleMostrarPassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  setModalWidth(size: 'sm' | 'md' | 'lg' | 'xl' | 'full'): void {
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
