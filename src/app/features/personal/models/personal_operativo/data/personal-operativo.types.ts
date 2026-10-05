export type TipoContratoPersonal =
  | 'NOMBRADO'
  | 'CONTRATADO'
  | 'CAS'
  | 'LOCADOR'
  | 'TERCERO'
  | 'OTRO';

export type TurnoPreferentePersonal =
  | 'MANANA'
  | 'TARDE'
  | 'NOCHE'
  | 'ROTATIVO';

export type EstadoLaboralPersonal =
  | 'ACTIVO'
  | 'VACACIONES'
  | 'DESCANSO_MEDICO'
  | 'SUSPENDIDO'
  | 'CESADO';

export type TipoDocumento =
  | 'DNI'
  | 'CE'
  | 'PASAPORTE'
  | 'OTRO';

export type GeneroPersona =
  | 'M'
  | 'F'
  | 'OTRO';

export type NombreRol =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'SUPERVISOR'
  | 'OPERADOR'
  | 'CONDUCTOR'
  | 'RECOLECTOR';

export type EstadoLicencia =
  | 'VIGENTE'
  | 'POR_VENCER'
  | 'VENCIDA'
  | 'SUSPENDIDA'
  | 'CANCELADA';
