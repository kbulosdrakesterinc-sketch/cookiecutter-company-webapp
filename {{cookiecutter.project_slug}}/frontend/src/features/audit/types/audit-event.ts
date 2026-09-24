export type JsonPrimitive = string | number | boolean | null;

export type JsonValue =
  | JsonPrimitive
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

export interface AuditEvent {
  readonly id: string;
  readonly occurred_at: string;
  readonly actor_identifier: string;
  readonly action: string;
  readonly target_type: string;
  readonly target_id: string;
  readonly target_display: string;
  readonly changes: { readonly [key: string]: JsonValue };
  readonly context: { readonly [key: string]: JsonValue };
}

export interface AuditEventDirectoryResponse {
  readonly page: number;
  readonly page_size: number;
  readonly total: number;
  readonly total_pages: number;
  readonly results: readonly AuditEvent[];
}

export interface AuditEventFilters {
  readonly action: string;
  readonly target_type: string;
  readonly actor: string;
  readonly occurred_after: string;
  readonly occurred_before: string;
}
