import { PaginationData } from './pagination.model';

export interface PaginatedData<T> {
  items: T[];
  pagination: PaginationData;
}
