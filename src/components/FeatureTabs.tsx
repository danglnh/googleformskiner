"use client";

import { useState } from "react";
import ImportForm from "@/components/ImportForm";
import UTMBuilder from "@/components/UTMBuilder";

type FeatureTab = "skiner" | "utm_builder";

export default function FeatureTabs() {
  const [tab, setTab] = useState<FeatureTab>("skiner");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTab("skiner")}
          className={`rounded px-4 py-2 text-sm font-medium ${tab === "skiner" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
        >
          Google Form Skiner
        </button>
        <button
          onClick={() => setTab("utm_builder")}
          className={`rounded px-4 py-2 text-sm font-medium ${tab === "utm_builder" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
        >
          UTM Builder
        </button>
      </div>

      {tab === "skiner" ? <ImportForm /> : <UTMBuilder />}
    </div>
  );
}
