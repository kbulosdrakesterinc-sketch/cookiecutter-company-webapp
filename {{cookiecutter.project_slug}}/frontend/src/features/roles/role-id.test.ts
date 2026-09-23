import { describe, expect, it } from "vitest";

import { parseRoleId } from "./role-id";

describe("parseRoleId", () => {
  it("accepts positive integer role IDs", () => {
    expect(parseRoleId("1")).toBe(1);
    expect(parseRoleId("42")).toBe(42);
    expect(parseRoleId("001")).toBe(1);
  });

  it("rejects invalid role IDs", () => {
    expect(parseRoleId("")).toBeNull();
    expect(parseRoleId("0")).toBeNull();
    expect(parseRoleId("-1")).toBeNull();
    expect(parseRoleId("1.5")).toBeNull();
    expect(parseRoleId("role-1")).toBeNull();
    expect(parseRoleId("9007199254740992")).toBeNull();
  });
});
