"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import { SyncProgressEvent } from "@/lib/collegeSync";

interface LiveLogFeedProps {
  events: SyncProgressEvent[];
}

export default function LiveLogFeed({ events }: LiveLogFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const userScrolled = useRef(false);

  useEffect(() => {
    if (!userScrolled.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [events]);

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
      userScrolled.current = !isAtBottom;
    }
  };

  const getColor = (step: string) => {
    switch (step) {
      case "login":
      case "navigate":
        return "text-[#00D9FF]"; 
      case "select_params":
        return "text-[#FFB800]"; 
      case "scraping_subject":
        return "text-[#6C63FF]"; 
      case "complete":
        return "text-[#00F5A0]"; 
      case "error":
        return "text-[#FF4D6D]"; 
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="bg-[#0a0a0f] border border-[#2b2b36] rounded-xl p-3 shadow-inner relative overflow-hidden flex flex-col mt-4">
      <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-[#0a0a0f] to-transparent pointer-events-none z-10" />
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto max-h-[180px] pr-2 scrollbar-thin scrollbar-thumb-[#6C63FF] scrollbar-track-transparent space-y-2 relative"
      >
        <AnimatePresence initial={false}>
          {events.map((evt, i) => {
            if (!evt.message) return null;
            return (
              <motion.div
                key={`${evt.step}-${i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-mono text-[11px] leading-relaxed flex items-start gap-2"
              >
                <span className="text-gray-600 shrink-0 select-none">[{new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}]</span>
                <span className={`${getColor(evt.step)} break-words leading-tight flex-1`}>
                  {`> ${evt.message}`}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-4 bg-gradient-to-t from-[#0a0a0f] to-transparent pointer-events-none z-10" />
    </div>
  );
}
