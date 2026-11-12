import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ChangeDetectorRef, EventEmitter, Output, Input } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';
import Swal from 'sweetalert2';

// Directives
import { UppercaseDirective } from 'src/app/shared/directives/uppercase.directive';

// Services
import { CodigosQrService } from '../../../services/codigos-qr.service';
import { ZonasServices } from 'src/app/features/zonas/services/zonas.service';
import { RutasServices } from 'src/app/features/rutas/services/rutas.service';

// Interfaces
import { CrearCodigoQrData, CrearCodigoQrRequest, TipoRecursoQr } from '../../../interfaces/codigos-qr';
import { ZonaData } from 'src/app/features/zonas/interfaces';
import { RutaPorZonaData } from 'src/app/features/rutas/interfaces/rutas';


@Component({
  selector: 'codigo-qr-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    UppercaseDirective,
  ],
  templateUrl: './codigo-qr-form.component.html',
  styles: ``,
})
export class CodigoQrFormComponent implements OnInit, OnDestroy {

  // Eventos
  @Input() mostrarModal = false;

  @Output() cerrar = new EventEmitter<void>();
  @Output() guardado = new EventEmitter<CrearCodigoQrData>();

  // Formulario
  readonly codigoQrForm;

  isSaving = false;
  errorMensaje = '';

  // Selectores
  zonasDisponibles: ZonaData[] = [];
  rutasDisponibles: RutaPorZonaData[] = [];

  isLoadingZonas = false;
  isLoadingRutas = false;
  modalWidthClass = 'max-w-4xl';

  errorZonas = '';
  errorRutas = '';

  // Suscripciones
  private readonly suscripciones = new Subscription();
  private consultaRutas?: Subscription;

  constructor(
    private readonly fb: FormBuilder,
    private readonly codigosQrService: CodigosQrService,
    private readonly zonaService: ZonasServices,
    private readonly rutaService: RutasServices,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.codigoQrForm = this.fb.group({
      tipo_recurso: this.fb.nonNullable.control<TipoRecursoQr>(
        'RUTA',
        Validators.required,
      ),

      // En RUTA, la zona se utiliza para cargar sus rutas.
      id_zona: this.fb.control<number | null>(
        null,
        Validators.required,
      ),

      id_ruta: this.fb.control<number | null>(
        null,
        Validators.required,
      ),

      titulo: this.fb.nonNullable.control(
        '',
        Validators.required,
      ),

      descripcion: this.fb.nonNullable.control(''),
      fecha_expiracion: this.fb.nonNullable.control(''),
      observacion: this.fb.nonNullable.control(''),
    });
  }

  ngOnInit(): void {
    this.cargarZonas();
  }

  ngOnDestroy(): void {
    this.consultaRutas?.unsubscribe();
    this.suscripciones.unsubscribe();
  }

  // ================================
  // Methods
  // ================================

  cargarZonas(): void {
    if (this.isLoadingZonas) {
      return;
    }

    this.isLoadingZonas = true;
    this.errorZonas = '';

    const suscripcion = this.zonaService
      .getZonasActivas()
      .pipe(
        finalize(() => {
          this.isLoadingZonas = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response.success) {
            this.zonasDisponibles = [];
            this.errorZonas = response.message ||
              'No se pudieron cargar las zonas activas.';
            return;
          }

          this.zonasDisponibles = this.normalizarListado<ZonaData>(
            response.data,
          );
        },

        error: (error: unknown) => {
          this.zonasDisponibles = [];

          this.errorZonas = this.obtenerMensajeError(
            error,
            'No se pudieron cargar las zonas activas.',
          );
        },
      });

