import { notFound } from "next/navigation";
import Link from "next/link";
import { blogPosts } from "@/lib/blogData";
import { ArrowLeft, Clock, Calendar } from "lucide-react";
import AdBanner from "@/components/ads/AdBanner";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = blogPosts.find((p) => p.slug === params.slug);
  if (!post) return { title: "Post Not Found" };
  return {
    title: `${post.title} | AttendMate Blog`,
    description: post.excerpt,
  };
}

// Simple markdown-ish parser for paragraphs and headers
function renderContent(content: string) {
  const blocks = content.trim().split("\n\n");
  
  return blocks.map((block, i) => {
    // Headers
    if (block.startsWith("## ")) {
      return (
        <h2 key={i} className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-10 mb-4">
          {block.replace("## ", "")}
        </h2>
      );
    }
    
    // Lists
    if (block.startsWith("- ")) {
      const items = block.split("\n").map(item => item.replace("- ", ""));
      return (
        <ul key={i} className="list-disc list-outside ml-6 space-y-2 mb-6 text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
          {items.map((item, idx) => {
            // handle bold text in list items (very naive approach)
            const parts = item.split("**");
            return (
              <li key={idx}>
                {parts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="font-semibold text-gray-900 dark:text-white">{part}</strong> : part)}
              </li>
            );
          })}
        </ul>
      );
    }

    // HR
    if (block.startsWith("---")) {
      return <hr key={i} className="my-10 border-gray-200 dark:border-gray-800" />;
    }

    // Bold Paragraph (e.g. Conclusion)
    if (block.startsWith("**") && block.endsWith("**")) {
      return (
        <p key={i} className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          {block.replace(/\*\*/g, "")}
        </p>
      );
    }

    // Regular paragraph
    return (
      <p key={i} className="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
        {block}
      </p>
    );
  });
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = blogPosts.find((p) => p.slug === params.slug);

  if (!post) {
    notFound();
  }

  // We want to insert an ad halfway through the content blocks
  const rawBlocks = post.content.trim().split("\n\n");
  const halfWayIndex = Math.floor(rawBlocks.length / 2);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-24">
      <article className="max-w-3xl mx-auto px-4 sm:px-6">
        
        <div className="mb-10">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Articles
          </Link>
        </div>

        <header className="mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight mb-6">
            {post.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <time>{post.date}</time>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{post.readTime}</span>
            </div>
          </div>
        </header>

        {/* Top Ad Slot (Below Title) */}
        <div className="my-10">
          <AdBanner dataAdSlot="blog-top" dataAdFormat="horizontal" />
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          {/* Render first half */}
          {renderContent(rawBlocks.slice(0, halfWayIndex).join("\n\n"))}

          {/* Middle Ad Slot */}
          <div className="my-12">
             <AdBanner dataAdSlot="blog-middle" dataAdFormat="fluid" />
          </div>

          {/* Render second half */}
          {renderContent(rawBlocks.slice(halfWayIndex).join("\n\n"))}
        </div>

        {/* Bottom Ad Slot */}
        <div className="mt-16 pt-10 border-t border-gray-200 dark:border-gray-800">
           <AdBanner dataAdSlot="blog-bottom" dataAdFormat="horizontal" />
        </div>

      </article>
    </main>
  );
}
