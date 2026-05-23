"use client";

import { ReactNode } from "react";
import ModernNavigation from "@/components/navigation/ModernNavigation";

export default function ProfessionalPageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f9fafb] dark:bg-[#111827]">
      <ModernNavigation />
      <main className="lg:ml-60 min-h-screen">
        {children}
      </main>
    </div>
  );
}
