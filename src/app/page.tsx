import { redirect } from "next/navigation";
import FeatureTabs from "@/components/FeatureTabs";
import { isAuthenticated } from "@/lib/auth";

export default function HomePage() {
  if (!isAuthenticated()) {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Google Form Skiner</h1>
        <p className="mt-1 text-sm text-slate-600">
          Render Google Forms as clean HTML and build UTM links for sales-friendly campaign tracking.
        </p>
      </header>

      <FeatureTabs />
    </main>
  );
}
