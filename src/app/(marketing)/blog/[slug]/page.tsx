import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { blogPosts, getBlogPost } from "@/lib/marketing/blog-posts";
import { BlogArticle } from "@/components/marketing/blog-article";
import { MarketingButton } from "@/components/marketing/primitives";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: "Post Not Found" };
  return {
    title: post.title,
    description: post.description,
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  return (
    <div className="flex-1">
      <div className="ln-container max-w-3xl py-16 md:py-24">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-[var(--ln-muted)] transition-colors hover:text-[var(--ln-ink)]"
        >
          <ArrowLeft className="size-4" />
          Blog
        </Link>

        <article className="mt-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--ln-muted)]">
            {post.category}
          </p>
          <h1 className="mt-4 font-display text-3xl font-medium leading-tight tracking-tight md:text-5xl">
            {post.title}
          </h1>
          <div className="mt-5 flex flex-wrap gap-4 font-mono text-xs text-[var(--ln-faint)]">
            <span>{post.author}</span>
            <span>{post.date}</span>
            <span>{post.readTime}</span>
          </div>

          <div className="mt-10 border-t border-[var(--ln-line)] pt-10">
            <BlogArticle content={post.content} />
          </div>
        </article>

        <div className="mt-16 rounded-[var(--ln-radius-lg)] bg-[var(--ln-panel)] px-8 py-10 text-center">
          <p className="font-display text-2xl font-medium text-white">
            Put these checks on autopilot.
          </p>
          <div className="mt-6 flex justify-center">
            <MarketingButton href="/register" variant="panel">
              Start free trial
            </MarketingButton>
          </div>
        </div>
      </div>
    </div>
  );
}
