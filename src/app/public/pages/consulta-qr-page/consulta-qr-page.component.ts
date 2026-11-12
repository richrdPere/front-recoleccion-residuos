import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';

import { DOCUMENT, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  EMPTY,
  Subject,
  Subscription,
  catchError,
  combineLatest,
  distinctUntilChanged,
  exhaustMap,
  filter,
  finalize,
  fromEvent,
  map,
  merge,
  of,
  switchMap,
  takeWhile,
  timer,
} from 'rxjs';

// Services
import { PublicQrService } from '../../services/public-qr.service';
import { PublicScheduleService } from '../../services/public-schedule.service';

// Interfaces
import {
  PublicQrView,
} from '../../models/public-qr.model';

import {
  PublicRouteOption,
  PublicZone,
} from '../../models/public-catalog.model';

// Componentes
import {
  PublicRouteMapComponent,
} from '../../components/public-route-map/public-route-map.component';

@Component({
  selector: 'app-consulta-qr-page',
  standalone: true,

  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    PublicRouteMapComponent,
  ],

  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './consulta-qr-page.component.html',
})
export class ConsultaQrPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly qrService = inject(PublicQrService);
  private readonly publicService = inject(PublicScheduleService);

  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly actualizar$ = new Subject<void>();

  private consultaRutas?: Subscription;
  private zonaCargada: string | null = null;

  token = '';

  zonas: PublicZone[] = [];
  rutasDisponibles: PublicRouteOption[] = [];

  idZona = '';
  idRutaConsulta = '';

  // Selección interna cuando un QR devuelve varias rutas.
  idRuta = '';

  cargando = false;
  cargandoZonas = false;
  cargandoRutas = false;

  error = '';
  errorCatalogo = '';

  datos: PublicQrView | null = null;

  // ==========================================================
  // GETTERS
  // ==========================================================
  get ruta() {
    const rutas = this.datos?.rutas ?? [];

    return rutas.find(
      item => String(item.ruta.id_ruta) === this.idRuta,
    ) ?? rutas[0] ?? null;
  }

  get ubicacion() {
    const ubicacion = this.ruta?.ubicacion;

    if (!ubicacion?.disponible) {
      return null;
    }

    const vencimiento = Date.parse(ubicacion.valida_hasta);

    if (
      !Number.isFinite(vencimiento) ||
      vencimiento <= Date.now()
    ) {
      return null;
    }

    return ubicacion;
  }

  get mensajeUbicacion(): string {
    const ubicacion = this.ruta?.ubicacion;

    if (!ubicacion) return '';

    if (!ubicacion.disponible) {
      return ubicacion.mensaje;
    }

    return this.ubicacion
      ? 'La ubicación del vehículo es aproximada.'
      : 'La ubicación perdió vigencia. Esperando una nueva actualización.';
  }

  get parametrosConsulta() {
    return this.token
      ? { qr: this.token }
      : {
        zona: this.idZona || null,
        ruta: this.idRutaConsulta || null,
      };
  }

  // ==========================================================
  // CICLO DE VIDA
  // ==========================================================
  ngOnInit(): void {
    this.cargarZonas();

    // Reevalúa la vigencia del marcador aunque falle el servidor.
    timer(0, 1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cdr.markForCheck());

    combineLatest([
      this.route.paramMap,
      this.route.queryParamMap,
    ])
      .pipe(
        map(([params, query]) => ({
          token: (
            params.get('tokenPublico') ||
            query.get('qr') ||
            ''
          ).trim(),

          zona: (query.get('zona') || '').trim(),
          ruta: (query.get('ruta') || '').trim(),
        })),

        distinctUntilChanged(
          (anterior, actual) =>
            anterior.token === actual.token &&
            anterior.zona === actual.zona &&
            anterior.ruta === actual.ruta,
        ),

        switchMap(contexto => {
          this.token = contexto.token;
          this.idZona = contexto.zona;
          this.idRutaConsulta = contexto.ruta;

          this.datos = null;
          this.error = '';
          this.idRuta = '';

          if (!this.token && this.zonaCargada !== this.idZona) {
            this.cargarRutas(this.idZona);
          }

          this.cdr.markForCheck();

          if (!this.token && !this.idRutaConsulta) {
            return EMPTY;
          }

          return merge(
            of(null),
            timer(15000, 15000),
            this.actualizar$,

            fromEvent(this.document, 'visibilitychange').pipe(
              filter(
                () => this.document.visibilityState === 'visible',
              ),
            ),
          ).pipe(
            filter(
              () => this.document.visibilityState !== 'hidden',
            ),

            // Evita consultas simultáneas de actualización.
            exhaustMap(() => {
              this.cargando = true;
              this.cdr.markForCheck();

              const consulta = contexto.token
                ? this.qrService.consultar(contexto.token)
                : this.publicService.consultar(contexto.ruta);

              return consulta.pipe(
                map(datos => ({
                  datos,
                  mensaje: '',
                  detener: false,
                })),

                catchError((error: unknown) => {
                  const status = (
                    error as { status?: number } | null
                  )?.status ?? 0;

                  return of({
                    datos: null,

                    mensaje: this.obtenerMensajeError(
                      error,
                      'No se pudo actualizar la información. Se volverá a intentar.',
                    ),

                    detener: [400, 404, 410].includes(status),
                  });
                }),

                finalize(() => {
                  this.cargando = false;
                  this.cdr.markForCheck();
                }),
              );
            }),

            // Detiene las consultas de recursos inválidos o retirados.
            takeWhile(resultado => !resultado.detener, true),
          );
        }),

        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(resultado => {
        this.error = resultado.mensaje;
        this.datos = resultado.datos;

        const rutas = resultado.datos?.rutas ?? [];

        if (
          !rutas.some(
            item => String(item.ruta.id_ruta) === this.idRuta,
          )
        ) {
          this.idRuta = String(
            rutas[0]?.ruta.id_ruta ?? '',
          );
        }

        this.cdr.markForCheck();
      });
  }

  // ==========================================================
  // CATÁLOGOS
  // ==========================================================
  cargarZonas(): void {
    this.cargandoZonas = true;
    this.errorCatalogo = '';

    this.publicService.getZonas()
      .pipe(
        finalize(() => {
          this.cargandoZonas = false;
          this.cdr.markForCheck();
        }),

        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: data => {
          this.zonas = data.items;
        },

        error: (error: unknown) => {
          this.zonas = [];

          this.errorCatalogo = this.obtenerMensajeError(
            error,
            'No se pudieron cargar las zonas.',
          );
        },
      });
  }

  private cargarRutas(idZona: string): void {
    this.consultaRutas?.unsubscribe();

    this.zonaCargada = idZona;
    this.rutasDisponibles = [];
    this.errorCatalogo = '';

    if (!idZona) {
      this.cargandoRutas = false;
      return;
    }

    this.cargandoRutas = true;

    this.consultaRutas = this.publicService
      .getRutasPorZona(idZona)
      .pipe(
        finalize(() => {
          this.cargandoRutas = false;
          this.cdr.markForCheck();
        }),

        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: data => {
          this.rutasDisponibles = data.items;
        },

        error: (error: unknown) => {
          this.errorCatalogo = this.obtenerMensajeError(
            error,
            'No se pudieron cargar las rutas.',
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

  seleccionarRuta(id: string): void {
    this.idRuta = id;
  }

  actualizar(): void {
    this.actualizar$.next();
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

    if (!error || typeof error !== 'object') {
      return texto(error) ?? respaldo;
    }

    const objeto = error as {
      message?: unknown;
      details?: { message?: unknown };
      error?: unknown;
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

// import { ChangeDetectionStrategy, Component, DestroyRef, DOCUMENT, OnInit, computed, inject, signal } from '@angular/core';
// import { DatePipe } from '@angular/common';
// import { ActivatedRoute, Router, RouterLink } from '@angular/router';
// import { HttpErrorResponse } from '@angular/common/http';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { EMPTY, Subject, catchError, combineLatest, distinctUntilChanged, exhaustMap, filter, finalize, fromEvent, map, merge, of, switchMap, takeWhile, timer } from 'rxjs';

// // Services
// import { PublicQrService } from '../../services/public-qr.service';

// // Interfaces
// import { PublicQrView } from '../../models/public-qr.model';

// // Componentes
// import { PublicRouteMapComponent } from '../../components/public-route-map/public-route-map.component';

// @Component({
//   selector: 'app-consulta-qr-page',
//   standalone: true,

//   imports: [
//     DatePipe,
//     RouterLink,
//     PublicRouteMapComponent,
//   ],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   templateUrl: './consulta-qr-page.component.html',
// })
// export class ConsultaQrPageComponent implements OnInit {

//   private readonly route = inject(ActivatedRoute);
//   private readonly router = inject(Router);
//   private readonly servicio = inject(PublicQrService);
//   private readonly destroyRef = inject(DestroyRef);
//   private readonly document = inject(DOCUMENT);

//   private readonly actualizar$ =    new Subject<void>();

//   private readonly ahora = signal(Date.now());

//   readonly token = signal('');
//   readonly entrada = signal('');
//   readonly cargando = signal(false);
//   readonly error = signal('');
//   readonly datos = signal<PublicQrView | null>(null);
//   readonly idRuta = signal('');

//   readonly ruta = computed(() => {
//     const rutas = this.datos()?.rutas ?? [];

//     return rutas.find(
//       (item) =>
//         String(item.ruta.id_ruta) === this.idRuta(),
//     ) ?? rutas[0] ?? null;
//   });

//   readonly ubicacion = computed(() => {
//     const ubicacion = this.ruta()?.ubicacion;

//     if (
//       !ubicacion?.disponible ||
//       !Number.isFinite(
//         Date.parse(ubicacion.valida_hasta),
//       ) ||
//       Date.parse(ubicacion.valida_hasta) <=
//       this.ahora()
//     ) {
//       return null;
//     }

//     return ubicacion;
//   });

//   readonly mensajeUbicacion = computed(() => {
//     const ubicacion = this.ruta()?.ubicacion;

//     if (!ubicacion) {
//       return '';
//     }

//     if (!ubicacion.disponible) {
//       return ubicacion.mensaje;
//     }

//     return this.ubicacion()
//       ? 'La ubicación del vehículo es aproximada.'
//       : 'La ubicación perdió vigencia. Esperando una nueva actualización.';
//   });

//   ngOnInit(): void {
//     // Retirar el marcador aunque falle la siguiente consulta.
//     timer(0, 1000)
//       .pipe(
//         takeUntilDestroyed(this.destroyRef),
//       )
//       .subscribe(() => {
//         this.ahora.set(Date.now());
//       });

//     combineLatest([
//       this.route.paramMap,
//       this.route.queryParamMap,
//     ])
//       .pipe(
//         map(([params, query]) =>
//           (
//             params.get('tokenPublico') ||
//             query.get('qr') ||
//             ''
//           ).trim(),
//         ),

//         distinctUntilChanged(),

//         switchMap((token) => {
//           this.token.set(token);
//           this.entrada.set(token);
//           this.datos.set(null);
//           this.error.set('');
//           this.idRuta.set('');

//           if (!token) {
//             return EMPTY;
//           }

//           // Conservar el QR al navegar por el menú público.
//           if (
//             this.route.snapshot.queryParamMap.get('qr')
//             !== token
//           ) {
//             void this.router.navigate([], {
//               relativeTo: this.route,

//               queryParams: {
//                 qr: token,
//               },

//               queryParamsHandling: 'merge',
//               replaceUrl: true,
//             });
//           }

//           return merge(
//             of(null),
//             timer(15000, 15000),
//             this.actualizar$,

//             fromEvent(
//               this.document,
//               'visibilitychange',
//             ).pipe(
//               filter(() =>
//                 this.document.visibilityState ===
//                 'visible',
//               ),
//             ),
//           ).pipe(
//             // Suspender consultas en pestañas ocultas.
//             filter(() =>
//               this.document.visibilityState !==
//               'hidden',
//             ),

//             // Una sola consulta en curso.
//             exhaustMap(() => {
//               this.cargando.set(true);

//               return this.servicio
//                 .consultar(token)
//                 .pipe(
//                   map((datos) => ({
//                     datos,
//                     mensaje: '',
//                     detener: false,
//                   })),

//                   catchError((error: unknown) => {
//                     const http =
//                       error instanceof HttpErrorResponse
//                         ? error
//                         : null;

//                     const mensaje =
//                       http?.error?.message ??
//                       (
//                         http?.status === 429
//                           ? 'Se realizaron demasiadas consultas. Espera unos segundos.'
//                           : 'No se pudo actualizar la información. Se volverá a intentar.'
//                       );

//                     return of({
//                       datos: null,
//                       mensaje: String(mensaje),

//                       detener: [
//                         400,
//                         404,
//                         410,
//                       ].includes(
//                         http?.status ?? 0,
//                       ),
//                     });
//                   }),

//                   finalize(() => {
//                     this.cargando.set(false);
//                   }),
//                 );
//             }),

//             // Un QR inválido o revocado no se consulta en bucle.
//             takeWhile(
//               (resultado) => !resultado.detener,
//               true,
//             ),
//           );
//         }),

//         takeUntilDestroyed(this.destroyRef),
//       )
//       .subscribe((resultado) => {
//         this.error.set(resultado.mensaje);
//         this.datos.set(resultado.datos);

//         const rutas = resultado.datos?.rutas ?? [];

//         if (
//           !rutas.some(
//             (item) =>
//               String(item.ruta.id_ruta) ===
//               this.idRuta(),
//           )
//         ) {
//           this.idRuta.set(
//             String(
//               rutas[0]?.ruta.id_ruta ?? '',
//             ),
//           );
//         }
//       });
//   }

//   seleccionarRuta(id: string): void {
//     this.idRuta.set(id);
//   }

//   actualizar(): void {
//     this.actualizar$.next();
//   }

//   abrir(): void {
//     let token = this.entrada().trim();

//     try {
//       if (
//         token.includes('/') ||
//         token.includes('?')
//       ) {
//         const url = new URL(
//           token,
//           this.document.baseURI,
//         );

//         const match = url.pathname.match(
//           /\/(?:q|consulta)\/([^/]+)\/?$/,
//         );

//         token = match
//           ? decodeURIComponent(match[1])
//           : url.searchParams.get('qr') ?? '';
//       }

//       if (!/^[a-f0-9]{64}$/i.test(token)) {
//         this.error.set(
//           'Ingresa un enlace QR o un token válido.',
//         );

//         return;
//       }

//       void this.router.navigate(
//         ['/consulta', token],
//         {
//           queryParams: {
//             qr: token,
//           },
//         },
//       );
//     } catch {
//       this.error.set(
//         'El enlace ingresado no es válido.',
//       );
//     }
//   }
// }
