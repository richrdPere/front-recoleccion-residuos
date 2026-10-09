import { AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, NgZone, OnChanges, OnDestroy, Output, PLATFORM_ID, SimpleChanges, ViewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { GeoJSONSource, IControl, Map as MapboxMap, Marker } from 'mapbox-gl';
import type { FeatureCollection, Geometry, Polygon } from 'geojson';

// Environment
import { environment } from '../../../../environments/environment';

// Interfaces
import type {
  MonitoreoMapaItem,
  MonitoreoRecorridoDetalleData,
  MonitoreoUltimaUbicacion,
  MonitoreoZona,
} from 'src/app/features/monitoreo/interfaces';

type MapboxAPI = typeof import('mapbox-gl').default;

interface RegistroMarcador {
  marcador: Marker;
  boton: HTMLButtonElement;
  seleccionar: () => void;
}
type PoligonoZonaEditable = {
  type: 'Polygon';
  coordinates: [number, number][][];
};

interface ControlDibujoZona extends IControl {
  getAll(): FeatureCollection<Geometry>;
  set(data: FeatureCollection<Geometry>): string[];
  delete(ids: string | string[]): ControlDibujoZona;
}

interface ZonaVisualMapa {
  nombre: string;
  color: string | null;
  poligono_geojson: {
    type: 'Polygon';
    coordinates: number[][][];
  } | null;
}

type ConstructorDibujoZona = new (
  opciones: {
    displayControlsDefault: boolean;
    controls: {
      polygon: boolean;
      trash: boolean;
    };
    defaultMode: string;
  },
) => ControlDibujoZona;

@Component({
  selector: 'mapa-base',
  standalone: true,
  imports: [],
  templateUrl: './mapa-base.component.html',
  styleUrl: './mapa-base.component.css',
})
export class MapaBaseComponent implements AfterViewInit, OnChanges, OnDestroy {

  @ViewChild('contenedorMapa', { static: true })
  private contenedorMapa!: ElementRef<HTMLDivElement>;

  // *********************************************************
  // 1. DATOS RECIBIDOS
  // *********************************************************
  @Input() recorridos: MonitoreoMapaItem[] = [];

  @Input() zonas: MonitoreoZona[] = [];

  @Input() detalle: MonitoreoRecorridoDetalleData | null = null;

  @Input() idRecorridoSeleccionado: number | null = null;

  // Umbral visual configurable, no reemplaza las reglas
  // de disponibilidad que aplica tu backend.
  @Input() maxAntiguedadGpsSegundos = 120;

  @Input() mostrarZonas = true;
  @Input() mostrarRuta = true;
  @Input() mostrarPuntos = true;

  @Input() habilitarEdicionZona = false;
  @Input() poligonoEditable: PoligonoZonaEditable | null = null;

  @Input() zonaVisual: ZonaVisualMapa | null = null;

  // *********************************************************
  // 2. EVENTOS
  // *********************************************************
  @Output() recorridoSeleccionado = new EventEmitter<number>();
  @Output() mapaError = new EventEmitter<string>();

  @Output() poligonoCambiado = new EventEmitter<PoligonoZonaEditable | null>();


  // *********************************************************
  // 3. ESTADO INTERNO
  // *********************************************************
  private mapa?: MapboxMap;
  private mapboxgl?: MapboxAPI;
  private listo = false;
  private destruido = false;
  private observadorTamano?: ResizeObserver;

  private readonly marcadores = new Map<number, RegistroMarcador>();

  private readonly fuenteZonas = 'monitoreo-zonas';
  private readonly fuenteRuta = 'monitoreo-ruta';
  private readonly fuentePuntos = 'monitoreo-puntos';

  private dibujoZona?: ControlDibujoZona;
  private firmaPoligonoEditor: string | undefined;

  private readonly alCambiarDibujoZona = (): void => {
    if (!this.dibujoZona || this.destruido) return;

    const features = this.dibujoZona.getAll().features
      .filter((feature) => feature.geometry.type === 'Polygon');

    // Conserva el último polígono completado.
    const seleccionado = features[features.length - 1];

    const anteriores = features
      .slice(0, -1)
      .map((feature) => String(feature.id));

    if (anteriores.length) {
      this.dibujoZona.delete(anteriores);
    }

    let poligono: PoligonoZonaEditable | null = null;

    if (seleccionado?.geometry.type === 'Polygon') {
      poligono = {
        type: 'Polygon',
        coordinates: seleccionado.geometry.coordinates.map(
          (anillo) =>
            anillo.map(
              (punto): [number, number] => [punto[0], punto[1]],
            ),
        ),
      };
    }

    const firma = JSON.stringify(poligono);

    if (firma === this.firmaPoligonoEditor) return;

    this.firmaPoligonoEditor = firma;

    this.ngZone.run(() => {
      this.poligonoCambiado.emit(poligono);
    });
  };

  private configurarEditorZona(): void {
    const mapa = this.mapa;
    if (!mapa || !this.listo) return;

    if (!this.habilitarEdicionZona) {
      this.retirarEditorZona();
      return;
    }

    if (!this.dibujoZona) {
      const ConstructorDraw = (
        window as unknown as {
          MapboxDraw?: ConstructorDibujoZona;
        }
      ).MapboxDraw;

      if (!ConstructorDraw) {
        this.ngZone.run(() => {
          this.mapaError.emit(
            'No se pudo cargar la herramienta de dibujo de zonas.',
          );
        });

        return;
      }

      this.dibujoZona = new ConstructorDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          trash: true,
        },
        defaultMode: 'simple_select',
      });

      mapa.addControl(this.dibujoZona, 'top-left');

      mapa.on('draw.create', this.alCambiarDibujoZona);
      mapa.on('draw.update', this.alCambiarDibujoZona);
      mapa.on('draw.delete', this.alCambiarDibujoZona);
    }

    this.sincronizarPoligonoEditor();
  }

  private sincronizarPoligonoEditor(): void {
    if (!this.dibujoZona || !this.mapboxgl || !this.mapa) return;

    const poligono = this.poligonoEditable;
    const firma = JSON.stringify(poligono);

    // Evita volver a cargar la geometría que acabamos de emitir.
    if (firma === this.firmaPoligonoEditor) return;

    // Usa la validación estructural del mapa base.
    if (
      poligono &&
      !this.poligonoValido(poligono.coordinates)
    ) {
      this.ngZone.run(() => {
        this.mapaError.emit(
          'El polígono recibido no tiene una estructura válida.',
        );
      });

      return;
    }

    this.firmaPoligonoEditor = firma;

    const data: FeatureCollection<Geometry> = {
      type: 'FeatureCollection',
      features: poligono
        ? [
          {
            type: 'Feature',
            id: 'zona-editable',
            properties: {},
            geometry: poligono,
          },
        ]
        : [],
    };

    this.dibujoZona.set(data);

    // Centra una geometría cargada desde el formulario.
    // No ajusta la cámara con cada edición del usuario.
    if (poligono) {
      const limites = new this.mapboxgl.LngLatBounds();

      for (const anillo of poligono.coordinates) {
        for (const punto of anillo) {
          limites.extend(punto);
        }
      }

      this.mapa.fitBounds(limites, {
        padding: 50,
        maxZoom: 16,
        duration: 0,
      });
    }
  }

  private retirarEditorZona(): void {
    if (!this.mapa || !this.dibujoZona) return;

    this.mapa.off('draw.create', this.alCambiarDibujoZona);
    this.mapa.off('draw.update', this.alCambiarDibujoZona);
    this.mapa.off('draw.delete', this.alCambiarDibujoZona);

    this.mapa.removeControl(this.dibujoZona);
    this.dibujoZona = undefined;
    this.firmaPoligonoEditor = undefined;
  }

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private ngZone: NgZone,
  ) { }

  // *********************************************************
  // 4. INICIALIZAR UNA SOLA INSTANCIA
  // *********************************************************
  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.mapboxgl = (
      window as unknown as { mapboxgl?: MapboxAPI }
    ).mapboxgl;

    if (!this.mapboxgl) {
      this.mapaError.emit('No se pudo cargar Mapbox desde el CDN.');
      return;
    }

    const mapboxgl = this.mapboxgl;

    this.ngZone.runOutsideAngular(() => {
      this.mapa = new mapboxgl.Map({
        container: this.contenedorMapa.nativeElement,
        accessToken: environment.mapboxToken,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-71.955, -13.322],
        zoom: 14,
      });

      this.mapa.addControl(
        new mapboxgl.NavigationControl(),
        'top-right',
      );

      this.mapa.on('load', () => {
        if (this.destruido) return;

        this.crearCapas();
        this.listo = true;

        // También procesa datos que llegaron antes del load.
        this.actualizarZonaVisual();
        this.actualizarDatos();
        this.configurarEditorZona();

        this.centrarSeleccionado();
      });

      this.mapa.on('error', (evento) => {
        if (this.destruido) return;

        this.ngZone.run(() => {
          this.mapaError.emit(
            evento.error?.message ?? 'Error al mostrar el mapa.',
          );
        });
      });

      if (typeof ResizeObserver !== 'undefined') {
        this.observadorTamano = new ResizeObserver(() => {
          if (!this.destruido) this.mapa?.resize();
        });

        this.observadorTamano.observe(
          this.contenedorMapa.nativeElement,
        );
      }
    });
  }

  // *********************************************************
  // 5. ACTUALIZAR SIN RECREAR EL MAPA
  // *********************************************************
  ngOnChanges(changes: SimpleChanges): void {
    if (!this.listo || this.destruido) return;

    if (changes['zonaVisual']) {
      this.ngZone.runOutsideAngular(() => {
        this.actualizarZonaVisual();
      });
    }

    this.ngZone.runOutsideAngular(() => {
      this.actualizarDatos();

      // No mueve la cámara con cada posición GPS.
      if (changes['idRecorridoSeleccionado']) {
        this.centrarSeleccionado();
      }
    });
  }

  private actualizarZonaVisual(): void {
    const mapa = this.mapa;

    if (
      this.destruido ||
      !mapa ||
      !mapa.isStyleLoaded()
    ) {
      return;
    }

    const geometria = this.zonaVisual?.poligono_geojson;

    const data: FeatureCollection<Polygon> = {
      type: 'FeatureCollection',
      features: geometria
        ? [{
          type: 'Feature',
          geometry: geometria,
          properties: {
            nombre: this.zonaVisual?.nombre ?? '',
            color: this.zonaVisual?.color || '#2563eb',
          },
        }]
        : [],
    };

    const fuenteId = 'zona-detalle-source';
    const fuente = mapa.getSource(fuenteId) as
      GeoJSONSource | undefined;

    if (fuente) {
      fuente.setData(data);
    } else {
      mapa.addSource(fuenteId, {
        type: 'geojson',
        data,
      });

      mapa.addLayer({
        id: 'zona-detalle-relleno',
        type: 'fill',
        source: fuenteId,
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': 0.2,
        },
      });

      mapa.addLayer({
        id: 'zona-detalle-borde',
        type: 'line',
        source: fuenteId,
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 3,
        },
      });
    }

    // Ajustar la vista al anillo exterior del polígono.
    const coordenadas = geometria?.coordinates[0];

    if (!coordenadas?.length) {
      return;
    }

    const longitudes = coordenadas.map(([longitud]) => longitud);
    const latitudes = coordenadas.map(([, latitud]) => latitud);

    if (
      !longitudes.every(Number.isFinite) ||
      !latitudes.every(Number.isFinite)
    ) {
      return;
    }

    mapa.fitBounds(
      [
        [Math.min(...longitudes), Math.min(...latitudes)],
        [Math.max(...longitudes), Math.max(...latitudes)],
      ],
      {
        padding: 45,
        maxZoom: 16,
        duration: 0,
      },
    );
  }

  private actualizarDatos(): void {
    if (!this.mapa || !this.listo) return;

    this.actualizarMarcadores();
    this.configurarEditorZona();
    this.actualizarZonas();
    this.actualizarRuta();
    this.actualizarPuntos();
  }

  // *********************************************************
  // 6. CREAR FUENTES Y CAPAS
  // *********************************************************
  private crearCapas(): void {
    const mapa = this.mapa;
    if (!mapa) return;

    for (const id of [
      this.fuenteZonas,
      this.fuenteRuta,
      this.fuentePuntos,
    ]) {
      mapa.addSource(id, {
        type: 'geojson',
        data: this.coleccionVacia(),
      });
    }

    mapa.addLayer({
      id: 'zonas-relleno',
      type: 'fill',
      source: this.fuenteZonas,
      paint: {
        'fill-color': ['get', 'color'],
        'fill-opacity': 0.12,
      },
    });

    mapa.addLayer({
      id: 'zonas-borde',
      type: 'line',
      source: this.fuenteZonas,
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 2,
      },
    });

    mapa.addLayer({
      id: 'ruta-trazado',
      type: 'line',
      source: this.fuenteRuta,
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 5,
      },
    });

    mapa.addLayer({
      id: 'ruta-puntos',
      type: 'circle',
      source: this.fuentePuntos,
      paint: {
        'circle-radius': 7,
        'circle-color': ['get', 'color'],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
      },
    });

    mapa.addLayer({
      id: 'ruta-puntos-orden',
      type: 'symbol',
      source: this.fuentePuntos,
      layout: {
        'text-field': ['to-string', ['get', 'orden']],
        'text-size': 12,
        'text-offset': [0, 1.5],
      },
      paint: {
        'text-color': '#111827',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1,
      },
    });
  }

  // *********************************************************
  // 7. VEHÍCULOS
  // *********************************************************
  private actualizarMarcadores(): void {
    if (!this.mapa || !this.mapboxgl) return;

    const idsVisibles = new Set<number>();

    for (const item of this.recorridos) {
      const coordenadas =
        this.obtenerCoordenadas(item.ultima_ubicacion);

      if (!coordenadas) continue;

      idsVisibles.add(item.id_recorrido);

      let registro = this.marcadores.get(item.id_recorrido);

      if (!registro) {
        const boton = document.createElement('button');
        boton.type = 'button';

        // Estilos directos: los elementos creados por Mapbox
        // no reciben los atributos de encapsulación de Angular.
        Object.assign(boton.style, {
          border: '3px solid white',
          borderRadius: '999px',
          padding: '8px 12px',
          color: 'white',
          fontWeight: '700',
          fontSize: '12px',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,.3)',
        });

        const id = item.id_recorrido;

        const seleccionar = () => {
          this.ngZone.run(() => {
            this.recorridoSeleccionado.emit(id);
          });
        };

        boton.addEventListener('click', seleccionar);

        const marcador = new this.mapboxgl.Marker({
          element: boton,
          anchor: 'bottom',
        })
          .setLngLat(coordenadas)
          .addTo(this.mapa);

        registro = { marcador, boton, seleccionar };
        this.marcadores.set(id, registro);
      }

      registro.marcador.setLngLat(coordenadas);

      const seleccionado =
        item.id_recorrido === this.idRecorridoSeleccionado;

      const segundos = item.gps.segundos_sin_actualizar;
      const fechaGps =
        item.gps.fecha_ultima_posicion ??
        item.ultima_ubicacion?.fecha_recepcion;

      const fechaMs = fechaGps ? Date.parse(fechaGps) : NaN;

      const edad =
        Number.isFinite(fechaMs)
          ? Math.max(0, (Date.now() - fechaMs) / 1000)
          : null;

      // No tratamos un estado desconocido como GPS en vivo.
      const reciente =
        edad !== null &&
        edad <= this.maxAntiguedadGpsSegundos &&
        (segundos === null ||
          segundos <= this.maxAntiguedadGpsSegundos);

      registro.boton.textContent =
        `${reciente ? '🚛' : '⚠'} ${item.vehiculo.placa}`;

      registro.boton.style.backgroundColor =
        seleccionado ? '#4f46e5' : reciente ? '#2563eb' : '#64748b';

      registro.boton.style.outline =
        seleccionado ? '3px solid #a5b4fc' : 'none';

      registro.boton.setAttribute(
        'aria-pressed',
        String(seleccionado),
      );

      registro.boton.setAttribute(
        'aria-label',
        `Seleccionar vehículo ${item.vehiculo.placa}`,
      );

      registro.boton.title = [
        `Vehículo: ${item.vehiculo.placa}`,
        `Ruta: ${item.ruta.nombre}`,
        `Recorrido: ${item.estado_recorrido}`,
        `GPS: ${item.gps.estado}`,
        `Última posición: ${fechaGps ?? 'Sin fecha'}`,
        `Progreso: ${item.progreso.porcentaje}%`,
      ].join('\n');
    }

    for (const [id, registro] of this.marcadores) {
      if (!idsVisibles.has(id)) {
        this.eliminarMarcador(registro);
        this.marcadores.delete(id);
      }
    }
  }

  // *********************************************************
  // 8. ZONAS
  // *********************************************************
  private actualizarZonas(): void {
    const data = this.coleccionVacia();

    if (this.mostrarZonas) {
      const unicas = new Map<number, MonitoreoZona>();

      for (const zona of this.zonas) {
        unicas.set(zona.id_zona, zona);
      }

      for (const item of this.recorridos) {
        const zona = item.ruta.zona;
        if (zona) unicas.set(zona.id_zona, zona);
      }

      for (const zona of unicas.values()) {
        const geometria = zona.poligono_geojson;

        if (
          !zona.estado ||
          geometria?.type !== 'Polygon' ||
          !this.poligonoValido(geometria.coordinates)
        ) {
          continue;
        }

        data.features.push({
          type: 'Feature',
          id: zona.id_zona,
          geometry: geometria,
          properties: {
            nombre: zona.nombre,
            color: this.colorSeguro(zona.color),
          },
        });
      }
    }

    this.actualizarFuente(this.fuenteZonas, data);
  }

  // *********************************************************
  // 9. RUTA PLANIFICADA SELECCIONADA
  // *********************************************************
  private actualizarRuta(): void {
    const data = this.coleccionVacia();
    const detalle = this.detalleActual();
    const geometria =
      detalle?.programacion.version_ruta.geometria_geojson;

    if (
      this.mostrarRuta &&
      geometria?.type === 'LineString' &&
      geometria.coordinates.length >= 2 &&
      geometria.coordinates.every((p) => this.posicionValida(p))
    ) {
      data.features.push({
        type: 'Feature',
        geometry: geometria,
        properties: {
          color: this.colorSeguro(
            detalle?.programacion.ruta.color,
          ),
        },
      });
    }

    this.actualizarFuente(this.fuenteRuta, data);
  }

  // *********************************************************
  // 10. PUNTOS DE LA RUTA
  // *********************************************************
  private actualizarPuntos(): void {
    const data = this.coleccionVacia();
    const detalle = this.detalleActual();

    if (this.mostrarPuntos && detalle) {
      for (const punto of detalle.programacion.version_ruta.puntos) {
        // Continúa con el cuerpo mostrado arriba.
      }
    }

    this.actualizarFuente(this.fuentePuntos, data);
  }
  // private actualizarPuntos(): void {
  //   const data = this.coleccionVacia();
  //   const detalle = this.detalleActual();

  //   if (this.mostrarPuntos && detalle) {
  //     const atendidos = new Set(
  //       detalle.recolecciones
  //         .filter((r) => r.estado_recoleccion === 'VALIDA')
  //         .map((r) => r.id_ruta_punto),
  //     );

  //     // Confirmar el catálogo de estado_recoleccion antes
  //     // de usar "VALIDA" para determinar atención.
  //     // En esta versión mantenemos el mismo color para todos.
  //     void atendidos;

  //     for (const punto of detalle.programacion.version_ruta.puntos) {
  //       if (!punto.estado || punto.deleted_at) continue;

  //       const coordenadas = this.convertirCoordenadas(
  //         punto.longitud,
  //         punto.latitud,
  //       );

  //       if (!coordenadas) continue;

  //       data.features.push({
  //         type: 'Feature',
  //         id: punto.id_ruta_punto,
  //         geometry: {
  //           type: 'Point',
  //           coordinates: coordenadas,
  //         },
  //         properties: {
  //           nombre: punto.nombre,
  //           orden: punto.orden,
  //           tipo: punto.tipo_punto,
  //           color: '#f59e0b',
  //         },
  //       });
  //     }
  //   }

  //   this.actualizarFuente(this.fuentePuntos, data);
  // }

  // *********************************************************
  // 11. CENTRAR VEHÍCULO
  // *********************************************************
  centrarRecorrido(idRecorrido: number): void {
    const item = this.recorridos.find(
      (r) => r.id_recorrido === idRecorrido,
    );

    const coordenadas =
      this.obtenerCoordenadas(item?.ultima_ubicacion ?? null);

    if (!this.mapa || !this.listo || !coordenadas) return;

    this.mapa.flyTo({
      center: coordenadas,
      zoom: Math.max(this.mapa.getZoom(), 15),
    });
  }

  private centrarSeleccionado(): void {
    if (this.idRecorridoSeleccionado !== null) {
      this.centrarRecorrido(this.idRecorridoSeleccionado);
    }
  }

  // *********************************************************
  // 12. UTILIDADES
  // *********************************************************
  private detalleActual(): MonitoreoRecorridoDetalleData | null {
    return this.detalle?.id_recorrido ===
      this.idRecorridoSeleccionado
      ? this.detalle
      : null;
  }

  private coleccionVacia(): FeatureCollection<Geometry> {
    return { type: 'FeatureCollection', features: [] };
  }

  private actualizarFuente(
    id: string,
    data: FeatureCollection<Geometry>,
  ): void {
    const fuente = this.mapa?.getSource(id) as
      GeoJSONSource | undefined;

    fuente?.setData(data);
  }

  private obtenerCoordenadas(
    ubicacion: MonitoreoUltimaUbicacion | null,
  ): [number, number] | null {
    if (!ubicacion) return null;

    return this.convertirCoordenadas(
      ubicacion.longitud,
      ubicacion.latitud,
    );
  }

  private convertirCoordenadas(
    longitud: string | number | null | undefined,
    latitud: string | number | null | undefined,
  ): [number, number] | null {
    if (
      longitud == null ||
      latitud == null ||
      String(longitud).trim() === '' ||
      String(latitud).trim() === ''
    ) {
      return null;
    }

    const posicion: [number, number] = [
      Number(longitud),
      Number(latitud),
    ];

    return this.posicionValida(posicion) ? posicion : null;
  }

  private posicionValida(p: number[]): boolean {
    return (
      p.length >= 2 &&
      Number.isFinite(p[0]) &&
      Number.isFinite(p[1]) &&
      Math.abs(p[0]) <= 180 &&
      Math.abs(p[1]) <= 90
    );
  }

  private poligonoValido(anillos: number[][][]): boolean {
    return (
      anillos.length > 0 &&
      anillos.every((anillo) => {
        if (
          anillo.length < 4 ||
          !anillo.every((p) => this.posicionValida(p))
        ) {
          return false;
        }

        const primero = anillo[0];
        const ultimo = anillo[anillo.length - 1];

        return primero[0] === ultimo[0] &&
          primero[1] === ultimo[1];
      })
    );
  }

  private colorSeguro(color?: string | null): string {
    return color && /^#[0-9a-f]{6}$/i.test(color)
      ? color
      : '#2563eb';
  }

  private eliminarMarcador(registro: RegistroMarcador): void {
    registro.boton.removeEventListener(
      'click',
      registro.seleccionar,
    );
    registro.marcador.remove();
  }

  // *********************************************************
  // 13. LIBERAR RECURSOS
  // *********************************************************
  ngOnDestroy(): void {
    this.destruido = true;
    this.listo = false;

    this.observadorTamano?.disconnect();

    for (const registro of this.marcadores.values()) {
      this.eliminarMarcador(registro);
    }

    this.marcadores.clear();
    this.mapa?.remove();
    this.retirarEditorZona();
    this.mapa = undefined;
  }
}
