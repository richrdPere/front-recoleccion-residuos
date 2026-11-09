import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  ViewChild,
  signal,
} from '@angular/core';

import type {
  GeoJSONSource,
  Map as MapboxMap,
} from 'mapbox-gl';

import type {
  FeatureCollection,
} from 'geojson';

import {
  environment,
} from 'src/environments/environment';

@Component({
  selector: 'historial-mapa',
  standalone: true,

  template: `
    <div
      #contenedor
      class="h-96 w-full overflow-hidden rounded-xl"
      aria-label="Trazado GPS registrado"
    ></div>

    @if (error()) {
      <p class="mt-2 text-sm text-error">
        {{ error() }}
      </p>
    }
  `,
})
export class HistorialMapaComponent
  implements AfterViewInit, OnChanges, OnDestroy {

  @ViewChild('contenedor', { static: true })
  private contenedor!: ElementRef<HTMLDivElement>;

  @Input({ required: true })
  geojson!: FeatureCollection;

  readonly error = signal<string | null>(null);

  private mapa?: MapboxMap;
  private destruido = false;

  async ngAfterViewInit(): Promise<void> {
    try {
      const modulo = await import('mapbox-gl');
      const mb = modulo.default;

      if (this.destruido) return;

      const mapa = new mb.Map({
        container: this.contenedor.nativeElement,
        accessToken: environment.mapboxToken,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-71.9556, -13.3214],
        zoom: 12,
      });

      this.mapa = mapa;

      mapa.addControl(
        new mb.NavigationControl(),
      );

      mapa.on('error', () => {
        if (!this.destruido) {
          this.error.set(
            'No se pudo cargar algún recurso del mapa.',
          );
        }
      });

      mapa.on('load', () => {
        if (this.destruido) return;

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

        this.actualizar();
      });
    } catch {
      if (!this.destruido) {
        this.error.set(
          'No se pudo inicializar el mapa.',
        );
      }
    }
  }

  ngOnChanges(): void {
    this.actualizar();
  }

  private actualizar(): void {
    const mapa = this.mapa;

    if (!mapa || !mapa.getSource('historial-gps')) {
      return;
    }

    const source = mapa.getSource(
      'historial-gps',
    ) as GeoJSONSource;

    source.setData(this.geojson);

    const coordenadas: number[][] = [];

    for (const feature of this.geojson.features) {
      if (feature.geometry.type === 'LineString') {
        coordenadas.push(
          ...feature.geometry.coordinates,
        );
      } else if (feature.geometry.type === 'Point') {
        coordenadas.push(
          feature.geometry.coordinates,
        );
      }
    }

    if (!coordenadas.length) return;

    const longitudes = coordenadas.map(c => c[0]);
    const latitudes = coordenadas.map(c => c[1]);

    mapa.fitBounds(
      [
        [
          Math.min(...longitudes),
          Math.min(...latitudes),
        ],
        [
          Math.max(...longitudes),
          Math.max(...latitudes),
        ],
      ],
      {
        padding: 40,
        maxZoom: 17,
        duration: 0,
      },
    );
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.mapa?.remove();
  }
}
