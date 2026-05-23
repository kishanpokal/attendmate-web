import Link from "next/link";
import { blogPosts } from "@/lib/blogData";
import { ChevronRight, BookOpen, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Blog | AttendMate",
  description: "Read articles about student productivity, attendance tracking, and college life.",
};

export default function BlogIndexPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
            AttendMate Blog
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
            Strategies, tips, and insights to help you manage your college attendance, ace your exams, and maintain a healthy work-life balance.
          </p>
        </div>

        <div className="space-y-8">
          {blogPosts.map((post) => (
            <article 
              key={post.slug} 
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-4">
                <span className="flex items-center gap-1.5 font-medium bg-gray-100 dark:bg-gray-700/50 px-2.5 py-1 rounded-md">
                  <BookOpen className="w-4 h-4" />
                  {post.readTime}
                </span>
                <span>•</span>
                <time>{post.date}</time>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                <Link href={`/blog/${post.slug}`}>
                  {post.title}
                </Link>
              </h2>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6 line-clamp-2 leading-relaxed">
                {post.excerpt}
              </p>
              
              <Link 
                href={`/blog/${post.slug}`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
              >
                Read Article
                <ChevronRight className="w-4 h-4" />
              </Link>
            </article>
          ))}
        </div>
        
      </div>
    </main>
  );
}
