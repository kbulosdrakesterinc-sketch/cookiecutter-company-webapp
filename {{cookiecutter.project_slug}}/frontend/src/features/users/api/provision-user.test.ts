import { afterEach, describe, expect, it, vi } from "vitest";

import {
  provisionUser,
  UserProvisioningError,
} from "./provision-user";

const createdUser = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "maria@example.com",
  first_name: "Maria",
  last_name: "Santos",
  is_active: true,
  account_state: "pending_activation" as const,
  date_joined: "2026-09-22T00:00:00Z",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("provisionUser", () => {
  it("posts provisioning input and returns the created user", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(createdUser), {
        status: 201,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    const result = await provisionUser({
      email: "maria@example.com",
      firstName: "Maria",
      lastName: "Santos",
    });

    expect(result).toEqual(createdUser);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/users",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("maps Django field errors", async () => {
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
      await provisionUser({
        email: "maria@example.com",
        firstName: "Maria",
        lastName: "Santos",
      });

      throw new Error("Expected provisioning to fail.");
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(UserProvisioningError);

      const provisioningError = error as UserProvisioningError;

      expect(provisioningError.message).toBe(
        "A user with this email already exists.",
      );
      expect(provisioningError.status).toBe(400);
      expect(provisioningError.fieldErrors.email).toEqual([
        "A user with this email already exists.",
      ]);
    }
  });
});
