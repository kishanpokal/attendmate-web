"use client";

import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  HomeRounded,
  ListAltRounded,
  BarChartRounded,
  SettingsRounded,
  AddRounded,
} from "@mui/icons-material";
import { useState, useEffect } from "react";

type RouteKey = "home" | "attendance" | "analytics" | "settings";

const navItems: {
  key: RouteKey;
  label: string;
  icon: any;
  path: string;
  accent: string;
  lightAccent: string;
}[] = [
  { key: "home", label: "Home", icon: HomeRounded, path: "/dashboard", accent: "#6366f1", lightAccent: "rgba(99, 102, 241, 0.12)" },
  { key: "attendance", label: "Attend", icon: ListAltRounded, path: "/attendance", accent: "#0ea5e9", lightAccent: "rgba(14, 165, 233, 0.12)" },
  { key: "analytics", label: "Analytics", icon: BarChartRounded, path: "/analytics", accent: "#10b981", lightAccent: "rgba(16, 185, 129, 0.12)" },
  { key: "settings", label: "Settings", icon: SettingsRounded, path: "/settings", accent: "#f59e0b", lightAccent: "rgba(245, 158, 11, 0.12)" },
];

export default function AttendMateBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const active = navItems.find((n) => pathname?.startsWith(n.path))?.key ?? "home";

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        /* Ensures the bar doesn't get cut off by iOS home indicator */
        .safe-padding { 
          padding-bottom: env(safe-area-inset-bottom); 
        }
      `}} />

      {/* Responsive Positioning Container:
        Mobile: Fixed to exact bottom, full width.
        Desktop: Floating center dock.
      */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none flex justify-center md:bottom-6">
        
        {/* Main Glass Background:
          Mobile: Safe-padding expands the glass to the bottom edge. Rounded top corners.
          Desktop: Fully rounded floating pill. 
        */}
        <div className="pointer-events-auto w-full md:w-auto safe-padding bg-white/85 dark:bg-[#0f1423]/85 backdrop-blur-2xl border-t md:border border-gray-200/50 dark:border-gray-800/60 shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.5)] md:shadow-2xl rounded-t-3xl md:rounded-[2rem] transition-colors duration-500">
          
          {/* Perfectly distributed 5-column grid layout for Mobile.
            Flexbox for desktop to keep it compact.
          */}
          <div className="w-full max-w-md mx-auto md:max-w-none h-[72px] md:h-[68px] grid grid-cols-5 md:flex md:items-center md:gap-2 px-2 sm:px-4">
            
            {/* 1. Home */}
            <NavItem item={navItems[0]} isActive={active === navItems[0].key} onClick={() => router.push(navItems[0].path)} />
            
            {/* 2. Attendance */}
            <NavItem item={navItems[1]} isActive={active === navItems[1].key} onClick={() => router.push(navItems[1].path)} />

            {/* 3. Center Floating Action Button (FAB) */}
            <div className="relative flex justify-center items-center h-full w-full md:w-20">
              <motion.button
                whileHover={{ scale: 1.05, translateY: -2 }}
                whileTap={{ scale: 0.95, rotate: 45 }}
                onClick={() => router.push("/attendance/add")}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                // Absolute positioning keeps the grid intact while letting the button float upwards
                className="absolute bottom-4 md:bottom-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white border border-white/20 dark:border-white/10 z-10"
              >
                <AddRounded sx={{ fontSize: 32 }} />
              </motion.button>
            </div>

            {/* 4. Analytics */}
            <NavItem item={navItems[2]} isActive={active === navItems[2].key} onClick={() => router.push(navItems[2].path)} />
            
            {/* 5. Settings */}
            <NavItem item={navItems[3]} isActive={active === navItems[3].key} onClick={() => router.push(navItems[3].path)} />
            
          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────── NAV ITEM COMPONENT ─────────────────── */

function NavItem({
  item,
  isActive,
  onClick,
}: {
  item: (typeof navItems)[number];
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;

  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center justify-center w-full h-full md:w-20 md:h-16 rounded-2xl select-none outline-none group transition-all"
    >
      {/* Animated Liquid Background Pill */}
      <div className="absolute inset-1 sm:inset-1.5 md:inset-1 rounded-xl sm:rounded-2xl overflow-hidden flex items-center justify-center">
        <AnimatePresence>
          {isActive && (
            <motion.div
              layoutId="active-nav-pill"
              className="absolute inset-0"
              style={{ backgroundColor: item.lightAccent }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Content Container */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center gap-1 w-full"
        animate={{ y: isActive ? -2 : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <motion.div
          animate={{ scale: isActive ? 1.1 : 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <Icon
            className={`transition-colors duration-300 ${
              isActive 
                ? "drop-shadow-sm" 
                : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
            }`}
            style={{
              fontSize: 26,
              color: isActive ? item.accent : undefined,
            }}
          />
        </motion.div>

        <span
          className={`text-[10px] sm:text-[11px] font-bold tracking-wide transition-colors duration-300 ${
            isActive 
              ? "" 
              : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
          }`}
          style={{
            color: isActive ? item.accent : undefined,
          }}
        >
          {item.label}
        </span>
      </motion.div>
    </button>
  );
}