import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, firstValueFrom, Observable, Subject, Subscription, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

// Service
import { RutaHorarioService } from '../../services/ruta-horario.service';

// Interfaces
import { RutaHorarioData } from '../../interfaces/rutas';
import { RutaHorarioFormComponent } from './ruta-horario-form/ruta-horario-form.component';

@Component({
  selector: 'ruta-horario',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    RutaHorarioFormComponent
  ],
  templateUrl: './ruta-horarios.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RutaHorarioComponent implements OnChanges, OnDestroy {
  // ================================
  // Inputs / Outputs
  // ================================
  @Input() mostrarModal = false;
  @Input() ruta_id: number | null = null;

  @Output() modalCerrado = new EventEmitter<void>();
  @Output() crearHorario = new EventEmitter<number>();
  @Output() editarHorario = new EventEmitter<RutaHorarioData>();
  @Output() horariosActualizados = new EventEmitter<number>();

  // ================================
  // Horarios
  // ================================
  horarios: RutaHorarioData[] = [];
  horariosFiltrados: RutaHorarioData[] = [];
  horariosPaginados: RutaHorarioData[] = [];

  isLoading = false;
  errorCarga: string | null = null;

  mostrarModalForm = false;
  modoEdicion = false;
  horarioSeleccionado: RutaHorarioData | null = null;

  // Search / filtros
  searchBusqueda = '';
  filtroDia = '';
  filtroFrecuencia = '';
  filtroEstado: boolean | null = null;

  searchTimeout?: ReturnType<typeof setTimeout>;

  // Selectores obtenidos de los datos del backend
  diasDisponibles: string[] = [];
  frecuenciasDisponibles: string[] = [];

  // Paginado
  page = 1;
  limit = 5;
  totalItems = 0;
  totalPages = 0;
  currentPage = 1;

  pageSizeOptions = [5, 10, 20, 50];

  // Bloqueo de operaciones por horario
  readonly horariosEnOperacion = new Set<string>();

  private consulta?: Subscription;
  private readonly destroy$ = new Subject<void>();
  private destruido = false;

  constructor(
    private horarioService: RutaHorarioService,
    private cdr: ChangeDetectorRef,
  ) { }

  // El componente carga cuando se abre o cambia la ruta.
  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['mostrarModal'] && !changes['ruta_id']) {
      return;
    }

    clearTimeout(this.searchTimeout);
    this.consulta?.unsubscribe();

    this.reiniciarFiltros();
    this.vaciarListado();
    this.errorCarga = null;

    if (this.mostrarModal) {
      this.getHorariosByRuta();
    }
    this.cerrarModalForm();
  }

  ngOnDestroy(): void {
    this.destruido = true;

    clearTimeout(this.searchTimeout);
    this.consulta?.unsubscribe();

    this.destroy$.next();
    this.destroy$.complete();
  }

  // ================================
  // Methods
  // ================================
  getHorariosByRuta(): void {
    this.consulta?.unsubscribe();
    this.errorCarga = null;

    const idRuta = this.ruta_id;

    if (
      idRuta === null ||
      !Number.isSafeInteger(idRuta) ||
      idRuta <= 0
    ) {
      this.isLoading = false;
      this.vaciarListado();
      this.errorCarga = 'El identificador de la ruta no es válido.';
      this.cdr.markForCheck();
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    this.consulta = this.horarioService
      .getHorariosByRuta(idRuta)
      .pipe(
        finalize(() => {
          this.isLoading = false;

          if (!this.destruido) {
            this.cdr.markForCheck();
          }
        }),
      )
      .subscribe({
        next: (res) => {
          if (!res.success) {
            this.vaciarListado();
            this.errorCarga =
              res.message || 'No se pudieron obtener los horarios.';
            return;
          }

          this.horarios = [...(res.data ?? [])];

          this.diasDisponibles = [
            ...new Set(
              this.horarios.map((horario) => horario.dia_semana),
            ),
          ].sort();

          this.frecuenciasDisponibles = [
            ...new Set(
              this.horarios.map((horario) => horario.frecuencia),
            ),
          ].sort();

          this.aplicarFiltros();
        },
        error: (error: unknown) => {
          this.vaciarListado();
          this.errorCarga = this.obtenerMensajeError(
            error,
            'No se pudieron obtener los horarios.',
          );
        },
      });
  }

  abrirNuevoHorario(): void {
    if (
      this.ruta_id === null ||
      this.isLoading ||
      this.horariosEnOperacion.size > 0
    ) {
      return;
    }

    this.modoEdicion = false;
    this.horarioSeleccionado = null;
    this.mostrarModalForm = true;
  }

  abrirEditarHorario(horario: RutaHorarioData): void {
    if (
      this.isLoading ||
      this.horariosEnOperacion.size > 0
    ) {
      return;
    }

    this.modoEdicion = true;
    this.horarioSeleccionado = { ...horario };
    this.mostrarModalForm = true;
  }

  cerrarModalForm(): void {
    this.mostrarModalForm = false;
    this.horarioSeleccionado = null;
  }

  onHorarioGuardado(): void {
    this.cerrarModalForm();
    this.getHorariosByRuta();

    if (this.ruta_id !== null) {
      this.horariosActualizados.emit(this.ruta_id);
    }
  }

  // abrirNuevoHorario(): void {
  //   if (
  //     this.ruta_id === null ||
  //     this.isLoading ||
  //     this.horariosEnOperacion.size > 0
  //   ) {
  //     return;
  //   }

  //   this.crearHorario.emit(this.ruta_id);
  // }

  // abrirEditarHorario(horario: RutaHorarioData): void {
  //   if (
  //     this.isLoading ||
  //     this.horariosEnOperacion.size > 0
  //   ) {
  //     return;
  //   }

  //   this.editarHorario.emit({ ...horario });
  // }

  async cambiarEstado(
    horario: RutaHorarioData,
    event: Event,
  ): Promise<void> {
    const input = event.target as HTMLInputElement;

    // Restaurar el checkbox hasta confirmar la operación.
    input.checked = horario.estado;

    if (
      this.ruta_id === null ||
      this.isLoading ||
      this.horariosEnOperacion.size > 0 ||
      horario.id_ruta !== this.ruta_id
    ) {
      return;
    }

    const idRuta = this.ruta_id;
    const clave = `${idRuta}:${horario.id_ruta_horario}`;
    const nuevoEstado = !horario.estado;

    this.horariosEnOperacion.add(clave);
    this.cdr.markForCheck();

    try {
      const resultado = await Swal.fire({
        icon: 'warning',
        title: nuevoEstado
          ? '¿Activar horario?'
          : '¿Desactivar horario?',

        text: `${nuevoEstado ? 'Se habilitará' : 'Se deshabilitará'
          } el horario de ${horario.dia_semana}, ${horario.hora_inicio
          } a ${horario.hora_fin}.`,

        showCancelButton: true,
        confirmButtonText: nuevoEstado
          ? 'Sí, activar'
          : 'Sí, desactivar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: nuevoEstado ? '#16a34a' : '#dc2626',

        reverseButtons: true,
        focusCancel: true,
        showLoaderOnConfirm: true,

        allowOutsideClick: () => !Swal.isLoading(),
        allowEscapeKey: () => !Swal.isLoading(),

        preConfirm: async () => {
          if (
            this.destruido ||
            this.ruta_id !== idRuta ||
            !this.mostrarModal
          ) {
            Swal.showValidationMessage(
              'La ruta seleccionada cambió. Cancela esta operación.',
            );
            return false;
          }

          try {
            const response = await firstValueFrom(
              this.horarioService
                .changeRutaHorarioEstado(
                  idRuta,
                  horario.id_ruta_horario,
                  { estado: nuevoEstado },
                )
                .pipe(takeUntil(this.destroy$)),
            );

            if (!response.success || !response.data) {
              Swal.showValidationMessage(
                response.message ||
                'No se pudo actualizar el estado del horario.',
              );
              return false;
            }

            return response;
          } catch (error: unknown) {
            if (!this.destruido) {
              Swal.showValidationMessage(
                this.obtenerMensajeError(
                  error,
                  'No se pudo actualizar el estado del horario.',
                ),
              );
            }

            return false;
          }
        },
      });

      if (
        this.destruido ||
        !resultado.isConfirmed ||
        !resultado.value
      ) {
        return;
      }

      const horarioActualizado = resultado.value.data;

      // Actualizar únicamente el listado de la misma ruta.
      if (this.ruta_id === idRuta && this.mostrarModal) {
        this.horarios = this.horarios.map((item) =>
          item.id_ruta_horario === horarioActualizado.id_ruta_horario
            ? { ...horarioActualizado }
            : item,
        );

        // Mantiene coherentes los filtros y la paginación.
        this.aplicarFiltros();

        input.checked = horarioActualizado.estado;
      }

      this.horariosActualizados.emit(idRuta);

      void Swal.fire({
        icon: 'success',
        title: horarioActualizado.estado
          ? 'Horario activado'
          : 'Horario desactivado',
        text: resultado.value.message,
        timer: 1800,
        showConfirmButton: false,
      });
    } finally {
      this.horariosEnOperacion.delete(clave);

      if (!this.destruido) {
        this.cdr.markForCheck();
      }
    }
  }

  async eliminarHorario(
    horario: RutaHorarioData,
  ): Promise<void> {
    if (
      this.ruta_id === null ||
      this.isLoading ||
      this.horariosEnOperacion.size > 0
    ) {
      return;
    }

    const idRuta = this.ruta_id;

    await this.confirmarOperacion({
      horario,
      idRuta,
      titulo: '¿Eliminar horario?',
      texto: `Se eliminará el horario de ${horario.dia_semana
        }, ${horario.hora_inicio} a ${horario.hora_fin}.`,
      confirmacion: 'Sí, eliminar',
      tituloExito: 'Horario eliminado',
      color: '#dc2626',
      ejecutar: () =>
        this.horarioService.deleteRutaHorario(
          idRuta,
          horario.id_ruta_horario,
        ),
    });
  }

  estaEnOperacion(horario: RutaHorarioData): boolean {
    return this.horariosEnOperacion.has(
      `${horario.id_ruta}:${horario.id_ruta_horario}`,
    );
  }

  // ================================
  // Helpers methods
  // ================================
  aplicarFiltros(): void {
    const busqueda = this.searchBusqueda.trim().toUpperCase();

    this.horariosFiltrados = this.horarios.filter((horario) => {
      const texto = [
        horario.dia_semana,
        horario.frecuencia,
        horario.hora_inicio,
        horario.hora_fin,
        horario.observacion ?? '',
      ].join(' ').toUpperCase();

      return (
        (!busqueda || texto.includes(busqueda)) &&
        (!this.filtroDia || horario.dia_semana === this.filtroDia) &&
        (
          !this.filtroFrecuencia ||
          horario.frecuencia === this.filtroFrecuencia
        ) &&
        (
          this.filtroEstado === null ||
          horario.estado === this.filtroEstado
        )
      );
    });

    this.totalItems = this.horariosFiltrados.length;
    this.totalPages = Math.ceil(this.totalItems / this.limit);

    this.page = Math.min(
      Math.max(this.page, 1),
      Math.max(this.totalPages, 1),
    );

    this.currentPage = this.page;

    const inicio = (this.page - 1) * this.limit;

    this.horariosPaginados = this.horariosFiltrados.slice(
      inicio,
      inicio + this.limit,
    );

    this.cdr.markForCheck();
  }

  onSearchChange(): void {
    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.aplicarFiltros();
    }, 300);
  }

  onFiltroChange(): void {
    clearTimeout(this.searchTimeout);
    this.page = 1;
    this.aplicarFiltros();
  }

  cambiarPagina(nuevaPagina: number): void {
    if (
      nuevaPagina < 1 ||
      nuevaPagina > this.totalPages
    ) {
      return;
    }

    this.page = nuevaPagina;
    this.aplicarFiltros();
  }

  cambiarLimite(): void {
    this.limit = Number(this.limit);

    if (!this.pageSizeOptions.includes(this.limit)) {
      this.limit = 5;
    }

    this.page = 1;
    this.aplicarFiltros();
  }

  limpiarFiltros(): void {
    clearTimeout(this.searchTimeout);
    this.reiniciarFiltros();
    this.aplicarFiltros();
  }

  private reiniciarFiltros(): void {
    this.searchBusqueda = '';
    this.filtroDia = '';
    this.filtroFrecuencia = '';
    this.filtroEstado = null;
    this.page = 1;
    this.currentPage = 1;
  }

  private vaciarListado(): void {
    this.horarios = [];
    this.horariosFiltrados = [];
    this.horariosPaginados = [];

    this.diasDisponibles = [];
    this.frecuenciasDisponibles = [];

    this.totalItems = 0;
    this.totalPages = 0;
  }

  // Comparte la confirmación y manejo de errores
  // entre eliminación y cambio de estado.
  private async confirmarOperacion(config: {
    horario: RutaHorarioData;
    idRuta: number;
    titulo: string;
    texto: string;
    confirmacion: string;
    tituloExito: string;
    color: string;
    ejecutar: () => Observable<{
      success: boolean;
      message: string;
    }>;
  }): Promise<void> {
    const clave =
      `${config.idRuta}:${config.horario.id_ruta_horario}`;

    this.horariosEnOperacion.add(clave);
    this.cdr.markForCheck();

    try {
      const resultado = await Swal.fire({
        icon: 'warning',
        title: config.titulo,
        text: config.texto,
        showCancelButton: true,
        confirmButtonText: config.confirmacion,
        cancelButtonText: 'Cancelar',
        confirmButtonColor: config.color,
        reverseButtons: true,
        focusCancel: true,
        showLoaderOnConfirm: true,

        allowOutsideClick: () => !Swal.isLoading(),
        allowEscapeKey: () => !Swal.isLoading(),

        preConfirm: async () => {
          // Evita operar si el contexto cambió antes de confirmar.
          if (
            this.destruido ||
            this.ruta_id !== config.idRuta ||
            !this.mostrarModal
          ) {
            Swal.showValidationMessage(
              'La ruta seleccionada cambió. Cancela esta operación.',
            );
            return false;
          }

          try {
            const response = await firstValueFrom(
              config.ejecutar().pipe(
                takeUntil(this.destroy$),
              ),
            );

            if (!response.success) {
              Swal.showValidationMessage(
                response.message || 'No se pudo completar la operación.',
              );
              return false;
            }

            return response;
          } catch (error: unknown) {
            if (!this.destruido) {
              Swal.showValidationMessage(
                this.obtenerMensajeError(
                  error,
                  'No se pudo completar la operación.',
                ),
              );
            }

            return false;
          }
        },
      });

      if (
        this.destruido ||
        !resultado.isConfirmed ||
        !resultado.value
      ) {
        return;
      }

      // Consulta nuevamente el estado confirmado por el backend.
      if (
        this.ruta_id === config.idRuta &&
        this.mostrarModal
      ) {
        this.getHorariosByRuta();
      }

      this.horariosActualizados.emit(config.idRuta);

      void Swal.fire({
        icon: 'success',
        title: config.tituloExito,
        text: resultado.value.message,
        timer: 1800,
        showConfirmButton: false,
      });
    } finally {
      this.horariosEnOperacion.delete(clave);

      if (!this.destruido) {
        this.cdr.markForCheck();
      }
    }
  }

  private obtenerMensajeError(
    error: unknown,
    fallback: string,
  ): string {
    if (typeof error === 'string' && error.trim()) {
      return error;
    }

    const err = error as {
      error?: { message?: unknown } | string;
      message?: unknown;
    } | null;

    const mensajeBackend = typeof err?.error === 'string'
      ? err.error
      : err?.error?.message;

    const mensaje = mensajeBackend ?? err?.message;

    return typeof mensaje === 'string' && mensaje.trim()
      ? mensaje
      : fallback;
  }

  // ================================
  // Modales methods
  // ================================
  cerrarModal(): void {
    if (this.horariosEnOperacion.size > 0) {
      return;
    }

    this.modalCerrado.emit();
  }
}
