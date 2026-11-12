import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, distinctUntilChanged, finalize, map } from 'rxjs';

// Services
import { PublicScheduleService } from '../../services/public-schedule.service';
import { PublicQrService } from '../../services/public-qr.service';

// Interfaces
import { PublicZone, PublicRouteOption } from '../../models/public-catalog.model';
import { PublicQrView } from '../../models/public-qr.model';

// Componentes
import { PublicPageHeaderComponent } from '../../components/public-page-header/public-page-header.component';

import { HorarioPublicoVista, ScheduleCardComponent } from '../../components/schedule-card/schedule-card.component';

@Component({
  selector: 'app-cronograma-publicos-page',
  standalone: true,

  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    PublicPageHeaderComponent,
    ScheduleCardComponent,
  ],

  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cronograma-publicos-page.component.html',
})
export class CronogramaPublicosPageComponent implements OnInit {
  private readonly publicService = inject(PublicScheduleService);
  private readonly qrService = inject(PublicQrService);

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  private consultaRutas?: Subscription;
  private consultaInformacion?: Subscription;

  private zonaCargada: string | null = null;

  // ==========================================================
  // ESTADO
  // ==========================================================
  zonas: PublicZone[] = [];
  rutasDisponibles: PublicRouteOption[] = [];

  datos: PublicQrView | null = null;

  idZona = '';
  idRuta = '';
  idRutaQr = '';
  tokenPublico = '';

  cargandoZonas = false;
  cargandoRutas = false;
  isLoading = false;

  errorZonas = '';
  errorRutas = '';
  error = '';

  // ==========================================================
  // GETTERS
  // ==========================================================
  get rutaSeleccionada() {
    const rutas = this.datos?.rutas ?? [];

    if (this.tokenPublico) {
      return rutas.find(
        item => String(item.ruta.id_ruta) === this.idRutaQr,
      ) ?? rutas[0] ?? null;
    }

    return rutas[0] ?? null;
  }

  get horariosVista(): HorarioPublicoVista[] {
    return (this.rutaSeleccionada?.horarios ?? []).map(
      (horario, index) => ({
        id: String(index),
        dias: this.formatearEtiqueta(horario.dia_semana),
        horaInicio: horario.hora_inicio.slice(0, 5),
        horaFin: horario.hora_fin.slice(0, 5),
        detalle: this.formatearEtiqueta(horario.frecuencia),
      }),
    );
  }

  get parametrosConsulta() {
    return this.tokenPublico
      ? { qr: this.tokenPublico }
      : {
        zona: this.idZona || null,
        ruta: this.idRuta || null,
      };
  }

  // ==========================================================
  // CICLO DE VIDA
  // ==========================================================
  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(
        map(query => ({
          zona: (query.get('zona') || '').trim(),
          ruta: (query.get('ruta') || '').trim(),
          qr: (query.get('qr') || '').trim(),
        })),

        distinctUntilChanged(
          (anterior, actual) =>
            anterior.zona === actual.zona &&
            anterior.ruta === actual.ruta &&
            anterior.qr === actual.qr,
        ),

        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(contexto => {
        this.tokenPublico = contexto.qr;
        this.idZona = contexto.zona;
        this.idRuta = contexto.ruta;
        this.idRutaQr = '';

        if (!this.tokenPublico) {
          if (!this.zonas.length && !this.cargandoZonas) {
            this.cargarZonas();
          }

          if (this.zonaCargada !== this.idZona) {
            this.cargarRutas();
          }
        } else {
          // Cancela cualquier catálogo pendiente del modo manual.
          this.consultaRutas?.unsubscribe();
          this.zonaCargada = null;
          this.rutasDisponibles = [];
          this.errorRutas = '';
        }

        this.consultar();
      });
  }

