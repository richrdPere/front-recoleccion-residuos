import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { DOCUMENT, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, catchError, distinctUntilChanged, exhaustMap, filter, finalize, fromEvent, map, merge, of, takeWhile, timer } from 'rxjs';

// Services
import { PublicScheduleService } from '../../services/public-schedule.service';
import { PublicQrService } from '../../services/public-qr.service';

// Interfaces
import { PublicZone, PublicRouteOption } from '../../models/public-catalog.model';
import { PublicQrView } from '../../models/public-qr.model';

// Componentes
import { PublicPageHeaderComponent } from '../../components/public-page-header/public-page-header.component';
import { PublicRouteMapComponent } from '../../components/public-route-map/public-route-map.component';

@Component({
  selector: 'app-seguimiento-publico-page',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    PublicPageHeaderComponent,
    PublicRouteMapComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './seguimiento-publico-page.component.html',
})
export class SeguimientoPublicoPageComponent implements OnInit {
  private readonly publicService = inject(PublicScheduleService);
  private readonly qrService = inject(PublicQrService);

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  private consultaRutas?: Subscription;
  private seguimiento?: Subscription;

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

  get ubicacion() {
    const ubicacion = this.rutaSeleccionada?.ubicacion;

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
    const ubicacion = this.rutaSeleccionada?.ubicacion;

    if (!ubicacion) return '';

    if (!ubicacion.disponible) {
      return ubicacion.mensaje;
    }

    return this.ubicacion
      ? 'La ubicación del vehículo es aproximada.'
      : 'La última ubicación perdió vigencia. Esperando una nueva actualización.';
  }

  get parametrosConsulta() {
    return this.tokenPublico
      ? { qr: this.tokenPublico }
      : {
        zona: this.idZona || null,
        ruta: this.idRuta || null,
      };
  }

  get estadoLabel(): string {
    const codigo = this.rutaSeleccionada?.estado.codigo ?? '';

    const etiquetas: Record<string, string> = {
      EN_PROCESO: 'Recolección en curso',
      DEMORADA: 'Servicio demorado',
      COMPLETADA: 'Recolección finalizada',
      CANCELADA: 'Servicio cancelado',
      SERVICIO_SUSPENDIDO: 'Servicio suspendido',
      SIN_PROGRAMACION: 'Sin programación',
      RECURSO_NO_DISPONIBLE: 'Ruta no disponible',
    };

    return etiquetas[codigo] ?? this.formatearEtiqueta(codigo);
  }

  // ==========================================================
  // CICLO DE VIDA
  // ==========================================================
  ngOnInit(): void {
    // Reevalúa la caducidad del GPS, incluso si falla el servidor.
    timer(0, 1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cdr.markForCheck());

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
        // Cancela el seguimiento de la selección anterior.
        this.seguimiento?.unsubscribe();

        this.tokenPublico = contexto.qr;
        this.idZona = contexto.zona;
        this.idRuta = contexto.ruta;
        this.idRutaQr = '';

        this.datos = null;
        this.error = '';

        if (!this.tokenPublico) {
          if (!this.zonas.length && !this.cargandoZonas) {
            this.cargarZonas();
          }

          if (this.zonaCargada !== this.idZona) {
            this.cargarRutas();
          }
        } else {
          this.consultaRutas?.unsubscribe();
          this.zonaCargada = null;
          this.rutasDisponibles = [];
          this.errorRutas = '';
        }

        this.iniciarSeguimiento();
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
  // SEGUIMIENTO
  // ==========================================================
  private iniciarSeguimiento(): void {
    this.seguimiento?.unsubscribe();

    if (!this.tokenPublico && !this.idRuta) {
      this.isLoading = false;
      this.cdr.markForCheck();
      return;
    }

    // Captura la selección correspondiente a este seguimiento.
    const token = this.tokenPublico;
    const idRuta = this.idRuta;

    this.seguimiento = merge(
      of(null),
      timer(15000, 15000),

      fromEvent(this.document, 'visibilitychange').pipe(
        filter(
          () => this.document.visibilityState === 'visible',
        ),
      ),
    )
      .pipe(
        // Suspende nuevas consultas mientras la pestaña está oculta.
        filter(
          () => this.document.visibilityState !== 'hidden',
        ),

        // Evita superponer solicitudes.
        exhaustMap(() => {
          this.isLoading = true;
          this.cdr.markForCheck();

          const consulta = token
            ? this.qrService.consultar(token)
            : this.publicService.consultar(idRuta);

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
                  'No se pudo actualizar el estado. Se volverá a intentar automáticamente.',
                ),

                detener: [400, 404, 410].includes(status),
              });
            }),

            finalize(() => {
              this.isLoading = false;
              this.cdr.markForCheck();
            }),
          );
        }),

        // Recursos inválidos o retirados no se consultan en bucle.
        takeWhile(resultado => !resultado.detener, true),

        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(resultado => {
        this.error = resultado.mensaje;
        this.datos = resultado.datos;

        const rutas = resultado.datos?.rutas ?? [];

        if (
          !rutas.some(
            item =>
              String(item.ruta.id_ruta) === this.idRutaQr,
          )
        ) {
          this.idRutaQr = String(
            rutas[0]?.ruta.id_ruta ?? '',
          );
        }

        this.cdr.markForCheck();
      });
  }

  actualizar(): void {
    if (this.isLoading) return;

    // También permite reintentar un seguimiento detenido por un error.
    this.error = '';
    this.iniciarSeguimiento();
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
    const texto = valor
      .replace(/_/g, ' ')
      .toLocaleLowerCase('es-PE');

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
