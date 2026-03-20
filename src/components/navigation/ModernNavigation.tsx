"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HomeRounded,
  ListAltRounded,
  BarChartRounded,
  SettingsRounded,
  AddRounded,
  ChevronLeftRounded,
  ChevronRightRounded,
} from "@mui/icons-material";
import { Sparkles } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/context/AuthContext";

/* ─────────────────────────────────────────────
    Types & Constants
───────────────────────────────────────────── */
type NavKey = "home" | "attendance" | "analytics" | "sync" | "settings";

interface NavItem {
  key: NavKey;
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { key: "home", label: "Dashboard", icon: HomeRounded, path: "/dashboard" },
  { key: "attendance", label: "Attendance", icon: ListAltRounded, path: "/attendance", badge: 3 },
  { key: "analytics", label: "Analytics", icon: BarChartRounded, path: "/analytics" },
  { key: "sync", label: "College Sync", icon: Sparkles, path: "/dashboard/sync" },
  { key: "settings", label: "Settings", icon: SettingsRounded, path: "/settings" },
];

export default function ModernNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onResize = () => setCollapsed(window.innerWidth < 1200);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (!mounted) return null;

  const active = NAV_ITEMS.find((n) => pathname === n.path || pathname?.startsWith(n.path + "/"))?.key ?? "home";
  const sidebarWidth = collapsed ? 80 : 260;

  return (
    <>
      {/* ══════════════════════════════════════
           DESKTOP SIDEBAR
      ══════════════════════════════════════ */}
      <motion.aside
        animate={{ width: sidebarWidth }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="hidden md:flex fixed inset-y-0 left-0 z-40 flex-col bg-white dark:bg-zinc-950 border-r border-gray-200 dark:border-zinc-800 shadow-sm"
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-5 py-8">
          <div className="flex items-center justify-center shrink-0 rounded-xl bg-primary text-white font-bold text-xl w-10 h-10 shadow-lg shadow-primary/20">
            A
          </div>
          {!collapsed && (
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-lg font-bold text-gray-900 dark:text-white tracking-tight"
            >
              AttendMate
            </motion.p>
          )}
        </div>

        {/* Primary Action Button (Add Entry) */}
        <div className="px-4 mb-4">
          <button
            onClick={() => router.push("/attendance/add")}
            className={`flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl font-medium transition-all hover:scale-[1.02] active:scale-95 ${collapsed ? "w-12 h-12 mx-auto" : "w-full py-3 px-4 shadow-md"}`}
          >
            <AddRounded />
            {!collapsed && <span>New Record</span>}
          </button>
        </div>

        {/* Main Nav */}
        <nav className="flex-1 px-3 space-y-1">
          {!collapsed && <p className="px-3 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Main Menu</p>}
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.key;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => router.push(item.path)}
                className={`relative w-full flex items-center gap-3 rounded-xl transition-all group ${collapsed ? "justify-center py-3" : "px-3 py-2.5"} 
                ${isActive ? "bg-primary/10 text-primary" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-900 hover:text-gray-900 dark:hover:text-zinc-200"}`}
              >
                <Icon sx={{ fontSize: 24 }} />
                {!collapsed && <span className="text-sm font-semibold">{item.label}</span>}

                {/* Active Indicator */}
                {isActive && (
                  <motion.div layoutId="active-pill" className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />
                )}

                {/* Badge */}
                {item.badge && !collapsed && (
                  <span className="ml-auto bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 mt-auto space-y-3 border-t border-gray-100 dark:border-zinc-900">
          <button
            onClick={() => router.push("/ai")}
            className={`flex items-center gap-3 text-primary bg-primary/5 rounded-xl transition-all ${collapsed ? "justify-center p-3" : "px-3 py-2.5 w-full hover:bg-primary/10"}`}
          >
            <Sparkles size={20} />
            {!collapsed && <span className="text-sm font-semibold text-left">Ask AI Copilot</span>}
          </button>

          <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between px-2"}`}>
            <ThemeToggle />
            {!collapsed && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center border border-zinc-200 dark:border-zinc-700 overflow-hidden text-white font-bold text-sm shrink-0 shadow-inner">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <span>{(user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U").toUpperCase()}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-md rounded-full p-1 text-gray-400 hover:text-primary transition-colors"
        >
          {collapsed ? <ChevronRightRounded fontSize="small" /> : <ChevronLeftRounded fontSize="small" />}
        </button>
      </motion.aside>

      {/* ══════════════════════════════════════
           MOBILE BOTTOM BAR
      ══════════════════════════════════════ */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-lg border-t border-gray-200 dark:border-zinc-800 px-6 pb-6 pt-2">
        <nav className="flex items-center justify-between max-w-md mx-auto relative">

          <MobileButton icon={HomeRounded} active={active === "home"} onClick={() => router.push("/dashboard")} />
          <MobileButton icon={ListAltRounded} active={active === "attendance"} onClick={() => router.push("/attendance")} badge={3} />

          {/* Center Floating Action */}
          <div className="relative -top-6">
            <button
              onClick={() => router.push("/attendance/add")}
              className="bg-primary text-white p-4 rounded-2xl shadow-lg shadow-primary/40 active:scale-90 transition-transform"
            >
              <AddRounded sx={{ fontSize: 28 }} />
            </button>
          </div>

          <MobileButton icon={BarChartRounded} active={active === "analytics"} onClick={() => router.push("/analytics")} />
          <MobileButton icon={SettingsRounded} active={active === "settings"} onClick={() => router.push("/settings")} />
        </nav>
      </div>

      {/* Desktop Content Spacer */}
      <div
        className="hidden md:block shrink-0 transition-all duration-300"
        style={{ width: sidebarWidth }}
      />
    </>
  );
}

/* ─────────────────────────────────────────────
    Helper Components
───────────────────────────────────────────── */
function MobileButton({ icon: Icon, active, onClick, badge }: any) {
  return (
    <button onClick={onClick} className={`relative p-2 transition-all ${active ? "text-primary scale-110" : "text-gray-400"}`}>
      <Icon sx={{ fontSize: 28 }} />
      {active && (
        <motion.div layoutId="mob-dot" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
      )}
      {badge && (
        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white dark:border-zinc-950 rounded-full" />
      )}
    </button>
  );
}