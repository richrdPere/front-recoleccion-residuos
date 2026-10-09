import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, finalize } from 'rxjs';
import Swal from 'sweetalert2';

// Service
import { UsuarioService } from '../../../services/usuario.service';

// Interfaces
import { UsuarioIdentificador, UsuarioPaginadoItem } from '../../../interfaces/get-usuarios-paginados.interface';

export interface UsuarioGestionRolOpcion {
  id_rol: UsuarioIdentificador;
  nombre: string;
  descripcion?: string | null;
  estado?: boolean;
}

@Component({
  selector: 'usuario-roles',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './usuario-roles.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsuarioRolesComponent implements OnChanges {

  // ============================================================
  // INPUTS / OUTPUTS
  // ============================================================
  @Input() mostrarModal = false;
  @Input() usuarioSeleccionado: UsuarioPaginadoItem | null = null;
  @Input() rolesDisponibles: readonly UsuarioGestionRolOpcion[] = [];

  @Output() modalCerrado = new EventEmitter<void>();
  @Output() rolesActualizados = new EventEmitter<void>();

  // ============================================================
  // ESTADO
  // ============================================================
  private readonly destroyRef = inject(DestroyRef);

  roles: UsuarioGestionRolOpcion[] = [];
  rolesAsignadosIds: UsuarioIdentificador[] = [];

  isLoading = false;
  rolProcesandoId: UsuarioIdentificador | null = null;
  errorCarga: string | null = null;

  modalWidthClass = 'max-w-4xl';

  constructor(
    private readonly usuarioService: UsuarioService,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  // ============================================================
  // CICLO DE VIDA
  // ============================================================
  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['usuarioSeleccionado'] ||
      changes['rolesDisponibles'] ||
      changes['mostrarModal']
    ) {
      this.sincronizarRoles();
    }
  }

  private sincronizarRoles(): void {
    const usuario = this.usuarioSeleccionado;

    this.rolesAsignadosIds = usuario?.roles
      .filter(rol => rol.estado_asignacion)
      .map(rol => rol.id_rol) ?? [];

    const mapa = new Map<string, UsuarioGestionRolOpcion>();

    // Incluye las asignaciones existentes, incluso si su rol
    // ya no aparece en el catálogo disponible.
    for (const rol of usuario?.roles ?? []) {
      if (rol.estado_asignacion) {
        mapa.set(String(rol.id_rol), {
          id_rol: rol.id_rol,
          nombre: rol.nombre,
          descripcion: rol.descripcion,
          estado: rol.estado,
        });
      }
    }

    // El catálogo actual tiene prioridad.
    for (const rol of this.rolesDisponibles) {
      mapa.set(String(rol.id_rol), { ...rol });
    }

    this.roles = [...mapa.values()];
  }

  // ============================================================
  // AGREGAR / QUITAR ROL
  // ============================================================
  async cambiarRol(rol: UsuarioGestionRolOpcion): Promise<void> {
    const usuario = this.usuarioSeleccionado;

    if (!usuario || this.isLoading) {
      return;
    }

    const quitar = this.tieneRol(rol.id_rol);

    // Un rol inactivo puede quitarse, pero no asignarse.
    if (!quitar && rol.estado === false) {
      return;
    }

    if (quitar) {
      const confirmacion = await Swal.fire({
        icon: 'warning',
        title: '¿Quitar rol?',
        text: `Se quitará el rol ${rol.nombre} del usuario ${usuario.username}.`,
        showCancelButton: true,
        confirmButtonText: 'Sí, quitar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#d33',
        reverseButtons: true,
        focusCancel: true,
      });

      if (!confirmacion.isConfirmed) {
        return;
      }
    }

    // Verifica que el modal siga mostrando al mismo usuario.
    if (
      !this.mostrarModal ||
      this.isLoading ||
      String(this.usuarioSeleccionado?.id_usuario) !==
      String(usuario.id_usuario)
    ) {
      return;
    }

    const solicitud$: Observable<{
      success: boolean;
      message: string;
    }> = quitar
        ? this.usuarioService.removeRolUsuario(
          usuario.id_usuario,
          rol.id_rol,
        )
        : this.usuarioService.addRolUsuario(
          usuario.id_usuario,
          { id_rol: rol.id_rol },
        );

    this.isLoading = true;
    this.rolProcesandoId = rol.id_rol;
    this.cdr.markForCheck();

    solicitud$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoading = false;
          this.rolProcesandoId = null;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response.success) {
            this.mostrarError(
              response.message || 'La operación no fue completada.',
            );
            return;
          }

          if (quitar) {
            this.rolesAsignadosIds = this.rolesAsignadosIds.filter(
              id => String(id) !== String(rol.id_rol),
            );
          } else if (!this.tieneRol(rol.id_rol)) {
            this.rolesAsignadosIds = [
              ...this.rolesAsignadosIds,
              rol.id_rol,
            ];
          }

          this.cdr.markForCheck();
          this.rolesActualizados.emit();

          void Swal.fire({
            icon: 'success',
            title: quitar ? 'Rol removido' : 'Rol asignado',
            text: response.message,
            timer: 1800,
            showConfirmButton: false,
          });
        },

        error: (error: unknown) => {
          this.mostrarError(this.obtenerMensajeError(error));
        },
      });
  }

  // ============================================================
  // HELPERS
  // ============================================================
  tieneRol(idRol: UsuarioIdentificador): boolean {
    return this.rolesAsignadosIds.some(
      id => String(id) === String(idRol),
    );
  }

  estaProcesando(idRol: UsuarioIdentificador): boolean {
    return (
      this.isLoading &&
      String(this.rolProcesandoId) === String(idRol)
    );
  }

  get nombreUsuario(): string {
    const persona = this.usuarioSeleccionado?.persona;

    return persona
      ? `${persona.nombres} ${persona.apellidos}`.trim()
      : '';
  }

  private mostrarError(mensaje: string): void {
    void Swal.fire({
      icon: 'error',
      title: 'No se pudo actualizar el rol',
      text: mensaje,
    });
  }

  private obtenerMensajeError(error: unknown): string {
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
      : 'Ocurrió un error al actualizar los roles del usuario.';
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
    if (this.isLoading) {
      return;
    }

    this.modalCerrado.emit();
  }
}
