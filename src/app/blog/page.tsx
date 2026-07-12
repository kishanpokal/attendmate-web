import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Clock } from "lucide-react";
import PublicShell from "@/components/site/PublicShell";
import Container from "@/components/ui/Container";
import { blogPosts } from "@/lib/blogData";

export const metadata: Metadata = {
  title: "Blog — Attendance Tips & College Advice",
  description:
    "Practical articles on managing college attendance, staying above 75%, study strategies, and balancing student life.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndexPage() {
  return (
    <PublicShell>
      <Container size="narrow" className="py-14 lg:py-20">
        <header>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            The AttendMate Blog
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            Practical strategies for managing your attendance, staying above the
            75% line, and getting through college with your sanity intact.
          </p>
        </header>

        <div className="mt-12 divide-y divide-gray-200 dark:divide-gray-800">
          {blogPosts.map((post) => (
            <article key={post.slug} className="py-7 first:pt-0">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <time>{post.date}</time>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {post.readTime}
                </span>
              </div>
              <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
                <Link href={`/blog/${post.slug}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  {post.title}
                </Link>
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400 leading-relaxed">
                {post.excerpt}
              </p>
              <Link
                href={`/blog/${post.slug}`}
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Read article <ChevronRight className="w-4 h-4" />
              </Link>
            </article>
          ))}
        </div>
      </Container>
    </PublicShell>
  );
}
