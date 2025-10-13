import { Suspense } from "react";
import { client } from "~/sanity/lib/client";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { urlFor } from "~/sanity/lib/image";
import Link from "next/link";
import { format } from "date-fns";
import Image from "next/image";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import type { TypedObject } from "@portabletext/types";

// Define the Post type based on Sanity schema
interface Post {
  _id: string;
  title: string;
  slug: { current: string };
  author?: {
    name: string;
    image?: SanityImageSource;
  };
  mainImage?: SanityImageSource;
  categories?: Array<{
    title: string;
    slug: { current: string };
  }>;
  publishedAt: string;
  body: TypedObject[];
}

async function getPosts(): Promise<Post[]> {
  const query = `*[_type == "post"] | order(publishedAt desc) {
    _id,
    title,
    slug,
    author->{
      name,
      image
    },
    mainImage,
    categories[]->{
      title,
      slug
    },
    publishedAt,
    body
  }`;

  return await client.fetch(query);
}

function PostCardSkeleton() {
  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-sm">
      <Skeleton className="h-48 w-full" />
      <CardHeader className="space-y-4">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      </CardHeader>
    </Card>
  );
}

function PostCard({ post }: { post: Post }) {
  const imageUrl = post.mainImage
    ? urlFor(post.mainImage).width(400).height(200).url()
    : `https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=200&fit=crop&crop=center&auto=format&q=80`;
  const authorImageUrl = post.author?.image
    ? urlFor(post.author.image).width(40).height(40).url()
    : `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face&auto=format&q=80`;

  return (
    <Card className="group overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-teal-200/80 hover:shadow-2xl hover:shadow-teal-500/20">
      <div className="aspect-video overflow-hidden">
        <Image
          src={imageUrl}
          alt={post.title}
          width={400}
          height={200}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-teal-500/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>
      <CardHeader className="space-y-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10 ring-2 ring-teal-100 transition-all duration-300 group-hover:ring-teal-200">
            <AvatarImage
              src={authorImageUrl}
              alt={post.author?.name ?? "Author"}
            />
            <AvatarFallback className="bg-teal-100 font-semibold text-teal-700">
              {post.author?.name?.charAt(0) ?? "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <span className="text-sm font-medium text-slate-700">
              {post.author?.name ?? "Unknown Author"}
            </span>
            <time className="block text-xs text-slate-500">
              {format(new Date(post.publishedAt), "MMM d, yyyy")}
            </time>
          </div>
        </div>

        <CardTitle className="line-clamp-2 text-lg font-bold text-slate-900 transition-colors duration-300 group-hover:text-teal-700">
          <Link
            href={`/blog/${post.slug.current}`}
            className="transition-colors hover:text-teal-600"
          >
            {post.title}
          </Link>
        </CardTitle>

        <CardDescription className="line-clamp-3 leading-relaxed text-slate-600">
          {(post.body?.[0] as { children?: Array<{ text?: string }> })
            ?.children?.[0]?.text ?? "No description available"}
        </CardDescription>

        <div className="flex items-center justify-end pt-2">
          <div className="flex items-center text-teal-600 opacity-0 transition-all duration-300 group-hover:opacity-100">
            <span className="text-sm font-medium">Read more</span>
            <svg
              className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

async function BlogPosts() {
  const posts = await getPosts();

  if (posts.length === 0) {
    return (
      <div className="py-12 text-center">
        <h2 className="mb-4 text-2xl font-semibold text-gray-600">
          No posts yet
        </h2>
        <p className="text-gray-500">Check back soon for new content!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}
    </div>
  );
}

export default function BlogPage() {
  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative flex min-h-[60vh] items-center justify-center overflow-hidden pt-20">
        {/* Prominent animated radial gradient behind text */}
        <div
          className="animate-pulse-slow pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 800px 500px at 50% 50%, rgba(49, 171, 163, 0.15) 0%, rgba(49, 171, 163, 0.08) 40%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />

        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="relative space-y-8 text-center">
            {/* Floating badge with announcement */}
            <div className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-teal-200/60 bg-teal-100/30 px-4 py-2 shadow-sm backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-md sm:px-5 sm:py-2.5">
              <div className="h-2 w-2 flex-shrink-0 animate-pulse rounded-full bg-[#31aba3]" />
              <span className="font-serif text-xs leading-tight font-medium text-slate-600 sm:text-sm">
                📚 Latest insights and updates
              </span>
            </div>

            {/* Main headline with enhanced animations */}
            <h1 className="font-display animate-fade-in-up space-y-2 px-2 text-4xl leading-tight font-bold transition-all duration-1500 ease-out sm:px-0 sm:text-5xl md:text-6xl lg:text-7xl">
              <span
                className="animate-gradient-subtle block bg-gradient-to-r from-slate-600 via-teal-600 to-slate-600 bg-clip-text text-transparent"
                style={{ backgroundSize: "200% 200%" }}
              >
                Odis AI Blog
              </span>
            </h1>

            {/* Description with enhanced animation */}
            <p
              className="animate-fade-in-up mx-auto max-w-3xl px-4 font-serif text-base leading-relaxed text-slate-700 transition-all duration-1300 ease-out sm:px-0 sm:text-lg md:text-xl"
              style={{ transitionDelay: "0.2s" }}
            >
              Insights, tips, and updates on veterinary practice management,
              technology, and industry trends.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-8">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                href="/"
                className="text-slate-600 transition-colors hover:text-teal-600"
              >
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-slate-900">Blog</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Posts Grid */}
        <Suspense
          fallback={
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <PostCardSkeleton key={i} />
              ))}
            </div>
          }
        >
          <BlogPosts />
        </Suspense>
      </div>
    </div>
  );
}
