export interface ReferenceDataSet {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string;
  readonly is_active: boolean;
  readonly value_count: number;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface ReferenceDataValue {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string;
  readonly sort_order: number;
  readonly is_active: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface ReferenceDataSetDirectoryResponse {
  readonly page: number;
  readonly page_size: number;
  readonly total: number;
  readonly total_pages: number;
  readonly results: readonly ReferenceDataSet[];
}

export interface ReferenceDataValueDirectoryResponse {
  readonly page: number;
  readonly page_size: number;
  readonly total: number;
  readonly total_pages: number;
  readonly results: readonly ReferenceDataValue[];
}
