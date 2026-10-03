import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-usuarios-page',
  imports: [],
  templateUrl: './usuarios-page.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsuariosPageComponent {


  // this.usuarioService
  // .getUsuariosPaginated({
  //   page: 1,
  //   limit: 10,
  //   search: 'Carlos',
  //   estado: true,
  //   sort_by: 'created_at',
  //   sort_order: 'DESC',
  // })
  // .subscribe({
  //   next: (response) => {
  //     const usuarios = response.data.items;
  //     const paginacion = response.data.pagination;
  //     const filtrosAplicados = response.data.filters;

  //     console.log({ usuarios, paginacion, filtrosAplicados });
  //   },
  //   error: (error) => {
  //     console.error(error);
  //   },
  // });


  // GET ID
  // this.usuarioService
  // .getUsuarioSelector({
  //   search: 'Carlos',
  //   limit: 20,
  // })
  // .subscribe({
  //   next: (response) => {
  //     // data es directamente el arreglo del selector.
  //     this.usuarios = response.data;
  //   },
  //   error: (error) => {
  //     console.error(error);
  //   },
  // });



  //   this.usuarioService.removeRolUsuario(7, 5).subscribe({
  //   next: (response) => {
  //     console.log(response.message);
  //     console.log('Asignación modificada:', response.data.changed);
  //   },
  //   error: (error) => {
  //     console.error(error);
  //   },
  // });
}
