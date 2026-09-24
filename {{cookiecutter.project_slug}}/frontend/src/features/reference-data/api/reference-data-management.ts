import type {
  ReferenceDataSet,
  ReferenceDataValue,
} from "../types/reference-data";
import type {
  ReferenceDataFieldErrors,
  ReferenceDataSetInput,
  ReferenceDataValueInput,
} from "../types/reference-data-management";

function getStringArray(value: unknown): readonly string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.every((item) => typeof item === "string") ? value : undefined;
}

function getFieldErrors(value: unknown): ReferenceDataFieldErrors {
  if (typeof value !== "object" || value === null) {
    return {};
  }

  return {
    code: "code" in value ? getStringArray(value.code) : undefined,
    name: "name" in value ? getStringArray(value.name) : undefined,
    description:
      "description" in value ? getStringArray(value.description) : undefined,
    sortOrder:
      "sort_order" in value ? getStringArray(value.sort_order) : undefined,
    isActive:
      "is_active" in value ? getStringArray(value.is_active) : undefined,
  };
}

function getDetail(value: unknown): string | null {
  if (
    typeof value === "object" &&
    value !== null &&
    "detail" in value &&
    typeof value.detail === "string"
  ) {
    return value.detail;
  }

  return null;
}

export class ReferenceDataManagementError extends Error {
  public readonly status: number;
  public readonly fieldErrors: ReferenceDataFieldErrors;

  public constructor(
    message: string,
    status: number,
    fieldErrors: ReferenceDataFieldErrors,
  ) {
    super(message);

    this.name = "ReferenceDataManagementError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

async function requestReferenceData<T>(
  url: string,
  method: "POST" | "PATCH",
  input: object,
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const body: unknown = await response.json();

  if (!response.ok) {
    const fieldErrors = getFieldErrors(body);
    const firstFieldMessage =
      fieldErrors.code?.[0] ??
      fieldErrors.name?.[0] ??
      fieldErrors.description?.[0] ??
      fieldErrors.sortOrder?.[0] ??
      fieldErrors.isActive?.[0];

    throw new ReferenceDataManagementError(
      getDetail(body) ?? firstFieldMessage ?? "Unable to save reference data.",
      response.status,
      fieldErrors,
    );
  }

  return body as T;
}

export async function createReferenceDataSet(
  input: ReferenceDataSetInput,
): Promise<ReferenceDataSet> {
  return requestReferenceData<ReferenceDataSet>(
    "/api/reference-data",
    "POST",
    input,
  );
}

export async function updateReferenceDataSet(
  referenceSetId: string,
  input: ReferenceDataSetInput,
): Promise<ReferenceDataSet> {
  return requestReferenceData<ReferenceDataSet>(
    `/api/reference-data/${encodeURIComponent(referenceSetId)}`,
    "PATCH",
    input,
  );
}

export async function createReferenceDataValue(
  referenceSetId: string,
  input: ReferenceDataValueInput,
): Promise<ReferenceDataValue> {
  return requestReferenceData<ReferenceDataValue>(
    `/api/reference-data/${encodeURIComponent(referenceSetId)}/values`,
    "POST",
    input,
  );
}

export async function updateReferenceDataValue(
  referenceSetId: string,
  valueId: string,
  input: ReferenceDataValueInput,
): Promise<ReferenceDataValue> {
  return requestReferenceData<ReferenceDataValue>(
    `/api/reference-data/${encodeURIComponent(referenceSetId)}/values/${encodeURIComponent(valueId)}`,
    "PATCH",
    input,
  );
}
