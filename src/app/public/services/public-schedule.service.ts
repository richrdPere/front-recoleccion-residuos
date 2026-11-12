import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, timeout } from 'rxjs';

// Environment
import { environment } from 'src/environments/environment';

// Interfaces
import { ApiResponse } from 'src/app/core/models/api-response.model';
import { PublicRouteInformationData, PublicZoneRoutesData, PublicZonesData } from '../models/public-catalog.model';
import { PublicId, PublicQrView } from '../models/public-qr.model';

@Injectable({
  providedIn: 'root',
})
export class PublicScheduleService {
  private readonly http = inject(HttpClient);

  private readonly API_BASE = environment.apiUrl.replace(/\/+$/, '') + '/publico';

  // *********************************************************
  // 1. LISTAR ZONAS
  // *********************************************************
  getZonas(): Observable<PublicZonesData> {
    return this.http
      .get<ApiResponse<PublicZonesData>>(
        `${this.API_BASE}/zonas`,
      )
      .pipe(
        timeout(12000),
        map(response => this.obtenerDatos(response)),
      );
  }

  // *********************************************************
  // 2. LISTAR RUTAS DE UNA ZONA
  // *********************************************************
  getRutasPorZona(
    idZona: PublicId,
  ): Observable<PublicZoneRoutesData> {
    const id = encodeURIComponent(String(idZona));

    return this.http
      .get<ApiResponse<PublicZoneRoutesData>>(
        `${this.API_BASE}/zonas/${id}/rutas`,
      )
      .pipe(
        timeout(12000),
        map(response => this.obtenerDatos(response)),
      );
  }

  // *********************************************************
  // 3. INFORMACIÓN PÚBLICA DE LA RUTA
  // ********************************************************* /
  getInformacionRuta(
    idRuta: PublicId,
  ): Observable<PublicRouteInformationData> {
    const id = encodeURIComponent(String(idRuta));

    return this.http
      .get<ApiResponse<PublicRouteInformationData>>(
        `${this.API_BASE}/rutas/${id}/informacion`,
      )
      .pipe(
        timeout(12000),
        map(response => this.obtenerDatos(response)),
      );
  }

  // *********************************************************
  // ADAPTAR AL MODELO VISUAL EXISTENTE
  // *********************************************************
  consultar(idRuta: PublicId): Observable<PublicQrView> {
    return this.getInformacionRuta(idRuta).pipe(
      map((data): PublicQrView => ({
        titulo: data.ruta.nombre,
        descripcion: null,
        sector: data.ruta.zona.nombre,
        actualizado: data.fecha_actualizacion,

        rutas: [
          {
            ruta: data.ruta,
            horarios: data.horarios,
            proxima_recoleccion: data.proxima_recoleccion,
            estado: data.estado,
            ubicacion: data.ubicacion,
          },
        ],
      })),
    );
  }

  private obtenerDatos<T>(response: ApiResponse<T>): T {
    if (!response.success || response.data == null) {
      throw new Error(
        response.message ||
        'No se pudo consultar la información pública.',
      );
    }

    return response.data;
  }
}
