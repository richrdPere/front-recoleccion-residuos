import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, timeout } from 'rxjs';

// Environment
import { environment } from 'src/environments/environment';

// Interface
import { PublicQrResponse, PublicQrView, PublicRouteInformation } from '../models/public-qr.model';

@Injectable({
  providedIn: 'root',
})
export class PublicQrService {
  // *********************************************************
  // ENDPOINTS
  // *********************************************************
  private readonly http = inject(HttpClient);

  private readonly base = environment.apiUrl.replace(/\/+$/, '') + '/publico/qr';

  // *********************************************************
  // 1. CONSULTAR
  // *********************************************************
  consultar(tokenPublico: string): Observable<PublicQrView> {
    const token = encodeURIComponent(
      tokenPublico.trim(),
    );

    return this.http
      .get<PublicQrResponse>(
        `${this.base}/${token}/informacion`,
      )
      .pipe(
        timeout(12000),

        map((response): PublicQrView => {
          if (!response.success) {
            throw new HttpErrorResponse({
              status: 410,

              error: {
                message: response.message,
              },
            });
          }

          const data = response.data;

          const rutas: PublicRouteInformation[] =
            data.tipo_recurso === 'ZONA'
              ? data.rutas
              : data.cronograma.rutas.map(
                (item) => ({
                  ...item,
                  estado: data.estado,
                  ubicacion: data.ubicacion,
                }),
              );

          return {
            titulo: data.codigo_qr.titulo,
            descripcion: data.codigo_qr.descripcion,

            sector: data.tipo_recurso === 'ZONA'
              ? data.zona.nombre
              : rutas[0]?.ruta.zona.nombre ??
              'Sector de recolección',

            actualizado: data.fecha_actualizacion,
            rutas,
          };
        }),
      );
  }
}
