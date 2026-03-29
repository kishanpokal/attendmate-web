import { useEffect, useState, useRef } from 'react';
import { useScroll, useTransform, useSpring, MotionValue, useMotionValue } from 'framer-motion';

/**
 * Returns a smooth parallax Y offset driven by the global scroll position.
 */
export function useParallax(speed: number): MotionValue<number> {
  const { scrollY } = useScroll();
  return useTransform(scrollY, [0, 1000], [0, speed * 100]);
}

/**
 * Basic IntersectionObserver wrapper to detect when an element enters the viewport.
 */
export function useReveal<T extends HTMLElement>(threshold = 0.15): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const currentRef = ref.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Optional: observer.unobserve(entry.target) if we only want it to trigger once
        }
      },
      { threshold }
    );

    observer.observe(currentRef);

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  return [ref, isVisible];
}

/**
 * Returns spring-dampened X and Y motion values driven by mouse movement relative to the screen.
 */
export function useMouseParallax(strength: number) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth the raw mouse values with a spring
  const springConfig = { stiffness: 50, damping: 20 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      // Calculate cursor position mapped from -1 to 1 based on screen center
      const xObj = (e.clientX / innerWidth - 0.5) * 2;
      const yObj = (e.clientY / innerHeight - 0.5) * 2;

      mouseX.set(xObj * strength);
      mouseY.set(yObj * strength);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY, strength]);

  return { x: smoothX, y: smoothY };
}
