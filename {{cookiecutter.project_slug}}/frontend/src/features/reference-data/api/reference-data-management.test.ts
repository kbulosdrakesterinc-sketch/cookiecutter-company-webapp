import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createReferenceDataSet,
  ReferenceDataManagementError,
  updateReferenceDataValue,
} from "./reference-data-management";

const referenceSet = {
  id: "11111111-1111-4111-8111-111111111111",
  code: "GENERAL",
  name: "General lookup",
  description: "",
  is_active: true,
  value_count: 0,
  created_at: "2026-09-24T00:00:00Z",
  updated_at: "2026-09-24T00:00:00Z",
};

const referenceValue = {
  id: "22222222-2222-4222-8222-222222222222",
  code: "ALPHA",
  name: "Alpha",
  description: "",
  sort_order: 10,
  is_active: true,
  created_at: "2026-09-24T00:00:00Z",
  updated_at: "2026-09-24T00:00:00Z",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("reference-data management", () => {
  it("posts set creation input through the BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(referenceSet), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await createReferenceDataSet({
      code: "GENERAL",
      name: "General lookup",
      description: "",
      isActive: true,
    });

    expect(result).toEqual(referenceSet);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/reference-data",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          code: "GENERAL",
          name: "General lookup",
          description: "",
          isActive: true,
        }),
      }),
    );
  });

  it("patches a value without changing its stable code", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(referenceValue), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await updateReferenceDataValue(
      referenceSet.id,
      referenceValue.id,
      {
        name: "Alpha",
        description: "",
        sortOrder: 20,
        isActive: false,
      },
    );

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(String(init.body))).toEqual({
      name: "Alpha",
      description: "",
      sortOrder: 20,
      isActive: false,
    });
    expect(JSON.parse(String(init.body))).not.toHaveProperty("code");
  });

  it("maps Django field validation errors for forms", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            sort_order: ["Ensure this value is greater than or equal to 0."],
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    );

    try {
      await updateReferenceDataValue(
        referenceSet.id,
        referenceValue.id,
        {
          name: "Alpha",
          description: "",
          sortOrder: -1,
          isActive: true,
        },
      );
      throw new Error("Expected reference-data update to fail.");
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ReferenceDataManagementError);
      const managementError = error as ReferenceDataManagementError;

      expect(managementError.status).toBe(400);
      expect(managementError.fieldErrors.sortOrder).toEqual([
        "Ensure this value is greater than or equal to 0.",
      ]);
    }
  });
});
