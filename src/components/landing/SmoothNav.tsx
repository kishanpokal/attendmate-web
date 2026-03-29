'use client';

import React, { useState, useEffect } from 'react';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';

export default function SmoothNav() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() || 0;
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
    setScrolled(latest > 50);
  });

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['features', 'how'];
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(section);
            return;
          }
        }
      }
      setActiveSection('');
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      variants={{
        visible: { y: 0 },
        hidden: { y: '-100%' },
      }}
      animate={hidden ? 'hidden' : 'visible'}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
        scrolled
          ? 'bg-[rgba(3,5,15,0.8)] backdrop-blur-[24px] saturate-[180%] border-b border-[rgba(255,255,255,0.07)] py-[14px]'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-[1100px] mx-auto px-6 flex items-center justify-between">
        {/* LOGO */}
        <a href="#" className="flex items-center gap-1.5 font-heading font-extrabold text-[22px] tracking-tight text-white z-50">
          <motion.span
            animate={{
              scale: [1, 1.4, 1],
              color: ['#00F0A0', '#00D4FF', '#5B5FEE', '#00F0A0']
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            ●
          </motion.span>
          AttendMate
        </a>

        {/* DESKTOP LINKS */}
        <div className="hidden md:flex items-center gap-7">
          <NavLink href="#features" active={activeSection === 'features'}>Features</NavLink>
          <NavLink href="#how" active={activeSection === 'how'}>How it works</NavLink>
          
          <motion.a
            href="/login"
            layout
            className="group relative overflow-hidden bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.15)] text-white px-[18px] py-2 rounded-lg font-semibold text-sm transition-colors hover:text-[#080C1A]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] to-[var(--cyan)] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0" />
            <span className="relative z-10">Open App →</span>
          </motion.a>
        </div>

        {/* MOBILE HAMBURGER TOGGLE */}
        <button 
          className="md:hidden relative z-50 w-6 h-6 flex flex-col justify-center items-center gap-1.5"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <motion.span 
            animate={{ rotate: mobileMenuOpen ? 45 : 0, y: mobileMenuOpen ? 8 : 0 }} 
            className="w-full h-0.5 bg-white block rounded-full" 
          />
          <motion.span 
            animate={{ opacity: mobileMenuOpen ? 0 : 1 }} 
            className="w-full h-0.5 bg-white block rounded-full" 
          />
          <motion.span 
            animate={{ rotate: mobileMenuOpen ? -45 : 0, y: mobileMenuOpen ? -8 : 0 }} 
            className="w-full h-0.5 bg-white block rounded-full" 
          />
        </button>
      </div>

      {/* MOBILE MENU TRAY */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-[rgba(3,5,15,0.95)] backdrop-blur-3xl z-40 flex flex-col px-8 py-32"
          >
            <div className="flex flex-col gap-8 text-2xl font-heading font-bold">
              <MobileLink href="#features" onClick={() => setMobileMenuOpen(false)}>Features</MobileLink>
              <MobileLink href="#how" onClick={() => setMobileMenuOpen(false)}>How it works</MobileLink>
              <MobileLink href="/login" onClick={() => setMobileMenuOpen(false)}>Open App →</MobileLink>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <a href={href} className="relative group text-[15px] text-[rgba(236,240,255,0.6)] hover:text-white transition-all hover:-translate-y-[2px]">
      {children}
      <motion.div
        animate={{ scaleX: active ? 1 : 0 }}
        initial={{ scaleX: 0 }}
        className="absolute -bottom-1 left-0 right-0 h-[2px] bg-white origin-left"
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      />
    </a>
  );
}

function MobileLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <motion.a 
      href={href} 
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="text-white relative group w-max"
    >
      {children}
    </motion.a>
  );
}
