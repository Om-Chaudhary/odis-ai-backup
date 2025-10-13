import { notFound } from "next/navigation";
import { client } from "~/sanity/lib/client";
import { urlFor } from "~/sanity/lib/image";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { PortableText } from "@portabletext/react";
import { format } from "date-fns";
import Link from "next/link";
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
    bio?: TypedObject[];
  };
  mainImage?: SanityImageSource;
  categories?: Array<{
    title: string;
    slug: { current: string };
  }>;
  publishedAt: string;
  body: TypedObject[];
}

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getPost(slug: string): Promise<Post | null> {
  const query = `*[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    author->{
      name,
      image,
      bio
    },
    mainImage,
    categories[]->{
      title,
      slug
    },
    publishedAt,
    body
  }`;

  return await client.fetch(query, { slug });
}

// Portable Text components for rendering rich content
const portableTextComponents = {
  types: {
    image: ({
      value,
    }: {
      value: { alt?: string; asset?: SanityImageSource };
    }) => {
      const imageUrl = urlFor(value.asset!).width(800).height(400).url();
      return (
        <div className="my-12">
          <div className="overflow-hidden rounded-2xl shadow-2xl shadow-teal-500/10">
            <Image
              src={imageUrl}
              alt={value.alt ?? "Blog post image"}
              width={800}
              height={400}
              className="h-auto w-full transition-transform duration-500 hover:scale-105"
            />
          </div>
          {value.alt && (
            <p className="mt-4 text-center text-sm text-slate-500 italic">
              {value.alt}
            </p>
          )}
        </div>
      );
    },
  },
  block: {
    h1: ({ children }: { children?: React.ReactNode }) => (
      <h1 className="font-display mt-12 mb-6 text-3xl font-bold text-slate-900 first:mt-0">
        {children}
      </h1>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2 className="font-display mt-10 mb-4 text-2xl font-bold text-slate-900">
        {children}
      </h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3 className="font-display mt-8 mb-3 text-xl font-bold text-slate-900">
        {children}
      </h3>
    ),
    normal: ({ children }: { children?: React.ReactNode }) => (
      <p className="mb-6 font-serif text-lg leading-relaxed text-slate-700">
        {children}
      </p>
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="my-8 rounded-r-2xl border-l-4 border-teal-500 bg-teal-50/50 py-4 pl-6 font-serif text-lg text-slate-600 italic">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }: { children?: React.ReactNode }) => (
      <ul className="mb-6 list-inside list-disc space-y-3 font-serif text-lg text-slate-700">
        {children}
      </ul>
    ),
    number: ({ children }: { children?: React.ReactNode }) => (
      <ol className="mb-6 list-inside list-decimal space-y-3 font-serif text-lg text-slate-700">
        {children}
      </ol>
    ),
  },
  marks: {
    strong: ({ children }: { children?: React.ReactNode }) => (
      <strong className="font-semibold text-slate-900">{children}</strong>
    ),
    em: ({ children }: { children?: React.ReactNode }) => (
      <em className="text-slate-600 italic">{children}</em>
    ),
    link: ({
      children,
      value,
    }: {
      children?: React.ReactNode;
      value?: { href?: string; blank?: boolean };
    }) => (
      <a
        href={value?.href ?? "#"}
        className="font-medium text-teal-600 underline decoration-teal-300 underline-offset-2 transition-colors duration-300 hover:text-teal-700 hover:decoration-teal-400"
        target={value?.blank ? "_blank" : undefined}
        rel={value?.blank ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    ),
  },
};

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  const imageUrl = post.mainImage
    ? urlFor(post.mainImage).width(1200).height(630).url()
    : null;

  const bodyText = (post.body?.[0] as { children?: Array<{ text?: string }> })
    ?.children?.[0]?.text;

  return {
    title: post.title,
    description: bodyText ?? "Read more about this post on the Odis AI blog.",
    openGraph: {
      title: post.title,
      description: bodyText ?? "Read more about this post on the Odis AI blog.",
      images: imageUrl ? [{ url: imageUrl }] : [],
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author?.name ?? "Unknown Author"],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const imageUrl = post.mainImage
    ? urlFor(post.mainImage).width(800).height(400).url()
    : `https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=400&fit=crop&crop=center&auto=format&q=80`;
  const authorImageUrl = post.author?.image
    ? urlFor(post.author.image).width(60).height(60).url()
    : `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face&auto=format&q=80`;

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative flex min-h-[50vh] items-center justify-center overflow-hidden pt-20">
        {/* Animated background elements */}
        <div
          className="animate-pulse-slow pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 600px 400px at 50% 50%, rgba(49, 171, 163, 0.12) 0%, rgba(49, 171, 163, 0.06) 40%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />

        <div className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <div className="relative space-y-6 text-center">
            {/* Title */}
            <h1 className="font-display animate-fade-in-up text-3xl leading-tight font-bold text-slate-900 sm:text-4xl md:text-5xl lg:text-6xl">
              <span
                className="animate-gradient-subtle bg-gradient-to-r from-slate-600 via-teal-600 to-slate-600 bg-clip-text text-transparent"
                style={{ backgroundSize: "200% 200%" }}
              >
                {post.title}
              </span>
            </h1>

            {/* Author and Date */}
            <div
              className="animate-fade-in-up flex items-center justify-center space-x-4 text-slate-600"
              style={{ transitionDelay: "0.2s" }}
            >
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12 ring-2 ring-teal-100">
                  <AvatarImage
                    src={authorImageUrl}
                    alt={post.author?.name ?? "Author"}
                  />
                  <AvatarFallback className="bg-teal-100 text-lg font-semibold text-teal-700">
                    {post.author?.name?.charAt(0) ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="font-medium text-slate-900">
                    {post.author?.name ?? "Unknown Author"}
                  </p>
                  <time className="text-sm text-slate-500">
                    {format(new Date(post.publishedAt), "MMMM d, yyyy")}
                  </time>
                </div>
              </div>
            </div>
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
              <BreadcrumbLink
                href="/blog"
                className="text-slate-600 transition-colors hover:text-teal-600"
              >
                Blog
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="line-clamp-1 text-slate-900">
                {post.title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <article className="mx-auto max-w-4xl">
          {/* Featured Image */}
          <div className="mb-12 overflow-hidden rounded-2xl shadow-2xl shadow-teal-500/10">
            <Image
              src={imageUrl}
              alt={post.title}
              width={800}
              height={400}
              className="h-auto w-full transition-transform duration-500 hover:scale-105"
            />
          </div>

          {/* Content */}
          <div className="prose prose-lg prose-slate max-w-none">
            <PortableText
              value={post.body}
              components={portableTextComponents}
            />
          </div>

          {/* Author Bio */}
          {post.author?.bio && (
            <div className="mt-16 rounded-2xl border border-slate-200/60 bg-white/80 p-8 shadow-lg backdrop-blur-sm">
              <div className="flex items-start space-x-6">
                <Avatar className="h-20 w-20 ring-4 ring-teal-100">
                  <AvatarImage
                    src={authorImageUrl}
                    alt={post.author?.name ?? "Author"}
                  />
                  <AvatarFallback className="bg-teal-100 text-xl font-semibold text-teal-700">
                    {post.author?.name?.charAt(0) ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="mb-4 text-xl font-bold text-slate-900">
                    About {post.author?.name ?? "Unknown Author"}
                  </h3>
                  <div className="prose prose-slate max-w-none">
                    <PortableText
                      value={post.author?.bio}
                      components={portableTextComponents}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Back to Blog */}
          <div className="mt-16 flex justify-center">
            <Link
              href="/blog"
              className="group inline-flex items-center gap-2 rounded-2xl border border-teal-200/60 bg-teal-100/30 px-6 py-3 font-medium text-teal-700 transition-all duration-300 hover:scale-105 hover:bg-teal-200/50 hover:shadow-lg hover:shadow-teal-500/20"
            >
              <svg
                className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Blog
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}
