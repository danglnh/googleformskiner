"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pin })
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.message || "Invalid PIN");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
      <div className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold">Google Form Skiner</h1>
        <p className="mt-1 text-sm text-slate-600">Enter PIN to access the tool.</p>

        <form className="mt-5 space-y-3" onSubmit={onSubmit}>
          <input
            className="w-full rounded border border-slate-300 px-3 py-2"
            type="password"
            placeholder="PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
          >
            {loading ? "Checking..." : "Unlock"}
          </button>
        </form>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </div>
    </main>
  );
}
