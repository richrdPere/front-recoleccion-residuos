import { CommonModule, DatePipe, } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

// Directives
import { UppercaseDirective } from 'src/app/shared/directives/uppercase.directive';

// Service
import { UsuarioService } from '../../services/usuario.service';

// Interfaces
import { UsuarioIdentificador, UsuarioPaginadoItem, UsuarioRolNombre, UsuariosPaginadosFilters } from '../../interfaces';


@Component({
  selector: 'app-usuarios-page',
  imports: [
    DatePipe,
    FormsModule,
    CommonModule,
    UppercaseDirective,
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

  // Selectores
  readonly rolesUsuario: {
    id: number,
    value: UsuarioRolNombre;
    label: string;
  }[] = [
      // {
      //   value: 'SUPER_ADMIN',
      //   label: 'Camión compactador',
      // },
      {
        id: 2,
        value: 'ADMIN',
        label: 'Administrador',
      },
      {
        id: 3,
        value: 'SUPERVISOR',
        label: 'Supervisor',
      },
      {
        id: 4,
        value: 'OPERADOR',
        label: 'Operador',
      },
      {
        id: 5,
        value: 'CONDUCTOR',
        label: 'Conductor',
      },
      {
        id: 6,
        value: 'RECOLECTOR',
        label: 'Recolector',
      },
      // {
      //   value: 'CIUDADANO',
      //   label: 'Ciudadano',
      // },
    ];


  constructor(
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.getUsuariosPaginated();
  }

  // ================================
  // Methods
  // ================================
  getUsuariosPaginated() {
    const params: UsuariosPaginadosFilters = {
      page: this.page,
      limit: this.limit,
      search: this.searchBusqueda,
      estado: this.estadoBusqueda,
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

  // - Add rol

  // - Remove rol

  // - Ver usuario
  verUsuario(usuario: UsuarioPaginadoItem) {
    throw new Error('Method not implemented.');
  }

  gestionarRoles(usuario: UsuarioPaginadoItem) {
    throw new Error('Method not implemented.');
  }

  // - Reset password
  resetPassword(usuario: any) {
    throw new Error('Method not implemented.');
  }

  // - Eliminar usuario
  eliminarUsuario(usuario: UsuarioPaginadoItem) {
    throw new Error('Method not implemented.');
  }

  // - Editar usuario
  editarUsuario(usuario: UsuarioPaginadoItem) {
    throw new Error('Method not implemented.');
  }

  // - CAMBIAR ESTADO
  cambiarEstado(usuario: UsuarioPaginadoItem) {

    // this.usuarioService
    //   .changeStateUsuario(usuario.id, !usuario.estado)
    //   .subscribe({
    //     next: (res) => {

    //       usuario.estado = res.data.estado;

    //       Swal.fire({
    //         icon: 'success',
    //         title: res.message,
    //         timer: 1500,
    //         showConfirmButton: false
    //       });
    //     },
    //     error: (err) => console.error(err)
    //   });

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

}
