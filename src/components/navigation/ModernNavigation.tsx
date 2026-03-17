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
  PeopleRounded,
  MenuBookRounded,
  KeyboardArrowUpRounded,
} from "@mui/icons-material";
import { Sparkles } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/context/AuthContext";

/* ─────────────────────────────────────────────
   Types & Constants
───────────────────────────────────────────── */
type NavKey = "home" | "attendance" | "analytics" | "settings";

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
  { key: "settings", label: "Settings", icon: SettingsRounded, path: "/settings" },
];

type SecondaryNavKey = "subjects" | "friends";

interface SecondaryNavItem {
  key: SecondaryNavKey;
  label: string;
  icon: React.ElementType;
  path: string;
}

const SECONDARY_NAV_ITEMS: SecondaryNavItem[] = [
  { key: "subjects", label: "Subjects", icon: MenuBookRounded, path: "/subjects" },
  { key: "friends", label: "Friends", icon: PeopleRounded, path: "/friends" },
];

/* Default avatar SVG */
const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E" +
  "%3Ccircle cx='20' cy='20' r='20' fill='%23e4e4e7'/%3E" +
  "%3Ccircle cx='20' cy='15' r='7' fill='%23a1a1aa'/%3E" +
  "%3Cellipse cx='20' cy='34' rx='12' ry='9' fill='%23a1a1aa'/%3E" +
  "%3C/svg%3E";

