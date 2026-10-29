import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, Subscription } from 'rxjs';
import Swal from 'sweetalert2';

// Service
import { CodigosQrService } from '../../services/codigos-qr.service';

// Interfaces
import { CodigoQrListadoItem, GetCodigosQrPaginadoParams, RegenerarCodigoQrData } from '../../interfaces/codigos-qr';

// Componentes
import { CodigoQrFormComponent } from '../components/codigo-qr-form/codigo-qr-form.component';
import { CodigoQrImagenComponent } from '../components/codigo-qr-imagen/codigo-qr-imagen.component';
import { CodigoQrRegenerarComponent } from '../components/codigo-qr-regenerar/codigo-qr-regenerar.component';
import { CodigoQrViewComponent } from '../components/codigo-qr-view/codigo-qr-view.component';


@Component({
  selector: 'app-codigos-qr-page',
  imports: [
    CommonModule,
    FormsModule,
    CodigoQrFormComponent,
    CodigoQrImagenComponent,
    CodigoQrRegenerarComponent,
    CodigoQrViewComponent
],
  templateUrl: './codigos-qr-page.component.html',
  styles: ``,
})
export class CodigosQrPageComponent implements OnInit, OnDestroy {

  // Códigos QR
  codigosQr: CodigoQrListadoItem[] = [];

  isLoading = true;
  mostrarModal = false;

  // Imagen QR
  mostrarModalImagen = false;
  codigoQrImagenId: number | null = null;

  // Regeneración QR
  mostrarModalRegenerar = false;
  codigoQrRegenerarId: number | null = null;

  // Detalle QR
  mostrarModalView = false;
  codigoQrViewId: number | null = null;

  errorMensaje = '';
  errorDescarga = '';

  // Search
  searchBusqueda = '';
  idZona: number | null = null;
  idRuta: number | null = null;

  searchTimeout: ReturnType<typeof setTimeout> | undefined;

  // Paginado
  page = 1;
  limit = 10;
  totalItems = 0;
  totalPages = 0;
  currentPage = 1;

  pageSizeOptions = [5, 10, 20, 50];

  // Descargas
  readonly descargandoIds = new Set<number>();

  // Filtros aplicados
  private filtrosAplicados: GetCodigosQrPaginadoParams = {};

  // Suscripciones
  private consultaListado?: Subscription;
  private readonly suscripcionesDescargas = new Subscription();

  constructor(
    private readonly codigosQrService: CodigosQrService,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.cargarCodigosQr();
  }

  ngOnDestroy(): void {
    clearTimeout(this.searchTimeout);

    this.consultaListado?.unsubscribe();
    this.suscripcionesDescargas.unsubscribe();
  }

  // ================================
  // Methods
  // ================================

  cargarCodigosQr(): void {
    // Cancela la consulta anterior para evitar respuestas desordenadas.
    this.consultaListado?.unsubscribe();

    const params: GetCodigosQrPaginadoParams = {
      ...this.filtrosAplicados,
      page: this.page,
      limit: this.limit,
    };

    this.isLoading = true;
    this.errorMensaje = '';
    this.cdr.markForCheck();

    this.consultaListado = this.codigosQrService
      .getCodigosQrPaginado(params)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response.success) {
            this.errorMensaje = response.message ||
              'No se pudieron obtener los códigos QR.';

            this.limpiarListado();
            return;
          }

          const paginacion = response.data;

          // QR devuelve la paginación directamente en data.
          this.codigosQr = paginacion.items;
          this.totalItems = paginacion.total;
          this.currentPage = paginacion.page;

          this.page = paginacion.page;
          this.limit = paginacion.limit;
          this.totalPages = paginacion.total_pages;

