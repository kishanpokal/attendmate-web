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
  {
    key: "home",
    label: "Home",
    icon: Home,
    path: "/dashboard",
    accent: "#6C63FF",
  },
  {
    key: "attendance",
    label: "Attend",
    icon: ListAlt,
    path: "/attendance",
    accent: "#06B6D4",
  },
  {
    key: "analytics",
    label: "Analytics",
    icon: BarChart,
    path: "/analytics",
    accent: "#10B981",
  },
  {
    key: "settings",
    label: "Settings",
    icon: Settings,
    path: "/settings",
    accent: "#F59E0B",
  },
];

export default function AttendMateBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [ripple, setRipple] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const active =
    navItems.find((n) => pathname?.startsWith(n.path))?.key ?? "home";
  const activeItem = navItems.find((n) => n.key === active);

  const handleNav = (key: string, path: string) => {
    setRipple(key);
    setTimeout(() => setRipple(null), 500);
    router.push(path);
  };

  if (!mounted) return null;

  return (
    <>
      {/* Glow orb that follows active route */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');

        .nav-root * {
          font-family: 'DM Sans', sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        .nav-glass {
          background: rgba(15, 15, 20, 0.82);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow:
            0 -1px 0 rgba(255,255,255,0.06) inset,
            0 0 0 1px rgba(0,0,0,0.3),
            0 24px 64px rgba(0,0,0,0.6),
            0 8px 24px rgba(0,0,0,0.4);
        }

        .nav-glass-light {
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid rgba(0, 0, 0, 0.06);
          box-shadow:
            0 -1px 0 rgba(255,255,255,0.9) inset,
            0 24px 64px rgba(0,0,0,0.12),
            0 8px 24px rgba(0,0,0,0.08);
        }

        .fab-glow {
          box-shadow:
            0 0 0 1px rgba(108,99,255,0.3),
            0 4px 20px rgba(108,99,255,0.6),
            0 8px 40px rgba(108,99,255,0.3),
            0 0 80px rgba(108,99,255,0.15);
        }

        .fab-glow:hover {
          box-shadow:
            0 0 0 1px rgba(108,99,255,0.5),
            0 4px 20px rgba(108,99,255,0.8),
            0 8px 48px rgba(108,99,255,0.4),
            0 0 100px rgba(108,99,255,0.2);
        }

        .pip {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .nav-item-bg {
          transition: background 0.25s ease, border-color 0.25s ease;
        }

        @keyframes ripple-out {
          0% { transform: scale(0.5); opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .ripple-ring {
          animation: ripple-out 0.5s ease-out forwards;
        }
      `}</style>

      <div className="nav-root fixed bottom-0 left-0 right-0 z-50 pb-5 px-4">
        <div className="relative mx-auto max-w-[420px]">

          {/* Active accent line at very top of bar */}
          <motion.div
            className="absolute -top-[1px] left-1/2 h-[2px] rounded-full z-10"
            style={{ backgroundColor: activeItem?.accent }}
            animate={{
              width: "40%",
              x: "-50%",
              opacity: 1,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />

          {/* Main glass bar */}
          <div className="nav-glass relative h-[68px] rounded-[24px] flex items-center justify-between px-3 backdrop-blur-2xl">

            {/* Left two items */}
            <div className="flex items-center gap-1">
              {navItems.slice(0, 2).map((item) => (
                <NavItem
                  key={item.key}
                  item={item}
                  isActive={active === item.key}
                  hasRipple={ripple === item.key}
                  onClick={() => handleNav(item.key, item.path)}
                />
              ))}
            </div>

            {/* Center spacer for FAB */}
            <div className="w-[72px] flex-shrink-0" />

            {/* Right two items */}
            <div className="flex items-center gap-1">
              {navItems.slice(2).map((item) => (
                <NavItem
                  key={item.key}
                  item={item}
                  isActive={active === item.key}
                  hasRipple={ripple === item.key}
                  onClick={() => handleNav(item.key, item.path)}
                />
              ))}
            </div>
          </div>

          {/* FAB */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-[22px]">
            {/* Pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: "rgba(108,99,255,0.25)" }}
              animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            />

            <motion.button
              whileHover={{ scale: 1.08, rotate: 45 }}
              whileTap={{ scale: 0.92, rotate: 90 }}
              onClick={() => router.push("/attendance/add")}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className="fab-glow relative h-[56px] w-[56px] rounded-[18px] flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, #7C6FFF 0%, #5B4FFF 50%, #4338CA 100%)",
              }}
            >
              {/* Shine */}
              <div
                className="absolute inset-0 rounded-[18px]"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.22) 0%, transparent 60%)",
                }}
              />
              <Add
                style={{ color: "#fff", fontSize: 26, position: "relative", zIndex: 1 }}
              />
            </motion.button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────── NAV ITEM ─────────────────── */

function NavItem({
  item,
  isActive,
  hasRipple,
  onClick,
}: {
  item: (typeof navItems)[number];
  isActive: boolean;
  hasRipple: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.88 }}
      className="relative flex flex-col items-center justify-center w-[68px] h-[52px] rounded-[16px] overflow-hidden select-none"
    >
      {/* Active background pill */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            key="active-bg"
            layoutId="active-nav-bg"
            className="absolute inset-0 rounded-[16px]"
            style={{
              backgroundColor: `${item.accent}18`,
              border: `1px solid ${item.accent}30`,
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
      </AnimatePresence>

      {/* Ripple effect */}
      {hasRipple && (
        <div
          className="ripple-ring absolute inset-0 rounded-[16px]"
          style={{ border: `2px solid ${item.accent}50` }}
        />
      )}

      {/* Icon */}
      <motion.div
        animate={{
          y: isActive ? -1 : 0,
          scale: isActive ? 1.1 : 1,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
      >
        <Icon
          style={{
            fontSize: 22,
            color: isActive ? item.accent : "rgba(180,180,190,0.7)",
            transition: "color 0.2s ease",
          }}
        />
      </motion.div>

      {/* Label */}
      <AnimatePresence>
        {isActive && (
          <motion.span
            key="label"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.18 }}
            className="mt-[2px] text-[10px] font-semibold tracking-wide leading-none"
            style={{ color: item.accent }}
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Dot indicator when inactive */}
      <AnimatePresence>
        {!isActive && (
          <motion.div
            key="dot"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0, scale: 0 }} // hidden until hovered via CSS
            exit={{ opacity: 0, scale: 0 }}
            className="mt-[3px] pip"
            style={{ backgroundColor: "transparent" }}
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
}