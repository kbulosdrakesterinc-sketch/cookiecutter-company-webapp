import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createRole,
  RoleManagementError,
  updateRole,
} from "./role-management";

const role = {
  id: 7,
  name: "Payroll",
  users: [],
  permissions: [],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("role management", () => {
  it("posts role creation input through the BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(role), {
        status: 201,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await createRole({
      name: "Payroll",
      permissionIds: [1, 4],
    });

    expect(result).toEqual(role);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/roles",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "Payroll",
          permissionIds: [1, 4],
        }),
      }),
    );
  });

  it("patches a role with explicit replacement permission ids", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(role), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await updateRole(7, {
      name: "Payroll",
      permissionIds: [2],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/roles/7",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          name: "Payroll",
          permissionIds: [2],
        }),
      }),
    );
  });

  it("maps Django role-management field errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            permission_ids: ["One or more selected permissions do not exist."],
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
      await updateRole(7, {
        name: "Payroll",
        permissionIds: [999999],
      });

      throw new Error("Expected role update to fail.");
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(RoleManagementError);
      const managementError = error as RoleManagementError;

      expect(managementError.status).toBe(400);
      expect(managementError.fieldErrors.permissionIds).toEqual([
        "One or more selected permissions do not exist.",
      ]);
    }
  });
});
