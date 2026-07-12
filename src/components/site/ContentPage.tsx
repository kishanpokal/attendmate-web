import { ReactNode } from "react";
import PublicShell from "@/components/site/PublicShell";
import Container from "@/components/ui/Container";

/** Wrapper for text-heavy pages (legal, about, contact). */
export default function ContentPage({
  title,
  intro,
  updated,
  children,
}: {
  title: string;
  intro?: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <PublicShell>
      <Container size="narrow" className="py-14 lg:py-20">
        <header className="pb-8 mb-8 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{title}</h1>
          {intro && (
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              {intro}
            </p>
          )}
          {updated && (
            <p className="mt-4 text-sm text-gray-400">Last updated: {updated}</p>
          )}
        </header>
        <article className="prose-content">{children}</article>
      </Container>
    </PublicShell>
  );
}
