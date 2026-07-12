/**
 * Central site configuration.
 * NOTE: Update `email` to a real inbox you monitor — it appears on the
 * Privacy Policy and Contact pages and is used for AdSense verification.
 */
export const siteConfig = {
  name: "AttendMate",
  url: "https://attendmateweb.vercel.app",
  description:
    "A simple, accurate attendance tracker for college students. Track your percentage, know how many classes you can safely skip, and stay above 75%.",
  author: "Kishan Pokal",
  email: "attendmate.support@gmail.com", // TODO: replace with your real contact email
  adsensePublisherId: "ca-pub-4169484162979613",
  /**
   * Ad unit slot IDs. These are placeholders — after AdSense approves your
   * site, create display ad units in your dashboard and paste each numeric
   * slot ID here. Ads won't fill until these are real.
   */
  adSlots: {
    toolInContent: "0000000000",
    blogInContent: "0000000000",
    blogBottom: "0000000000",
  },
};
