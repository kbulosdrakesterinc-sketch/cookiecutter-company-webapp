export interface ReferenceDataSetInput {
  readonly code?: string;
  readonly name: string;
  readonly description: string;
  readonly isActive: boolean;
}

export interface ReferenceDataValueInput {
  readonly code?: string;
  readonly name: string;
  readonly description: string;
  readonly sortOrder: number;
  readonly isActive: boolean;
}

export interface ReferenceDataFieldErrors {
  readonly code?: readonly string[];
  readonly name?: readonly string[];
  readonly description?: readonly string[];
  readonly sortOrder?: readonly string[];
  readonly isActive?: readonly string[];
}
