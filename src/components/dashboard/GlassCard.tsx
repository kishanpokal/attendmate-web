"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  hoverLift?: boolean;
}

export default function GlassCard({
  children,
  className = "",
  glowColor,
  hoverLift = true,
}: GlassCardProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const activeGlowColor = glowColor || "var(--color-attendmate-primary)";
  const shadowGlowColor = glowColor || "rgba(91,95,238,0.15)";

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      whileHover={
        hoverLift
          ? {
              y: -4,
              boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 30px ${shadowGlowColor}`,
            }
          : undefined
      }
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative rounded-[20px] bg-white/5 border border-white/10 backdrop-blur-xl backdrop-saturate-[180%] shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06),0_0_0_1px_rgba(255,255,255,0.02)] overflow-hidden ${className}`}
    >
      {/* Top Edge Glow Line */}
      <div
        className="absolute top-0 left-[10%] right-[10%] h-[1px] opacity-60 pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${activeGlowColor}, transparent)`,
        }}
      />

      {/* Spotlight Effect */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(circle 300px at ${mousePosition.x}px ${mousePosition.y}px, rgba(91,95,238,0.06) 0%, transparent 100%)`,
        }}
      />

      <div className="relative z-10 w-full h-full">{children}</div>
    </motion.div>
  );
}
