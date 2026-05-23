"use client";

import { useRouter, usePathname } from "next/navigation";
import { Home, ClipboardList, BarChart3, Settings, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import ThemeToggle from "@/components/ThemeToggle";

type RouteKey = "home" | "attendance" | "analytics" | "settings";

const navItems = [
  { key: "home" as RouteKey, label: "Home", icon: Home, path: "/dashboard" },
  { key: "attendance" as RouteKey, label: "Attend", icon: ClipboardList, path: "/attendance" },
  { key: "analytics" as RouteKey, label: "Analytics", icon: BarChart3, path: "/analytics" },
  { key: "settings" as RouteKey, label: "Settings", icon: Settings, path: "/settings" },
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
      {/* AD SLOT: mobile bottom banner */}
      <div className="fixed bottom-[72px] left-0 right-0 z-40 flex justify-center md:hidden">
        {/* AdSense ad unit will be placed here - 320x50 mobile banner */}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
        <div className="w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="w-full max-w-lg mx-auto h-[68px] grid grid-cols-6 px-2">

            <NavItem item={navItems[0]} isActive={active === navItems[0].key} onClick={() => router.push(navItems[0].path)} />
            <NavItem item={navItems[1]} isActive={active === navItems[1].key} onClick={() => router.push(navItems[1].path)} />

            {/* FAB */}
            <div className="relative flex justify-center items-center h-full">
              <button
                onClick={() => router.push("/attendance/add")}
                className="absolute bottom-4 w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg text-white hover:bg-indigo-700 active:scale-95 transition-all"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>

            <NavItem item={navItems[2]} isActive={active === navItems[2].key} onClick={() => router.push(navItems[2].path)} />
            <NavItem item={navItems[3]} isActive={active === navItems[3].key} onClick={() => router.push(navItems[3].path)} />

            <div className="flex items-center justify-center h-full">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

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
      className={`relative flex flex-col items-center justify-center w-full h-full select-none outline-none transition-colors ${
        isActive ? "text-indigo-600" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-medium mt-1">{item.label}</span>
      {isActive && <div className="absolute bottom-2 w-1 h-1 rounded-full bg-indigo-600" />}
    </button>
  );
}