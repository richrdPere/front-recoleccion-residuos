import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Observable, Subject, auditTime, interval, takeUntil, catchError, defer, finalize, forkJoin, of, switchMap } from 'rxjs';

// Services
import { MonitoreoService } from '../../services/monitoreo.service';
import { MonitoreoSocketService } from 'src/app/core/socket/monitoreo-socket.service';
import { provideMonitoreoSocketAutenticado } from 'src/app/core/socket/monitoreo-socket-auth.provider';

// Interfaces
import { MonitoreoAlertasData, MonitoreoAlertasFilters, MonitoreoMapaData, MonitoreoMapaFilters, MonitoreoMapaItem, MonitoreoOperacionData, MonitoreoOperacionFilters, MonitoreoRecorridoDetalleData, MonitoreoUltimaUbicacion, MonitoreoZona } from '../../interfaces';

// *********************************************************
// RESULTADO DE CADA CONSULTA
// *********************************************************
interface ResultadoConsulta<T> {
  data: T | null;
  error: string | null;
}

// Componentes
import { MapaBaseComponent } from 'src/app/shared/components/mapa-base/mapa-base.component';
import { RecorridoActualizadoSocket, TrackingActualizadoSocket } from 'src/app/core/socket/monitoreo-socket.types';
import { esMasReciente, gpsVisual, normalizarTracking } from 'src/app/core/socket/monitoreo-tracking.utils';

