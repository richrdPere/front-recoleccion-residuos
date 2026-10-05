import { CommonModule, DatePipe, } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';

// Directives
import { UppercaseDirective } from 'src/app/shared/directives/uppercase.directive';

// Service
import { UsuarioService } from '../../services/usuario.service';

// Interfaces
import { UsuarioIdentificador, UsuarioPaginadoItem, UsuarioRolAsignado, UsuarioRolCatalogo, UsuarioRolNombre, UsuariosPaginadosFilters } from '../../interfaces';

// Componentes
import { UsuarioViewComponent } from '../usuario-view/usuario-view.component';
import { UsuarioFormComponent } from '../usuario-form/usuario-form.component';
import { UsuarioRolesComponent } from '../usuario-roles/usuario-roles.component';

@Component({
  selector: 'app-usuarios-page',
  imports: [
    DatePipe,
    FormsModule,
    CommonModule,
    UppercaseDirective,
    UsuarioViewComponent,
    UsuarioFormComponent,
    UsuarioRolesComponent
  ],
  templateUrl: './usuarios-page.component.html',
  styles: ``,
})
export class UsuariosPageComponent implements OnInit {

  // Usuarios
  usuarios: UsuarioPaginadoItem[] = [];
  usuario_id: number | null = null;
  isLoading = true;

  mostrarModal = false;
  mostrarModalView = false;
  modoEdicion = false;
  usuarioSeleccionado: any = null;
  mostrarModalRoles = false;
  usuarioRolesSeleccionado: UsuarioPaginadoItem | null = null;

  searchTimeout: any;

  // Search
  searchBusqueda: string = '';
  rolBusqueda: UsuarioIdentificador | '' = '';
  estadoBusqueda: boolean = true;

  // Paginado
  page = 1;
  limit = 5;
  totalItems = 0;
  totalPages = 0;
  currentPage = 1;

  pageSizeOptions = [5, 10, 20, 50];

  // Estado switch
  readonly usuariosCambiandoEstado = new Set<string>();

  // Selectores
  rolesDisponibles: UsuarioRolCatalogo[] = [];

  constructor(
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.getUsuariosPaginated();
    this.cargarRoles()
  }

