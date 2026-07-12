import Script from "next/script";
import { siteConfig } from "@/lib/siteConfig";

/**
 * Loads the Google AdSense library. Rendered only inside PublicShell, so the
 * script never loads on the app (dashboard/settings) or auth screens — which is
 * what keeps us compliant with AdSense's "ads on screens without publisher
 * content" policy.
 */
export default function AdSenseScript() {
  return (
    <Script
      id="google-adsense"
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${siteConfig.adsensePublisherId}`}
    />
  );
}