@Component({
  selector: 'app-monitoreo-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MapaBaseComponent,
  ],
  providers: [MonitoreoSocketService, provideMonitoreoSocketAutenticado()],
  templateUrl: './monitoreo-page.component.html',
  // styles: ``,
  // styleUrl: './monitoreo-page.component.scss' ,
  styleUrls: ['./monitoreo-page.component.scss'],
  host: {
    '(document:keydown.escape)': 'cerrarPanel()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitoreoPageComponent implements OnInit {

  private readonly monitoreoService = inject(MonitoreoService);
  private readonly destroyRef = inject(DestroyRef);
  readonly socketMonitoreo = inject(MonitoreoSocketService);
  readonly ultimaRecepcionSocket = signal<string | null>(null);
  readonly sincronizando = signal(false);
  private readonly posicionesSocket = new Map<number, MonitoreoUltimaUbicacion>();
  private readonly refrescosSocket$ = new Subject<void>();
  private sesionDisponible = true;
  private consultaEnCurso = false;
  private consultaEnFondo = false;
  private refrescoPendiente = false;
  private ultimoRecorridoDesconocido = 0;

  readonly consultaActual = computed(() =>
    !this.filtros().fecha || this.filtros().fecha === this.obtenerFechaLima());


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
    this.configurarTiempoReal();
    this.actualizarMonitoreo();
    void this.socketMonitoreo.iniciar();
    this.destroyRef.onDestroy(() => this.socketMonitoreo.detener());
  }

  // *********************************************************
  // 7. ACTUALIZAR MONITOREO
  // *********************************************************
  actualizarMonitoreo(): void {
    if (!this.sesionDisponible) return;
    this.cerrarDetalle();
    this.consultaEnFondo = false;
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
    if (!this.sesionDisponible) return;

    idRecorrido = Number(idRecorrido);

    if (!Number.isSafeInteger(idRecorrido) || idRecorrido <= 0) {
      return;
    }

    this.panelActivo.set('detalle');
    this.idRecorridoSeleccionado.set(idRecorrido);
    this.selecciones$.next(idRecorrido);
  }

  cerrarDetalle(): void {
    if (this.panelActivo() === 'detalle') {
      this.cerrarPanel();
    }

    this.idRecorridoSeleccionado.set(null);
    this.selecciones$.next(null);
  }
  // seleccionarRecorrido(idRecorrido: number): void {
  //   if (!this.sesionDisponible) return;
  //   idRecorrido = Number(idRecorrido);
  //   if (!Number.isSafeInteger(idRecorrido) || idRecorrido <= 0) {
  //     return;
  //   }

  //   this.idRecorridoSeleccionado.set(idRecorrido);
  //   this.selecciones$.next(idRecorrido);
  // }

  // cerrarDetalle(): void {
  //   this.idRecorridoSeleccionado.set(null);
  //   this.selecciones$.next(null);
  // }

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
            const enFondo = this.consultaEnFondo;
            this.consultaEnFondo = false;
            this.consultaEnCurso = true;
            this.sincronizando.set(enFondo);
            this.cargando.set(!enFondo);

            this.errorOperacion.set(null);
            this.errorMapa.set(null);
            this.errorAlertas.set(null);

            // Evita mostrar datos anteriores con nuevos filtros.
            // Esto no debe destruir la instancia del mapa.
            if (!enFondo) {
              this.operacion.set(null);
              this.mapa.set(null);
              this.alertas.set(null);
            }

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
              takeUntil(this.socketMonitoreo.sesionCerrada$),
              finalize(() => {
                this.consultaEnCurso = false;
                this.cargando.set(false);
                this.sincronizando.set(false);
              }),
            );
          }),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((resultado) => {
        // Si una actualización de fondo falla, conservar el último dato útil.
        // Un cambio de filtros ya vació los datos al comenzar la consulta.
        if (resultado.operacion.data) this.operacion.set(resultado.operacion.data);
        if (resultado.mapa.data) this.mapa.set(resultado.mapa.data);
        if (resultado.alertas.data) this.alertas.set(resultado.alertas.data);
        this.reaplicarPosiciones();
        const seleccionado = this.idRecorridoSeleccionado();
        if (seleccionado !== null) this.selecciones$.next(seleccionado);
        if (this.refrescoPendiente) {
          this.refrescoPendiente = false;
          this.refrescosSocket$.next();
        }

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
            if (this.detalle()?.id_recorrido !== idRecorrido) this.detalle.set(null);
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
              takeUntil(this.socketMonitoreo.sesionCerrada$),
              finalize(() => this.cargandoDetalle.set(false)),
            );
          }),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((resultado) => {
        if (resultado.data) {
          this.detalle.set({
            ...resultado.data,
            ...this.proyectarUbicacion(resultado.data.id_recorrido,
              resultado.data.ultima_ubicacion, resultado.data.gps),
          });
        }
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
  readonly zonasMapa = computed<MonitoreoZona[]>(() => {
    const zonas = new Map<number, MonitoreoZona>();
    for (const item of [...this.recorridosMapa(), ...this.programaciones()]) {
      if (item.ruta?.zona) zonas.set(item.ruta.zona.id_zona, item.ruta.zona);
    }
    return [...zonas.values()];
  });

  // *********************************************************
  // 16. TIEMPO REAL Y RECONCILIACIÓN
  // *********************************************************
  private configurarTiempoReal(): void {
    this.socketMonitoreo.sesionCerrada$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.sesionDisponible = false;
        this.refrescoPendiente = false;
        this.posicionesSocket.clear();
        this.ultimaRecepcionSocket.set(null);
        this.cerrarDetalle();
        this.detalle.set(null);
        this.mapa.set(null);
        this.operacion.set(null);
        this.alertas.set(null);
      });
    this.socketMonitoreo.ubicacion$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((evento) => this.aplicarTracking(evento));

    this.socketMonitoreo.recorrido$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((evento) => this.aplicarEstadoRecorrido(evento));

    this.socketMonitoreo.sincronizar$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.sesionDisponible = true;
        this.refrescosSocket$.next();
      });

    // Agrupar cambios de estado y programación; no consultar por cada GPS.
    this.refrescosSocket$
      .pipe(auditTime(1000), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refrescarEnSegundoPlano());

    // Envejecimiento visual aunque deje de llegar GPS.
    interval(15000).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.reaplicarPosiciones());

    // Resumen/alertas no están incluidos en el evento de ubicación.
    // También recupera datos perdidos por una desconexión.
    interval(30000).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.consultaActual() && !this.consultaEnCurso) {
          this.refrescosSocket$.next();
        }
      });
  }

  reconectarSocket(): void {
    void this.socketMonitoreo.iniciar();
  }

  private refrescarEnSegundoPlano(): void {
    if (!this.sesionDisponible || !this.consultaActual()) return;
    if (this.consultaEnCurso) {
      this.refrescoPendiente = true;
      return;
    }
    this.consultaEnFondo = true;
    this.consultas$.next({ ...this.filtros() });
  }

  private aplicarTracking(evento: TrackingActualizadoSocket): void {
    if (!this.consultaActual()) return;
    const ubicacion = normalizarTracking(evento);
    if (!ubicacion) return;
    const id = ubicacion.id_recorrido;
    if (!esMasReciente(ubicacion, this.posicionesSocket.get(id) ?? null)) return;
    this.posicionesSocket.delete(id);
    this.posicionesSocket.set(id, ubicacion);
    // Una sola posición por recorrido, con límite de memoria.
    if (this.posicionesSocket.size > 500) {
      const primero = this.posicionesSocket.keys().next().value;
      if (primero !== undefined) this.posicionesSocket.delete(primero);
    }
    this.ultimaRecepcionSocket.set(new Date().toISOString());
    this.reaplicarPosiciones();

    // Un recorrido nuevo requiere su DTO completo; no fabricar ruta/vehículo.
    if (!this.recorridosMapa().some((item) => Number(item.id_recorrido) === id) &&
      Date.now() - this.ultimoRecorridoDesconocido > 30000) {
      this.ultimoRecorridoDesconocido = Date.now();
      this.refrescosSocket$.next();
    }
  }

  private aplicarEstadoRecorrido(evento: RecorridoActualizadoSocket): void {
    if (!this.consultaActual()) return;
    // El estado y sus efectos en filtros, resumen y programación los resuelve REST.
    // Así un evento retrasado no devuelve un recorrido finalizado a EN_CURSO.
    if (!Number.isSafeInteger(Number(evento?.id_recorrido))) return;
    this.refrescosSocket$.next();
  }

  private proyectarUbicacion(
    id: number,
    actual: MonitoreoUltimaUbicacion | null,
    gps: import('../../interfaces').MonitoreoGps,
  ): {
    ultima_ubicacion: MonitoreoUltimaUbicacion | null;
    gps: import('../../interfaces').MonitoreoGps
  } {
    if (!this.consultaActual()) return { ultima_ubicacion: actual, gps };
    const pendiente = this.posicionesSocket.get(Number(id));
    const elegida = pendiente && esMasReciente(pendiente, actual) ? pendiente : actual;
    return {
      ultima_ubicacion: elegida,
      gps: elegida ? gpsVisual(elegida) : gps,
    };
  }

  private reaplicarPosiciones(): void {
    if (!this.consultaActual()) return;
    // Reaplicar después de REST evita que una respuesta en vuelo haga retroceder
    // un marcador que ya recibió una posición más reciente por socket.
    this.mapa.update((data) => data ? {
      ...data, items: data.items.map((item) => ({
        ...item,
        ...this.proyectarUbicacion(item.id_recorrido, item.ultima_ubicacion, item.gps),
      })),
    } : null);
    this.operacion.update((data) => data ? {
      ...data, items: data.items.map((item) => item.recorrido ? {
        ...item,
        ...this.proyectarUbicacion(item.recorrido.id_recorrido, item.ultima_ubicacion, item.gps),
      } : item),
    } : null);
    this.detalle.update((data) => data ? {
      ...data,
      ...this.proyectarUbicacion(data.id_recorrido, data.ultima_ubicacion, data.gps),
    } : null);
  }

  // *********************************************************
  // PANELES SUPERPUESTOS AL MAPA
  // *********************************************************
  readonly panelActivo = signal<
    'recorridos' | 'alertas' | 'detalle' | null
  >(null);

  alternarPanel(panel: 'recorridos' | 'alertas'): void {
    this.panelActivo.update((actual) =>
      actual === panel ? null : panel,
    );
  }

  cerrarPanel(): void {
    this.panelActivo.set(null);
  }
}
