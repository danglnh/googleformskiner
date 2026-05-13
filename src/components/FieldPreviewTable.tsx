import type { GoogleFormField } from "@/types/googleForm";

type Props = {
  fields: GoogleFormField[];
};

export default function FieldPreviewTable({ fields }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-600">
            <th className="px-2 py-2">Label</th>
            <th className="px-2 py-2">Type</th>
            <th className="px-2 py-2">Required</th>
            <th className="px-2 py-2">Options</th>
            <th className="px-2 py-2">Entry ID</th>
            <th className="px-2 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field) => (
            <tr key={field.id} className="border-b border-slate-100 align-top">
              <td className="px-2 py-2 font-medium text-slate-800">{field.label}</td>
              <td className="px-2 py-2 text-slate-700">{field.type}</td>
              <td className="px-2 py-2 text-slate-700">{field.required ? "Yes" : "No"}</td>
              <td className="px-2 py-2 text-slate-700">{field.options?.join(", ") || "-"}</td>
              <td className="px-2 py-2 font-mono text-xs text-slate-700">entry.{field.entryId}</td>
              <td className="px-2 py-2 text-slate-700">
                {field.type === "unsupported" ? (
                  <span className="text-amber-600">Unsupported{field.unsupportedReason ? `: ${field.unsupportedReason}` : ""}</span>
                ) : (
                  <span className="text-emerald-700">Supported</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
