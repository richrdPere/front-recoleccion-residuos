import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Observable, Subject, catchError, defer, finalize, forkJoin, of, switchMap } from 'rxjs';

// Services
import { MonitoreoService } from '../../services/monitoreo.service';

// Interfaces
import { MonitoreoAlertasData, MonitoreoAlertasFilters, MonitoreoMapaData, MonitoreoMapaFilters, MonitoreoMapaItem, MonitoreoOperacionData, MonitoreoOperacionFilters, MonitoreoRecorridoDetalleData, MonitoreoUltimaUbicacion } from '../../interfaces';

// *********************************************************
// RESULTADO DE CADA CONSULTA
// *********************************************************
interface ResultadoConsulta<T> {
  data: T | null;
  error: string | null;
}

// Componentes
import { MapaBaseComponent } from 'src/app/shared/components/mapa-base/mapa-base.component';

@Component({
  selector: 'app-monitoreo-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MapaBaseComponent,
  ],
  templateUrl: './monitoreo-page.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitoreoPageComponent implements OnInit {

  private readonly monitoreoService = inject(MonitoreoService);
  private readonly destroyRef = inject(DestroyRef);

  // *********************************************************
  // 1. SOLICITUDES
  // *********************************************************
  private readonly consultas$ = new Subject<MonitoreoMapaFilters>();
  private readonly selecciones$ = new Subject<number | null>();

  // *********************************************************
  // 2. FILTROS
  // *********************************************************
  readonly filtros = signal<MonitoreoMapaFilters>({
    fecha: this.obtenerFechaLima(),
    id_zona: null,
    id_ruta: null,
    id_vehiculo: null,
    estado_programacion: null,
    estado_recorrido: null,
  });

  // *********************************************************
  // 3. ESTADO DE CARGA Y ERRORES
  // *********************************************************
  readonly cargando = signal(false);
  readonly cargandoDetalle = signal(false);

  readonly errorOperacion = signal<string | null>(null);
  readonly errorMapa = signal<string | null>(null);
  readonly errorAlertas = signal<string | null>(null);
  readonly errorDetalle = signal<string | null>(null);

  // *********************************************************
  // 4. DATOS DEL BACKEND
  // *********************************************************
  readonly operacion = signal<MonitoreoOperacionData | null>(null);

  readonly mapa = signal<MonitoreoMapaData | null>(null);

  readonly alertas = signal<MonitoreoAlertasData | null>(null);

  readonly detalle = signal<MonitoreoRecorridoDetalleData | null>(null);

  readonly idRecorridoSeleccionado = signal<number | null>(null);

  // *********************************************************
  // 5. DATOS PARA LA VISTA
  // *********************************************************
  readonly resumen = computed(
    () => this.operacion()?.resumen ?? null,
  );

  readonly programaciones = computed(
    () => this.operacion()?.items ?? [],
  );

  readonly recorridosMapa = computed(
    () => this.mapa()?.items ?? [],
  );

  readonly alertasOperativas = computed(
    () => this.alertas()?.items ?? [],
  );

  readonly resumenAlertas = computed(
    () => this.alertas()?.resumen ?? null,
  );

  readonly generadoEn = computed(
    () => this.mapa()?.generado_en ?? null,
  );

  readonly recorridoSeleccionado = computed(
    () =>
      this.recorridosMapa().find(
        (item) =>
          item.id_recorrido === this.idRecorridoSeleccionado(),
      ) ?? null,
  );

  // Solo estos elementos pueden convertirse en marcadores.
  // Una ubicación válida puede estar desactualizada:
  // su estado GPS también debe mostrarse en la vista.
  readonly recorridosConUbicacion = computed(
    () =>
      this.recorridosMapa().filter(
        (item) =>
          this.obtenerCoordenadas(item.ultima_ubicacion) !== null,
      ),
  );

  readonly recorridosSinUbicacion = computed(
    () =>
      this.recorridosMapa().filter(
        (item) =>
          this.obtenerCoordenadas(item.ultima_ubicacion) === null,
      ),
  );

  // *********************************************************
  // 6. INICIALIZACIÓN
  // *********************************************************
  ngOnInit(): void {
    this.configurarConsultas();
    this.configurarDetalle();

    this.actualizarMonitoreo();
  }

  // *********************************************************
  // 7. ACTUALIZAR MONITOREO
  // *********************************************************
  actualizarMonitoreo(): void {
    this.cerrarDetalle();
    this.consultas$.next({ ...this.filtros() });
  }

  // *********************************************************
  // 8. CAMBIAR FILTROS
  // *********************************************************
  actualizarFiltros(
    cambios: Partial<MonitoreoMapaFilters>,
  ): void {
    const actuales = this.filtros();

    this.filtros.set({
      ...actuales,
      ...cambios,

      // Una ruta de la zona anterior puede dejar de ser válida.
      id_ruta:
        cambios.id_zona !== undefined &&
          cambios.id_zona !== actuales.id_zona
          ? null
          : cambios.id_ruta !== undefined
            ? cambios.id_ruta
            : actuales.id_ruta,
    });

    this.actualizarMonitoreo();
  }

  limpiarFiltros(): void {
    this.filtros.set({
      fecha: this.obtenerFechaLima(),
      id_zona: null,
      id_ruta: null,
      id_vehiculo: null,
      estado_programacion: null,
      estado_recorrido: null,
    });

    this.actualizarMonitoreo();
  }

  // *********************************************************
  // 9. SELECCIONAR RECORRIDO
  // *********************************************************
  seleccionarRecorrido(idRecorrido: number): void {
    if (!Number.isInteger(idRecorrido) || idRecorrido <= 0) {
      return;
    }

    this.idRecorridoSeleccionado.set(idRecorrido);
    this.selecciones$.next(idRecorrido);
  }

  cerrarDetalle(): void {
    this.idRecorridoSeleccionado.set(null);
    this.selecciones$.next(null);
  }

  // *********************************************************
  // 10. VALIDAR COORDENADAS
  // Mapbox utiliza [longitud, latitud].
  // *********************************************************
  obtenerCoordenadas(
    ubicacion: MonitoreoUltimaUbicacion | null,
  ): [number, number] | null {
    if (
      !ubicacion ||
      ubicacion.latitud == null ||
      ubicacion.longitud == null ||
      String(ubicacion.latitud).trim() === '' ||
      String(ubicacion.longitud).trim() === ''
    ) {
      return null;
    }

    const latitud = Number(ubicacion.latitud);
    const longitud = Number(ubicacion.longitud);

    if (
      !Number.isFinite(latitud) ||
      !Number.isFinite(longitud) ||
      latitud < -90 ||
      latitud > 90 ||
      longitud < -180 ||
      longitud > 180
    ) {
      return null;
    }

    return [longitud, latitud];
  }

  trackByRecorrido(
    _index: number,
    item: MonitoreoMapaItem,
  ): number {
    return item.id_recorrido;
  }

  // *********************************************************
  // 11. CARGA DE OPERACIÓN, MAPA Y ALERTAS
  // Cada endpoint maneja su error de forma independiente.
  // *********************************************************
  private configurarConsultas(): void {
    this.consultas$
      .pipe(
        switchMap((filters) =>
          defer(() => {
            this.cargando.set(true);

            this.errorOperacion.set(null);
            this.errorMapa.set(null);
            this.errorAlertas.set(null);

            // Evita mostrar datos anteriores con nuevos filtros.
            // Esto no debe destruir la instancia del mapa.
            this.operacion.set(null);
            this.mapa.set(null);
            this.alertas.set(null);

            const filtrosOperacion: MonitoreoOperacionFilters = {
              ...filters,
            };

            const filtrosAlertas: MonitoreoAlertasFilters = {
              ...filters,
              page: 1,
              limit: 20,
            };

            return forkJoin({
              operacion: this.consultar(
                this.monitoreoService.getMonitoreoOperacion(
                  filtrosOperacion,
                ),
                'No se pudo obtener el monitoreo operativo.',
              ),

              mapa: this.consultar(
                this.monitoreoService.getMonitoreoMapa(filters),
                'No se pudieron obtener los vehículos del mapa.',
              ),

              alertas: this.consultar(
                this.monitoreoService.getMonitoreoAlertas(
                  filtrosAlertas,
                ),
                'No se pudieron obtener las alertas.',
              ),
            }).pipe(
              finalize(() => this.cargando.set(false)),
            );
          }),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((resultado) => {
        this.operacion.set(resultado.operacion.data);
        this.mapa.set(resultado.mapa.data);
        this.alertas.set(resultado.alertas.data);

        this.errorOperacion.set(resultado.operacion.error);
        this.errorMapa.set(resultado.mapa.error);
        this.errorAlertas.set(resultado.alertas.error);
      });
  }

  // *********************************************************
  // 12. CARGAR DETALLE
  // Cambiar selección cancela el detalle anterior.
  // *********************************************************
  private configurarDetalle(): void {
    this.selecciones$
      .pipe(
        switchMap((idRecorrido) =>
          defer(() => {
            this.detalle.set(null);
            this.errorDetalle.set(null);
            this.cargandoDetalle.set(false);

            if (idRecorrido === null) {
              return EMPTY;
            }

            this.cargandoDetalle.set(true);

            return this.consultar(
              this.monitoreoService.getMonitoreoRecorridoDetalle(
                idRecorrido,
              ),
              'No se pudo obtener el detalle del recorrido.',
            ).pipe(
              finalize(() => this.cargandoDetalle.set(false)),
            );
          }),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((resultado) => {
        this.detalle.set(resultado.data);
        this.errorDetalle.set(resultado.error);
      });
  }

  // *********************************************************
  // 13. NORMALIZAR RESPUESTAS Y ERRORES
  // *********************************************************
  private consultar<T>(
    request$: Observable<{
      success: boolean;
      message: string;
      data: T;
    }>,
    mensajeDefecto: string,
  ): Observable<ResultadoConsulta<T>> {
    return request$.pipe(
      switchMap((response) =>
        of<ResultadoConsulta<T>>(
          response.success
            ? { data: response.data, error: null }
            : {
              data: null,
              error: response.message || mensajeDefecto,
            },
        ),
      ),
      catchError((error: unknown) =>
        of<ResultadoConsulta<T>>({
          data: null,
          error: this.obtenerMensajeError(error, mensajeDefecto),
        }),
      ),
    );
  }

  private obtenerMensajeError(
    error: unknown,
    mensajeDefecto: string,
  ): string {
    if (typeof error === 'string' && error.trim()) {
      return error;
    }

    const respuesta = error as {
      error?: { message?: unknown } | string;
      message?: unknown;
    } | null;

    const mensajeBackend =
      typeof respuesta?.error === 'string'
        ? respuesta.error
        : respuesta?.error?.message;

    if (
      typeof mensajeBackend === 'string' &&
      mensajeBackend.trim() &&
      !mensajeBackend.trim().startsWith('<')
    ) {
      return mensajeBackend;
    }

    if (
      typeof respuesta?.message === 'string' &&
      respuesta.message.trim()
    ) {
      return respuesta.message;
    }

    return mensajeDefecto;
  }

  // *********************************************************
  // 14. FECHA LOCAL DE CALCA
  // No utiliza UTC para evitar consultar el día siguiente.
  // *********************************************************
  private obtenerFechaLima(): string {
    const partes = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());

    const obtener = (tipo: string): string =>
      partes.find((parte) => parte.type === tipo)?.value ?? '';

    return `${obtener('year')}-${obtener('month')}-${obtener('day')}`;
  }

  // *********************************************************
  // 15. OBTENER ZONAS LOCALES DE CALCA
  // *********************************************************
  zonasMapa(): import("../../interfaces").MonitoreoZona[] {
    throw new Error('Method not implemented.');
  }
}
