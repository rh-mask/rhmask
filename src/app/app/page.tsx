import type { Metadata } from "next";
import { Dashboard } from "@/components/Dashboard";

export const metadata: Metadata = { title: "App" };

export default function AppPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Dashboard />
    </div>
  );
}
