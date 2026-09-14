/*
|--------------------------------------------------------------------------
| Tipos de dispositivo permitidos
|--------------------------------------------------------------------------
*/

export type LoginDeviceType =
  | 'WEB'
  | 'ANDROID'
  | 'IOS';

/*
|--------------------------------------------------------------------------
| Login request
|--------------------------------------------------------------------------
*/

export interface LoginRequest {
  username: string;
  password: string;
  dispositivo_id: string;
  tipo_dispositivo: LoginDeviceType;
  nombre_dispositivo: string;
}
