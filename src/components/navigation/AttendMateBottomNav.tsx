"use client";

import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  ListAlt,
  BarChart,
  Settings,
  Add,
} from "@mui/icons-material";
import { useState, useEffect } from "react";

type RouteKey = "home" | "attendance" | "analytics" | "settings";

const navItems: {
  key: RouteKey;
  label: string;
  icon: any;
  path: string;
  accent: string;
}[] = [
  { key: "home", label: "Home", icon: Home, path: "/dashboard", accent: "#6C63FF" },
  { key: "attendance", label: "Attend", icon: ListAlt, path: "/attendance", accent: "#06B6D4" },
  { key: "analytics", label: "Analytics", icon: BarChart, path: "/analytics", accent: "#10B981" },
  { key: "settings", label: "Settings", icon: Settings, path: "/settings", accent: "#F59E0B" },
];

export default function AttendMateBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const active = navItems.find((n) => pathname?.startsWith(n.path))?.key ?? "home";
  const activeItem = navItems.find((n) => n.key === active);

  if (!mounted) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

        .nav-root * {
          font-family: 'Inter', system-ui, sans-serif;
          -webkit-tap-highlight-color: transparent;
        }

        /* Safe area support for modern iOS/Android devices */
        .safe-padding {
          padding-bottom: env(safe-area-inset-bottom, 16px);
        }

        /* Sleek FAB styling */
        .fab-premium {
          background: linear-gradient(135deg, #6C63FF 0%, #4338CA 100%);
          box-shadow: 0 8px 24px rgba(108, 99, 255, 0.35),
                      inset 0 1px 1px rgba(255, 255, 255, 0.2);
        }
      `}</style>

      {/* Full width wrapper with Tailwind Dark Mode support for Glassmorphism */}
      <div className="nav-root fixed bottom-0 left-0 right-0 z-50 safe-padding transition-all duration-300 bg-white/85 dark:bg-[#121217]/85 backdrop-blur-[20px] border-t border-black/5 dark:border-white/10 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)]">
        
        {/* Active Top Indicator Line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] overflow-hidden">
          <motion.div
            className="absolute top-0 h-[2px] rounded-full"
            style={{ backgroundColor: activeItem?.accent || "#6C63FF" }}
            initial={false}
            animate={{
              // Calculate position based on a 5-column grid
              left: active === "home" ? "10%" :
                    active === "attendance" ? "30%" :
                    active === "analytics" ? "70%" : "90%",
              x: "-50%",
              width: "40px",
            }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          />
        </div>

        {/* 5-Column Grid ensures perfect spacing on all screen sizes */}
        <div className="max-w-md mx-auto relative h-[68px] grid grid-cols-5 items-center px-2">
          
          {/* Left Items */}
          <NavItem item={navItems[0]} isActive={active === navItems[0].key} onClick={() => router.push(navItems[0].path)} />
          <NavItem item={navItems[1]} isActive={active === navItems[1].key} onClick={() => router.push(navItems[1].path)} />

          {/* Center FAB Spacer & Button */}
          <div className="relative flex justify-center items-center h-full">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9, rotate: 45 }}
              onClick={() => router.push("/attendance/add")}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="fab-premium absolute -top-5 w-14 h-14 rounded-2xl flex items-center justify-center z-10"
            >
              <Add style={{ color: "#fff", fontSize: 28 }} />
            </motion.button>
          </div>

          {/* Right Items */}
          <NavItem item={navItems[2]} isActive={active === navItems[2].key} onClick={() => router.push(navItems[2].path)} />
          <NavItem item={navItems[3]} isActive={active === navItems[3].key} onClick={() => router.push(navItems[3].path)} />
          
        </div>
      </div>
    </>
  );
}

/* ─────────────────── NAV ITEM ─────────────────── */

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
      className="relative flex flex-col items-center justify-center w-full h-full select-none outline-none group"
    >
      {/* Background Pill */}
      <div className="absolute inset-2 rounded-xl flex items-center justify-center overflow-hidden">
        <AnimatePresence>
          {isActive && (
            <motion.div
              layoutId="active-nav-bg"
              className="absolute inset-0"
              style={{ backgroundColor: `${item.accent}15` }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Icon & Label Container */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-1"
        animate={{ y: isActive ? -2 : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        <motion.div
          animate={{ scale: isActive ? 1.1 : 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <Icon
            className={`transition-colors duration-300 ${isActive ? "" : "text-slate-500 dark:text-[#8b8b99]"}`}
            style={{
              fontSize: 24,
              color: isActive ? item.accent : undefined,
            }}
          />
        </motion.div>

        <span
          className={`text-[10px] font-medium tracking-wide transition-all duration-300 ${isActive ? "" : "text-slate-500 dark:text-[#8b8b99]"}`}
          style={{
            color: isActive ? item.accent : undefined,
            opacity: isActive ? 1 : 0.8,
          }}
        >
          {item.label}
        </span>
      </motion.div>
    </button>
  );
}