import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';

// Environment
import { environment } from 'src/environments/environment';

// Service
import { AuthStorageService } from 'src/app/core/auth/auth-storage.service';

// Helper
import { HttpServiceHelper } from 'src/app/core/auth/http-service.helper';

// Interface
import { ActualizarEstadoCodigoQrRequest, ActualizarEstadoCodigoQrResponse, CrearCodigoQrRequest, CrearCodigoQrResponse, GetCodigoQrByIdResponse, GetCodigoQrImagenParams, GetCodigosQrPaginadoParams, GetCodigosQrPaginadoResponse, RegenerarCodigoQrRequest, RegenerarCodigoQrResponse } from '../interfaces/codigos-qr';

@Injectable({
  providedIn: 'root'
})
export class CodigosQrService {

  // *********************************************************
  // ENDPOINTS
  // *********************************************************
  private readonly API_BASE = environment.apiUrl + 'codigos-qr';

  private readonly API_CREATE_CODIGO_QR: string = this.API_BASE + '/create';
  private readonly API_GET_CODIGO_QR_PAGINADO: string = this.API_BASE + '/paginado';
  private readonly API_GET_CODIGO_QR_DETALLE: string = this.API_BASE + '/view/';

  // Imagen QR
  private readonly API_GET_CODIGO_QR_IMAGEN: string = this.API_BASE + '/';

  // Operaciones individuales
  private readonly API_CHANGE_ESTADO_CODIGO_QR: string = this.API_BASE + '/';
  private readonly API_REGENERAR_CODIGO_QR: string = this.API_BASE + '/';
  private readonly API_REVOCAR_CODIGO_QR: string = this.API_BASE + '/';

  constructor(
    private readonly http: HttpClient,
    private readonly authStorage: AuthStorageService
  ) { }


  // *********************************************************
  // 1. CREAR CÓDIGO QR
  // *********************************************************
  crearCodigoQr(
    request: CrearCodigoQrRequest,
  ): Observable<CrearCodigoQrResponse> {
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .post<CrearCodigoQrResponse>(
        this.API_CREATE_CODIGO_QR,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo crear el código QR.',
          ),
        ),
      );
  }

  // *********************************************************
  // 2. OBTENER CÓDIGOS QR PAGINADOS
  // *********************************************************
  getCodigosQrPaginado(
    query: GetCodigosQrPaginadoParams = {},
  ): Observable<GetCodigosQrPaginadoResponse> {
    const params = HttpServiceHelper.buildParams(query);
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .get<GetCodigosQrPaginadoResponse>(
        this.API_GET_CODIGO_QR_PAGINADO,
        {
          headers,
          params,
        },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener los códigos QR.',
          ),
        ),
      );
  }

  // *********************************************************
  // 3. OBTENER CÓDIGO QR POR ID
  // *********************************************************
  getCodigoQrById(
    idCodigoQr: number,
  ): Observable<GetCodigoQrByIdResponse> {
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .get<GetCodigoQrByIdResponse>(
        `${this.API_GET_CODIGO_QR_DETALLE}${idCodigoQr}`,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el código QR.',
          ),
        ),
      );
  }

  // *********************************************************
  // 4. OBTENER IMAGEN DEL CÓDIGO QR
  // *********************************************************
  getCodigoQrImagen(
    idCodigoQr: number,
    query: GetCodigoQrImagenParams = {},
  ): Observable<Blob> {
    const params = HttpServiceHelper.buildParams(query);
    const formato = query.formato ?? 'PNG';

    const headers = this.getJsonHeaders()
      .set('x-client-origin', 'WEB')
      .set(
        'Accept',
        formato === 'SVG' ? 'image/svg+xml' : 'image/png',
      );

    // const params = new HttpParams()
    //   .set('formato', formato)
    //   .set('width', String(query.width ?? 512))
    //   .set('margin', String(query.margin ?? 4))
    //   .set('download', String(query.download ?? false));

    return this.http
      .get(
        `${this.API_GET_CODIGO_QR_IMAGEN}${idCodigoQr}/imagen`,
        {
          headers,
          params,
          responseType: 'blob',
        },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener la imagen del código QR.',
          ),
        ),
      );
  }

  // *********************************************************
  // 5. ACTUALIZAR ESTADO DEL CÓDIGO QR
  // *********************************************************
  actualizarEstadoCodigoQr(
    idCodigoQr: number,
    request: ActualizarEstadoCodigoQrRequest,
  ): Observable<ActualizarEstadoCodigoQrResponse> {
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .patch<ActualizarEstadoCodigoQrResponse>(
        `${this.API_CHANGE_ESTADO_CODIGO_QR}${idCodigoQr}/estado`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo actualizar el estado del código QR.',
          ),
        ),
      );
  }

  // *********************************************************
  // 6. REGENERAR CÓDIGO QR
  // *********************************************************
  regenerarCodigoQr(
    idCodigoQr: number,
    request: RegenerarCodigoQrRequest,
  ): Observable<RegenerarCodigoQrResponse> {
    const headers = this.getJsonHeaders().set(
      'x-client-origin',
      'WEB',
    );

    return this.http
      .post<RegenerarCodigoQrResponse>(
        `${this.API_REGENERAR_CODIGO_QR}${idCodigoQr}/regenerar`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo regenerar el código QR.',
          ),
        ),
      );
  }

  // *********************************************************
  // MÉTODOS PRIVADOS
  // *********************************************************
  private getJsonHeaders(): HttpHeaders {
    return HttpServiceHelper.getHeaders({
      token:
        this.authStorage.getAccessToken(),
    });
  }
}