  // ================================
  // Methods
  // ================================
  getUsuariosPaginated() {
    const params: UsuariosPaginadosFilters = {
      page: this.page,
      limit: this.limit,
      search: this.searchBusqueda,
      // estado: this.estadoBusqueda,
      id_rol: this.rolBusqueda,
      sort_by: 'created_at',
      sort_order: 'DESC',
    };

    console.log("PARAMS: ", params);

    this.isLoading = true;

    this.usuarioService.getUsuariosPaginated(params)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (res) => {

          const paginacion = res.data;

          this.usuarios = paginacion.items;
          this.totalItems = paginacion.pagination.total;
          this.currentPage = paginacion.pagination.page;

          this.page = paginacion.pagination.page;
          this.limit = paginacion.pagination.limit;
          this.totalPages = paginacion.pagination.total_pages;
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;

          this.usuarios = [];
          this.totalItems = 0;
          this.totalPages = 0;
        }
      });
  }

  cargarRoles(): void {
    this.usuarioService.getRoles().subscribe({
      next: (response) => {
        this.rolesDisponibles = response.success
          ? response.data
          : [];

        this.cdr.markForCheck();
      },

      error: (error) => {
        this.rolesDisponibles = [];
        this.cdr.markForCheck();

        void Swal.fire({
          icon: 'error',
          title: 'No se pudieron cargar los roles',
          text: error?.error?.message ??
            error?.message ??
            'Intenta nuevamente.',
        });
      },
    });
  }

  // - Ver usuario
  verUsuario(usuario: UsuarioPaginadoItem) {
    this.usuario_id = usuario.id_usuario;
    this.mostrarModalView = true;
  }

  // - Gestionar roles usuario
  abrirModalRoles(usuario: UsuarioPaginadoItem): void {
    this.usuarioRolesSeleccionado = usuario;
    this.mostrarModalRoles = true;
  }

  // - Reset password
  async resetPassword(usuario: UsuarioPaginadoItem): Promise<void> {
    const dni = usuario.persona.tipo_documento === 'DNI'
      ? usuario.persona.numero_documento.trim()
      : '';

    const resultado = await Swal.fire({
      icon: 'warning',
      title: 'Restablecer contraseña',

      text: dni
        ? 'Se propone el DNI del usuario. Puedes reemplazarlo por otra contraseña antes de confirmar.'
        : 'Ingresa la nueva contraseña del usuario.',

      input: 'password',
      inputLabel: 'Nueva contraseña',
      inputValue: dni,
      inputPlaceholder: 'Mínimo 8 caracteres',

      inputAttributes: {
        autocomplete: 'new-password',
        autocapitalize: 'off',
        spellcheck: 'false',
      },

      // Preserva exactamente la contraseña ingresada.
      inputAutoTrim: false,

      showCancelButton: true,
      confirmButtonText: 'Restablecer',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#64748b',

      reverseButtons: true,
      focusCancel: true,
      showLoaderOnConfirm: true,

      allowOutsideClick: () => !Swal.isLoading(),
      allowEscapeKey: () => !Swal.isLoading(),

      preConfirm: async (nuevaPassword: string) => {
        if (!nuevaPassword || !nuevaPassword.trim()) {
          Swal.showValidationMessage('Ingresa una contraseña.');
          return false;
        }

        if (nuevaPassword.length < 8) {
          Swal.showValidationMessage(
            'La contraseña debe tener al menos 8 caracteres.',
          );
          return false;
        }

        if (new TextEncoder().encode(nuevaPassword).length > 72) {
          Swal.showValidationMessage(
            'La contraseña no puede superar los 72 bytes.',
          );
          return false;
        }

        try {
          const response = await firstValueFrom(
            this.usuarioService.resetPasswordUsuario(
              usuario.id_usuario,
              {
                nueva_password: nuevaPassword,
              },
            ),
          );

          if (!response.success) {
            Swal.showValidationMessage(
              response.message || 'No se pudo restablecer la contraseña.',
            );
            return false;
          }

          return response;
        } catch (error: unknown) {
          const err = error as {
            error?: { message?: unknown } | string;
            message?: unknown;
          } | null;

          const mensajeBackend = typeof err?.error === 'string'
            ? err.error
            : err?.error?.message;

          const mensaje = mensajeBackend ?? err?.message;

          Swal.showValidationMessage(
            typeof mensaje === 'string' && mensaje.trim()
              ? mensaje
              : 'Ocurrió un error al restablecer la contraseña.',
          );

          return false;
        }
      },
    });

    if (!resultado.isConfirmed || !resultado.value) {
      return;
    }

    await Swal.fire({
      icon: 'success',
      title: 'Contraseña restablecida',
      text: resultado.value.message ||
        'La contraseña del usuario fue actualizada correctamente.',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#3085d6',
    });
  }

  // - Eliminar usuario
  eliminarUsuario(usuario: UsuarioPaginadoItem) {
    Swal.fire({
      title: '¿Eliminar usuario?',
      text: `Se eliminará el usuario con username: @${usuario.username}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    }).then((result) => {

      if (result.isConfirmed) {

        this.usuarioService.deleteUsuario(usuario.id_usuario)
          .subscribe({
            next: () => {

              Swal.fire({
                icon: 'success',
                title: 'Usuario eliminado',
                text: 'El Usuario fue eliminado correctamente',
                timer: 2000,
                showConfirmButton: false
              });

              this.getUsuariosPaginated();
            },
            error: (err) => {

              console.error(err);

              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo eliminar el usuario'
              });

            }
          });
      }
    });
  }

  // - Editar usuario
  editarUsuario(usuario: UsuarioPaginadoItem) {
    this.modoEdicion = true;
    this.usuarioSeleccionado = { ...usuario };
    this.mostrarModal = true;
  }

  // - CAMBIAR ESTADO
  async cambiarEstado(
    usuario: UsuarioPaginadoItem,
    event: Event,
  ): Promise<void> {
    const input = event.target as HTMLInputElement;
    const usuarioId = String(usuario.id_usuario);

    // El navegador ya cambió el checkbox; restauramos su estado.
    input.checked = usuario.estado;

    if (this.usuariosCambiandoEstado.has(usuarioId)) {
      return;
    }

    const nuevoEstado = !usuario.estado;

    this.usuariosCambiandoEstado.add(usuarioId);
    this.cdr.markForCheck();

    try {
      const resultado = await Swal.fire({
        icon: 'warning',
        title: nuevoEstado
          ? '¿Activar usuario?'
          : '¿Desactivar usuario?',

        text: nuevoEstado
          ? `Se habilitará la cuenta de ${usuario.username}.`
          : `Se deshabilitará la cuenta de ${usuario.username}.`,

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
          try {
            const response = await firstValueFrom(
              this.usuarioService.changeEstadoUsuario(
                usuario.id_usuario,
                { estado: nuevoEstado },
              ),
            );

            if (!response.success) {
              Swal.showValidationMessage(
                response.message || 'No se pudo actualizar el estado.',
              );
              return false;
            }

            return response;
          } catch (error: unknown) {
            const err = error as {
              error?: { message?: unknown } | string;
              message?: unknown;
            } | null;

            const mensajeBackend = typeof err?.error === 'string'
              ? err.error
              : err?.error?.message;

            const mensaje = mensajeBackend ?? err?.message;

            Swal.showValidationMessage(
              typeof mensaje === 'string' && mensaje.trim()
                ? mensaje
                : 'Ocurrió un error al actualizar el estado del usuario.',
            );

            return false;
          }
        },
      });

      if (!resultado.isConfirmed || !resultado.value) {
        return;
      }

      // Usa el estado confirmado por el backend.
      usuario.estado = resultado.value.data.estado;
      usuario.updated_at = resultado.value.data.updated_at;

      input.checked = usuario.estado;
      this.cdr.markForCheck();

      void Swal.fire({
        icon: 'success',
        title: usuario.estado
          ? 'Usuario activado'
          : 'Usuario desactivado',
        text: resultado.value.message,
        timer: 1800,
        showConfirmButton: false,
      });
    } finally {
      this.usuariosCambiandoEstado.delete(usuarioId);
      this.cdr.markForCheck();
    }
  }

  estaCambiandoEstado(usuario: UsuarioPaginadoItem): boolean {
    return this.usuariosCambiandoEstado.has(String(usuario.id_usuario));
  }

  // ================================
  // Helpers methods
  // ================================
  onSearchChange() {
    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.getUsuariosPaginated();
    }, 300);
  }

  onPageSizeChange() {
    this.currentPage = 1; // vuelve a la primera página
  }

  onFiltroChange() {
    this.page = 1;
    this.getUsuariosPaginated();
  }

  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina < 1 || nuevaPagina > this.totalPages) return;
    this.page = nuevaPagina;
    this.getUsuariosPaginated();
  }

  cambiarLimite() {
    this.limit = Number(this.limit);
    this.page = 1;
    this.getUsuariosPaginated();
  }

  getRolesAsignados(usuario: UsuarioPaginadoItem): UsuarioRolAsignado[] {
    return usuario.roles.filter(rol => rol.estado_asignacion);
  }

  limpiarFiltros(): void {
    this.searchBusqueda = '';
    this.rolBusqueda = '';
    this.estadoBusqueda = true;
    this.page = 1;

    this.getUsuariosPaginated();
  }

  // ================================
  // Modales methods
  // ================================
  abrirModal() {
    this.modoEdicion = false;
    this.usuarioSeleccionado = null;
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  cerrarModalInfo() {
    this.mostrarModalView = false;
    this.usuario_id = null;
  }



  cerrarModalRoles(): void {
    this.mostrarModalRoles = false;
    this.usuarioRolesSeleccionado = null;
  }

}