  // ==========================================================
  // ZONAS
  // ==========================================================
  cargarZonas(): void {
    if (this.cargandoZonas) return;

    this.cargandoZonas = true;
    this.errorZonas = '';

    this.publicService.getZonas()
      .pipe(
        finalize(() => {
          this.cargandoZonas = false;
          this.cdr.markForCheck();
        }),

        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: response => {
          this.zonas = response.items;
        },

        error: (error: unknown) => {
          this.zonas = [];

          this.errorZonas = this.obtenerMensajeError(
            error,
            'No se pudieron cargar las zonas.',
          );
        },
      });
  }

  // ==========================================================
  // RUTAS
  // ==========================================================
  cargarRutas(): void {
    this.consultaRutas?.unsubscribe();

    this.zonaCargada = this.idZona;
    this.rutasDisponibles = [];
    this.errorRutas = '';

    if (!this.idZona) {
      this.cargandoRutas = false;
      this.cdr.markForCheck();
      return;
    }

    this.cargandoRutas = true;

    this.consultaRutas = this.publicService
      .getRutasPorZona(this.idZona)
      .pipe(
        finalize(() => {
          this.cargandoRutas = false;
          this.cdr.markForCheck();
        }),

        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: response => {
          this.rutasDisponibles = response.items;
        },

        error: (error: unknown) => {
          this.errorRutas = this.obtenerMensajeError(
            error,
            'No se pudieron cargar las rutas.',
          );
        },
      });
  }

  // ==========================================================
  // CONSULTAR CRONOGRAMA
  // ==========================================================
  consultar(): void {
    this.consultaInformacion?.unsubscribe();

    this.datos = null;
    this.error = '';

    if (!this.tokenPublico && !this.idRuta) {
      this.isLoading = false;
      this.cdr.markForCheck();
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    const consulta = this.tokenPublico
      ? this.qrService.consultar(this.tokenPublico)
      : this.publicService.consultar(this.idRuta);

    this.consultaInformacion = consulta
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),

        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: response => {
          this.datos = response;

          if (
            !response.rutas.some(
              item =>
                String(item.ruta.id_ruta) === this.idRutaQr,
            )
          ) {
            this.idRutaQr = String(
              response.rutas[0]?.ruta.id_ruta ?? '',
            );
          }
        },

        error: (error: unknown) => {
          this.error = this.obtenerMensajeError(
            error,
            'No se pudo consultar el cronograma.',
          );
        },
      });
  }

  // ==========================================================
  // SELECCIÓN
  // ==========================================================
  cambiarZona(idZona: string): void {
    void this.router.navigate([], {
      relativeTo: this.route,

      queryParams: {
        zona: idZona || null,
        ruta: null,
        qr: null,
      },

      queryParamsHandling: 'merge',
    });
  }

  cambiarRuta(idRuta: string): void {
    void this.router.navigate([], {
      relativeTo: this.route,

      queryParams: {
        zona: this.idZona || null,
        ruta: idRuta || null,
        qr: null,
      },

      queryParamsHandling: 'merge',
    });
  }

  // ==========================================================
  // UTILIDADES
  // ==========================================================
  formatearEtiqueta(valor: string): string {
    const texto = valor.replace(/_/g, ' ').toLocaleLowerCase('es-PE');

    return texto.charAt(0).toLocaleUpperCase('es-PE') +
      texto.slice(1);
  }

  private obtenerMensajeError(
    error: unknown,
    respaldo: string,
  ): string {
    const texto = (valor: unknown): string | null =>
      typeof valor === 'string' && valor.trim()
        ? valor.trim()
        : null;

    if (!error || typeof error !== 'object') {
      return texto(error) ?? respaldo;
    }

    const objeto = error as {
      message?: unknown;
      error?: unknown;
      details?: { message?: unknown };
    };

    const interno =
      objeto.error && typeof objeto.error === 'object'
        ? objeto.error as { message?: unknown }
        : null;

    return texto(objeto.details?.message) ??
      texto(interno?.message) ??
      texto(objeto.message) ??
      texto(objeto.error) ??
      respaldo;
  }
}

// import {
//   ChangeDetectionStrategy,
//   Component,
//   computed,
//   signal,
// } from '@angular/core';

// import {
//   PublicPageHeaderComponent,
// } from '../../components/public-page-header/public-page-header.component';

// import {
//   SectorInformationCardComponent,
// } from '../../components/sector-information-card/sector-information-card.component';

// import {
//   ScheduleCardComponent,
// } from '../../components/schedule-card/schedule-card.component';

// import {
//   NextCollectionCardComponent,
// } from '../../components/next-collection-card/next-collection-card.component';
// import { RUTAS_PUBLICAS_DEMO } from '../public-demo-data/public-demo-data.component';



// @Component({
//   selector: 'app-cronograma-publicos-page',
//   standalone: true,
//   imports: [
//     PublicPageHeaderComponent,
//     SectorInformationCardComponent,
//     ScheduleCardComponent,
//     NextCollectionCardComponent,
//   ],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   templateUrl: './cronograma-publicos-page.component.html',
// })
// export class CronogramaPublicosPageComponent {
//   readonly rutas = RUTAS_PUBLICAS_DEMO;
//   readonly idRuta = signal(this.rutas[0].idRuta);

//   // Mes fijo para poder revisar los datos de demostración.
//   readonly mes = signal('2026-11');

//   readonly ruta = computed(
//     () => this.rutas.find(
//       (item) => item.idRuta === this.idRuta(),
//     ) ?? this.rutas[0],
//   );

//   readonly serviciosMes = computed(
//     () => this.ruta().servicios.filter(
//       (servicio) => servicio.fecha.startsWith(`${this.mes()}-`),
//     ),
//   );

//   readonly mesLabel = computed(() => {
//     const [year, month] = this.mes().split('-').map(Number);

//     return new Intl.DateTimeFormat('es-PE', {
//       month: 'long',
//       year: 'numeric',
//       timeZone: 'UTC',
//     }).format(new Date(Date.UTC(year, month - 1, 1)));
//   });

//   seleccionarMes(event: Event): void {
//     const value = (event.target as HTMLInputElement).value;

//     if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return;

//     const year = Number(value.slice(0, 4));

//     if (year >= 2000 && year <= 2100) {
//       this.mes.set(value);
//     }
//   }
// }
