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
  takeUntil,
} from 'rxjs';

import {
  PublicPageHeaderComponent,
} from '../../components/public-page-header/public-page-header.component';

import {
  PublicScheduleService,
} from '../../services/public-schedule.service';

import {
  PublicRouteOption,
  PublicZone,
} from '../../models/public-catalog.model';

interface ReporteVistaPrevia {
  sector: string;
  ruta: string;
  tipo: string;
  referencia: string;
  descripcion: string;
}

@Component({
  selector: 'app-reportar-problema-page',
  standalone: true,

  imports: [
    ReactiveFormsModule,
    PublicPageHeaderComponent,
  ],

  changeDetection: ChangeDetectionStrategy.OnPush,

  templateUrl: './reportar-problema-page.component.html',
})
export class ReportarProblemaPageComponent
  implements OnInit, OnDestroy {

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly catalogo = inject(PublicScheduleService);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly destroy$ = new Subject<void>();

  private rutasSub?: Subscription;

  zonas: PublicZone[] = [];
  rutas: PublicRouteOption[] = [];

  cargandoZonas = false;
  cargandoRutas = false;

  errorZonas = '';
  errorRutas = '';
  errorValidacion = '';

  vistaPrevia: ReporteVistaPrevia | null = null;

  readonly tipos = [
    'Recolección no realizada',
    'Residuos acumulados',
    'Problema durante el recorrido',
    'Otro',
  ];

  readonly form = this.fb.group({
    idZona: ['', Validators.required],
    idRuta: ['', Validators.required],
    tipo: ['', Validators.required],

    referencia: [
      '',
      [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(200),
        Validators.pattern(/\S(?:[\s\S]*\S)?/),
      ],
    ],

    descripcion: [
      '',
      [
        Validators.required,
        Validators.minLength(15),
        Validators.maxLength(1500),
        Validators.pattern(/\S(?:[\s\S]*\S)?/),
      ],
    ],
  });

  ngOnInit(): void {
    // Evitar conservar una vista previa desactualizada.
    this.form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.vistaPrevia = null;
        this.errorValidacion = '';
      });

    this.cargarZonas();
  }

  // *********************************************************
  // CATÁLOGOS REALES
  // *********************************************************

  cargarZonas(): void {
    if (this.cargandoZonas) return;

    this.cargandoZonas = true;
    this.errorZonas = '';

    this.catalogo.getZonas()
      .pipe(
        takeUntil(this.destroy$),

        finalize(() => {
          this.cargandoZonas = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: response => {
          this.zonas = response.items;
        },

        error: (error: unknown) => {
          this.errorZonas = this.obtenerMensajeError(
            error,
            'No se pudieron cargar los sectores.',
          );
        },
      });
  }

  cambiarZona(): void {
    this.cargarRutas();
  }

  cargarRutas(): void {
    // Cancelar la consulta del sector anterior.
    this.rutasSub?.unsubscribe();

    this.rutas = [];
    this.errorRutas = '';
    this.errorValidacion = '';
    this.vistaPrevia = null;

    this.form.controls.idRuta.reset('');

    const idZona = this.form.controls.idZona.value;

    if (!idZona) {
      this.cargandoRutas = false;
      this.cdr.markForCheck();
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
        next: response => {
          if (this.form.controls.idZona.value !== idZona) {
            return;
          }

          // Permitir reportar también sobre una ruta inactiva
          // que el catálogo público siga ofreciendo.
          this.rutas = response.items.filter(
            ruta => String(ruta.id_zona) === idZona,
          );
        },

        error: (error: unknown) => {
          this.errorRutas = this.obtenerMensajeError(
            error,
            'No se pudieron cargar las rutas del sector.',
          );
        },
      });
  }

  // *********************************************************
  // VISTA PREVIA
  // *********************************************************

  previsualizar(): void {
    this.vistaPrevia = null;
    this.errorValidacion = '';

    if (this.cargandoZonas || this.cargandoRutas) return;

    this.form.patchValue({
      referencia: this.form.controls.referencia.value.trim(),
      descripcion: this.form.controls.descripcion.value.trim(),
    });

    this.form.markAllAsTouched();

    if (this.form.invalid) return;

    const datos = this.form.getRawValue();

    const zona = this.zonas.find(
      item => String(item.id_zona) === datos.idZona,
    );

    const ruta = this.rutas.find(
      item =>
        String(item.id_ruta) === datos.idRuta &&
        String(item.id_zona) === datos.idZona,
    );

    if (!zona || !ruta) {
      this.errorValidacion =
        'Selecciona un sector y una ruta de ese sector.';
      return;
    }

    if (!this.tipos.includes(datos.tipo)) {
      this.errorValidacion =
        'Selecciona un tipo de problema válido.';
      return;
    }

    this.vistaPrevia = {
      sector: zona.nombre,
      ruta: `${ruta.codigo} · ${ruta.nombre}`,
      tipo: datos.tipo,
      referencia: datos.referencia,
      descripcion: datos.descripcion,
    };
  }

  // *********************************************************
  // UTILIDADES
  // *********************************************************

  invalido(campo: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[campo];

    return control.touched && control.invalid;
  }

  private obtenerMensajeError(
    error: unknown,
    respaldo: string,
  ): string {
    const err = error as {
      error?: {
        message?: unknown;
      };
      message?: unknown;
    } | null;

    const mensaje = err?.error?.message ?? err?.message;

    return typeof mensaje === 'string' && mensaje.trim()
      ? mensaje
      : respaldo;
  }

  ngOnDestroy(): void {
    this.rutasSub?.unsubscribe();

    this.destroy$.next();
    this.destroy$.complete();
  }
}
