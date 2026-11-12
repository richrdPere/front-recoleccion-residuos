import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';

import {
  isPlatformBrowser,
} from '@angular/common';

// Tipos: no importan la librería en tiempo de ejecución.
import type {
  GeoJSONSource,
  Map as MapboxMap,
} from 'mapbox-gl';

import type {
  FeatureCollection,
} from 'geojson';

// Environment
import {
  environment,
} from 'src/environments/environment';

type MapboxAPI =
  typeof import('mapbox-gl').default;

@Component({
  selector: 'historial-mapa',
  standalone: true,

  changeDetection: ChangeDetectionStrategy.OnPush,

  template: `
    <div
      #contenedor
      class="h-96 w-full overflow-hidden rounded-xl"
      aria-label="Trazado GPS registrado"
    ></div>

    @if (error) {
      <p class="mt-3 text-sm text-error" role="alert">
        {{ error }}
      </p>
    }
  `,
})
export class HistorialMapaComponent
  implements AfterViewInit, OnChanges, OnDestroy {

  // ==========================================================
  // INPUTS / CONTENEDOR
  // ==========================================================
  @Input({ required: true })
  geojson!: FeatureCollection;

  @ViewChild('contenedor', { static: true })
  private contenedor!: ElementRef<HTMLDivElement>;

  // ==========================================================
  // ESTADO
  // ==========================================================
  error: string | null = null;

  private mapa?: MapboxMap;
  private observer?: ResizeObserver;

  private listo = false;
  private destruido = false;

  constructor(
    @Inject(PLATFORM_ID)
    private readonly platformId: object,

    private readonly zone: NgZone,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  // ==========================================================
  // INICIALIZACIÓN
  // ==========================================================
  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Usar la misma librería que ya carga index.html.
    const mapboxgl = (
      window as unknown as {
        mapboxgl?: MapboxAPI;
      }
    ).mapboxgl;

    if (!mapboxgl) {
      this.mostrarError(
        'No se cargó la librería de Mapbox. Revisa el script de index.html.',
      );
      return;
    }

    const token =
      environment.mapboxToken?.trim();

    if (!token) {
      this.mostrarError(
        'No se configuró el token de Mapbox para este entorno.',
      );
      return;
    }

    if (!this.geojsonValido()) {
      this.mostrarError(
        'No se recibió un trazado GeoJSON válido.',
      );
      return;
    }

    try {
      this.zone.runOutsideAngular(() => {
        const mapa = new mapboxgl.Map({
          container: this.contenedor.nativeElement,

          accessToken: token,
          style: 'mapbox://styles/mapbox/streets-v12',

          center: [-71.9556, -13.3214],
          zoom: 12,
        });

        this.mapa = mapa;

        mapa.addControl(
          new mapboxgl.NavigationControl(),
          'top-right',
        );

        // ----------------------------------------------------
        // ERRORES DEL MAPA
        // ----------------------------------------------------
        mapa.on('error', (evento) => {
          this.registrarErrorMapa(evento.error);
        });

        // ----------------------------------------------------
        // ESTILO CARGADO
        // ----------------------------------------------------
        mapa.on('load', () => {
          if (this.destruido) return;

          try {
            this.mostrarError(null);

            mapa.resize();

            mapa.addSource('historial-gps', {
              type: 'geojson',
              data: this.geojson,
            });

            mapa.addLayer({
              id: 'historial-lineas',
              type: 'line',
              source: 'historial-gps',

              filter: [
                '==',
                ['geometry-type'],
                'LineString',
              ],

              paint: {
                'line-color': '#2563eb',
                'line-width': 4,
              },
            });

            mapa.addLayer({
              id: 'historial-muestras',
              type: 'circle',
              source: 'historial-gps',

              filter: [
                '==',
                ['geometry-type'],
                'Point',
              ],

              paint: {
                'circle-radius': 5,
                'circle-color': '#2563eb',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff',
              },
            });

            this.listo = true;
            this.actualizar();
          } catch (error: unknown) {
            this.registrarErrorMapa(error);
          }
        });

        // ----------------------------------------------------
        // AJUSTAR TAMAÑO DEL MODAL
        // ----------------------------------------------------
        this.observer = new ResizeObserver(() => {
          if (!this.destruido) {
            mapa.resize();
          }
        });

        this.observer.observe(
          this.contenedor.nativeElement,
        );
      });
    } catch (error: unknown) {
      this.registrarErrorMapa(error);
    }
  }

  ngOnChanges(): void {
    this.actualizar();
  }

  // ==========================================================
  // ACTUALIZAR TRAZADO
  // ==========================================================
  private actualizar(): void {
    const mapa = this.mapa;

    if (
      this.destruido ||
      !this.listo ||
      !mapa
    ) {
      return;
    }

    if (!this.geojsonValido()) {
      this.mostrarError(
        'El trazado recibido no tiene un formato GeoJSON válido.',
      );
      return;
    }

    const source = mapa.getSource(
      'historial-gps',
    ) as GeoJSONSource | undefined;

    if (!source) return;

    try {
      source.setData(this.geojson);

      // Calcular límites sin expandir arrays grandes.
      let oeste = Infinity;
      let este = -Infinity;
      let sur = Infinity;
      let norte = -Infinity;

      const incluirCoordenada = (
        coordenada: number[],
      ): void => {
        const longitud = coordenada[0];
        const latitud = coordenada[1];

        if (
          !Number.isFinite(longitud) ||
          !Number.isFinite(latitud) ||
          longitud < -180 ||
          longitud > 180 ||
          latitud < -90 ||
          latitud > 90
        ) {
          return;
        }

        oeste = Math.min(oeste, longitud);
        este = Math.max(este, longitud);

        sur = Math.min(sur, latitud);
        norte = Math.max(norte, latitud);
      };

      for (const feature of this.geojson.features) {
        const geometria = feature.geometry;

        if (!geometria) continue;

        if (geometria.type === 'LineString') {
          for (const coordenada of geometria.coordinates) {
            incluirCoordenada(coordenada);
          }
        } else if (geometria.type === 'Point') {
          incluirCoordenada(
            geometria.coordinates,
          );
        }
      }

      if (!Number.isFinite(oeste)) {
        return;
      }

      mapa.resize();

      mapa.fitBounds(
        [
          [oeste, sur],
          [este, norte],
        ],
        {
          padding: 40,
          maxZoom: 17,
          duration: 0,
        },
      );
    } catch (error: unknown) {
      this.registrarErrorMapa(error);
    }
  }

  private geojsonValido(): boolean {
    return (
      this.geojson?.type === 'FeatureCollection' &&
      Array.isArray(this.geojson.features)
    );
  }

  // ==========================================================
  // ERRORES
  // ==========================================================
  private registrarErrorMapa(error: unknown): void {
    if (this.destruido) return;

    const detalle = error as {
      message?: unknown;
      status?: unknown;
    } | null;

    const status = Number(detalle?.status);

    const original =
      typeof detalle?.message === 'string'
        ? detalle.message
        : typeof error === 'string'
          ? error
          : 'Error de Mapbox sin descripción disponible.';

    const mensaje = original
      .replace(
        /([?&]access_token=)[^&\s"'<>]+/gi,
        '$1[OMITIDO]',
      )
      .replace(
        /\b(?:pk|sk|tk)\.[A-Za-z0-9._-]+/g,
        '[TOKEN OMITIDO]',
      );

    console.error('[historial-mapa]', {
      status: Number.isFinite(status)
        ? status
        : null,

      mensaje,
    });

    if (status === 401) {
      this.mostrarError(
        'Mapbox rechazó el token de acceso.',
      );
      return;
    }

    if (status === 403) {
      this.mostrarError(
        'Mapbox denegó el acceso. Revisa los permisos y las URL autorizadas del token.',
      );
      return;
    }

    this.mostrarError(
      `No se pudo cargar o actualizar el mapa: ${mensaje}`,
    );
  }

  private mostrarError(
    mensaje: string | null,
  ): void {
    if (this.destruido) return;

    this.zone.run(() => {
      this.error = mensaje;
      this.cdr.markForCheck();
    });
  }

  // ==========================================================
  // DESTRUCCIÓN
  // ==========================================================
  ngOnDestroy(): void {
    this.destruido = true;
    this.listo = false;

    this.observer?.disconnect();
    this.mapa?.remove();

    this.observer = undefined;
    this.mapa = undefined;
  }
}
