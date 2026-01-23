"use client";

import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  ListAlt,
  BarChart,
  Settings,
  Add,
} from "@mui/icons-material";

type RouteKey = "home" | "attendance" | "analytics" | "settings";

const navItems: {
  key: RouteKey;
  label: string;
  icon: any;
  path: string;
}[] = [
  { key: "home", label: "Home", icon: Home, path: "/dashboard" },
  { key: "attendance", label: "Attendance", icon: ListAlt, path: "/attendance" },
  { key: "analytics", label: "Analytics", icon: BarChart, path: "/analytics" },
  { key: "settings", label: "Settings", icon: Settings, path: "/settings" },
];

export default function AttendMateBottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const active =
    navItems.find((n) => pathname.startsWith(n.path))?.key ?? "home";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-4">
      <div className="relative mx-auto max-w-md px-4">
        {/* Glass container */}
        <div
          className="
            relative h-[72px] rounded-[36px]
            backdrop-blur-xl
            bg-white/40 dark:bg-[#1C1C1E]/30
            border border-white/40
            shadow-lg
            flex items-center justify-between px-6
          "
        >
          {/* LEFT */}
          <NavIcon
            item={navItems[0]}
            active={active === "home"}
            onClick={() => router.push("/dashboard")}
          />
          <NavIcon
            item={navItems[1]}
            active={active === "attendance"}
            onClick={() => router.push("/attendance")}
          />

          {/* Spacer for FAB */}
          <div className="w-16" />

          {/* RIGHT */}
          <NavIcon
            item={navItems[2]}
            active={active === "analytics"}
            onClick={() => router.push("/analytics")}
          />
          <NavIcon
            item={navItems[3]}
            active={active === "settings"}
            onClick={() => router.push("/settings")}
          />
        </div>

        {/* FLOATING ACTION BUTTON */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => router.push("/attendance/add")}
          className="
            absolute left-1/2 -top-6 -translate-x-1/2
            h-16 w-16 rounded-full
            bg-indigo-600/80
            backdrop-blur-xl
            border-2 border-white/50
            shadow-xl
            flex items-center justify-center
          "
        >
          <Add className="text-white" />
        </motion.button>
      </div>
    </div>
  );
}

/* ---------------- NAV ICON ---------------- */

function NavIcon({
  item,
  active,
  onClick,
}: {
  item: any;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      animate={{ scale: active ? 1.05 : 0.95 }}
      className="flex flex-col items-center justify-center w-14 h-14"
    >
      <div
        className={`
          flex items-center justify-center h-10 w-10 rounded-xl
          ${
            active
              ? "bg-indigo-500/20 border border-indigo-500/30"
              : ""
          }
        `}
      >
        <Icon
          className={`${
            active
              ? "text-indigo-600"
              : "text-gray-500 dark:text-gray-400"
          }`}
        />
      </div>

      {active && (
        <span className="text-xs mt-1 text-indigo-600 font-medium">
          {item.label}
        </span>
      )}
    </motion.button>
  );
}
