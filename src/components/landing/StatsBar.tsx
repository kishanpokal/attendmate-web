'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const STATS = [
  { value: 10, label: 'to mark attendance', postfix: 's', prefix: '< ' },
  { value: 100, label: 'cloud-synced, always', postfix: '%' },
  { value: 100, label: 'AI powered predictions', text: 'AI' }, // Special case for pure text
  { value: 0, label: 'papers needed' },
];

function useCountUp(target: number, duration: number, start: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start || target === 0) return;
    let startTime: number | null = null;
    
    // easeOutCubic
    const easeObj = (t: number) => 1 - Math.pow(1 - t, 3);
    
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const pct = Math.min(progress / (duration * 1000), 1);
      
      setCount(Math.floor(easeObj(pct) * target));
      
      if (progress < duration * 1000) {
        requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };
    
    requestAnimationFrame(step);
  }, [target, duration, start]);

  return count;
}

function StatItem({ stat, index }: { stat: typeof STATS[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const displayNum = useCountUp(stat.value, 2, isInView);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      className="group relative flex flex-col items-center justify-center py-10 px-8 sm:px-14 min-w-[200px] cursor-default overflow-hidden rounded-xl transition-colors duration-300 hover:bg-[rgba(255,255,255,0.02)]"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary-glow)] opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-xl pointer-events-none" />
      
      <div className="relative flex items-center gap-1 font-mono font-bold text-[40px] leading-none text-white transition-colors duration-300 group-hover:text-[var(--primary)] text-center">
        {stat.prefix && <span className="text-3xl text-[var(--muted)] -mt-1">{stat.prefix}</span>}
        {stat.text ? stat.text : displayNum}
        {stat.postfix && <span className="text-3xl font-medium">{stat.postfix}</span>}
        
        {/* Hover Arrow */}
        <motion.svg
          className="w-5 h-5 absolute -right-6 top-0 opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-300 text-[var(--green)]"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
        </motion.svg>
      </div>
      
      <span className="mt-2 text-[13px] text-[var(--muted)] group-hover:text-[rgba(236,240,255,0.7)] transition-colors duration-300">
        {stat.label}
      </span>
    </motion.div>
  );
}

export default function StatsBar() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section 
      ref={ref}
      className="relative z-10 w-full border-y border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.01)] backdrop-blur-sm flex flex-wrap justify-center overflow-hidden"
    >
      <div className="max-w-[1200px] mx-auto flex flex-wrap justify-center divide-x divide-transparent sm:divide-[rgba(255,255,255,0.04)] relative">
        {/* Animated Gradient Line Separator effect */}
        {STATS.map((stat, i) => (
          <React.Fragment key={stat.label}>
            {i > 0 && (
              <motion.div 
                initial={{ scaleY: 0 }}
                animate={isInView ? { scaleY: 1 } : { scaleY: 0 }}
                transition={{ duration: 0.8, delay: i * 0.15 }}
                className="hidden sm:block absolute top-[25%] bottom-[25%] w-[1px] bg-gradient-to-b from-[var(--primary)] via-[var(--cyan)] to-transparent opacity-30 origin-top"
                style={{ left: `${(i / STATS.length) * 100}%` }}
              />
            )}
            <StatItem stat={stat} index={i} />
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}
