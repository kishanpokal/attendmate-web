"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

interface AdBannerProps {
  dataAdSlot: string;
  dataAdFormat?: string;
  dataFullWidthResponsive?: string;
  className?: string;
}

export default function AdBanner({
  dataAdSlot,
  dataAdFormat = "auto",
  dataFullWidthResponsive = "true",
  className = "",
}: AdBannerProps) {
  const pathname = usePathname();
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (pathname === "/login" || pathname === "/register") return;
    
    let timer: NodeJS.Timeout;

    const pushAd = () => {
      try {
        if (adRef.current && adRef.current.offsetWidth > 0) {
          // @ts-ignore
          if (typeof window !== "undefined" && window.adsbygoogle) {
            // @ts-ignore
            window.adsbygoogle.push({});
          }
        } else {
          // If width is 0 (e.g. flex shrink or display none), wait for layout
          timer = setTimeout(pushAd, 200);
        }
      } catch (err) {
        console.error("AdSense Error", err);
      }
    };

    // Add a tiny initial delay to ensure CSS layout is fully painted
    timer = setTimeout(pushAd, 100);

    return () => clearTimeout(timer);
  }, [pathname]);

  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <div className={`w-full min-h-[90px] flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-2 ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block", width: "100%", minHeight: "90px" }}
        data-ad-client="ca-pub-4169484162979613"
        data-ad-slot={dataAdSlot}
        data-ad-format={dataAdFormat}
        data-full-width-responsive={dataFullWidthResponsive}
      />
    </div>
  );
}