    this.suscripciones.add(suscripcion);
  }

  cargarRutasPorZona(idZona: number): void {
    // Cancela la consulta anterior antes de iniciar otra.
    this.consultaRutas?.unsubscribe();

    this.rutasDisponibles = [];
    this.errorRutas = '';
    this.isLoadingRutas = true;

    this.consultaRutas = this.rutaService
      .getRutasByZona(idZona)
      .pipe(
        finalize(() => {
          this.isLoadingRutas = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response.success) {
            this.errorRutas = response.message ||
              'No se pudieron cargar las rutas de la zona.';
            return;
          }

          this.rutasDisponibles =
            this.normalizarListado<RutaPorZonaData>(
              response.data,
            );
        },

        error: (error: unknown) => {
          this.errorRutas = this.obtenerMensajeError(
            error,
            'No se pudieron cargar las rutas de la zona.',
          );
        },
      });
  }

  guardar(): void {
    if (this.isSaving) {
      return;
    }

    this.errorMensaje = '';

    // Evita títulos compuestos únicamente por espacios.
    const titulo = this.codigoQrForm.controls.titulo.value.trim();

    this.codigoQrForm.controls.titulo.setValue(titulo);
    this.codigoQrForm.markAllAsTouched();

    if (
      this.codigoQrForm.invalid ||
      this.isLoadingZonas ||
      this.isLoadingRutas ||
      this.errorZonas ||
      (this.esRuta && this.errorRutas)
    ) {
      return;
    }

    const valores = this.codigoQrForm.getRawValue();
    const idZona = valores.id_zona;
    const idRuta = valores.id_ruta;

    // Comprueba que la zona pertenece al selector cargado.
    if (
      idZona === null ||
      !this.zonasDisponibles.some(
        (zona) => zona.id_zona === idZona,
      )
    ) {
      this.errorMensaje = 'Selecciona una zona válida.';
      return;
    }

    let fechaExpiracion: string | null = null;

    if (valores.fecha_expiracion) {
      // datetime-local representa la hora local del navegador.
      const fecha = new Date(valores.fecha_expiracion);

      if (
        Number.isNaN(fecha.getTime()) ||
        fecha.getTime() <= Date.now()
      ) {
        this.codigoQrForm.controls.fecha_expiracion.setErrors({
          fechaFutura: true,
        });

        return;
      }

      fechaExpiracion = fecha.toISOString();
    }

    const camposComunes = {
      titulo,
      descripcion: valores.descripcion.trim(),
      fecha_expiracion: fechaExpiracion,
      observacion: 'Código QR creado para la consulta pública del servicio de recolección.',
    };

    let request: CrearCodigoQrRequest;

    if (valores.tipo_recurso === 'RUTA') {
      if (
        idRuta === null ||
        !this.rutasDisponibles.some(
          (ruta) => ruta.id_ruta === idRuta,
        )
      ) {
        this.errorMensaje =
          'Selecciona una ruta válida de la zona elegida.';
        return;
      }

      request = {
        ...camposComunes,
        tipo_recurso: 'RUTA',
        id_ruta: idRuta,
      };
    } else {
      request = {
        ...camposComunes,
        tipo_recurso: 'ZONA',
        id_zona: idZona,
      };
    }

    this.isSaving = true;
    this.cdr.markForCheck();

    const suscripcion = this.codigosQrService
      .crearCodigoQr(request)
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response.success) {
            this.errorMensaje = response.message ||
              'No se pudo crear el código QR.';
            return;
          }

          void Swal.fire({
            icon: 'success',
            title: 'Código QR creado',
            text: response.message ||
              'El código QR fue creado correctamente.',
            timer: 2000,
            showConfirmButton: false,
          });

          this.guardado.emit(response.data);
        },

        error: (error: unknown) => {
          this.errorMensaje = this.obtenerMensajeError(
            error,
            'No se pudo crear el código QR.',
          );

          void Swal.fire({
            icon: 'error',
            title: 'No se pudo crear el código QR',
            text: this.errorMensaje,
            confirmButtonText: 'Aceptar',
          });
        },
      });

    this.suscripciones.add(suscripcion);
  }

  // ================================
  // Helpers methods
  // ================================
  esRequerido(campo: string): boolean {
    return (
      this.codigoQrForm
        .get(campo)
        ?.hasValidator(Validators.required) ?? false
    );
  }

  campoCompleto(campo: string): boolean {
    const control = this.codigoQrForm.get(campo);

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

  get esRuta(): boolean {
    return this.codigoQrForm.controls.tipo_recurso.value === 'RUTA';
  }

  onTipoRecursoChange(): void {
    this.errorMensaje = '';

    const controlRuta = this.codigoQrForm.controls.id_ruta;

    controlRuta.reset(null);

    if (this.esRuta) {
      controlRuta.setValidators(Validators.required);
    } else {
      controlRuta.clearValidators();
    }

    controlRuta.updateValueAndValidity();

    this.onZonaChange();
  }

  onZonaChange(): void {
    this.consultaRutas?.unsubscribe();

    this.codigoQrForm.controls.id_ruta.reset(null);

    this.rutasDisponibles = [];
    this.errorRutas = '';
    this.errorMensaje = '';

    const idZona = this.codigoQrForm.controls.id_zona.value;

    if (this.esRuta && idZona !== null) {
      this.cargarRutasPorZona(idZona);
    }
  }

  reintentarRutas(): void {
    const idZona = this.codigoQrForm.controls.id_zona.value;

    if (this.esRuta && idZona !== null) {
      this.cargarRutasPorZona(idZona);
    }
  }

  limpiarErrorFecha(): void {
    this.codigoQrForm.controls.fecha_expiracion
      .updateValueAndValidity();
  }

  private normalizarListado<T>(
    data: T | T[] | null | undefined,
  ): T[] {
    if (data === null || data === undefined) {
      return [];
    }

    return Array.isArray(data) ? data : [data];
  }

  private obtenerMensajeError(
    error: unknown,
    mensajePorDefecto: string,
  ): string {
    const textoValido = (valor: unknown): string | null =>
      typeof valor === 'string' && valor.trim()
        ? valor.trim()
        : null;

    const obtenerMessage = (valor: unknown): string | null => {
      if (!valor || typeof valor !== 'object') {
        return null;
      }

      return textoValido(
        (valor as { message?: unknown }).message,
      );
    };

    const mensajeDirecto = textoValido(error);

    if (mensajeDirecto) {
      return mensajeDirecto;
    }

    if (!error || typeof error !== 'object') {
      return mensajePorDefecto;
    }

    const objeto = error as {
      details?: unknown;
      error?: unknown;
      message?: unknown;
    };

    return obtenerMessage(objeto.details) ??
      obtenerMessage(objeto.error) ??
      textoValido(objeto.message) ??
      textoValido(objeto.error) ??
      mensajePorDefecto;
  }

  seleccionarTipoRecurso(
    tipo: 'ZONA' | 'RUTA',
    event: Event,
  ): void {
    const checkbox = event.target as HTMLInputElement;

    // Siempre debe permanecer una opción seleccionada.
    checkbox.checked = true;

    const control = this.codigoQrForm.controls.tipo_recurso;

    if (control.value === tipo) {
      return;
    }

    control.setValue(tipo);
    control.markAsDirty();
    control.markAsTouched();

    this.onTipoRecursoChange();
  }

  // ================================
  // Modal methods
  // ================================

  cerrarModal(): void {
    if (this.isSaving) {
      return;
    }

    this.cerrar.emit();
  }

}
