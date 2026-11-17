import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, PLATFORM_ID, SimpleChanges, ViewChild, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription, finalize } from 'rxjs';

// Services
import { IncidenciasService } from '../../../services/incidencias.service';
import { AuthStorageService } from 'src/app/core/auth/auth-storage.service';

// Interfaces
import { IncidenciaId, IncidenciaListadoItem } from '../../../interfaces';
import { IncidenciaArchivoListadoItem } from '../../../interfaces/get-incidencia-archivo-listado.incidencia';

@Component({
  selector: 'incidencia-archivos-form',
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],

  templateUrl: './incidencia-archivos-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidenciaArchivosFormComponent
  implements OnChanges, AfterViewInit, OnDestroy {

  // ==========================================================
  // ENTRADAS Y EVENTOS
  // ==========================================================
  @Input() mostrarModal = false;
  @Input() incidencia: IncidenciaListadoItem | null = null;

  @Output() modalCerrado = new EventEmitter<void>();

  @Output() archivosGuardados =
    new EventEmitter<IncidenciaArchivoListadoItem[]>();

  @ViewChild('dialogo', { static: true })
  private dialogo?: ElementRef<HTMLDialogElement>;

  // ==========================================================
  // CONFIGURACIÓN
  // ==========================================================
  readonly maxArchivos = 10;
  readonly maxBytes = 5 * 1024 * 1024;

  readonly accept =
    '.jpg,.jpeg,.png,.webp,.pdf';

  private readonly tiposPermitidos = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ]);

  // ==========================================================
  // ESTADO
  // ==========================================================
  incidenciaActual: IncidenciaListadoItem | null = null;
  archivos: File[] = [];

  isSaving = false;
  errorArchivos = '';
  errorMensaje = '';

  private esGestor = false;
  private usuarioId: IncidenciaId | null = null;

  private consultaGuardado?: Subscription;
  private destruido = false;

  private readonly platformId = inject(PLATFORM_ID);
  private readonly fb = inject(FormBuilder);

  readonly archivosForm = this.fb.nonNullable.group({
    descripcion: ['', Validators.maxLength(500)],
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
  // PERMISOS
  // ==========================================================
  private cargarPermisos(): void {
    this.esGestor = this.authStorage.getRoles().some(
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

  get puedeAdjuntar(): boolean {
    const incidencia = this.incidenciaActual;

    if (
      !incidencia ||
      !this.idValido(incidencia.id_incidencia) ||
      !incidencia.estado ||
      ![
        'REPORTADA',
        'EN_REVISION',
        'EN_ATENCION',
      ].includes(incidencia.estado_incidencia)
    ) {
      return false;
    }

    const esPropia = this.usuarioId !== null &&
      String(this.usuarioId) ===
      String(incidencia.id_usuario_reporte);

    return this.esGestor || esPropia;
  }

  get puedeGuardar(): boolean {
    return this.puedeAdjuntar &&
      !this.isSaving &&
      this.archivos.length > 0 &&
      this.archivos.length <= this.maxArchivos &&
      this.archivosForm.valid;
  }

  get totalBytes(): number {
    return this.archivos.reduce(
      (total, archivo) => total + archivo.size,
      0,
    );
  }

  // ==========================================================
  // SELECCIONAR ARCHIVOS
  // ==========================================================
  seleccionarArchivos(event: Event): void {
    const input = event.target as HTMLInputElement;
    const seleccionados = Array.from(input.files ?? []);

    // Permite seleccionar nuevamente el mismo archivo.
    input.value = '';

    if (
      this.isSaving ||
      !this.puedeAdjuntar ||
      !seleccionados.length
    ) {
      return;
    }

    this.errorArchivos = '';
    this.errorMensaje = '';

    const nuevos: File[] = [];

    for (const archivo of seleccionados) {
      const error = this.validarArchivo(archivo);

      if (error) {
        // Conserva la selección anterior si el nuevo lote es inválido.
        this.errorArchivos = error;
        return;
      }

      const duplicado = [...this.archivos, ...nuevos].some(
        existente =>
          existente.name === archivo.name &&
          existente.size === archivo.size &&
          existente.lastModified === archivo.lastModified,
      );

      if (!duplicado) {
        nuevos.push(archivo);
      }
    }

    if (this.archivos.length + nuevos.length > this.maxArchivos) {
      this.errorArchivos =
        `Puedes enviar como máximo ${this.maxArchivos} archivos por solicitud.`;

      return;
    }

    this.archivos = [...this.archivos, ...nuevos];
  }

  quitarArchivo(index: number): void {
    if (this.isSaving) return;

    this.archivos = this.archivos.filter(
      (_, posicion) => posicion !== index,
    );

    this.errorArchivos = '';
    this.errorMensaje = '';
  }

  private validarArchivo(archivo: File): string | null {
    if (!archivo.name.trim() || archivo.name.length > 255) {
      return 'El nombre de uno de los archivos no es válido.';
    }

    if (!this.tiposPermitidos.has(archivo.type.toLowerCase())) {
      return `"${archivo.name}": solo se permiten JPEG, PNG, WebP y PDF.`;
    }

    if (archivo.size === 0) {
      return `"${archivo.name}" está vacío.`;
    }

    if (archivo.size > this.maxBytes) {
      return `"${archivo.name}" supera el máximo de 5 MB.`;
    }

    return null;
  }

  // ==========================================================
  // GUARDAR
  // ==========================================================
  guardar(): void {
    if (this.isSaving || !this.mostrarModal) return;

    this.errorMensaje = '';
    this.errorArchivos = '';

    const descripcion = this.archivosForm.controls
      .descripcion.value.trim();

    this.archivosForm.controls.descripcion
      .setValue(descripcion);

    this.archivosForm.markAllAsTouched();

    if (!this.puedeAdjuntar || !this.incidenciaActual) {
      this.errorMensaje =
        'No puedes adjuntar evidencias a esta incidencia. Debe estar habilitada, abierta y dentro de tus permisos.';

      return;
    }

    if (!this.puedeGuardar) {
      this.errorMensaje =
        'Selecciona archivos válidos y revisa la descripción.';

      return;
    }

    for (const archivo of this.archivos) {
      const error = this.validarArchivo(archivo);

      if (error) {
        this.errorArchivos = error;
        return;
      }
    }

    const id = this.incidenciaActual.id_incidencia;

    this.isSaving = true;

    this.consultaGuardado = this.incidenciasService
      .agregarIncidenciaArchivos(
        id,
        this.archivos,
        descripcion,
      )
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
              'No se pudieron registrar las evidencias.';

            return;
          }

          this.archivos = [];

          this.archivosGuardados.emit(response.data);
        },

        error: (error: unknown) => {
          // Conserva los archivos para revisar o reintentar.
          this.errorMensaje = this.obtenerMensajeError(
            error,
            'No se pudieron registrar las evidencias.',
          );
        },
      });
  }

  private reiniciarFormulario(): void {
    this.archivos = [];
    this.errorArchivos = '';
    this.errorMensaje = '';

    this.archivosForm.reset({
      descripcion: '',
    });
  }

  // ==========================================================
  // PRESENTACIÓN
  // ==========================================================
  formatearTamano(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
