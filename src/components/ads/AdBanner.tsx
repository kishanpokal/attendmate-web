"use client";

import { useEffect, useRef } from "react";
import { siteConfig } from "@/lib/siteConfig";

interface AdBannerProps {
  /** AdSense ad unit slot ID (create in your AdSense dashboard). */
  slot: string;
  format?: string;
  className?: string;
}

/**
 * A single in-content ad unit. Only use inside real content (articles, tools) —
 * never on app screens or above-the-fold with no surrounding content.
 */
export default function AdBanner({ slot, format = "auto", className = "" }: AdBannerProps) {
  const ref = useRef<HTMLModElement>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const push = () => {
      const el = ref.current;
      if (el && el.offsetWidth > 0) {
        try {
          // @ts-expect-error adsbygoogle is injected by the AdSense script
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch {
          /* ignore — script may still be loading */
        }
      } else {
        // Width can be 0 before layout settles; retry shortly.
        timer = setTimeout(push, 200);
      }
    };

    timer = setTimeout(push, 120);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`my-8 ${className}`}>
      <p className="text-[11px] uppercase tracking-wider text-gray-400 text-center mb-1.5">
        Advertisement
      </p>
      <div className="min-h-[100px] flex items-center justify-center overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
        <ins
          ref={ref}
          className="adsbygoogle"
          style={{ display: "block", width: "100%", minHeight: "100px" }}
          data-ad-client={siteConfig.adsensePublisherId}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}
