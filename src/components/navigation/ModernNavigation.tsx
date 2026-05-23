"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Home, ClipboardList, BarChart3, Settings, Plus, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/context/AuthContext";

type NavKey = "home" | "attendance" | "analytics" | "ai" | "sync" | "settings";

interface NavItem {
  key: NavKey;
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { key: "home", label: "Dashboard", icon: Home, path: "/dashboard" },
  { key: "attendance", label: "Attendance", icon: ClipboardList, path: "/attendance" },
  { key: "analytics", label: "Analytics", icon: BarChart3, path: "/analytics" },
  { key: "ai", label: "AI Copilot", icon: Sparkles, path: "/ai" },
  { key: "sync", label: "College Sync", icon: BarChart3, path: "/dashboard/sync" },
  { key: "settings", label: "Settings", icon: Settings, path: "/settings" },
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
  const sidebarWidth = collapsed ? 72 : 260;

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside
        style={{ width: sidebarWidth }}
        className="hidden md:flex fixed inset-y-0 left-0 z-40 flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-200"
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-6">
          <div className="flex items-center justify-center shrink-0 rounded-xl bg-indigo-600 text-white font-bold text-lg w-9 h-9">
            A
          </div>
          {!collapsed && (
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              AttendMate
            </span>
          )}
        </div>

        {/* New Record Button */}
        <div className="px-4 mb-4">
          <button
            onClick={() => router.push("/attendance/add")}
            className={`flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-xl font-medium transition-colors hover:bg-indigo-700 ${collapsed ? "w-10 h-10 mx-auto" : "w-full py-2.5 px-4"}`}
          >
            <Plus className="w-5 h-5" />
            {!collapsed && <span>New Record</span>}
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 space-y-1">
          {!collapsed && <p className="px-3 mb-2 text-xs font-medium text-gray-400">Menu</p>}
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.key;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => router.push(item.path)}
                className={`relative w-full flex items-center gap-3 rounded-lg transition-colors ${collapsed ? "justify-center py-2.5" : "px-3 py-2"} 
                ${isActive
                    ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"}`}
              >
                <Icon className="w-5 h-5" />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}

                {/* Active left border */}
                {isActive && (
                  <div className="absolute left-0 w-1 h-5 bg-indigo-600 rounded-r-full" />
                )}

                {/* Badge */}
                {item.badge && !collapsed && (
                  <span className="ml-auto bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 mt-auto space-y-3 border-t border-gray-200 dark:border-gray-700">
          <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between px-1"}`}>
            <ThemeToggle />
            {!collapsed && (
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span>{(user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U").toUpperCase()}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm rounded-full p-1 text-gray-400 hover:text-indigo-600 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>



      {/* MOBILE BOTTOM BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-4 pb-5 pt-2">
        <nav className="flex items-center justify-between max-w-md mx-auto">
          <MobileButton icon={Home} active={active === "home"} onClick={() => router.push("/dashboard")} />
          <MobileButton icon={ClipboardList} active={active === "attendance"} onClick={() => router.push("/attendance")} />

          {/* Center FAB */}
          <div className="relative -top-5">
            <button
              onClick={() => router.push("/attendance/add")}
              className="bg-indigo-600 text-white p-3.5 rounded-2xl shadow-lg hover:bg-indigo-700 active:scale-95 transition-all"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          <MobileButton icon={BarChart3} active={active === "analytics"} onClick={() => router.push("/analytics")} />
          <MobileButton icon={Settings} active={active === "settings"} onClick={() => router.push("/settings")} />
        </nav>
      </div>

      {/* Desktop Content Spacer */}
      <div
        className="hidden md:block shrink-0 transition-all duration-200"
        style={{ width: sidebarWidth }}
      />
    </>
  );
}

function MobileButton({ icon: Icon, active, onClick, badge }: any) {
  return (
    <button onClick={onClick} className={`relative p-2 transition-colors ${active ? "text-indigo-600" : "text-gray-400"}`}>
      <Icon className="w-6 h-6" />
      {active && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full" />
      )}
      {badge && (
        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
      )}
    </button>
  );
}