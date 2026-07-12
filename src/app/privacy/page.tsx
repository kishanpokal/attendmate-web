import type { Metadata } from "next";
import Link from "next/link";
import ContentPage from "@/components/site/ContentPage";
import { siteConfig } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How AttendMate collects, uses, and protects your data, including our use of cookies and Google AdSense advertising.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <ContentPage
      title="Privacy Policy"
      intro="Your privacy matters. This policy explains what information AttendMate collects, how it is used, and the choices you have."
      updated="July 12, 2026"
    >
      <p>
        This Privacy Policy describes how {siteConfig.name} ("we", "us", or "our")
        handles information when you use our website and application (the
        "Service"), available at {siteConfig.url}. By using the Service, you agree
        to the practices described below.
      </p>

      <h2>Information we collect</h2>
      <p>We collect only what is needed to run the Service:</p>
      <ul>
        <li>
          <strong>Account information.</strong> When you create an account, we
          collect your email address and username through our authentication
          provider (Google Firebase). If you sign in with Google, we receive basic
          profile information such as your name and profile photo.
        </li>
        <li>
          <strong>Attendance data.</strong> The subjects, timetable, and
          attendance records you enter are stored so the Service can calculate
          your statistics. This data belongs to you.
        </li>
        <li>
          <strong>Usage data.</strong> Like most websites, we automatically
          collect anonymous technical information such as browser type, device
          type, and pages visited, to understand how the Service is used and to
          improve it.
        </li>
      </ul>

      <h2>How we use your information</h2>
      <ul>
        <li>To provide, maintain, and improve the Service.</li>
        <li>To calculate and display your attendance statistics.</li>
        <li>To secure your account and prevent misuse.</li>
        <li>To display advertising on our public pages (see below).</li>
      </ul>
      <p>
        We do not sell your personal information, and we do not share your
        attendance records with other users unless you explicitly choose to.
      </p>

      <h2>Cookies and advertising</h2>
      <p>
        We use cookies and similar technologies to keep you signed in and to
        support advertising on the public areas of our website.
      </p>
      <p>
        <strong>Google AdSense.</strong> We use Google AdSense to serve ads on our
        public content pages. Third-party vendors, including Google, use cookies
        to serve ads based on your prior visits to this and other websites.
      </p>
      <ul>
        <li>
          Google's use of advertising cookies enables it and its partners to
          serve ads to you based on your visit to our site and/or other sites on
          the internet.
        </li>
        <li>
          You may opt out of personalized advertising by visiting{" "}
          <a href="https://www.google.com/settings/ads" target="_blank" rel="noreferrer">
            Google Ads Settings
          </a>
          .
        </li>
        <li>
          You can also opt out of third-party vendors' use of cookies for
          personalized advertising by visiting{" "}
          <a href="https://www.aboutads.info/choices/" target="_blank" rel="noreferrer">
            aboutads.info
          </a>
          .
        </li>
      </ul>
      <p>
        For more information on how Google uses data when you use our partners'
        sites, see{" "}
        <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noreferrer">
          Google's Privacy &amp; Terms
        </a>
        .
      </p>

      <h2>Third-party services</h2>
      <p>The Service relies on trusted third-party providers:</p>
      <ul>
        <li>
          <strong>Google Firebase</strong> — authentication and database
          hosting.
        </li>
        <li>
          <strong>Google AdSense</strong> — advertising on public pages.
        </li>
        <li>
          <strong>Vercel</strong> — website hosting and privacy-friendly
          analytics.
        </li>
      </ul>
      <p>
        Each provider processes data under its own privacy policy. We encourage
        you to review Google's and Vercel's policies for details.
      </p>

      <h2>Data retention and security</h2>
      <p>
        We retain your account and attendance data for as long as your account is
        active. You can delete your data at any time from within the app. We use
        industry-standard security measures to protect your information, though no
        method of transmission over the internet is completely secure.
      </p>

      <h2>Your rights</h2>
      <p>
        You may access, correct, or delete your personal data at any time by
        signing in to your account or by contacting us. If you would like your
        account fully removed, contact us using the details below.
      </p>

      <h2>Children's privacy</h2>
      <p>
        The Service is intended for college students and is not directed at
        children under 13. We do not knowingly collect personal information from
        children under 13.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Any changes will be
        posted on this page with an updated revision date.
      </p>

      <h2>Contact us</h2>
      <p>
        If you have questions about this Privacy Policy, contact us at{" "}
        <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a> or through
        our <Link href="/contact">Contact page</Link>.
      </p>
    </ContentPage>
  );
}
