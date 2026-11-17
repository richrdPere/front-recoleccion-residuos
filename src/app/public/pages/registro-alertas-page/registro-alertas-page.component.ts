import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';

import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  Subject,
  Subscription,
  finalize,
  forkJoin,
  takeUntil,
} from 'rxjs';

import {
  PublicPageHeaderComponent,
} from '../../components/public-page-header/public-page-header.component';

import {
  PublicScheduleService,
} from '../../services/public-schedule.service';

import {
  ConsentimientoAlertas,
  PublicCitizenService,
  RegistroAlertaPublicaRequest,
} from '../../services/public-citizen.service';

import {
  PublicRouteOption,
  PublicZone,
} from '../../models/public-catalog.model';

@Component({
  selector: 'app-registro-alertas-page',
  standalone: true,

  imports: [
    ReactiveFormsModule,
    PublicPageHeaderComponent,
  ],

  changeDetection: ChangeDetectionStrategy.OnPush,

  templateUrl:
    './registro-alertas-page.component.html',
})
export class RegistroAlertasPageComponent
  implements OnInit, OnDestroy {

  private readonly fb =
    inject(NonNullableFormBuilder);

  private readonly catalogo =
    inject(PublicScheduleService);

  private readonly ciudadano =
    inject(PublicCitizenService);

  private readonly cdr =
    inject(ChangeDetectorRef);

  private readonly destroy$ =
    new Subject<void>();

  private rutasSub?: Subscription;

  private claveRegistro = '';
  private firmaIntento = '';

  zonas: PublicZone[] = [];
  rutas: PublicRouteOption[] = [];

  consentimiento:
    ConsentimientoAlertas | null = null;

  cargandoInicial = false;
  cargandoRutas = false;
  isSaving = false;

  registrado = false;

  mensaje = '';
  errorMensaje = '';

  readonly form = this.fb.group({
    nombre: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100),
        Validators.pattern(/\S(?:[\s\S]*\S)?/),
      ],
    ],

    celular: [
      '',
      [
        Validators.required,
        Validators.pattern(/^9\d{8}$/),
      ],
    ],

    idZona: ['', Validators.required],
    idRuta: ['', Validators.required],

    inicio: true,
    cambios: true,
    incidencias: true,

    acepta: [
      false,
      Validators.requiredTrue,
    ],
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  // *********************************************************
  // CATÁLOGO REAL Y CONSENTIMIENTO
  // *********************************************************

  cargarDatos(): void {
    if (this.cargandoInicial || this.isSaving) {
      return;
    }

    this.cargandoInicial = true;
    this.errorMensaje = '';

    forkJoin({
      zonas: this.catalogo.getZonas(),

      consentimiento:
        this.ciudadano.getConfiguracion(),
    })
      .pipe(
        takeUntil(this.destroy$),

        finalize(() => {
          this.cargandoInicial = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: resultado => {
          this.zonas = resultado.zonas.items;

          this.consentimiento =
            resultado.consentimiento;
        },

        error: error => {
          this.errorMensaje =
            this.obtenerMensajeError(error);
        },
      });
  }

  cambiarZona(): void {
    if (this.isSaving || this.registrado) {
      return;
    }

    this.rutasSub?.unsubscribe();

    this.rutas = [];
    this.form.controls.idRuta.setValue('');

    this.errorMensaje = '';

    const idZona =
      this.form.controls.idZona.value;

    if (!idZona) {
      this.cargandoRutas = false;
      return;
    }

    this.cargandoRutas = true;

    this.rutasSub = this.catalogo
      .getRutasPorZona(idZona)
      .pipe(
        takeUntil(this.destroy$),

        finalize(() => {
          this.cargandoRutas = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: resultado => {
          if (
            this.form.controls.idZona.value !==
            idZona
          ) {
            return;
          }

          // El catálogo también admite rutas inactivas
          // para consultas; aquí solo ofrecemos activas.
          this.rutas = resultado.items.filter(
            ruta => ruta.estado_ruta === 'ACTIVA',
          );
        },

        error: error => {
          this.errorMensaje =
            this.obtenerMensajeError(error);
        },
      });
  }

  // *********************************************************
  // REGISTRO REAL
  // *********************************************************

  registrar(): void {
    if (
      this.isSaving ||
      this.registrado ||
      this.cargandoInicial ||
      this.cargandoRutas
    ) {
      return;
    }

    this.errorMensaje = '';
    this.mensaje = '';

    this.form.patchValue({
      nombre:
        this.form.controls.nombre.value.trim(),

      celular:
        this.form.controls.celular.value.trim(),
    });

    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const consentimiento =
      this.consentimiento;

    if (!consentimiento) {
      this.errorMensaje =
        'No se pudo cargar el consentimiento. ' +
        'Recarga los datos antes de registrarte.';

      return;
    }

    const datos = this.form.getRawValue();

    if (
      !datos.inicio &&
      !datos.cambios &&
      !datos.incidencias
    ) {
      this.errorMensaje =
        'Selecciona al menos un tipo de aviso.';

      return;
    }

    const ruta = this.rutas.find(
      item =>
        String(item.id_ruta) === datos.idRuta &&
        String(item.id_zona) === datos.idZona,
    );

    if (!ruta) {
      this.errorMensaje =
        'Selecciona una ruta del sector indicado.';

      return;
    }

    const contenido = {
      nombre: datos.nombre,
      celular: datos.celular,

      id_zona: Number(datos.idZona),
      id_ruta: Number(datos.idRuta),

      inicio: datos.inicio,
      cambios: datos.cambios,
      incidencias: datos.incidencias,

      acepta: datos.acepta,

      version_consentimiento:
        consentimiento.version,
    };

    const firma = JSON.stringify(contenido);

    try {
      // Reutilizar la clave si se reintenta el mismo
      // contenido después de un error de conexión.
      if (
        !this.claveRegistro ||
        this.firmaIntento !== firma
      ) {
        this.claveRegistro = this.crearClave();
        this.firmaIntento = firma;
      }
    } catch {
      this.errorMensaje =
        'El navegador no pudo preparar el registro. ' +
        'Prueba con un navegador actualizado.';

      return;
    }

    const request:
      RegistroAlertaPublicaRequest = {
      ...contenido,

      clave_registro:
        this.claveRegistro,
    };

    this.isSaving = true;
    this.form.disable({
      emitEvent: false,
    });

    this.ciudadano
      .registrar(request)
      .pipe(
        takeUntil(this.destroy$),

        finalize(() => {
          this.isSaving = false;

          if (!this.registrado) {
            this.form.enable({
              emitEvent: false,
            });
          }

          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: resultado => {
          this.registrado = true;

          this.mensaje =
            'Tus datos y preferencias fueron guardados. ' +
            'Falta habilitar y vincular las notificaciones ' +
            'de este navegador.';

          // Se conserva la referencia para el próximo
          // paso de vinculación. No guardar nombre/celular.
          try {
            localStorage.setItem(
              'recoleccion_alertas_registro_v1',

              JSON.stringify({
                id_suscripcion:
                  resultado.id_suscripcion,

                clave_registro:
                  this.claveRegistro,
              }),
            );
          } catch {
            // El registro del servidor ya fue confirmado.
            this.mensaje +=
              ' El navegador no pudo conservar ' +
              'la referencia local del registro.';
          }
        },

        error: error => {
          this.errorMensaje =
            this.obtenerMensajeError(error);
        },
      });
  }

  // *********************************************************
  // HELPERS
  // *********************************************************

  invalido(
    campo: keyof typeof this.form.controls,
  ): boolean {
    const control = this.form.controls[campo];

    return control.touched && control.invalid;
  }

  private crearClave(): string {
    const bytes = crypto.getRandomValues(
      new Uint8Array(16),
    );

    bytes[6] =
      (bytes[6] & 0x0f) | 0x40;

    bytes[8] =
      (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(
      bytes,

      valor =>
        valor.toString(16).padStart(2, '0'),
    ).join('');

    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20),
    ].join('-');
  }

  private obtenerMensajeError(
    error: unknown,
  ): string {
    const err = error as {
      error?: {
        message?: string;
      };

      message?: string;
    } | null;

    return (
      err?.error?.message ||
      err?.message ||
      'No se pudo completar el registro.'
    );
  }

  ngOnDestroy(): void {
    this.rutasSub?.unsubscribe();

    this.destroy$.next();
    this.destroy$.complete();
  }
}
