import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  djangoFetch: vi.fn(),
}));

vi.mock("@/shared/server/django-fetch", () => {
  class DjangoRequestError extends Error {
    readonly status = 500;
    readonly body = { detail: "Upstream error." };
  }

  return {
    djangoFetch: mocks.djangoFetch,
    DjangoRequestError,
  };
});

import { PATCH } from "./route";

describe("PATCH /api/reference-data/[id]/values/[valueId]", () => {
  beforeEach(() => {
    mocks.djangoFetch.mockReset();
  });

  it("forwards editable value fields through the Django BFF boundary", async () => {
    mocks.djangoFetch.mockResolvedValue({
      id: "22222222-2222-4222-8222-222222222222",
      code: "ALPHA",
      name: "Alpha updated",
      description: "",
      sort_order: 5,
      is_active: false,
      created_at: "2026-09-24T00:00:00Z",
      updated_at: "2026-09-24T00:00:00Z",
    });

    const response = await PATCH(
      new Request("http://app.test/api/reference-data/set/values/value", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: " Alpha updated ",
          description: "",
          sortOrder: 5,
          isActive: false,
        }),
      }),
      {
        params: Promise.resolve({
          id: "11111111-1111-4111-8111-111111111111",
          valueId: "22222222-2222-4222-8222-222222222222",
        }),
      },
    );

    expect(response.status).toBe(200);
    expect(mocks.djangoFetch).toHaveBeenCalledWith(
      "/reference-data/11111111-1111-4111-8111-111111111111/values/22222222-2222-4222-8222-222222222222/",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          name: "Alpha updated",
          description: "",
          sort_order: 5,
          is_active: false,
        }),
      }),
    );
  });
});
