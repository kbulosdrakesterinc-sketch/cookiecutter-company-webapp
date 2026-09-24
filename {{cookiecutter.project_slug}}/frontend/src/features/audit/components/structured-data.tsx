import type { JsonValue } from "../types/audit-event";

interface StructuredDataProps {
  readonly value: JsonValue;
}

function humanizeKey(value: string): string {
  return value.replaceAll("_", " ");
}

function isJsonObject(
  value: JsonValue,
): value is { readonly [key: string]: JsonValue } {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function StructuredData({ value }: StructuredDataProps): React.ReactNode {
  if (value === null) {
    return <span className="text-slate-400">None</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-slate-400">None</span>;
    }

    return (
      <ul className="space-y-1 pl-4">
        {value.map((item, index) => (
          <li className="list-disc" key={index}>
            <StructuredData value={item} />
          </li>
        ))}
      </ul>
    );
  }

  if (isJsonObject(value)) {
    const entries = Object.entries(value);

    if (entries.length === 0) {
      return <span className="text-slate-400">None</span>;
    }

    return (
      <dl className="space-y-1.5">
        {entries.map(([key, item]) => (
          <div className="grid grid-cols-[minmax(6rem,auto)_1fr] gap-2" key={key}>
            <dt className="font-medium capitalize text-slate-600">
              {humanizeKey(key)}
            </dt>
            <dd className="min-w-0 text-slate-700">
              <StructuredData value={item} />
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  if (typeof value === "boolean") {
    return <span>{value ? "True" : "False"}</span>;
  }

  return <span className="wrap-break-word">{String(value)}</span>;
}
