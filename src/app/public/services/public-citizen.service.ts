import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, timeout } from 'rxjs';

import { environment } from 'src/environments/environment';

import { ApiResponse } from 'src/app/core/models/api-response.model';

export interface ConsentimientoAlertas {
  version: string;
  texto: string;
}

export interface RegistroAlertaPublicaRequest {
  clave_registro: string;

  nombre: string;
  celular: string;

  id_zona: number;
  id_ruta: number;

  inicio: boolean;
  cambios: boolean;
  incidencias: boolean;

  acepta: boolean;
  version_consentimiento: string;
}

export interface RegistroAlertaPublicaData {
  id_suscripcion: string;

  estado:
  | 'PENDIENTE_DISPOSITIVO'
  | 'ACTIVA'
  | 'BAJA';

  requiere_dispositivo: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class PublicCitizenService {
  private readonly http = inject(HttpClient);

  private readonly API_BASE = environment.apiUrl.replace(/\/+$/, '') + '/publico/alertas';

  getConfiguracion():
    Observable<ConsentimientoAlertas> {
    return this.http
      .get<ApiResponse<ConsentimientoAlertas>>(
        `${this.API_BASE}/configuracion`,
      )
      .pipe(
        timeout(15000),
        map(response =>
          this.obtenerDatos(response),
        ),
      );
  }

  registrar(
    request: RegistroAlertaPublicaRequest,
  ): Observable<RegistroAlertaPublicaData> {
    return this.http
      .post<ApiResponse<RegistroAlertaPublicaData>>(
        `${this.API_BASE}/registro`,
        request,
      )
      .pipe(
        timeout(15000),
        map(response =>
          this.obtenerDatos(response),
        ),
      );
  }

  private obtenerDatos<T>(
    response: ApiResponse<T>,
  ): T {
    if (
      !response.success ||
      response.data == null
    ) {
      throw new Error(
        response.message ||
        'No se pudo completar la operación.',
      );
    }

    return response.data;
  }
}
