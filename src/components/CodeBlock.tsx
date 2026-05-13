"use client";

import { useState } from "react";

type Props = {
  title: string;
  code: string;
};

export default function CodeBlock({ title, code }: Props) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        <button className="rounded bg-slate-900 px-3 py-1 text-xs text-white" onClick={onCopy}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="max-h-80 overflow-auto p-4 text-xs leading-relaxed text-slate-800">
        <code>{code}</code>
      </pre>
    </div>
  );
}