          // Si la página dejó de existir, consulta la última disponible.
          if (
            this.codigosQr.length === 0 &&
            this.totalItems > 0 &&
            this.totalPages > 0 &&
            this.page > this.totalPages
          ) {
            this.page = this.totalPages;
            this.currentPage = this.page;

            // Ejecuta después del finalize de esta consulta.
            queueMicrotask(() => {
              if (!this.suscripcionesDescargas.closed) {
                this.cargarCodigosQr();
              }
            });
          }
        },

        error: (error: unknown) => {
          this.errorMensaje = this.obtenerMensajeError(
            error,
            'No se pudieron obtener los códigos QR.',
          );

          this.limpiarListado();
        },
      });
  }

  // - Descargar imagen QR
  descargarImagen(codigo: CodigoQrListadoItem): void {
    const idCodigoQr = codigo.id_codigo_qr;

    if (this.descargandoIds.has(idCodigoQr)) {
      return;
    }

    this.errorDescarga = '';
    this.descargandoIds.add(idCodigoQr);
    this.cdr.markForCheck();

    const suscripcion = this.codigosQrService
      .getCodigoQrImagen(idCodigoQr, {
        formato: 'PNG',
      })
      .pipe(
        finalize(() => {
          this.descargandoIds.delete(idCodigoQr);
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (blob) => {
          if (blob.size === 0) {
            this.mostrarErrorDescarga(
              'El servidor devolvió una imagen vacía.',
            );
            return;
          }

          const url = URL.createObjectURL(blob);
          const enlace = document.createElement('a');

          enlace.href = url;
          enlace.download = `codigo-qr-${idCodigoQr}.png`;

          document.body.appendChild(enlace);
          enlace.click();
          enlace.remove();

          setTimeout(() => {
            URL.revokeObjectURL(url);
          }, 1000);
        },

        error: (error: unknown) => {
          this.mostrarErrorDescarga(
            this.obtenerMensajeError(
              error,
              'No se pudo descargar la imagen del código QR.',
            ),
          );
        },
      });

    this.suscripcionesDescargas.add(suscripcion);
  }


  // ================================
  // Modales methods
  // ================================
  abrirModal(): void {
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
  }

  onCodigoQrGuardado(): void {
    this.cerrarModal();
    this.page = 1;
    this.currentPage = 1;
    this.cargarCodigosQr();
  }

  // Imagen QR
  verImagenCodigoQr(codigo: CodigoQrListadoItem): void {
    this.codigoQrImagenId = codigo.id_codigo_qr;
    this.mostrarModalImagen = true;
  }

  cerrarModalImagen(): void {
    this.mostrarModalImagen = false;
    this.codigoQrImagenId = null;
  }

  // Regeneración QR
  abrirModalRegenerar(codigo: CodigoQrListadoItem): void {
    this.codigoQrRegenerarId = codigo.id_codigo_qr;
    this.mostrarModalRegenerar = true;
  }

  cerrarModalRegenerar(): void {
    this.mostrarModalRegenerar = false;
    this.codigoQrRegenerarId = null;
  }

  onCodigoQrRegenerado(data: RegenerarCodigoQrData): void {
    this.cerrarModalRegenerar();
    this.cargarCodigosQr();

    // Abre la imagen del nuevo QR usando el modal ya implementado.
    this.codigoQrImagenId = data.codigo_nuevo.id_codigo_qr;
    this.mostrarModalImagen = true;
  }

  // Detalle QR
  verCodigoQr(codigo: CodigoQrListadoItem): void {
    this.codigoQrViewId = codigo.id_codigo_qr;
    this.mostrarModalView = true;
  }

  cerrarModalInfo(): void {
    this.mostrarModalView = false;
    this.codigoQrViewId = null;
  }

  // ================================
  // Helpers methods
  // ================================

  get hayFiltros(): boolean {
    return Boolean(
      this.searchBusqueda.trim() ||
      this.idZona !== null ||
      this.idRuta !== null,
    );
  }

  get hayFiltrosAplicados(): boolean {
    return Boolean(
      this.filtrosAplicados.search ||
      this.filtrosAplicados.id_zona ||
      this.filtrosAplicados.id_ruta,
    );
  }

  get registroDesde(): number {
    return this.totalItems === 0
      ? 0
      : (this.page - 1) * this.limit + 1;
  }

  get registroHasta(): number {
    return Math.min(
      this.page * this.limit,
      this.totalItems,
    );
  }

  onSearchChange(): void {
    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.aplicarFiltros();
    }, 300);
  }

  onFiltroChange(): void {
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    clearTimeout(this.searchTimeout);

    this.filtrosAplicados = {
      search: this.searchBusqueda.trim() || undefined,
      id_zona: this.idZona ?? undefined,
      id_ruta: this.idRuta ?? undefined,
    };

    this.page = 1;
    this.currentPage = 1;

    this.cargarCodigosQr();
  }

  cambiarPagina(nuevaPagina: number): void {
    if (
      this.isLoading ||
      nuevaPagina < 1 ||
      nuevaPagina > this.totalPages ||
      nuevaPagina === this.page
    ) {
      return;
    }

    this.page = nuevaPagina;
    this.currentPage = nuevaPagina;

    this.cargarCodigosQr();
  }

  cambiarLimite(): void {
    this.limit = Number(this.limit);
    this.page = 1;
    this.currentPage = 1;

    this.cargarCodigosQr();
  }

  onPageSizeChange(): void {
    this.cambiarLimite();
  }

  limpiarFiltros(): void {
    clearTimeout(this.searchTimeout);

    this.searchBusqueda = '';
    this.idZona = null;
    this.idRuta = null;

    this.filtrosAplicados = {};
    this.page = 1;
    this.currentPage = 1;

    this.cargarCodigosQr();
  }

  private limpiarListado(): void {
    this.codigosQr = [];
    this.totalItems = 0;
    this.totalPages = 0;
  }

  private mostrarErrorDescarga(mensaje: string): void {
    this.errorDescarga = mensaje;

    void Swal.fire({
      icon: 'error',
      title: 'No se pudo descargar el código QR',
      text: mensaje,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#3085d6',
    });
  }

  private obtenerMensajeError(
    error: unknown,
    mensajePorDefecto: string,
  ): string {
    if (error instanceof HttpErrorResponse) {
      const body: unknown = error.error;

      if (typeof body === 'string' && body.trim()) {
        return body;
      }

      if (
        typeof body === 'object' &&
        body !== null &&
        'message' in body &&
        typeof body.message === 'string' &&
        body.message.trim()
      ) {
        return body.message;
      }

      return mensajePorDefecto;
    }

    if (error instanceof Error) {
      return error.message || mensajePorDefecto;
    }

    if (typeof error === 'string' && error.trim()) {
      return error;
    }

    return mensajePorDefecto;
  }

}
