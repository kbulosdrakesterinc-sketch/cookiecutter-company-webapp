import { afterEach, describe, expect, it, vi } from "vitest";

import {
  RoleMembershipError,
  searchRoleMembershipCandidates,
  updateRoleMembership,
} from "./role-membership";

const member = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "member@example.com",
  first_name: "Member",
  last_name: "User",
  is_active: true,
};

const role = {
  id: 7,
  name: "Payroll",
  users: [member],
  permissions: [],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("role membership", () => {
  it("patches explicit membership deltas through the BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(role), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await updateRoleMembership(7, {
      addUserIds: ["22222222-2222-4222-8222-222222222222"],
      removeUserIds: ["33333333-3333-4333-8333-333333333333"],
    });

    expect(result).toEqual(role);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/roles/7/membership",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          addUserIds: ["22222222-2222-4222-8222-222222222222"],
          removeUserIds: ["33333333-3333-4333-8333-333333333333"],
        }),
      }),
    );
  });

  it("searches membership candidates by name or email", async () => {
    const responseBody = {
      page: 1,
      page_size: 20,
      total: 1,
      total_pages: 1,
      results: [member],
    };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(responseBody), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await searchRoleMembershipCandidates(
      7,
      "Member User",
    );

    expect(result).toEqual(responseBody);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/roles/7/membership-candidates?search=Member+User&page=1&page_size=20",
      expect.objectContaining({
        method: "GET",
      }),
    );
  });

  it("maps invalid membership user ids from Django", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            user_ids: ["One or more selected users do not exist."],
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
            },
          },
        ),
      ),
    );

    try {
      await updateRoleMembership(7, {
        addUserIds: ["44444444-4444-4444-8444-444444444444"],
      });

      throw new Error("Expected role membership update to fail.");
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(RoleMembershipError);
      const membershipError = error as RoleMembershipError;

      expect(membershipError.status).toBe(400);
      expect(membershipError.fieldErrors.userIds).toEqual([
        "One or more selected users do not exist.",
      ]);
    }
  });

  it("maps overlapping add/remove validation errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            add_user_ids: [
              "A user cannot be both added and removed in one request.",
            ],
            remove_user_ids: [
              "A user cannot be both added and removed in one request.",
            ],
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
            },
          },
        ),
      ),
    );

    try {
      await updateRoleMembership(7, {
        addUserIds: [member.id],
        removeUserIds: [member.id],
      });

      throw new Error("Expected role membership update to fail.");
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(RoleMembershipError);
      const membershipError = error as RoleMembershipError;

      expect(membershipError.fieldErrors.addUserIds?.[0]).toContain(
        "both added and removed",
      );
      expect(membershipError.fieldErrors.removeUserIds?.[0]).toContain(
        "both added and removed",
      );
    }
  });
});
