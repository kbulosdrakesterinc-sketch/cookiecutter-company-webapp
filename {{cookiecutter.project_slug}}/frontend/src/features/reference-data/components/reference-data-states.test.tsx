import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

import ReferenceDataError from "@/app/(app)/administration/reference-data/error";
import ReferenceDataLoading from "@/app/(app)/administration/reference-data/loading";

import type {
  ReferenceDataSet,
  ReferenceDataValue,
} from "../types/reference-data";
import { ReferenceDataSetForm } from "./reference-data-set-form";
import { ReferenceDataSetsTable } from "./reference-data-sets-table";
import { ReferenceDataValueForm } from "./reference-data-value-form";
import { ReferenceDataValuesTable } from "./reference-data-values-table";

const referenceSet: ReferenceDataSet = {
  id: "11111111-1111-4111-8111-111111111111",
  code: "GENERAL",
  name: "General lookup",
  description: "Reusable lookup.",
  is_active: true,
  value_count: 1,
  created_at: "2026-09-24T00:00:00Z",
  updated_at: "2026-09-24T00:00:00Z",
};

const referenceValue: ReferenceDataValue = {
  id: "22222222-2222-4222-8222-222222222222",
  code: "ALPHA",
  name: "Alpha",
  description: "",
  sort_order: 10,
  is_active: true,
  created_at: "2026-09-24T00:00:00Z",
  updated_at: "2026-09-24T00:00:00Z",
};

describe("Reference Data states and forms", () => {
  it("renders successful set and value directory content", () => {
    const setMarkup = renderToStaticMarkup(
      <ReferenceDataSetsTable
        canChangeSets={true}
        referenceSets={[referenceSet]}
      />,
    );
    const valueMarkup = renderToStaticMarkup(
      <ReferenceDataValuesTable
        canChangeValues={true}
        referenceSetId={referenceSet.id}
        values={[referenceValue]}
      />,
    );

    expect(setMarkup).toContain("GENERAL");
    expect(setMarkup).toContain("General lookup");
    expect(valueMarkup).toContain("ALPHA");
    expect(valueMarkup).toContain("Alpha");
  });

  it("renders empty states for sets and values", () => {
    const setMarkup = renderToStaticMarkup(
      <ReferenceDataSetsTable
        canChangeSets={false}
        referenceSets={[]}
      />,
    );
    const valueMarkup = renderToStaticMarkup(
      <ReferenceDataValuesTable
        canChangeValues={false}
        referenceSetId={referenceSet.id}
        values={[]}
      />,
    );

    expect(setMarkup).toContain("No reference-data sets found.");
    expect(valueMarkup).toContain("No reference-data values found.");
  });

  it("renders route loading and error states", () => {
    const loadingMarkup = renderToStaticMarkup(<ReferenceDataLoading />);
    const errorMarkup = renderToStaticMarkup(
      <ReferenceDataError
        error={new Error("test failure")}
        reset={() => undefined}
      />,
    );

    expect(loadingMarkup).toContain('aria-label="Loading reference data"');
    expect(errorMarkup).toContain("Reference data unavailable");
  });

  it("renders create forms with editable stable-code fields", () => {
    const setMarkup = renderToStaticMarkup(<ReferenceDataSetForm />);
    const valueMarkup = renderToStaticMarkup(
      <ReferenceDataValueForm referenceSetId={referenceSet.id} />,
    );

    expect(setMarkup).toContain('name="code"');
    expect(setMarkup).toContain("Create reference-data set");
    expect(valueMarkup).toContain('name="sortOrder"');
    expect(valueMarkup).toContain("Create value");
  });

  it("renders edit forms with stable-code fields disabled", () => {
    const setMarkup = renderToStaticMarkup(
      <ReferenceDataSetForm referenceSet={referenceSet} />,
    );
    const valueMarkup = renderToStaticMarkup(
      <ReferenceDataValueForm
        referenceSetId={referenceSet.id}
        value={referenceValue}
      />,
    );

    expect(setMarkup).toContain('disabled=""');
    expect(setMarkup).toContain("Save changes");
    expect(valueMarkup).toContain('disabled=""');
    expect(valueMarkup).toContain("Save changes");
  });
});
