import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { finalize, Subscription } from 'rxjs';

// Service
import { HistorialService } from 'src/app/features/recorridos/services/historial.service';

// Interfaces
import { HistorialDetalle, HistorialResultadoFinal } from 'src/app/features/recorridos/interfaces/historial';

@Component({
  selector: 'recoleccion-resultado-recorrido',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recoleccion-resultado-recorrido.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecoleccionResultadoRecorridoComponent implements OnChanges, OnDestroy {

  @Input() idRecorrido: number | null = null;
  @Input() actualizacion = 0;

  detalle: HistorialDetalle | null = null;

  cargando = false;
  errorCarga = '';

  private consulta?: Subscription;
  private revision = 0;
  private destruido = false;

  constructor(
    private readonly historialService: HistorialService,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['idRecorrido'] ||
      changes['actualizacion']
    ) {
      this.consultar();
    }
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.revision++;
    this.consulta?.unsubscribe();
  }

  consultar(): void {
    if (this.destruido) return;

    const revision = ++this.revision;

    this.consulta?.unsubscribe();

    this.detalle = null;
    this.errorCarga = '';
    this.cargando = false;

    const id = this.idRecorrido;

    if (id === null) {
      this.cdr.markForCheck();
      return;
    }

    if (!Number.isSafeInteger(id) || id <= 0) {
      this.errorCarga = 'El identificador del recorrido no es válido.';
      this.cdr.markForCheck();
      return;
    }

    this.cargando = true;
    this.cdr.markForCheck();

    this.consulta = this.historialService
      .getHistorialDetalle(id)
      .pipe(
        finalize(() => {
          if (!this.esConsultaActual(revision)) return;

          this.cargando = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: response => {
          if (!this.esConsultaActual(revision)) return;

          if (!response.success || !response.data) {
            this.errorCarga = response.message ||
              'No se pudo consultar el resultado del recorrido.';
            return;
          }

          const detalle = response.data;

          if (Number(detalle.recorrido.id_recorrido) !== id) {
            this.errorCarga =
              'La respuesta no corresponde al recorrido seleccionado.';
            return;
          }

          this.detalle = detalle;
        },

        error: (error: unknown) => {
          if (!this.esConsultaActual(revision)) return;

          this.errorCarga = this.obtenerMensajeError(error);
        },
      });
  }

  get resultado(): HistorialResultadoFinal | null {
    return this.detalle?.recorrido.resultado_final ?? null;
  }

  get cantidadValida(): boolean {
    const cantidad = this.resultado?.cantidad_total;

    return typeof cantidad === 'number' &&
      Number.isFinite(cantidad) &&
      cantidad >= 0;
  }

  get estadoLabel(): string {
    const estado = this.detalle?.recorrido.estado_recorrido;

    switch (estado) {
      case 'EN_CURSO':
        return 'En curso';
      case 'PAUSADO':
        return 'Pausado';
      case 'FINALIZADO':
        return 'Finalizado';
      case 'CANCELADO':
        return 'Cancelado';
      default:
        return 'Sin información';
    }
  }

  get mensajeSinResultado(): string {
    switch (this.detalle?.recorrido.estado_recorrido) {
      case 'EN_CURSO':
        return 'El recorrido está en curso. La cantidad total se registra después de finalizar.';

      case 'PAUSADO':
        return 'El recorrido está pausado. Todavía no corresponde registrar el resultado final.';

      case 'FINALIZADO':
        return 'El recorrido finalizó, pero el resultado final todavía no está registrado en el servidor. Puede estar pendiente de registro o sincronización.';

      case 'CANCELADO':
        return 'El recorrido fue cancelado y no tiene un resultado final registrado.';

      default:
        return 'No hay un resultado final disponible.';
    }
  }

  get porcentajeAtencion(): number {
    const resumen = this.detalle?.resumen_puntos;

    if (!resumen || resumen.total <= 0) return 0;

    return Math.min(
      100,
      Math.max(0, resumen.atendidos / resumen.total * 100),
    );
  }

  unidadLabel(unidad: string): string {
    const etiquetas: Record<string, string> = {
      KG: 'kg',
      TONELADA: 't',
      LITRO: 'L',
      M3: 'm³',
    };

    return etiquetas[unidad] ?? unidad;
  }

  private esConsultaActual(revision: number): boolean {
    return !this.destruido && revision === this.revision;
  }

  private obtenerMensajeError(error: unknown): string {
    const respaldo =
      'No se pudo consultar el resultado del recorrido.';

    if (typeof error === 'string') {
      return error.trim() || respaldo;
    }

    if (!error || typeof error !== 'object') {
      return respaldo;
    }

    const objeto = error as {
      message?: unknown;
      error?: unknown;
      details?: unknown;
    };

    const mensajeDe = (valor: unknown): string | null => {
      if (typeof valor === 'string') {
        return valor.trim() || null;
      }

      if (valor && typeof valor === 'object') {
        const message = (
          valor as { message?: unknown }
        ).message;

        if (typeof message === 'string') {
          return message.trim() || null;
        }
      }

      return null;
    };

    return mensajeDe(objeto.details) ??
      mensajeDe(objeto.error) ??
      mensajeDe(objeto.message) ??
      respaldo;
  }
}
