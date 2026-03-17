"use client";

import ModernNavigation from "@/components/navigation/ModernNavigation";
import { motion, AnimatePresence } from "framer-motion";

export default function ProfessionalPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-transparent">
      <ModernNavigation />
      
      <main className="flex-1 w-full relative">
        <div className="content-container py-6 sm:py-10 lg:py-12 pb-28 md:pb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key="content-root"
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.98 }}
              transition={{ 
                duration: 0.5, 
                ease: [0.22, 1, 0.36, 1] 
              }}
              className="relative z-10"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Subtle inner glow for the main area */}
        <div className="fixed inset-0 pointer-events-none opacity-20 dark:opacity-10 bg-[radial-gradient(circle_at_50%_0%,var(--primary),transparent_70%)] max-h-[50vh]" />
      </main>
    </div>
  );
}

