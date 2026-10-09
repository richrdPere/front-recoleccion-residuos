import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize, Subscription } from 'rxjs';
import Swal from 'sweetalert2';

// Services
import { UsuarioService } from '../../../services/usuario.service';

// Interfaces
import { UsuarioPaginadoItem } from '../../../interfaces';

@Component({
  selector: 'usuario-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './usuario-view.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsuarioViewComponent implements OnChanges, OnDestroy {

  // INPUTS / OUTPUTS
  @Input() mostrarModal = false;
  @Input() usuario_id: number | null = null;

  @Output() modalCerrado = new EventEmitter<void>();


  // ESTADO
  usuario: UsuarioPaginadoItem | null = null;

  loading = false;
  errorCarga: string | null = null;

  modalWidthClass = 'max-w-4xl';

  private cargaSubscription?: Subscription;
  private destruido = false;

  constructor(
    private readonly usuarioService: UsuarioService,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.mostrarModal) {
      this.cancelarCarga();
      this.limpiarDatos();
      return;
    }

    // También carga cuando se reabre el modal con el mismo ID.
    if (changes['usuario_id'] || changes['mostrarModal']) {
      this.cargarDatosUsuario();
    }
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.cancelarCarga();
  }

  // CARGAR INFORMACIÓN
  cargarDatosUsuario(): void {
    // Cancelar primero evita que una respuesta anterior
    // reemplace los datos del vehículo seleccionado.
    this.cancelarCarga();
    this.limpiarDatos();

    if (!this.mostrarModal) {
      return;
    }

    const idUsuario = this.usuario_id;

    if (
      idUsuario === null ||
      !Number.isInteger(idUsuario) ||
      idUsuario <= 0
    ) {
      this.errorCarga = 'Selecciona un usuario válido.';
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    this.cargaSubscription = this.usuarioService.getUsuarioById(idUsuario)
      .pipe(
        finalize(() => {
          this.loading = false;

          if (!this.destruido) {
            this.cdr.markForCheck();
          }
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response.success || !response.data) {
            this.mostrarError(
              response.message ||
              'No se pudo obtener la información del usuario.',
            );
            return;
          }

          this.usuario = response.data;
          this.errorCarga = null;
          this.cdr.markForCheck();
        },

        error: (error: unknown) => {
          this.mostrarError(this.obtenerMensajeError(error));
        },
      });
  }

  // ============================================================
  // MANEJO DE ERRORES
  // ============================================================
  private mostrarError(mensaje: string): void {
    this.usuario = null;
    this.errorCarga = mensaje;
    this.cdr.markForCheck();

    void Swal.fire({
      icon: 'error',
      title: 'No se pudo obtener el usuario',
      text: mensaje,
    });
  }

  private obtenerMensajeError(error: unknown): string {
    // Admite tanto el error normalizado por HttpServiceHelper
    // como un HttpErrorResponse con error.message.
    const detalle = error as {
      message?: unknown;
      error?: {
        message?: unknown;
      };
    } | null;

    const mensaje =
      detalle?.error?.message ??
      detalle?.message;

    return typeof mensaje === 'string' && mensaje.trim()
      ? mensaje
      : 'Ocurrió un error al cargar la información del vehículo.';
  }

  // ============================================================
  // MODAL
  // ============================================================
  setModalWidth(
    size: 'sm' | 'md' | 'lg' | 'xl' | 'full',
  ): void {
    const clases = {
      sm: 'max-w-md',
      md: 'max-w-xl',
      lg: 'max-w-4xl',
      xl: 'max-w-6xl',
      full: 'max-w-full w-[95vw]',
    };

    this.modalWidthClass = clases[size];
    this.cdr.markForCheck();
  }

  cerrarModal(): void {
    this.cancelarCarga();
    this.limpiarDatos();

    // El padre controla mostrarModal.
    this.modalCerrado.emit();
    this.cdr.markForCheck();
  }

  // ============================================================
  // LIMPIEZA
  // ============================================================
  private cancelarCarga(): void {
    this.cargaSubscription?.unsubscribe();
    this.cargaSubscription = undefined;
    this.loading = false;
  }

  private limpiarDatos(): void {
    this.usuario = null;
    this.errorCarga = null;
  }

}
