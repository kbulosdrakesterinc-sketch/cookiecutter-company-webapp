import Link from "next/link";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AdministrationEmptyState } from "./administration-empty-state";
import { AdministrationPageHeader } from "./administration-page-header";
import {
  AdministrationPagination,
  buildAdministrationPaginationHref,
} from "./administration-pagination";

describe("Administration shared primitives", () => {
  it("renders a page header with an optional action", () => {
    const markup = renderToStaticMarkup(
      <AdministrationPageHeader
        action={<Link href="/administration/example/new">Add example</Link>}
        description="Manage shared examples."
        title="Examples"
      />,
    );

    expect(markup).toContain("Examples");
    expect(markup).toContain("Manage shared examples.");
    expect(markup).toContain('href="/administration/example/new"');
  });

  it("renders feature-owned empty-state copy", () => {
    const markup = renderToStaticMarkup(
      <AdministrationEmptyState
        description="Try another filter."
        title="No examples found."
      />,
    );

    expect(markup).toContain("No examples found.");
    expect(markup).toContain("Try another filter.");
  });

  it("keeps non-empty query values while changing only the page", () => {
    expect(
      buildAdministrationPaginationHref("/administration/example", 3, [
        ["search", "Ada Lovelace"],
        ["is_active", "true"],
        ["ignored", ""],
      ]),
    ).toBe(
      "/administration/example?page=3&search=Ada+Lovelace&is_active=true",
    );
  });

  it("hides pagination for a single page", () => {
    const markup = renderToStaticMarkup(
      <AdministrationPagination
        basePath="/administration/example"
        page={1}
        totalPages={1}
      />,
    );

    expect(markup).toBe("");
  });
});
