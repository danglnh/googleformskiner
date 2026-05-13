"use client";

import { useMemo, useState } from "react";
import FieldPreviewTable from "@/components/FieldPreviewTable";
import CodeBlock from "@/components/CodeBlock";
import type { GoogleFormSchema } from "@/types/googleForm";
import { generateCombined, generateHtml, generateJs } from "@/lib/generateEmbedCode";

type Tab = "combined" | "html" | "js";

export default function ImportForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schema, setSchema] = useState<GoogleFormSchema | null>(null);
  const [tab, setTab] = useState<Tab>("combined");

  const html = useMemo(() => (schema ? generateHtml(schema) : ""), [schema]);
  const js = useMemo(() => (schema ? generateJs() : ""), [schema]);
  const combined = useMemo(() => (schema ? generateCombined(schema) : ""), [schema]);

  async function onImport(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSchema(null);

    try {
      const res = await fetch("/api/import-google-form", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Import failed");
        return;
      }
      setSchema(data);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <form className="space-y-3" onSubmit={onImport}>
          <label className="block text-sm font-medium text-slate-700">Google Form URL</label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="https://docs.google.com/forms/d/e/.../viewform"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? "Importing..." : "Import form"}
          </button>
        </form>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </div>

      {schema ? (
        <>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold">Parser Result</h2>
            <p className="mt-1 text-sm text-slate-600">{schema.title}</p>
            {schema.description ? <p className="mt-1 text-sm text-slate-500">{schema.description}</p> : null}
            <p className="mt-2 text-xs text-slate-500">Submit URL: {schema.submitUrl}</p>

            {schema.warnings.length ? (
              <ul className="mt-3 list-disc pl-5 text-sm text-amber-700">
                {schema.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            ) : null}

            <div className="mt-4">
              <FieldPreviewTable fields={schema.fields} />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex gap-2">
              {(["combined", "html", "js"] as Tab[]).map((x) => (
                <button
                  key={x}
                  onClick={() => setTab(x)}
                  className={`rounded px-3 py-1 text-sm ${tab === x ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
                >
                  {x.toUpperCase()}
                </button>
              ))}
            </div>

            {tab === "combined" ? <CodeBlock title="Combined Embed Code" code={combined} /> : null}
            {tab === "html" ? <CodeBlock title="HTML" code={html} /> : null}
            {tab === "js" ? <CodeBlock title="JavaScript" code={js} /> : null}

            <div className="mt-4 rounded border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
              <p>Tracking fields are only captured if the original Google Form contains matching questions.</p>
              <p className="mt-2 font-medium">Recommended short-answer tracking questions:</p>
              <ul className="mt-1 list-disc pl-5">
                <li>utm_source</li>
                <li>utm_medium</li>
                <li>utm_campaign</li>
                <li>utm_content</li>
                <li>utm_term</li>
                <li>page_url</li>
              </ul>
            </div>
          </div>
        </>
      ) : null}

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-semibold">Notes</p>
        <ul className="mt-2 list-disc pl-5">
          <li>Public Google Form only.</li>
          <li>No file upload, no login-required form, no complex branching support.</li>
          <li>Re-import after changing Google Form fields.</li>
        </ul>
      </div>
    </div>
  );
}
