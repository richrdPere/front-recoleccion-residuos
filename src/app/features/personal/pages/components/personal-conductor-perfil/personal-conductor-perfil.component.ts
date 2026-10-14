import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subscription, finalize } from 'rxjs';
import Swal from 'sweetalert2';

// Services
import { PersonalService } from 'src/app/features/personal/services/personal.service';
import { ConductorService } from 'src/app/features/personal/services/condutor.service';


// ============================================================
// TIPOS DERIVADOS DEL SERVICIO
// ============================================================
type PerfilConductorIdentificador = Parameters<ConductorService['getPerfilConductor']>[0];
type RespuestaObservable<T> = T extends Observable<infer R> ? R : never;
type GetPerfilConductorResponse = RespuestaObservable<ReturnType<ConductorService['getPerfilConductor']>>;
type PerfilConductorData = GetPerfilConductorResponse['data'];

@Component({
  selector: 'personal-conductor-perfil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './personal-conductor-perfil.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonalConductorPerfilComponent
  implements OnChanges, OnDestroy {

  // ============================================================
  // INPUTS / OUTPUTS
  // ============================================================

  @Input() mostrarModal = false;

  // Es el ID del personal operativo, no el ID del conductor.
  @Input() personal_id: PerfilConductorIdentificador | null = null;

  @Output() modalCerrado = new EventEmitter<void>();

  // Permite actualizar el listado del componente padre.
  @Output() conductorActualizado =
    new EventEmitter<PerfilConductorData>();

  // ============================================================
  // ESTADO
  // ============================================================

  conductor: PerfilConductorData | null = null;

  loading = false;
  cambiandoEstado = false;

  errorCarga: string | null = null;
  modalWidthClass = 'max-w-4xl';

  private cargaSubscription?: Subscription;
  private estadoSubscription?: Subscription;

  private destruido = false;

  constructor(
    private readonly personalService: PersonalService,
    private readonly conductorService: ConductorService,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  // ============================================================
  // CICLO DE VIDA
  // ============================================================

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.mostrarModal) {
      this.cancelarSolicitudes();
      this.limpiarDatos();
      return;
    }

    if (changes['personal_id'] || changes['mostrarModal']) {
      this.cancelarSolicitudes();
      this.cargarPerfilConductor();
    }
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.cancelarSolicitudes();
  }

  // ============================================================
  // CARGAR PERFIL
  // ============================================================

  cargarPerfilConductor(): void {
    if (this.destruido || this.cambiandoEstado) {
      return;
    }

    this.cancelarCarga();
    this.limpiarDatos();

    if (!this.mostrarModal) {
      return;
    }

    const idPersonal = this.personal_id;

    if (!this.identificadorValido(idPersonal)) {
      this.errorCarga = 'Selecciona un personal operativo válido.';
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    this.cargaSubscription = this.conductorService
      .getPerfilConductor(idPersonal)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.actualizarVista();
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response.success || !response.data) {
            this.mostrarErrorCarga(
              response.message ||
              'No se pudo obtener el perfil del conductor.',
            );

            return;
          }

          this.conductor = response.data;
          this.errorCarga = null;
          this.actualizarVista();
        },

        error: (error: unknown) => {
          this.mostrarErrorCarga(
            this.obtenerMensajeError(
              error,
              'Ocurrió un error al cargar el perfil del conductor.',
            ),
          );
        },
      });
  }

  // ============================================================
  // CAMBIAR ESTADO DEL PERFIL
  // ============================================================

  cambiarEstadoConductor(nuevoEstado: boolean): void {
    if (
      this.destruido ||
      !this.mostrarModal ||
      this.loading ||
      this.cambiandoEstado ||
      !this.conductor
    ) {
      return;
    }

    if (
      typeof nuevoEstado !== 'boolean' ||
      nuevoEstado === this.conductor.estado
    ) {
      return;
    }

    const idPersonal = this.personal_id;

    if (
      !this.identificadorValido(idPersonal) ||
      String(this.conductor.id_personal) !== String(idPersonal)
    ) {
      void Swal.fire({
        icon: 'error',
        title: 'No se pudo identificar el personal',
        text: 'Selecciona nuevamente el perfil que deseas actualizar.',
      });

      this.actualizarVista();
      return;
    }

    this.cambiandoEstado = true;
    this.actualizarVista();

    this.estadoSubscription = this.conductorService
      .changeEstadoConductor(
        idPersonal,
        { estado: nuevoEstado },
      )
      .pipe(
        finalize(() => {
          this.cambiandoEstado = false;
          this.actualizarVista();
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response.success || !response.data) {
            this.mostrarErrorEstado(
              response.message ||
              'No se pudo cambiar el estado del conductor.',
            );

            return;
          }

          // Se utiliza la respuesta completa del backend.
          this.conductor = response.data;
          this.actualizarVista();

          void Swal.fire({
            icon: 'success',
            title: response.data.estado
              ? 'Perfil de conductor activado'
              : 'Perfil de conductor desactivado',
            text: response.message ||
              'El estado del perfil fue actualizado correctamente.',
          });

          this.conductorActualizado.emit(response.data);
        },

        error: (error: unknown) => {
          this.mostrarErrorEstado(
            this.obtenerMensajeError(
              error,
              'No se pudo actualizar el estado del conductor.',
            ),
          );
        },
      });
  }

  // ============================================================
  // MANEJO DE ERRORES
  // ============================================================

  private mostrarErrorCarga(mensaje: string): void {
    this.conductor = null;
    this.errorCarga = mensaje;
    this.actualizarVista();

    void Swal.fire({
      icon: 'error',
      title: 'No se pudo obtener el perfil del conductor',
      text: mensaje,
    });
  }

  private mostrarErrorEstado(mensaje: string): void {
    // Conserva los datos consultados para permitir otro intento.
    this.actualizarVista();

    void Swal.fire({
      icon: 'error',
      title: 'No se pudo cambiar el estado',
      text: mensaje,
    });
  }

  private obtenerMensajeError(
    error: unknown,
    mensajePredeterminado: string,
  ): string {
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
      : mensajePredeterminado;
  }

  // ============================================================
  // DATOS PARA LA VISTA
  // ============================================================

  getCodigo(): string {
    return this.conductor?.personal?.codigo_empleado ?? '';
  }

  get nombreCompleto(): string {
    const persona = this.conductor?.personal?.usuario?.persona;

    const nombre = [
      persona?.nombres,
      persona?.apellidos,
    ]
      .map((valor) => String(valor ?? '').trim())
      .filter(Boolean)
      .join(' ');

    return nombre || 'Nombre no registrado';
  }

  get fotoUrl(): string | null {
    return this.conductor?.personal?.usuario?.persona?.foto_url || null;
  }

  get numeroDocumento(): string {
    return this.conductor?.personal?.usuario?.persona
      ?.numero_documento || 'No registrado';
  }

  get celular(): string {
    return this.conductor?.personal?.usuario?.persona
      ?.celular || 'No registrado';
  }

  get username(): string {
    return this.conductor?.personal?.usuario?.username ||
      'No registrado';
  }

  get emailAcceso(): string {
    return this.conductor?.personal?.usuario?.email_acceso ||
      'No registrado';
  }

  obtenerEtiqueta(valor: string | null | undefined): string {
    const texto = valor?.trim();

    return texto
      ? texto.replace(/_/g, ' ')
      : 'No registrado';
  }

  obtenerEstadoRegistro(estado: boolean): {
    label: string;
    class: string;
    icon: string;
  } {
    return estado
      ? {
        label: 'Activo',
        class: 'badge-success',
        icon: 'fa-check',
      }
      : {
        label: 'Inactivo',
        class: 'badge-error',
        icon: 'fa-xmark',
      };
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
    this.actualizarVista();
  }

  cerrarModal(): void {
    // Evita cerrar desde el componente durante la actualización.
    if (this.cambiandoEstado) {
      return;
    }

    this.cancelarCarga();
    this.limpiarDatos();

    // El padre controla mostrarModal.
    this.modalCerrado.emit();
    this.actualizarVista();
  }

  // ============================================================
  // VALIDACIÓN / LIMPIEZA
  // ============================================================

  private identificadorValido(
    value: unknown,
  ): value is PerfilConductorIdentificador {
    if (typeof value === 'number') {
      return Number.isSafeInteger(value) && value > 0;
    }

    // Conserva los BIGINT recibidos como cadenas.
    return (
      typeof value === 'string' &&
      /^\d+$/.test(value) &&
      /[1-9]/.test(value)
    );
  }

  private cancelarCarga(): void {
    this.cargaSubscription?.unsubscribe();
    this.cargaSubscription = undefined;
    this.loading = false;
  }

  private cancelarSolicitudes(): void {
    this.cancelarCarga();

    this.estadoSubscription?.unsubscribe();
    this.estadoSubscription = undefined;
    this.cambiandoEstado = false;
  }

  private limpiarDatos(): void {
    this.conductor = null;
    this.errorCarga = null;
  }

  private actualizarVista(): void {
    if (!this.destruido) {
      this.cdr.markForCheck();
    }
  }
}
