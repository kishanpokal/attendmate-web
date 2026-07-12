import { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, ArrowRight } from "lucide-react";
import PublicShell from "@/components/site/PublicShell";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import AdBanner from "@/components/ads/AdBanner";
import { tools, getTool } from "@/lib/toolsData";
import { siteConfig } from "@/lib/siteConfig";

/**
 * Shared layout for tool pages.
 * `children` = the interactive calculator (client component).
 * `article`  = the explanatory prose content (important for real page value).
 */
export default function ToolLayout({
  slug,
  children,
  article,
}: {
  slug: string;
  children: ReactNode;
  article: ReactNode;
}) {
  const tool = getTool(slug);
  const related = tools.filter((t) => t.slug !== slug);

  return (
    <PublicShell>
      <Container size="narrow" className="py-10 lg:py-14">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:text-gray-900 dark:hover:text-white">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/tools" className="hover:text-gray-900 dark:hover:text-white">Tools</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-900 dark:text-white truncate">{tool?.short}</span>
        </nav>

        {/* Header */}
        <header className="mt-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            {tool?.title}
          </h1>
          <p className="mt-3 text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            {tool?.description}
          </p>
        </header>

        {/* Calculator */}
        <div className="mt-8">{children}</div>

        {/* In-content ad — sits between the tool and the explainer content */}
        <AdBanner slot={siteConfig.adSlots.toolInContent} />

        {/* Explanatory content */}
        <article className="prose-content mt-12">{article}</article>

        {/* Related tools */}
        <section className="mt-16 pt-10 border-t border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">More free tools</h2>
          <div className="mt-5 grid sm:grid-cols-2 gap-4">
            {related.map((t) => (
              <Link
                key={t.slug}
                href={`/tools/${t.slug}`}
                className="group flex items-start gap-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors"
              >
                <div className="grid place-items-center w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <t.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                    {t.short}
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{t.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Soft CTA to the app */}
        <section className="mt-12 rounded-2xl bg-gray-900 dark:bg-gray-900 border border-gray-800 px-6 py-8 text-center">
          <h2 className="text-xl font-semibold text-white">
            Tired of recalculating every week?
          </h2>
          <p className="mt-2 text-gray-300 max-w-md mx-auto">
            AttendMate tracks all of this automatically — every subject, updated
            the moment you mark a class.
          </p>
          <div className="mt-5 flex justify-center">
            <Button href="/register" variant="secondary" size="md">
              Start tracking free <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </section>
      </Container>
    </PublicShell>
  );
}
