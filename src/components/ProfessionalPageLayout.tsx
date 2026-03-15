"use client";

import ModernNavigation from "@/components/navigation/ModernNavigation";
import { motion } from "framer-motion";

export default function ProfessionalPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <ModernNavigation />
      <main className="flex-1 w-full max-w-[1600px] mx-auto relative px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="h-full"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
