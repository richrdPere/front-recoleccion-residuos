import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-codigos-qr-page',
  imports: [],
  templateUrl: './codigos-qr-page.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodigosQrPageComponent {
// import { DestroyRef, inject } from '@angular/core';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// // Dentro de tu clase:
// private readonly destroyRef = inject(DestroyRef);

// qrImagenUrl: string | null = null;
// cargandoQr = false;
// errorQr: string | null = null;

// constructor() {
//   this.destroyRef.onDestroy(() => {
//     this.liberarImagenQr();
//   });
// }

// cargarImagenQr(
//   idCodigoQr: number,
//   formato: 'PNG' | 'SVG' = 'PNG',
// ): void {
//   if(this.cargandoQr) {
//   return;
// }

// this.liberarImagenQr();
// this.cargandoQr = true;
// this.errorQr = null;

// this.codigoQrService
//   .getCodigoQrImagen(idCodigoQr, {
//     formato,
//     width: 512,
//     margin: 4,
//     download: false,
//   })
//   .pipe(takeUntilDestroyed(this.destroyRef))
//   .subscribe({
//     next: (imagen) => {
//       this.qrImagenUrl = URL.createObjectURL(imagen);
//       this.cargandoQr = false;
//     },
//     error: (error) => {
//       this.errorQr = 'No se pudo cargar la imagen del código QR.';
//       this.cargandoQr = false;

//       console.error(error);
//     },
//   });
// }

// private liberarImagenQr(): void {
//   if(this.qrImagenUrl) {
//   URL.revokeObjectURL(this.qrImagenUrl);
//   this.qrImagenUrl = null;
// }
// }


// this.codigoQrService
//   .actualizarEstadoCodigoQr(1, {
//     estado_qr: 'INACTIVO',
//     motivo: 'Pausa temporal para prueba.',
//   })
//   .subscribe({
//     next: (response) => {
//       if (!response.success) {
//         console.error(response.message);
//         return;
//       }

//       console.log(response.message);
//       console.log('ID:', response.data.id_codigo_qr);
//       console.log('Estado:', response.data.estado_qr);

//       // Recargar el listado o el detalle del código QR.
//     },
  //   error: (error) => {
  //     console.error(error);
  //   },
  // });
}
