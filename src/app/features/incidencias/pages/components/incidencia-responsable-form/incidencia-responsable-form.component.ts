import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, PLATFORM_ID, SimpleChanges, ViewChild, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription, finalize } from 'rxjs';

// Services
import { IncidenciasService } from '../../../services/incidencias.service';
import { UsuarioService } from 'src/app/features/usuarios/services/usuario.service';

// Interfaces
import { IncidenciaDetalleData, IncidenciaId, IncidenciaListadoItem } from '../../../interfaces';
import { UsuarioSelectorItem } from 'src/app/features/usuarios/interfaces/get-usuario-selector.interface';

@Component({
  selector: 'incidencia-responsable-form',
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],

  templateUrl: './incidencia-responsable-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidenciaResponsableFormComponent implements OnChanges, AfterViewInit, OnDestroy {

  // ==========================================================
  // ENTRADAS Y EVENTOS
  // ==========================================================
  @Input() mostrarModal = false;
  @Input() incidencia: IncidenciaListadoItem | null = null;

  @Output() modalCerrado = new EventEmitter<void>();
  @Output() guardado =    new EventEmitter<IncidenciaDetalleData>();

  @ViewChild('dialogo', { static: true })
  private dialogo?: ElementRef<HTMLDialogElement>;

  // Copia de la selección que se está gestionando.
  incidenciaActual: IncidenciaListadoItem | null = null;

  usuarios: UsuarioSelectorItem[] = [];

  isLoadingUsuarios = false;
  isSaving = false;

  errorUsuarios = '';
  errorMensaje = '';

  private consultaUsuarios?: Subscription;
  private consultaGuardado?: Subscription;

  private destruido = false;

  private readonly platformId = inject(PLATFORM_ID);
  private readonly fb = inject(FormBuilder);

  readonly busquedaUsuario =
    this.fb.nonNullable.control('');

  readonly responsableForm = this.fb.group({
    id_responsable: this.fb.control<string | null>(
      null,
      Validators.required,
    ),

    retirar_responsable: this.fb.nonNullable.control(false),
  });

  constructor(
    private readonly incidenciasService: IncidenciasService,
    private readonly usuarioService: UsuarioService,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  // ==========================================================
  // CICLO DE VIDA
  // ==========================================================
  ngOnChanges(changes: SimpleChanges): void {
    if (!this.mostrarModal) {
      this.consultaUsuarios?.unsubscribe();
      this.sincronizarDialogo();
      return;
    }

    // No reiniciar un formulario mientras guarda.
    if (this.isSaving) return;

    const seAbrio =
      changes['mostrarModal']?.currentValue === true;

    if (seAbrio || changes['incidencia']) {
      this.consultaUsuarios?.unsubscribe();

      this.incidenciaActual = this.incidencia
        ? { ...this.incidencia }
        : null;

      this.reiniciarFormulario();

      if (this.incidenciaEditable) {
        this.cargarUsuarios();
      }
    }

    this.sincronizarDialogo();
  }

  ngAfterViewInit(): void {
    this.sincronizarDialogo();
  }

  ngOnDestroy(): void {
    this.destruido = true;

    this.consultaUsuarios?.unsubscribe();
    this.consultaGuardado?.unsubscribe();

    if (
      isPlatformBrowser(this.platformId) &&
      this.dialogo?.nativeElement.open
    ) {
      this.dialogo.nativeElement.close();
    }
  }

  // ==========================================================
  // GETTERS
  // ==========================================================
  get incidenciaEditable(): boolean {
    const incidencia = this.incidenciaActual;

    return !!incidencia &&
      this.idValido(incidencia.id_incidencia) &&
      incidencia.estado &&
      [
        'REPORTADA',
        'EN_REVISION',
        'EN_ATENCION',
      ].includes(incidencia.estado_incidencia);
  }

  get responsableActual(): string {
    const incidencia = this.incidenciaActual;

    if (incidencia?.id_responsable == null) {
      return 'Sin responsable asignado';
    }

    return incidencia.responsable?.username ||
      `Usuario #${incidencia.id_responsable}`;
  }

  get puedeRetirar(): boolean {
    return this.incidenciaEditable &&
      this.incidenciaActual?.id_responsable != null &&
      this.incidenciaActual.estado_incidencia !== 'EN_ATENCION';
  }

  get retirando(): boolean {
    return this.responsableForm.controls
      .retirar_responsable.value;
  }

  get puedeGuardar(): boolean {
    if (
      !this.incidenciaEditable ||
      this.isSaving ||
      this.responsableForm.invalid
    ) {
      return false;
    }

    if (this.retirando) {
      return this.puedeRetirar;
    }

    const id = this.responsableForm.controls.id_responsable.value;

    return !this.isLoadingUsuarios &&
      id !== null &&
      this.usuarios.some(
        usuario => String(usuario.id_usuario) === id,
      ) &&
      id !== String(this.incidenciaActual?.id_responsable);
  }

  // ==========================================================
  // SELECTOR DE USUARIOS
  // ==========================================================
  cargarUsuarios(): void {
    if (
      !this.mostrarModal ||
      this.isSaving ||
      !this.incidenciaEditable ||
      this.retirando
    ) {
      return;
    }

    this.consultaUsuarios?.unsubscribe();

    // Una nueva búsqueda requiere seleccionar nuevamente.
    this.responsableForm.controls.id_responsable.reset(null);

    this.usuarios = [];
    this.errorUsuarios = '';
    this.isLoadingUsuarios = true;

    const search = this.busquedaUsuario.value.trim();

    this.consultaUsuarios = this.usuarioService
      .getUsuarioSelector({
        search: search || undefined,
        limit: 50,
      })
      .pipe(
        finalize(() => {
          this.isLoadingUsuarios = false;

          if (!this.destruido) {
            this.cdr.markForCheck();
          }
        }),
      )
      .subscribe({
        next: response => {
          if (!response.success) {
            this.errorUsuarios = response.message ||
              'No se pudieron consultar los usuarios.';

            return;
          }

          this.usuarios = response.data;
        },

        error: (error: unknown) => {
          this.errorUsuarios = this.obtenerMensajeError(
            error,
            'No se pudieron consultar los usuarios.',
          );
        },
      });
  }

  // ==========================================================
  // RETIRAR RESPONSABLE
  // ==========================================================
  onRetirarChange(): void {
    const control = this.responsableForm.controls.id_responsable;

    this.errorMensaje = '';

    if (this.retirando && this.puedeRetirar) {
      this.consultaUsuarios?.unsubscribe();

      control.reset(null);
      control.clearValidators();
      control.disable();
    } else {
      this.responsableForm.controls
        .retirar_responsable.setValue(false);

      control.enable();
      control.setValidators(Validators.required);
      control.reset(null);
    }

    control.updateValueAndValidity();
  }

  // ==========================================================
  // GUARDAR
  // ==========================================================
  guardar(): void {
    if (this.isSaving || !this.mostrarModal) return;

    this.errorMensaje = '';
    this.responsableForm.markAllAsTouched();

    if (!this.incidenciaEditable || !this.incidenciaActual) {
      this.errorMensaje =
        'La incidencia debe estar habilitada y abierta para cambiar su responsable.';

      return;
    }

    if (!this.puedeGuardar) {
      this.errorMensaje = this.retirando
        ? 'No se puede retirar al responsable de esta incidencia.'
        : 'Selecciona un usuario válido distinto del responsable actual.';

      return;
    }

    const idIncidencia = this.incidenciaActual.id_incidencia;

    const idResponsable = this.retirando
      ? null
      : this.responsableForm.controls.id_responsable.value;

    this.isSaving = true;

    this.consultaGuardado = this.incidenciasService
      .asignarResponsable(idIncidencia, {
        id_responsable: idResponsable,
      })
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
              'No se pudo actualizar el responsable.';

            return;
          }

          // El padre cierra el modal y actualiza el listado.
          this.guardado.emit(response.data);
        },

        error: (error: unknown) => {
          this.errorMensaje = this.obtenerMensajeError(
            error,
            'No se pudo actualizar el responsable.',
          );
        },
      });
  }

  // ==========================================================
  // FORMULARIO
  // ==========================================================
  private reiniciarFormulario(): void {
    const control = this.responsableForm.controls.id_responsable;

    control.enable();
    control.setValidators(Validators.required);

    this.responsableForm.reset({
      id_responsable: null,
      retirar_responsable: false,
    });

    control.updateValueAndValidity();

    this.busquedaUsuario.reset('');

    this.usuarios = [];
    this.errorUsuarios = '';
    this.errorMensaje = '';
  }

  private idValido(id: IncidenciaId): boolean {
    return typeof id === 'number'
      ? Number.isSafeInteger(id) && id > 0
      : /^[1-9]\d*$/.test(id);
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
    this.consultaUsuarios?.unsubscribe();

    if (!this.destruido && this.mostrarModal) {
      this.modalCerrado.emit();
    }
  }

  // ==========================================================
  // ERRORES
  // ==========================================================
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
