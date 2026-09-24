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

import { GET } from "./route";

describe("GET /api/audit-events", () => {
  beforeEach(() => {
    mocks.djangoFetch.mockReset();
  });

  it("forwards only supported filters to the Django audit endpoint", async () => {
    mocks.djangoFetch.mockResolvedValue({
      page: 2,
      page_size: 20,
      total: 0,
      total_pages: 0,
      results: [],
    });

    const response = await GET(
      new Request(
        "http://app.test/api/audit-events?action=admin.role.renamed" +
          "&target_type=auth.group&actor=admin%40example.com" +
          "&occurred_after=2026-09-24T08%3A00&occurred_before=2026-09-24T17%3A00" +
          "&page=2&page_size=20&ignored=value",
      ),
    );

    expect(response.status).toBe(200);
    expect(mocks.djangoFetch).toHaveBeenCalledTimes(1);
    expect(mocks.djangoFetch).toHaveBeenCalledWith(
      "/audit-events/?action=admin.role.renamed&target_type=auth.group" +
        "&actor=admin%40example.com&occurred_after=2026-09-24T08%3A00" +
        "&occurred_before=2026-09-24T17%3A00&page=2&page_size=20",
      { method: "GET" },
    );
  });
});
