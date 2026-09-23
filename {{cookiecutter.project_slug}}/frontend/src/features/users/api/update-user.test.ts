import { afterEach, describe, expect, it, vi } from "vitest";

import { updateUser, UserManagementError } from "./update-user";

const updatedUser = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "updated@example.com",
  first_name: "Updated",
  last_name: "User",
  is_active: false,
  account_state: "inactive" as const,
  date_joined: "2026-09-22T00:00:00Z",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("updateUser", () => {
  it("patches management input and returns the updated user", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(updatedUser), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    const result = await updateUser(updatedUser.id, {
      email: "updated@example.com",
      firstName: "Updated",
      lastName: "User",
      isActive: false,
    });

    expect(result).toEqual(updatedUser);
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/users/${updatedUser.id}`,
      expect.objectContaining({
        method: "PATCH",
      }),
    );
  });

  it("maps Django management field errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            email: ["A user with this email already exists."],
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
      await updateUser(updatedUser.id, {
        email: "duplicate@example.com",
      });

      throw new Error("Expected user update to fail.");
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(UserManagementError);

      const managementError = error as UserManagementError;

      expect(managementError.message).toBe(
        "A user with this email already exists.",
      );
      expect(managementError.status).toBe(400);
      expect(managementError.fieldErrors.email).toEqual([
        "A user with this email already exists.",
      ]);
    }
  });
});
