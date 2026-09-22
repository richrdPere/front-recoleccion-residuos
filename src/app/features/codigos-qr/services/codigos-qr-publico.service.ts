import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';

// Environment
import { environment } from 'src/environments/environment';

// Service
import { AuthStorageService } from 'src/app/core/auth/auth-storage.service';

// Helper
import { HttpServiceHelper } from 'src/app/core/auth/http-service.helper';
import { GetCronogramaPublicoQrParams, GetCronogramaPublicoQrResponse, GetEstadoPublicoRutaParams, GetEstadoPublicoRutaResponse, GetInformacionPublicaQrParams, GetInformacionPublicaQrResponse, GetUbicacionPublicaQrResponse, ResolverQrPublicoResponse } from '../interfaces/codigos-qr-publico';

// Interface


@Injectable({
  providedIn: 'root'
})
export class CodigosQrPublicoService {
  // *********************************************************
  // ENDPOINTS
  // *********************************************************
  private readonly API_BASE = environment.apiUrl + 'publico';

  private readonly API_GET_INFORMACION_PUBLICA: string = this.API_BASE + '/qr/';
  private readonly API_GET_CRONOGRAMA_PUBLICA: string = this.API_BASE + '/qr/';
  private readonly API_GET_ESTADO_RUTA_PUBLICA: string = this.API_BASE + '/qr/';
  private readonly API_GET_LAST_UBICACION_PUBLICA: string = this.API_BASE + '/qr/';
  private readonly API_RESOLVER_CODIGO_QR: string = this.API_BASE + '/qr/';

  constructor(
    private readonly http: HttpClient,
  ) { }

  // *********************************************************
  // 1. RESOLVER QR PÚBLICO
  // *********************************************************
  resolverQrPublico(
    tokenPublico: string,
  ): Observable<ResolverQrPublicoResponse> {
    const token = encodeURIComponent(tokenPublico.trim());

    return this.http
      .get<ResolverQrPublicoResponse>(
        `${this.API_RESOLVER_CODIGO_QR}${token}`,
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo consultar el código QR.',
          ),
        ),
      );
  }

  // *********************************************************
  // 2. OBTENER INFORMACIÓN PÚBLICA DEL QR
  // *********************************************************
  getInformacionPublicaQr(
    tokenPublico: string,
    query: GetInformacionPublicaQrParams = {},
  ): Observable<GetInformacionPublicaQrResponse> {
    const params = HttpServiceHelper.buildParams(query);
    const token = encodeURIComponent(tokenPublico.trim());

    return this.http
      .get<GetInformacionPublicaQrResponse>(
        `${this.API_GET_INFORMACION_PUBLICA}${token}/informacion`,
        { params },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener la información pública del código QR.',
          ),
        ),
      );
  }

  // *********************************************************
  // 3. OBTENER CRONOGRAMA DEL QR PÚBLICO
  // *********************************************************
  getCronogramaPublicoQr(
    tokenPublico: string,
    query: GetCronogramaPublicoQrParams = {},
  ): Observable<GetCronogramaPublicoQrResponse> {
    const params = HttpServiceHelper.buildParams(query);
    const token = encodeURIComponent(tokenPublico.trim());

    return this.http
      .get<GetCronogramaPublicoQrResponse>(
        `${this.API_GET_CRONOGRAMA_PUBLICA}${token}/cronograma`,
        { params },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el cronograma público.',
          ),
        ),
      );
  }

  // *********************************************************
  // 4. OBTENER ESTADO PÚBLICO DE LA RUTA
  // *********************************************************
  getEstadoPublicoRuta(
    tokenPublico: string,
    query: GetEstadoPublicoRutaParams = {},
  ): Observable<GetEstadoPublicoRutaResponse> {
    const params = HttpServiceHelper.buildParams(query);
    const token = encodeURIComponent(tokenPublico.trim());



    return this.http
      .get<GetEstadoPublicoRutaResponse>(
        `${this.API_GET_ESTADO_RUTA_PUBLICA}${token}/estado`,
        { params },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el estado público de la ruta.',
          ),
        ),
      );
  }

  // *********************************************************
  // 5. OBTENER ÚLTIMA UBICACIÓN PÚBLICA APROXIMADA
  // *********************************************************
  getUbicacionPublicaQr(
    tokenPublico: string,
  ): Observable<GetUbicacionPublicaQrResponse> {
    const token = encodeURIComponent(tokenPublico.trim());

    return this.http
      .get<GetUbicacionPublicaQrResponse>(
        `${this.API_GET_LAST_UBICACION_PUBLICA}${token}/ubicacion`,
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo consultar la ubicación pública del vehículo.',
          ),
        ),
      );
  }
}
