import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription, catchError, finalize, forkJoin, of } from 'rxjs';

// Services
import { HistorialService } from '../../services/historial.service';
import { RutasServices } from 'src/app/features/rutas/services/rutas.service';

// Interfaces
import { GetHistorialListadoFilters, HistorialDetalle, HistorialEstadoRecorrido, HistorialListado, HistorialTrazado } from '../../interfaces/historial';
import { HistorialFila } from '../../interfaces/historial';
import { CancelarRecorridoResponse } from '../../interfaces/recorridos';

// Componentes
import { RecorridosViewComponent } from '../components/recorridos-view/recorridos-view.component';
import { RecorridosCancelarComponent } from '../components/recorridos-cancelar/recorridos-cancelar.component';
import { RutaActivaData } from 'src/app/features/rutas/interfaces/rutas';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';


// ============================================================
// FECHA LOCAL DE PERÚ
// ============================================================
const fechaPeru = (fecha: Date): string => {
  const partes = new Intl.DateTimeFormat(
    'en',
    {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    },
  ).formatToParts(fecha);

  const valor = (tipo: string) =>
    partes.find(
      (parte) => parte.type === tipo,
    )?.value;

  return `${valor('year')}-${valor('month')}-${valor('day')}`;
};

@Component({
  selector: 'app-recorridos-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RecorridosViewComponent,
    RecorridosCancelarComponent,
  ],
  templateUrl: './recorridos-page.component.html',
  styles: ``,

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecorridosPageComponent implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);

  // ==========================================================
  // DATOS
  // ==========================================================
  listado: HistorialListado | null = null;
  recorridos: HistorialListado['items'] = [];

  detalle: HistorialDetalle | null = null;
  trazado: HistorialTrazado | null = null;

  recorridoSeleccionadoId: number | null = null;

  // ============================================================
  // MODAL DE DETALLE
  // ============================================================
  mostrarModalView = false;
  recorrido_id: number | null = null;

  // ============================================================
  // MODAL DE CANCELACIÓN
  // ============================================================
  mostrarModalCancelar = false;

  recorridoCancelarSeleccionado: HistorialFila | null = null;

  // ==========================================================
  // ESTADOS DE CARGA
  // ==========================================================
  isLoading = true;
  isLoadingDetalle = false;

  cargandoRutasActivas = false;
  errorRutasActivas: string | null = null;

  errorFiltros: string | null = null;

  // ==========================================================
  // ERRORES
  // ==========================================================
  error: string | null = null;
  errorDetalle: string | null = null;
  errorTrazado: string | null = null;

  // ==========================================================
  // FILTROS
  // ==========================================================
  searchTimeout: any;

  fechaInicioBusqueda = fechaPeru(
    new Date(Date.now() - 30 * 86400000),
  );

  fechaFinBusqueda = fechaPeru(new Date());

  // estadoBusqueda: HistorialEstadoRecorrido | '' = 'FINALIZADO';
  estadoBusqueda: HistorialEstadoRecorrido | '' = '';

  totalItems = 0;

  idZonaBusqueda: number | null = null;
  idRutaBusqueda: number | null = null;
  idVehiculoBusqueda: number | null = null;

  readonly estadosDisponibles = [
    { value: '', label: 'Todos' },
    { value: 'FINALIZADO', label: 'Finalizados' },
    { value: 'CANCELADO', label: 'Cancelados' },
    { value: 'EN_CURSO', label: 'En curso' },
    { value: 'PAUSADO', label: 'Pausados' },
  ];

  // ==========================================================
  // PAGINACIÓN
  // ==========================================================
  page = 1;
  limit = 5;

  currentPage = 1;
  totalPages = 0;

  readonly pageSizeOptions = [5, 10, 20, 50];

  // ==========================================================
  // SELECTORES
  // ==========================================================
  readonly estadosOperativos: {
    value: HistorialEstadoRecorrido;
    label: string;
  }[] = [
      {
        value: 'EN_CURSO',
        label: 'EN CURSO',
      },
      {
        value: 'PAUSADO',
        label: 'PAUSADO',
      },
      {
        value: 'FINALIZADO',
        label: 'FINALIZADO',
      },
      {
        value: 'CANCELADO',
        label: 'CANCELADO',
      },
    ];

  rutasActivas: RutaActivaData[] = [];

  // ==========================================================
  // SUSCRIPCIONES
  // ==========================================================
  private consulta?: Subscription;
  private consultaDetalle?: Subscription;

  private destruido = false;

  constructor(
    private readonly historialService: HistorialService,
    private readonly rutasService: RutasServices,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  // ==========================================================
  // CICLO DE VIDA
  // ==========================================================
  ngOnInit(): void {
    this.getRecorridosPaginated();
    this.getRutasActivas();
  }

  ngOnDestroy(): void {
    this.destruido = true;

    this.consulta?.unsubscribe();
    this.consultaDetalle?.unsubscribe();
  }

  // ==========================================================
  // LISTADO
  // ==========================================================

  // ==========================================================
  // OBTENER RUTAS ACTIVAS
  // ==========================================================
  getRutasActivas(): void {
    if (this.cargandoRutasActivas) {
      return;
    }

    this.cargandoRutasActivas = true;
    this.errorRutasActivas = null;

    this.rutasService.getRutasActivas()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.cargandoRutasActivas = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response.success) {
            this.rutasActivas = [];
            this.errorRutasActivas = response.message || 'No se pudieron obtener las rutas activas.';

            return;
          }

          this.rutasActivas = response.data ?? [];
        },

        error: (error: unknown) => {
          this.rutasActivas = [];

          const err = error as {
            error?: { message?: string } | string;
            message?: string;
          } | null;

          const mensajeBackend =
            typeof err?.error === 'string'
              ? err.error
              : err?.error?.message;

          this.errorRutasActivas =
            mensajeBackend ||
            err?.message ||
            'Ocurrió un error al cargar las rutas activas.';
        },
      });
  }

  getRecorridosPaginated(): void {

    // --------------------------------------------------------
    // 3. CONSTRUIR FILTROS TIPADOS
    // --------------------------------------------------------
    const filtros: GetHistorialListadoFilters = {
      fecha_inicio: this.fechaInicioBusqueda,
      fecha_fin: this.fechaFinBusqueda,

      page: this.page,
      limit: this.limit,

      sort_by: 'fecha_inicio',
      sort_order: 'DESC',
    };

    // No enviar estado cuando se selecciona "Todos".
    if (this.estadoBusqueda) {
      filtros.estado = this.estadoBusqueda;
    }

    if (this.idZonaBusqueda !== null) {
      filtros.id_zona = Number(this.idZonaBusqueda);
    }

    if (this.idRutaBusqueda !== null) {
      filtros.id_ruta = Number(this.idRutaBusqueda);
    }

    if (this.idVehiculoBusqueda !== null) {
      filtros.id_vehiculo = Number(this.idVehiculoBusqueda);
    }

    // --------------------------------------------------------
    // 4. CONSULTAR LISTADO
    // --------------------------------------------------------
    this.isLoading = true;
    this.marcarCambios();

    this.consulta = this.historialService
      .getHistorialListado(filtros)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.marcarCambios();
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response.success || !response.data) {
            this.limpiarListado();

            this.error =
              response.message ||
              'No se pudo consultar el historial.';

            this.marcarCambios();
            return;
          }

          const datos = response.data;
          const paginacion = datos.pagination;

          // El objeto completo conserva resumen,
          // filtros aplicados, columnas y metadata.
          this.listado = datos;
          this.recorridos = datos.items;

          this.totalItems = paginacion.total;
          this.totalPages = paginacion.total_pages;

          this.page = paginacion.page;
          this.currentPage = paginacion.page;
          this.limit = paginacion.limit;

          this.error = null;

          this.marcarCambios();
        },

        error: (error: unknown) => {
          this.limpiarListado();

          this.error = this.obtenerMensajeError(
            error,
            'No se pudo consultar el historial.',
          );

          this.marcarCambios();
        },
      });
  }

  // buscar(page = 1): void {

  // }

  // ============================================================
  // MODAL DE CANCELACIÓN
  // ============================================================
  abrirModalCancelar(recorrido: HistorialFila): void {
    if (
      !['EN_CURSO', 'PAUSADO'].includes(
        recorrido.estado,
      )
    ) {
      return;
    }

    this.recorridoCancelarSeleccionado = {
      ...recorrido,
    };

    this.mostrarModalCancelar = true;
  }

  cerrarModalCancelar(): void {
    this.mostrarModalCancelar = false;
    this.recorridoCancelarSeleccionado = null;
  }

  onRecorridoCancelado(
    _recorrido: CancelarRecorridoResponse['data'],
  ): void {
    // Volver al inicio evita quedar en una página vacía
    // si el recorrido deja de cumplir el filtro actual.
    this.page = 1;
    this.getRecorridosPaginated();
  }

  // ============================================================
  // MODAL DE DETALLE
  // ============================================================
  ver(idRecorrido: number): void {
    if (
      !Number.isSafeInteger(idRecorrido) ||
      idRecorrido <= 0
    ) {
      return;
    }

    this.recorrido_id = idRecorrido;
    this.mostrarModalView = true;
  }

  cerrarModalInfo(): void {
    this.mostrarModalView = false;
    this.recorrido_id = null;
  }

  cerrarDetalle(): void {
    this.consultaDetalle?.unsubscribe();
    this.consultaDetalle = undefined;

    this.recorridoSeleccionadoId = null;

    this.detalle = null;
    this.trazado = null;

    this.errorDetalle = null;
    this.errorTrazado = null;

    this.isLoadingDetalle = false;

    this.marcarCambios();
  }

  // ==========================================================
  // FILTROS Y PAGINACIÓN
  // ==========================================================
  onFiltroChange(): void {
    // this.page = 1;
    // this.getRecorridosPaginated();

    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.getRecorridosPaginated();
    }, 300);
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina < 1 || nuevaPagina > this.totalPages) {
      return;
    }
    this.page = nuevaPagina;
    this.getRecorridosPaginated();
    // this.buscar(nuevaPagina);
  }

  cambiarLimite(): void {
    this.limit = Number(this.limit);
    this.page = 1;

    this.getRecorridosPaginated();
  }

  limpiarFiltros(): void {
    this.fechaInicioBusqueda = fechaPeru(
      new Date(Date.now() - 30 * 86400000),
    );

    this.fechaFinBusqueda = fechaPeru(new Date());

    this.estadoBusqueda = 'FINALIZADO';

    this.idZonaBusqueda = null;
    this.idRutaBusqueda = null;
    this.idVehiculoBusqueda = null;

    this.page = 1;

    this.getRecorridosPaginated();
  }

  // ==========================================================
  // VALIDACIONES
  // ==========================================================
  private validarFiltros(): string | null {
    const fechaValida = (valor: string): boolean => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
        return false;
      }

      const fecha = new Date(
        `${valor}T00:00:00.000Z`,
      );

      return (
        Number.isFinite(fecha.getTime()) &&
        fecha.toISOString().slice(0, 10) === valor
      );
    };

    if (
      !fechaValida(this.fechaInicioBusqueda) ||
      !fechaValida(this.fechaFinBusqueda)
    ) {
      return 'Debe seleccionar fechas válidas.';
    }

    if (this.fechaInicioBusqueda > this.fechaFinBusqueda) {
      return 'La fecha inicial no puede ser posterior a la fecha final.';
    }

    const identificadores = [
      { nombre: 'zona', valor: this.idZonaBusqueda },
      { nombre: 'ruta', valor: this.idRutaBusqueda },
      { nombre: 'vehículo', valor: this.idVehiculoBusqueda },
    ];

    for (const item of identificadores) {
      if (
        item.valor !== null &&
        (
          !Number.isSafeInteger(Number(item.valor)) ||
          Number(item.valor) <= 0
        )
      ) {
        return `El identificador de ${item.nombre} no es válido.`;
      }
    }

    if (
      !this.estadosDisponibles.some(
        (item) => item.value === this.estadoBusqueda,
      )
    ) {
      return 'El estado seleccionado no es válido.';
    }

    return null;
  }

  // ==========================================================
  // PRESENTACIÓN
  // ==========================================================

  get rutasDisponibles(): RutaActivaData[] {
    const opciones: RutaActivaData[] = this.rutasActivas.filter(
      r => r.estado && r.estado_ruta === 'ACTIVA' && !r.deleted_at
    );

    return opciones;
  }


  duracion(segundos: number | null): string {
    if (
      segundos === null ||
      !Number.isFinite(segundos) ||
      segundos < 0
    ) {
      return 'Sin determinar';
    }

    const total = Math.floor(segundos);

    const horas = Math.floor(total / 3600);
    const minutos = Math.floor((total % 3600) / 60);
    const restantes = total % 60;

    return `${horas} h ${minutos} min ${restantes} s`;
  }

  obtenerEstado(estado: string): {
    label: string;
    class: string;
  } {
    const estados: Record<
      string,
      { label: string; class: string }
    > = {
      FINALIZADO: {
        label: 'Finalizado',
        class: 'badge-success',
      },
      CANCELADO: {
        label: 'Cancelado',
        class: 'badge-error',
      },
      EN_CURSO: {
        label: 'En curso',
        class: 'badge-info',
      },
      PAUSADO: {
        label: 'Pausado',
        class: 'badge-warning',
      },
    };

    return estados[estado] ?? {
      label: estado,
      class: 'badge-neutral',
    };
  }

  // ==========================================================
  // MANEJO DE ERRORES
  // ==========================================================
  private obtenerMensajeError(
    error: unknown,
    mensajePorDefecto: string,
  ): string {
    const textoValido = (
      valor: unknown,
    ): string | null =>
      typeof valor === 'string' && valor.trim()
        ? valor.trim()
        : null;

    const leerMensaje = (
      valor: unknown,
    ): string | null => {
      if (!valor || typeof valor !== 'object') {
        return null;
      }

      return textoValido(
        (valor as { message?: unknown }).message,
      );
    };

    const directo = textoValido(error);

    if (directo) {
      return directo;
    }

    if (error && typeof error === 'object') {
      const objeto = error as {
        details?: unknown;
        error?: unknown;
        message?: unknown;
      };

      return (
        leerMensaje(objeto.details) ??
        leerMensaje(objeto.error) ??
        textoValido(objeto.message) ??
        mensajePorDefecto
      );
    }

    return mensajePorDefecto;
  }

  // ==========================================================
  // LIMPIEZA Y DETECCIÓN DE CAMBIOS
  // ==========================================================
  private limpiarListado(): void {
    this.listado = null;
    this.recorridos = [];

    this.currentPage = 1;
    this.totalPages = 0;
  }

  private marcarCambios(): void {
    if (!this.destruido) {
      this.cdr.markForCheck();
    }
  }
}
