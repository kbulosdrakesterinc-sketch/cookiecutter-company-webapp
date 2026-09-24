import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import AuditLogError from "@/app/(app)/administration/audit-log/error";
import AuditLogLoading from "@/app/(app)/administration/audit-log/loading";

import type { AuditEvent } from "../types/audit-event";
import { AuditEventsTable } from "./audit-events-table";

const sampleEvent: AuditEvent = {
  id: "2b632030-89bc-4ea7-855c-df6ba91d3247",
  occurred_at: "2026-09-24T08:15:00+08:00",
  actor_identifier: "admin@example.com",
  action: "admin.user.updated",
  target_type: "accounts.user",
  target_id: "52bfce20-acde-4bb6-a099-1dc840b43588",
  target_display: "target@example.com",
  changes: {
    fields: {
      email: {
        from: "before@example.com",
        to: "after@example.com",
      },
    },
  },
  context: {},
};

describe("Audit Log states", () => {
  it("renders a successful event with structured changes", () => {
    const markup = renderToStaticMarkup(
      <AuditEventsTable events={[sampleEvent]} />,
    );

    expect(markup).toContain("admin@example.com");
    expect(markup).toContain("admin.user.updated");
    expect(markup).toContain("target@example.com");
    expect(markup).toContain("before@example.com");
    expect(markup).toContain("after@example.com");
  });

  it("renders the empty directory state", () => {
    const markup = renderToStaticMarkup(<AuditEventsTable events={[]} />);

    expect(markup).toContain("No audit events found.");
    expect(markup).toContain("Try adjusting the current filters.");
  });

  it("renders the route loading state", () => {
    const markup = renderToStaticMarkup(<AuditLogLoading />);

    expect(markup).toContain('aria-label="Loading audit events"');
  });

  it("renders the route error state", () => {
    const markup = renderToStaticMarkup(
      <AuditLogError error={new Error("test failure")} reset={() => undefined} />,
    );

    expect(markup).toContain("Audit log unavailable");
    expect(markup).toContain("The audit log could not be loaded.");
  });
});