/* ─────────────────────────────────────────────
   Navigation Component
───────────────────────────────────────────── */
export default function ModernNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  /* Auto-collapse on tablet */
  useEffect(() => {
    setMounted(true);
    const onResize = () => {
      setCollapsed(window.innerWidth < 1200);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (!mounted) return null;

  /* Active route detection */
  const active =
    NAV_ITEMS.find((n) => pathname === n.path || pathname?.startsWith(n.path + "/"))?.key ?? "home";

  const sidebarWidth = collapsed ? 80 : 280;

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
        {/* ── Brand Header ── */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-gray-100 dark:border-zinc-900/50">
          <div className="flex items-center justify-center shrink-0 rounded-xl bg-primary text-white font-bold text-xl w-10 h-10 shadow-md shadow-primary/20">
            A
          </div>

          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden flex flex-col"
              >
                <p className="text-lg font-bold text-gray-900 dark:text-white leading-none tracking-tight">
                  AttendMate
                </p>
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary mt-1">
                  Pro Edition
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Main Nav Scrollable Area ── */}
        <nav className="flex-1 flex flex-col gap-1.5 px-3 pt-6 overflow-y-auto custom-scrollbar pb-4">

          <div className="px-3 mb-2">
            {!collapsed && <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Menu</p>}
          </div>

          {NAV_ITEMS.map((item) => {
            const isActive = active === item.key;
            const Icon = item.icon;
            return (
              <motion.button
                key={item.key}
                onClick={() => router.push(item.path)}
                whileTap={{ scale: 0.98 }}
                className={`relative flex items-center gap-3 rounded-xl transition-all group ${collapsed ? "justify-center py-3" : "justify-start px-3 py-2.5"
                  } ${isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-900 hover:text-gray-900 dark:hover:text-white font-medium"
                  }`}
              >
                {/* Active Pill Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="desktop-active-pill"
                    className="absolute left-0 inset-y-1.5 w-1 rounded-r-full bg-primary"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                <span className="shrink-0 flex items-center justify-center">
                  <Icon sx={{ fontSize: 22 }} />
                </span>

                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-sm whitespace-nowrap overflow-hidden flex-1 text-left"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Badge */}
                {item.badge && !collapsed && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-white shadow-sm">
                    {item.badge}
                  </span>
                )}

                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <span className="absolute left-full ml-4 px-3 py-1.5 rounded-md text-xs font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                    {item.label}
                  </span>
                )}
              </motion.button>
            );
          })}

          <div className="my-4 border-t border-gray-100 dark:border-zinc-800/50 mx-2" />

          {/* Secondary Links */}
          <div className="px-3 mb-2">
            {!collapsed && <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Social</p>}
          </div>

          {SECONDARY_NAV_ITEMS.map((item) => {
            const isSecActive = pathname === item.path || pathname?.startsWith(item.path + "/");
            const Icon = item.icon;
            return (
              <motion.button
                key={item.key}
                onClick={() => router.push(item.path)}
                whileTap={{ scale: 0.98 }}
                className={`relative flex items-center gap-3 rounded-xl transition-all group ${collapsed ? "justify-center py-3" : "justify-start px-3 py-2.5"
                  } ${isSecActive
                    ? "bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white font-semibold"
                    : "text-gray-500 dark:text-zinc-500 hover:bg-gray-50 dark:hover:bg-zinc-900 hover:text-gray-900 dark:hover:text-white font-medium"
                  }`}
              >
                <span className="shrink-0 flex items-center justify-center">
                  <Icon sx={{ fontSize: 20 }} />
                </span>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-sm whitespace-nowrap overflow-hidden flex-1 text-left"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {collapsed && (
                  <span className="absolute left-full ml-4 px-3 py-1.5 rounded-md text-xs font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                    {item.label}
                  </span>
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* ── Desktop Footer Actions ── */}
        <div className="px-4 pb-6 pt-4 flex flex-col gap-3 border-t border-gray-100 dark:border-zinc-900/50">

          {/* Add Entry & Copilot Action */}
          <div className={`flex ${collapsed ? "flex-col items-center" : "flex-row"} gap-2`}>
            {/* Primary Action Button */}
            <button
              onClick={() => router.push("/attendance/add")}
              className={`flex items-center justify-center gap-2 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black rounded-xl font-medium transition-colors shadow-sm ${collapsed ? "w-10 h-10 p-0" : "flex-1 py-2.5 px-3"}`}
              title="Add Entry"
            >
              <AddRounded sx={{ fontSize: 20 }} />
              {!collapsed && <span className="text-sm">Add Entry</span>}
            </button>

            {/* AI Assistant Button */}
            <button
              onClick={() => router.push("/ai")}
              className={`flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-medium transition-colors ${collapsed ? "w-10 h-10 p-0" : "flex-1 py-2.5 px-3"}`}
              title="Copilot AI"
            >
              <Sparkles className="w-4 h-4" />
              {!collapsed && <span className="text-sm">Ask AI</span>}
            </button>
          </div>

          <div className={collapsed ? "flex justify-center my-2" : "my-2"}>
            <ThemeToggle />
          </div>

          {/* User Profile Trigger */}
          <div className="relative mt-2">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className={`w-full flex items-center gap-3 rounded-xl transition-all border border-transparent hover:bg-gray-50 dark:hover:bg-zinc-900 ${collapsed ? "justify-center p-1.5" : "p-2"
                } ${userMenuOpen ? "bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-800" : ""}`}
            >
              <img
                src={user?.photoURL ?? DEFAULT_AVATAR}
                alt="User"
                className="rounded-lg shrink-0 object-cover shadow-sm border border-gray-200 dark:border-zinc-800"
                style={{ width: 36, height: 36 }}
              />

              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 min-w-0 text-left overflow-hidden"
                  >
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {user?.displayName ?? "Member"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                      {user?.email ?? "Free Plan"}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {!collapsed && (
                <KeyboardArrowUpRounded
                  sx={{
                    fontSize: 20,
                    color: "gray",
                    transform: userMenuOpen ? "rotate(0deg)" : "rotate(180deg)",
                    transition: "transform 0.2s"
                  }}
                />
              )}
            </button>

            {/* User Dropdown Menu */}
            <AnimatePresence>
              {userMenuOpen && !collapsed && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-[110%] left-0 right-0 mb-2 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-xl overflow-hidden z-50 p-1"
                >
                  {["Profile", "Billing"].map((item) => (
                    <button
                      key={item}
                      className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      {item}
                    </button>
                  ))}
                  <div className="h-px bg-gray-100 dark:bg-zinc-800 my-1 mx-2" />
                  <button className="w-full text-left px-4 py-2 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors">
                    Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-8 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-sm text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full p-1 z-50 transition-colors"
          >
            {collapsed ? <ChevronRightRounded sx={{ fontSize: 16 }} /> : <ChevronLeftRounded sx={{ fontSize: 16 }} />}
          </button>
        </div>
      </motion.aside>

      {/* Desktop spacer to push main content */}
      <motion.div
        animate={{ width: sidebarWidth }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="hidden md:block shrink-0"
      />

      {/* ══════════════════════════════════════
          MOBILE — iOS Style Floating Dock & AI Button
      ══════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden p-4 pb-safe pointer-events-none">

        {/* Floating AI Assistant Button (Positioned just above the dock) */}
        <button
          onClick={() => router.push("/ai")}
          className="absolute bottom-[88px] right-4 p-3.5 bg-white dark:bg-zinc-800 text-primary rounded-full shadow-lg border border-gray-100 dark:border-zinc-700 active:scale-90 transition-transform flex items-center justify-center pointer-events-auto shadow-primary/10"
        >
          <Sparkles className="w-6 h-6" />
        </button>

        {/* Main Bottom Nav Dock */}
        <nav className="pointer-events-auto mx-auto max-w-[400px] flex items-center justify-between px-6 py-3 rounded-[2rem] bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl border border-gray-200/50 dark:border-zinc-800/50 shadow-2xl shadow-black/5 dark:shadow-black/40">

          {/* Left Side: Home & Attendance */}
          <MobileNavButton
            item={NAV_ITEMS[0]}
            isActive={active === NAV_ITEMS[0].key}
            onClick={() => router.push(NAV_ITEMS[0].path)}
          />
          <MobileNavButton
            item={NAV_ITEMS[1]}
            isActive={active === NAV_ITEMS[1].key}
            onClick={() => router.push(NAV_ITEMS[1].path)}
          />

          {/* Center: Floating Action Button (Add) */}
          <button
            onClick={() => router.push("/attendance/add")}
            className="relative flex items-center justify-center w-14 h-14 -mt-8 bg-primary text-white rounded-full shadow-lg shadow-primary/30 active:scale-95 transition-transform border-[4px] border-white dark:border-zinc-950"
          >
            <AddRounded sx={{ fontSize: 28 }} />
          </button>

          {/* Right Side: Analytics & Settings */}
          <MobileNavButton
            item={NAV_ITEMS[2]}
            isActive={active === NAV_ITEMS[2].key}
            onClick={() => router.push(NAV_ITEMS[2].path)}
          />
          <MobileNavButton
            item={NAV_ITEMS[3]}
            isActive={active === NAV_ITEMS[3].key}
            onClick={() => router.push(NAV_ITEMS[3].path)}
          />

        </nav>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   Helper Component for Mobile Icons
───────────────────────────────────────────── */
function MobileNavButton({ item, isActive, onClick }: { item: NavItem, isActive: boolean, onClick: () => void }) {
  const Icon = item.icon;

  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center p-2 rounded-xl transition-colors active:scale-90 ${isActive ? "text-primary" : "text-gray-500 dark:text-zinc-400"
        }`}
    >
      <Icon sx={{ fontSize: 26, position: "relative", zIndex: 1 }} />

      {/* Active Dot Indicator */}
      {isActive && (
        <motion.div
          layoutId="mob-active-dot"
          className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-primary"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}

      {/* Notification Badge */}
      {item.badge && (
        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-zinc-900 bg-rose-500" />
      )}
    </button>
  );
}