'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { useMouseParallax } from '@/hooks/useScrollAnimation';

export default function FinalCTA() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.1 });
  const [isHovered, setIsHovered] = useState(false);
  const { x, y } = useMouseParallax(15);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const titleWordsLine1 = "Ready to take control".split(" ");
  const titleWordsLine2 = "of your semester?".split(" ");

  return (
    <section 
      ref={containerRef}
      className="relative w-full overflow-hidden text-center py-40 border-t border-[rgba(255,255,255,0.04)]"
      style={{
        background: 'radial-gradient(ellipse 80% 60% at center, rgba(91,95,238,0.12) 0%, transparent 70%)',
        backgroundPosition: '50% 50%',
      }}
    >
      {/* Background Orbs */}
      <div 
        className="absolute top-0 left-[-10%] z-0 rounded-full opacity-30 mix-blend-screen pointer-events-none transition-transform duration-[20s] ease-in-out infinite"
        style={{
          width: isMobile ? 300 : 600,
          height: isMobile ? 300 : 600,
          background: 'rgba(91,95,238,0.3)',
          filter: `blur(${isMobile ? 60 : 100}px)`,
          animation: 'drift 25s ease-in-out infinite alternate',
        }}
      />
      <div 
        className="absolute bottom-[-20%] right-[-10%] z-0 rounded-full opacity-30 mix-blend-screen pointer-events-none"
        style={{
          width: isMobile ? 250 : 400,
          height: isMobile ? 250 : 400,
          background: 'rgba(0,212,255,0.3)',
          filter: `blur(${isMobile ? 50 : 80}px)`,
          animation: 'drift-reverse 30s ease-in-out infinite alternate',
        }}
      />

      <div className="relative z-10 max-w-[800px] mx-auto px-6 h-full flex flex-col items-center justify-center">
        
        {/* Animated Headline */}
        <h2 className="font-heading font-extrabold text-[clamp(40px,7vw,72px)] leading-[1.05] tracking-tight text-white mb-10 flex flex-wrap justify-center gap-x-[12px]">
          {/* Line 1 */}
          <div className="flex flex-wrap justify-center gap-[12px] w-full mb-1">
            {titleWordsLine1.map((word, i) => (
              <motion.span
                key={i}
                initial={{ y: 40, opacity: 0, rotateX: 20 }}
                animate={isInView ? { y: 0, opacity: 1, rotateX: 0 } : {}}
                transition={{ delay: i * 0.08, duration: 0.6, type: "spring", stiffness: 100 }}
                className="inline-block"
              >
                {word}
              </motion.span>
            ))}
          </div>
          
          {/* Line 2 */}
          <div className="flex flex-wrap justify-center gap-[12px] w-full">
            {titleWordsLine2.map((word, i) => {
              if (word.includes("semester?")) {
                return (
                  <motion.span
                    key={i}
                    initial={{ y: 40, opacity: 0, rotateX: 20 }}
                    animate={isInView ? { y: 0, opacity: 1, rotateX: 0 } : {}}
                    transition={{ delay: (titleWordsLine1.length + i) * 0.08, duration: 0.6, type: "spring", stiffness: 100 }}
                    className="inline-block text-transparent bg-clip-text bg-[length:200%_200%] animate-[shimmer_4s_linear_infinite]"
                    style={{ backgroundImage: 'linear-gradient(135deg, #5B5FEE 0%, #00D4FF 50%, #00F0A0 100%)' }}
                  >
                    {word}
                  </motion.span>
                );
              }
              return (
                <motion.span
                  key={i}
                  initial={{ y: 40, opacity: 0, rotateX: 20 }}
                  animate={isInView ? { y: 0, opacity: 1, rotateX: 0 } : {}}
                  transition={{ delay: (titleWordsLine1.length + i) * 0.08, duration: 0.6, type: "spring", stiffness: 100 }}
                  className="inline-block"
                >
                  {word}
                </motion.span>
              );
            })}
          </div>
        </h2>

        {/* CTA Button and Floaties */}
        <div className="relative mt-8">
          {/* Floaty 1 */}
          {!isMobile && (
            <motion.div 
              className="absolute -top-10 -left-32 px-4 py-2 rounded-xl bg-[rgba(255,255,255,0.06)] backdrop-blur-md border border-[rgba(255,255,255,0.15)] text-[12px] font-mono font-semibold whitespace-nowrap shadow-lg z-20"
              style={{ rotate: -8, x, y: y }}
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              78% overall
            </motion.div>
          )}

          {/* Floaty 2 */}
          {!isMobile && (
            <motion.div 
              className="absolute -top-6 -right-36 px-4 py-2 rounded-xl bg-[rgba(255,255,255,0.06)] backdrop-blur-md border border-[rgba(255,255,255,0.15)] text-[12px] font-mono font-semibold whitespace-nowrap shadow-lg text-[var(--primary)] z-20"
              style={{ rotate: 5, x, y: y }}
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            >
              🤖 AI copilot
            </motion.div>
          )}

          {/* Floaty 3 */}
          {!isMobile && (
            <motion.div 
              className="absolute -bottom-8 left-[10%] px-4 py-2 rounded-xl bg-[rgba(255,255,255,0.06)] backdrop-blur-md border border-[rgba(255,255,255,0.15)] text-[12px] font-mono font-semibold whitespace-nowrap shadow-lg text-[var(--cyan)] z-20"
              style={{ rotate: -3, x, y: y }}
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
            >
              3 classes today
            </motion.div>
          )}

          {/* Primary CTA Button */}
          <motion.a
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.8, type: "spring", stiffness: 200, damping: 20 }}
            href="/login"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative flex items-center justify-center px-12 py-5 rounded-[20px] bg-gradient-to-r from-[var(--primary)] to-[var(--cyan)] text-white font-heading font-extrabold text-[20px] transition-shadow duration-300 z-10"
            style={{
              boxShadow: isHovered ? '0 0 60px rgba(91,95,238,0.7)' : '0 10px 30px rgba(0,0,0,0.5)',
            }}
          >
            Start Tracking Free →
            
            {/* Ripple effect */}
            {isHovered && (
              <motion.div
                initial={{ scale: 0.3, opacity: 0.4 }}
                animate={{ scale: 3, opacity: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute inset-0 rounded-full bg-[var(--primary)] pointer-events-none mix-blend-screen"
              />
            )}
          </motion.a>
        </div>
      </div>
      
      <style>{`
        @keyframes drift {
          0% { transform: translateY(0) translateX(0) scale(1); }
          50% { transform: translateY(-40px) translateX(60px) scale(1.1); }
          100% { transform: translateY(-10px) translateX(-30px) scale(0.95); }
        }
        @keyframes drift-reverse {
          0% { transform: translateY(0) translateX(0) scale(1); }
          50% { transform: translateY(30px) translateX(-50px) scale(1.05); }
          100% { transform: translateY(20px) translateX(20px) scale(0.9); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
    </section>
  );
}
