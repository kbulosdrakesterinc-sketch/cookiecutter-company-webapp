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

import { GET, POST } from "./route";

describe("/api/reference-data", () => {
  beforeEach(() => {
    mocks.djangoFetch.mockReset();
  });

  it("forwards only supported directory query parameters", async () => {
    mocks.djangoFetch.mockResolvedValue({
      page: 2,
      page_size: 10,
      total: 0,
      total_pages: 0,
      results: [],
    });

    const response = await GET(
      new Request(
        "http://app.test/api/reference-data?search=general&is_active=false&page=2&page_size=10&ignored=value",
      ),
    );

    expect(response.status).toBe(200);
    expect(mocks.djangoFetch).toHaveBeenCalledWith(
      "/reference-data/?search=general&is_active=false&page=2&page_size=10",
      { method: "GET" },
    );
  });

  it("maps the set creation body to Django field names", async () => {
    mocks.djangoFetch.mockResolvedValue({
      id: "11111111-1111-4111-8111-111111111111",
      code: "GENERAL",
      name: "General",
      description: "",
      is_active: true,
      value_count: 0,
      created_at: "2026-09-24T00:00:00Z",
      updated_at: "2026-09-24T00:00:00Z",
    });

    const response = await POST(
      new Request("http://app.test/api/reference-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: " general ",
          name: " General ",
          description: " Shared ",
          isActive: false,
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(mocks.djangoFetch).toHaveBeenCalledWith(
      "/reference-data/",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          code: "general",
          name: "General",
          description: "Shared",
          is_active: false,
        }),
      }),
    );
  });
});
