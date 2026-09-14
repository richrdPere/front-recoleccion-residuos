import {
  Injectable,
} from '@angular/core';

export interface TokenExpiration {
  accessToken: string;
  refreshToken: string;
}

export interface StoredSession {
  sessionId: string;
  dispositivoId: string;
  tipoDispositivo: string;
  fechaExpiracion: string;
}

export interface StoredLoginData<TUsuario = unknown> {
  accessToken: string;
  refreshToken: string;
  expiresIn: TokenExpiration;
  sesion: StoredSession;
  roles: string[];
  usuario: TUsuario;
}

@Injectable({
  providedIn: 'root',
})
export class AuthStorageService {
  private readonly keys = {
    accessToken: 'accessToken',
    refreshToken: 'refreshToken',
    expiresIn: 'expiresIn',
    deviceId: 'recoleccion_web_device_id',
    roles: 'roles',
    sesion: 'sesion',
    usuario: 'usuario',
  } as const;

  // *********************************************************
  // 1. ACCESS TOKEN
  // *********************************************************
  getAccessToken(): string | null {
    return this.readString(
      this.keys.accessToken,
    );
  }

  // *********************************************************
  // 2. REFRESH TOKEN
  // *********************************************************
  getRefreshToken(): string | null {
    return this.readString(
      this.keys.refreshToken,
    );
  }

  // *********************************************************
  // 3. ROLES
  // *********************************************************
  getRoles(): string[] {
    return (
      this.readJson<string[]>(
        this.keys.roles,
      ) ?? []
    );
  }

  // *********************************************************
  // 4. SESIÓN
  // *********************************************************
  getSession(): StoredSession | null {
    return this.readJson<StoredSession>(
      this.keys.sesion,
    );
  }

  // *********************************************************
  // 5. USUARIO
  // *********************************************************
  getUser<TUsuario>(): TUsuario | null {
    return this.readJson<TUsuario>(
      this.keys.usuario,
    );
  }

  // *********************************************************
  // 6. EXPIRACIÓN
  // *********************************************************
  getExpiresIn(): TokenExpiration | null {
    return this.readJson<TokenExpiration>(
      this.keys.expiresIn,
    );
  }

  // *********************************************************
  // 7. GUARDAR LOGIN
  // *********************************************************
  saveLogin<TUsuario>(
    data: StoredLoginData<TUsuario>,
  ): void {
    this.writeString(
      this.keys.accessToken,
      data.accessToken,
    );

    this.writeString(
      this.keys.refreshToken,
      data.refreshToken,
    );

    this.writeJson(
      this.keys.expiresIn,
      data.expiresIn,
    );

    this.writeJson(
      this.keys.roles,
      data.roles,
    );

    this.writeJson(
      this.keys.sesion,
      data.sesion,
    );

    this.writeJson(
      this.keys.usuario,
      data.usuario,
    );
  }

  // *********************************************************
  // 8. OBTENER O CREAR ID DEL NAVEGADOR
  // *********************************************************
  getOrCreateDeviceId(): string {
    const storedDeviceId = this.readString(
      this.keys.deviceId,
    );

    if (storedDeviceId) {
      return storedDeviceId;
    }

    const uuid =
      typeof crypto !== 'undefined' &&
        typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : this.createFallbackUuid();

    const deviceId = `web-${uuid}`;

    this.writeString(
      this.keys.deviceId,
      deviceId,
    );

    return deviceId;
  }

  // *********************************************************
  // 9. VALIDAR SESIÓN
  // *********************************************************
  hasSession(): boolean {
    return Boolean(
      this.getAccessToken() &&
      this.getRefreshToken() &&
      this.getUser(),
    );
  }

  // *********************************************************
  // 10. LIMPIAR SESIÓN
  // *********************************************************
  clearSession(): void {
    /*
     * No se eliminan:
     *
     * - theme
     * - recoleccion_web_device_id
     *
     * El navegador debe conservar su identidad y preferencias.
     */
    localStorage.removeItem(
      this.keys.accessToken,
    );

    localStorage.removeItem(
      this.keys.refreshToken,
    );

    localStorage.removeItem(
      this.keys.expiresIn,
    );

    localStorage.removeItem(
      this.keys.roles,
    );

    localStorage.removeItem(
      this.keys.sesion,
    );

    localStorage.removeItem(
      this.keys.usuario,
    );
  }

  // *********************************************************
  // MÉTODOS PRIVADOS
  // *********************************************************
  private readString(
    key: string,
  ): string | null {
    const value = localStorage.getItem(key);
    const normalizedValue = value?.trim();

    return normalizedValue || null;
  }

  private readJson<T>(
    key: string,
  ): T | null {
    const value = localStorage.getItem(key);

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  }

  private writeString(
    key: string,
    value: string,
  ): void {
    localStorage.setItem(
      key,
      value,
    );
  }

  private writeJson(
    key: string,
    value: unknown,
  ): void {
    localStorage.setItem(
      key,
      JSON.stringify(value),
    );
  }

  private createFallbackUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
      .replace(/[xy]/g, (character) => {
        const randomValue =
          Math.floor(Math.random() * 16);

        const value =
          character === 'x'
            ? randomValue
            : (randomValue & 0x3) | 0x8;

        return value.toString(16);
      });
  }

  // GUARDAR TOKENS RENOVADOS
  saveTokens(
    accessToken: string,
    refreshToken: string,
    expiresIn: TokenExpiration,
  ): void {
    this.writeString(
      this.keys.accessToken,
      accessToken,
    );

    this.writeString(
      this.keys.refreshToken,
      refreshToken,
    );

    this.writeJson(
      this.keys.expiresIn,
      expiresIn,
    );
  }

  // ACTUALIZAR USUARIO
  saveUser<TUsuario>(
    usuario: TUsuario,
    roles: string[],
  ): void {
    this.writeJson(
      this.keys.usuario,
      usuario,
    );

    this.writeJson(
      this.keys.roles,
      roles,
    );
  }


  // GUARDAR SESIÓN
  saveSession(session: StoredSession): void {
    this.writeJson(
      this.keys.sesion,
      session,
    );
  }
}
