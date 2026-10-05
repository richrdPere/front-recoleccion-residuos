import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';

// Environment
import { environment } from 'src/environments/environment';

// Service
import { AuthStorageService } from 'src/app/core/auth/auth-storage.service';

// Helper
import { HttpServiceHelper } from 'src/app/core/auth/http-service.helper';

// Interfaces
import { GetConductoresDisponiblesResponse, GetPersonalByRolResponse, GetRecolectoresDisponiblesResponse, PersonalPorRolNombre } from '../models/disponibilidad';

@Injectable({
  providedIn: 'root'
})
export class DisponibilidadService {
  // *********************************************************
  // ENDPOINTS
  // *********************************************************
  private readonly API_BASE = environment.apiUrl + 'personal';

  private readonly API_GET_CONDUCTORES_DISPONIBLES: string = this.API_BASE + '/conductores/disponibles';
  private readonly API_GET_RECOLECTORES_DISPONIBLES: string = this.API_BASE + '/recolectores/disponibles';
  private readonly API_GET_PERSONAL_BY_ROL: string = this.API_BASE + '/rol/';

  constructor(
    private readonly http: HttpClient,
    private readonly authStorage: AuthStorageService
  ) { }

  // *********************************************************
  // 1. OBTENER CONDUCTORES DISPONIBLES
  // *********************************************************
  getConductoresDisponibles(): Observable<GetConductoresDisponiblesResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetConductoresDisponiblesResponse>(
        this.API_GET_CONDUCTORES_DISPONIBLES,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener los conductores disponibles.',
          ),
        ),
      );
  }

  // *********************************************************
  // 2. OBTENER PERSONAL POR ROL
  // *********************************************************
  getPersonalByRol(
    rol: PersonalPorRolNombre,
  ): Observable<GetPersonalByRolResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetPersonalByRolResponse>(
        `${this.API_GET_PERSONAL_BY_ROL}${encodeURIComponent(rol)}`,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el personal por rol.',
          ),
        ),
      );
  }

  // *********************************************************
  // 3. OBTENER RECOLECTORES DISPONIBLES
  // *********************************************************
  getRecolectoresDisponibles(): Observable<GetRecolectoresDisponiblesResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetRecolectoresDisponiblesResponse>(
        this.API_GET_RECOLECTORES_DISPONIBLES,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener los recolectores disponibles.',
          ),
        ),
      );
  }

  // *********************************************************
  // MÉTODOS PRIVADOS
  // *********************************************************
  private getJsonHeaders(): HttpHeaders {
    return HttpServiceHelper.getHeaders({
      token: this.authStorage.getAccessToken(),
    });
  }

}
