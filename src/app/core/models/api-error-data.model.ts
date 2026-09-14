export interface ApiErrorData {
  message: string;
  error?: string | null;
  statusCode: number;
  details?: unknown;
}
