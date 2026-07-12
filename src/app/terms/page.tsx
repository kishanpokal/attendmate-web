import type { Metadata } from "next";
import Link from "next/link";
import ContentPage from "@/components/site/ContentPage";
import { siteConfig } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms and conditions for using AttendMate.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <ContentPage
      title="Terms of Service"
      intro="Please read these terms carefully before using AttendMate."
      updated="July 12, 2026"
    >
      <p>
        These Terms of Service ("Terms") govern your use of {siteConfig.name} (the
        "Service"). By accessing or using the Service, you agree to be bound by
        these Terms. If you do not agree, please do not use the Service.
      </p>

      <h2>1. The Service</h2>
      <p>
        {siteConfig.name} is a free tool that helps college students track their
        attendance and calculate attendance-related statistics. We provide the
        Service on an "as is" and "as available" basis and may modify or
        discontinue features at any time.
      </p>

      <h2>2. Your account</h2>
      <p>
        You are responsible for maintaining the confidentiality of your account
        credentials and for all activity that occurs under your account. You agree
        to provide accurate information and to keep it up to date. You must be at
        least 13 years old to use the Service.
      </p>

      <h2>3. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service for any unlawful purpose.</li>
        <li>Attempt to gain unauthorized access to other users' data or our systems.</li>
        <li>Disrupt or interfere with the security or availability of the Service.</li>
        <li>Copy, resell, or exploit any part of the Service without permission.</li>
      </ul>

      <h2>4. Accuracy disclaimer</h2>
      <p>
        The attendance percentages, safe-skip counts, and conversions provided by
        the Service are calculated from the information you enter and are intended
        as helpful estimates. They are <strong>not</strong> an official record.
        Always confirm important attendance figures with your college or
        university before making decisions. We are not responsible for any
        academic consequences resulting from reliance on the Service.
      </p>

      <h2>5. Advertising</h2>
      <p>
        The public areas of our website may display third-party advertisements.
        We are not responsible for the content of these ads or the practices of
        advertisers. See our <Link href="/privacy">Privacy Policy</Link> for how
        advertising cookies are used.
      </p>

      <h2>6. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, {siteConfig.name} and its creator
        shall not be liable for any indirect, incidental, or consequential damages
        arising from your use of, or inability to use, the Service.
      </p>

      <h2>7. Changes to these Terms</h2>
      <p>
        We may update these Terms from time to time. Continued use of the Service
        after changes are posted constitutes acceptance of the updated Terms.
      </p>

      <h2>8. Contact</h2>
      <p>
        Questions about these Terms? Reach us at{" "}
        <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>.
      </p>
    </ContentPage>
  );
}
