import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Calendar } from "lucide-react";
import PublicShell from "@/components/site/PublicShell";
import Container from "@/components/ui/Container";
import AdBanner from "@/components/ads/AdBanner";
import { blogPosts } from "@/lib/blogData";
import { siteConfig } from "@/lib/siteConfig";

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return { title: "Post Not Found" };
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { title: post.title, description: post.excerpt, type: "article" },
  };
}

/** Minimal markdown-ish renderer for the blog content strings. */
function renderContent(content: string) {
  const blocks = content.trim().split("\n\n");

  return blocks.map((block, i) => {
    if (block.startsWith("## ")) {
      return <h2 key={i}>{block.replace("## ", "")}</h2>;
    }
    if (block.startsWith("- ")) {
      const items = block.split("\n").map((item) => item.replace("- ", ""));
      return (
        <ul key={i}>
          {items.map((item, idx) => {
            const parts = item.split("**");
            return (
              <li key={idx}>
                {parts.map((part, pIdx) =>
                  pIdx % 2 === 1 ? <strong key={pIdx}>{part}</strong> : part
                )}
              </li>
            );
          })}
        </ul>
      );
    }
    if (block.startsWith("---")) return <hr key={i} />;
    if (block.startsWith("**") && block.endsWith("**")) {
      return (
        <p key={i}>
          <strong>{block.replace(/\*\*/g, "")}</strong>
        </p>
      );
    }
    return <p key={i}>{block}</p>;
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) notFound();

  const rawBlocks = post.content.trim().split("\n\n");
  const mid = Math.floor(rawBlocks.length / 2);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: { "@type": "Person", name: siteConfig.author },
    publisher: { "@type": "Organization", name: siteConfig.name },
  };

  return (
    <PublicShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Container size="narrow" className="py-12 lg:py-16">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to articles
        </Link>

        <header className="mt-8 pb-8 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
            {post.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> {post.date}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> {post.readTime}
            </span>
          </div>
        </header>

        <article className="prose-content mt-8">
          {renderContent(rawBlocks.slice(0, mid).join("\n\n"))}

          {/* In-article ad — sits between real paragraphs of content */}
          <AdBanner slot={siteConfig.adSlots.blogInContent} className="not-prose" />

          {renderContent(rawBlocks.slice(mid).join("\n\n"))}
        </article>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <AdBanner slot={siteConfig.adSlots.blogBottom} />
        </div>
      </Container>
    </PublicShell>
  );
}
