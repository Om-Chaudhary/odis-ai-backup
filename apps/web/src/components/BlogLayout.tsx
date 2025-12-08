"use client";

import { ArrowRight } from "lucide-react";
import { Card } from "@odis/ui/card";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";

interface Post {
  id: string;
  title: string;
  summary: string;
  label: string;
  author: string;
  published: string;
  url: string;
  image: string;
  tags?: string[];
  authorImage?: string;
}

interface BlogLayoutProps {
  heading?: string;
  description?: string;
  posts?: Post[];
}

const BlogLayout = ({
  heading = "Latest Insights",
  description = "Discover the latest insights and updates on veterinary practice management, technology, and industry trends.",
  posts = [],
}: BlogLayoutProps) => {
  return (
    <section className="relative overflow-hidden py-8 md:py-12">
      {/* Animated background elements matching landing page */}
      <div className="pointer-events-none absolute inset-0">
        {/* Animated gradient overlay */}
        <div
          className="animate-gradient-move absolute inset-0 opacity-30 blur-sm"
          style={{
            background:
              "radial-gradient(circle at 30% 40%, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.04) 40%, transparent 70%)",
          }}
        />

        {/* Secondary moving gradient */}
        <div
          className="animate-gradient-move-reverse absolute inset-0 opacity-25 blur-sm"
          style={{
            background:
              "radial-gradient(circle at 70% 60%, rgba(16, 185, 129, 0.06) 0%, rgba(16, 185, 129, 0.03) 50%, transparent 80%)",
          }}
        />

        {/* Floating accent orbs */}
        <div
          className="animate-float-slow absolute top-1/4 left-1/4 h-[300px] w-[300px] rounded-full opacity-20 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(16, 185, 129, 0.04) 0%, transparent 60%)",
          }}
        />
        <div
          className="animate-float-slow-reverse absolute right-1/3 bottom-1/3 h-[200px] w-[200px] rounded-full opacity-15 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(16, 185, 129, 0.03) 0%, transparent 60%)",
          }}
        />
      </div>

      {/* Subtle dot pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(circle, #31aba3 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <h2 className="font-display animate-fade-in-up mb-6 text-4xl leading-tight font-bold sm:text-5xl md:text-6xl">
            <span className="animate-gradient-subtle bg-gradient-to-r from-slate-600 via-teal-600 to-slate-600 bg-clip-text text-transparent">
              {heading}
            </span>
          </h2>

          <p
            className="animate-fade-in-up mx-auto max-w-3xl font-serif text-lg leading-relaxed text-slate-700 md:text-xl"
            style={{ animationDelay: "0.1s" }}
          >
            {description}
          </p>
        </div>

        {/* Posts List */}
        <div className="container mx-auto max-w-6xl">
          <div className="space-y-6 sm:space-y-8 md:space-y-10 lg:space-y-12">
            {posts.map((post, index) => (
              <Card
                key={post.id}
                className="group animate-fade-in-up border border-white/20 bg-white/10 shadow-lg shadow-black/10 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white/15 hover:shadow-xl hover:shadow-black/20"
                style={{
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                <div className="p-6 sm:p-8 lg:p-10">
                  <div className="grid gap-y-6 sm:grid-cols-10 sm:gap-x-5 sm:gap-y-0 md:items-center md:gap-x-8 lg:gap-x-12">
                    {/* Content Section - Left */}
                    <div className="sm:col-span-5">
                      <div className="mb-6 md:mb-8">
                        <div className="flex flex-wrap gap-2 md:gap-3">
                          {post.tags?.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center rounded-full border border-teal-200/60 bg-teal-100/60 px-3 py-1 text-xs font-medium text-teal-700 transition-colors duration-200 hover:bg-teal-200/80"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <h3 className="font-display text-xl leading-tight font-semibold text-slate-900 md:text-2xl lg:text-3xl">
                        <Link
                          href={post.url}
                          className="transition-colors duration-300 hover:text-teal-700 hover:underline"
                        >
                          {post.title}
                        </Link>
                      </h3>

                      <p className="mt-6 font-serif leading-relaxed text-slate-600 md:mt-7">
                        {post.summary}
                      </p>

                      <div className="mt-8 flex items-center space-x-4 font-sans text-sm text-slate-500 md:mt-10">
                        <span className="font-medium">{post.author}</span>
                        <span className="text-slate-300">•</span>
                        <span>
                          {format(new Date(post.published), "MMM d, yyyy")}
                        </span>
                      </div>

                      <div className="mt-8 flex items-center space-x-2 md:mt-10">
                        <Link
                          href={post.url}
                          className="inline-flex items-center font-sans font-semibold text-teal-600 transition-all duration-300 hover:scale-105 hover:text-teal-700 hover:underline md:text-base"
                        >
                          <span>Read more</span>
                          <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </div>
                    </div>

                    {/* Image Section - Right */}
                    <div className="order-first sm:order-last sm:col-span-5">
                      <Link href={post.url} className="group/image block">
                        <div className="aspect-16/9 overflow-hidden rounded-xl border border-white/20 shadow-md shadow-black/10 transition-shadow duration-300 group-hover/image:shadow-lg group-hover/image:shadow-black/20">
                          <Image
                            src={post.image}
                            alt={post.title}
                            width={400}
                            height={200}
                            className="fade-in h-full w-full object-cover transition-all duration-300 group-hover/image:scale-105"
                          />
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {posts.length === 0 && (
          <div className="animate-fade-in-up py-16 text-center">
            <div className="animate-float mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-teal-100/50">
              <span className="text-4xl">📝</span>
            </div>
            <h3 className="font-display mb-4 text-2xl font-semibold text-slate-600">
              No posts yet
            </h3>
            <p className="mx-auto max-w-md font-serif text-slate-500">
              We&apos;re working on bringing you the latest insights. Check back
              soon for new content!
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes gradient-move {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 0.8;
          }
          25% {
            transform: translate(20px, -30px) scale(1.1);
            opacity: 1;
          }
          50% {
            transform: translate(-10px, 20px) scale(0.9);
            opacity: 0.9;
          }
          75% {
            transform: translate(30px, 10px) scale(1.05);
            opacity: 0.95;
          }
          100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.8;
          }
        }

        @keyframes gradient-move-reverse {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 0.6;
          }
          25% {
            transform: translate(-25px, 15px) scale(0.95);
            opacity: 0.8;
          }
          50% {
            transform: translate(15px, -25px) scale(1.1);
            opacity: 0.7;
          }
          75% {
            transform: translate(-20px, -10px) scale(0.9);
            opacity: 0.85;
          }
          100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.6;
          }
        }

        @keyframes float-slow {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.4;
          }
          50% {
            transform: translate(30px, -20px) scale(1.2);
            opacity: 0.6;
          }
        }

        @keyframes float-slow-reverse {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translate(-25px, 15px) scale(1.1);
            opacity: 0.5;
          }
        }

        @keyframes gradient-subtle {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-gradient-move {
          animation: gradient-move 15s ease-in-out infinite;
        }

        .animate-gradient-move-reverse {
          animation: gradient-move-reverse 18s ease-in-out infinite;
        }

        .animate-float-slow {
          animation: float-slow 12s ease-in-out infinite;
        }

        .animate-float-slow-reverse {
          animation: float-slow-reverse 14s ease-in-out infinite;
        }

        .animate-gradient-subtle {
          animation: gradient-subtle 8s ease-in-out infinite;
          background-size: 200% 200%;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </section>
  );
};

export { BlogLayout };
