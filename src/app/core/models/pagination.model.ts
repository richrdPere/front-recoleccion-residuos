export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_previous_page: boolean;
  has_next_page: boolean;
}
