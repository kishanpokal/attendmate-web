"use client";

import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  HomeRounded,
  ListAltRounded,
  BarChartRounded,
  SettingsRounded,
  AddRounded,
  ChevronLeftRounded,
  ChevronRightRounded,
  PersonRounded,
} from "@mui/icons-material";
import { useState, useEffect } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import { Sparkles } from "lucide-react";

type RouteKey = "home" | "attendance" | "analytics" | "settings";

const navItems = [
  { key: "home", label: "Dashboard", icon: HomeRounded, path: "/dashboard", accent: "#6366f1" },
  { key: "attendance", label: "Attendance", icon: ListAltRounded, path: "/attendance", accent: "#0ea5e9" },
  { key: "analytics", label: "Analytics", icon: BarChartRounded, path: "/analytics", accent: "#10b981" },
  { key: "settings", label: "Settings", icon: SettingsRounded, path: "/settings", accent: "#f59e0b" },
];

export default function ModernNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const active = navItems.find((n) => pathname === n.path || pathname?.startsWith(n.path + "/"))?.key ?? "home";

  return (
    <>
      {/* MOBILE FLOATING DOCK */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 md:hidden w-[90%] max-w-md">
        <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 rounded-3xl p-2 shadow-2xl flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = active === item.key;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => router.push(item.path)}
                className="relative p-4 rounded-2xl group outline-none"
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-active-pill"
                    className="absolute inset-0 bg-gray-100 dark:bg-gray-800 rounded-2xl"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon
                  className={`relative z-10 transition-colors duration-300 ${
                    isActive ? "text-indigo-500" : "text-gray-400 dark:text-gray-500"
                  }`}
                  sx={{ fontSize: 24 }}
                />
              </button>
            );
          })}
          
          {/* AI Toggle Button (Mobile) */}
          <button
            onClick={() => router.push("/ai")}
            className="p-4 rounded-2xl text-indigo-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Sparkles style={{ fontSize: 24 }} />
          </button>
          
          {/* Mobile FAB */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => router.push("/attendance/add")}
            className="p-4 rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/30"
          >
            <AddRounded sx={{ fontSize: 24 }} />
          </motion.button>
        </nav>
      </div>

      {/* DESKTOP SIDEBAR */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarCollapsed ? 88 : 280 }}
        className="hidden md:flex fixed left-0 top-0 h-screen bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex-col py-8 px-4 z-40 transition-all duration-300"
      >
        {/* Brand/Logo */}
        <div className="flex items-center gap-3 px-2 mb-10 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
            <span className="text-white font-black text-xl">A</span>
          </div>
          {!isSidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xl font-black tracking-tight text-gray-900 dark:text-white"
            >
              AttendMate
            </motion.span>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = active === item.key;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group overflow-hidden ${
                  isActive 
                  ? "bg-indigo-500/10 text-indigo-500" 
                  : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900"
                }`}
              >
                <div className={`shrink-0 transition-transform ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
                  <Icon sx={{ fontSize: 24 }} />
                </div>
                {!isSidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="font-bold whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
                {isActive && !isSidebarCollapsed && (
                  <motion.div
                    layoutId="sidebar-active-dot"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50"
                  />
                )}
              </button>
            );
          })}

          <div className="pt-4 border-t border-gray-100 dark:border-gray-900 space-y-2">
             <button
                onClick={() => router.push("/ai")}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Sparkles className="w-6 h-6 shrink-0" />
                {!isSidebarCollapsed && <span className="font-black uppercase tracking-tight">AI Assistant</span>}
              </button>

             <button
                onClick={() => router.push("/attendance/add")}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-800 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              >
                <AddRounded sx={{ fontSize: 24 }} />
                {!isSidebarCollapsed && <span className="font-bold">Add Attendance</span>}
              </button>
          </div>
        </nav>

        {/* Footer Area */}
        <div className="mt-auto space-y-4">
          <ThemeToggle />
          
          <div className={`flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-900 overflow-hidden`}>
            <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center shrink-0">
               <PersonRounded className="text-gray-400" />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-sm font-black text-gray-900 dark:text-white truncate">{user?.displayName || "User"}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate">Verified Account</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full flex items-center justify-center p-3 rounded-xl bg-gray-100 dark:bg-gray-900 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            {isSidebarCollapsed ? <ChevronRightRounded /> : <ChevronLeftRounded />}
          </button>
        </div>
      </motion.aside>
      
      {/* Spacer for desktop sidebar */}
      <div className={`hidden md:block shrink-0 transition-all duration-300 ${isSidebarCollapsed ? "w-[88px]" : "w-[280px]"}`} />
    </>
  );
}
