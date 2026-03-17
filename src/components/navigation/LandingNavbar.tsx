"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight, Sparkles } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export default function LandingNavbar() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  if (!mounted) return null;

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Analytics", href: "#analytics" },
    { label: "AI Copilot", href: "#copilot" },
  ];

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    if (href.startsWith("#")) {
      const el = document.querySelector(href);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      router.push(href);
    }
  };

  return (
    <>
      {/* ── NAVBAR ── */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "py-3"
            : "py-5"
        }`}
      >
        <div className="content-container">
          <div
            className={`flex items-center justify-between px-6 sm:px-8 rounded-2xl transition-all duration-500 ${
              scrolled
                ? "py-3 navbar-glass shadow-2xl"
                : "py-2 bg-transparent"
            }`}
          >
            {/* ── Logo ── */}
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-black text-base shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform duration-300">
                A
              </div>
              <span className="text-xl font-black tracking-tight text-foreground hidden sm:inline">
                Attend<span className="text-primary">Mate</span>
              </span>
            </button>

            {/* ── Desktop Links ── */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => handleNavClick(link.href)}
                  className="relative px-5 py-2.5 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-foreground transition-colors rounded-xl hover:bg-white/5 group"
                >
                  {link.label}
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 group-hover:w-6 h-0.5 bg-primary rounded-full transition-all duration-300" />
                </button>
              ))}
            </div>

            {/* ── Desktop Actions ── */}
            <div className="hidden md:flex items-center gap-3">
              <ThemeToggle />

              <button
                onClick={() => router.push("/login")}
                className="px-5 py-2.5 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-foreground transition-colors rounded-xl"
              >
                Sign In
              </button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/register")}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-black shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all border border-white/10"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>

            {/* ── Mobile Toggle ── */}
            <div className="flex items-center gap-3 md:hidden">
              <ThemeToggle />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-foreground"
                aria-label="Toggle menu"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={mobileOpen ? "close" : "open"}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {mobileOpen ? (
                      <X className="w-5 h-5" />
                    ) : (
                      <Menu className="w-5 h-5" />
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* ── MOBILE OVERLAY ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xl"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative mx-4 mt-24 rounded-[2rem] premium-glass border border-white/10 shadow-3xl overflow-hidden"
            >
              <div className="p-6 space-y-2">
                {navLinks.map((link, i) => (
                  <motion.button
                    key={link.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    onClick={() => handleNavClick(link.href)}
                    className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left text-base font-bold text-foreground hover:bg-white/5 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary/40" />
                    {link.label}
                  </motion.button>
                ))}

                <div className="h-px bg-border-color my-3" />

                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                  onClick={() => {
                    setMobileOpen(false);
                    router.push("/login");
                  }}
                  className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left text-base font-bold text-gray-500 hover:text-foreground hover:bg-white/5 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                  Sign In
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  onClick={() => {
                    setMobileOpen(false);
                    router.push("/register");
                  }}
                  className="w-full flex items-center justify-center gap-2 py-4 mt-2 rounded-2xl bg-primary text-white font-black text-sm shadow-lg shadow-primary/30 border border-white/10"
                >
                  <Sparkles className="w-4 h-4" />
                  Get Started Free
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
