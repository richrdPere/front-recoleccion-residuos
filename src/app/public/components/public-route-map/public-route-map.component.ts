import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, NgZone, OnChanges, OnDestroy, PLATFORM_ID, ViewChild, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// Environment
import { environment } from 'src/environments/environment';

// Interfaces
import type { GeoJSONSource, Map as MapboxMap, Marker } from 'mapbox-gl';
import type { Feature, LineString } from 'geojson';
import { PublicAvailableLocation, PublicRoute } from '../../models/public-qr.model';

type MapboxAPI = typeof import('mapbox-gl').default;

@Component({
  selector: 'app-public-route-map',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './public-route-map.component.html',
})
export class PublicRouteMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('contenedor', { static: true })
  private contenedor!: ElementRef<HTMLDivElement>;

  @Input() ruta: PublicRoute | null = null;

  @Input()
  ubicacion: PublicAvailableLocation | null = null;

  readonly error = signal('');

  private readonly platformId = inject(PLATFORM_ID);
  private readonly zone = inject(NgZone);

  private api?: MapboxAPI;
  private mapa?: MapboxMap;
  private marcador?: Marker;
  private observer?: ResizeObserver;

  private listo = false;
  private destruido = false;
  private rutaAjustada = '';

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.api = (
      window as unknown as {
        mapboxgl?: MapboxAPI;
      }
    ).mapboxgl;

    if (!this.api || !environment.mapboxToken) {
      this.error.set(
        'No se pudo inicializar el mapa.',
      );

      return;
    }

    try {
      this.mapa = new this.api.Map({
        container:
          this.contenedor.nativeElement,

        accessToken:
          environment.mapboxToken,

        style:
          'mapbox://styles/mapbox/streets-v12',

        center: [-71.9556, -13.3214],
        zoom: 13,
      });

      this.mapa.addControl(
        new this.api.NavigationControl(),
        'top-right',
      );

      this.mapa.on('load', () => {
        if (this.destruido || !this.mapa) {
          return;
        }

        this.listo = true;
        this.actualizarMapa();
      });

      this.mapa.on('error', () => {
        this.zone.run(() => {
          this.error.set(
            'No se pudo cargar parte del mapa. Comprueba tu conexión.',
          );
        });
      });

      this.observer = new ResizeObserver(() => {
        this.mapa?.resize();
      });

      this.observer.observe(
        this.contenedor.nativeElement,
      );
    } catch {
      this.error.set(
        'El navegador no pudo cargar el mapa.',
      );
    }
  }

  ngOnChanges(): void {
    this.actualizarMapa();
  }

  private actualizarMapa(): void {
    const mapa = this.mapa;
    const api = this.api;

    if (!mapa || !api || !this.listo) {
      return;
    }

    const geometria =
      this.ruta?.geometria_geojson;

    const datos: Feature<LineString> = {
      type: 'Feature',
      properties: {},

      geometry: {
        type: 'LineString',

        coordinates:
          geometria?.coordinates ?? [],
      },
    };

    const fuente = mapa.getSource(
      'ruta-publica',
    ) as GeoJSONSource | undefined;

    if (fuente) {
      fuente.setData(datos);
    } else {
      mapa.addSource('ruta-publica', {
        type: 'geojson',
        data: datos,
      });

      mapa.addLayer({
        id: 'ruta-publica-linea',
        type: 'line',
        source: 'ruta-publica',

        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },

        paint: {
          'line-color':
            this.ruta?.color ?? '#2563EB',

          'line-width': 5,
          'line-opacity': 0.85,
        },
      });
    }

    mapa.setPaintProperty(
      'ruta-publica-linea',
      'line-color',
      this.ruta?.color ?? '#2563EB',
    );

    if (this.ubicacion) {
      const coordenadas: [number, number] = [
        this.ubicacion.longitud,
        this.ubicacion.latitud,
      ];

      if (!this.marcador) {
        const elemento =
          document.createElement('div');

        elemento.textContent = '🚛';
        elemento.title =
          'Ubicación aproximada del recolector';

        elemento.setAttribute(
          'aria-label',
          elemento.title,
        );

        elemento.style.fontSize = '32px';

        this.marcador = new api.Marker({
          element: elemento,
        })
          .setLngLat(coordenadas)
          .addTo(mapa);
      } else {
        this.marcador.setLngLat(coordenadas);
      }
    } else {
      this.marcador?.remove();
      this.marcador = undefined;
    }

    // Ajustar al cambiar de ruta o versión, no por cada GPS.
    const firma = [
      this.ruta?.id_ruta ?? '',
      this.ruta?.id_ruta_version ?? '',
      Boolean(geometria?.coordinates.length),
      Boolean(this.ubicacion),
    ].join(':');

    if (firma === this.rutaAjustada) {
      return;
    }

    this.rutaAjustada = firma;

    const puntos: [number, number][] = [
      ...(geometria?.coordinates ?? []),
    ];

    if (this.ubicacion) {
      puntos.push([
        this.ubicacion.longitud,
        this.ubicacion.latitud,
      ]);
    }

    if (puntos.length) {
      const bounds = new api.LngLatBounds();

      puntos.forEach((punto) => {
        bounds.extend(punto);
      });

      mapa.fitBounds(bounds, {
        padding: 45,
        maxZoom: 15,
        duration: 0,
      });
    }
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.observer?.disconnect();
    this.marcador?.remove();
    this.mapa?.remove();
  }
}
