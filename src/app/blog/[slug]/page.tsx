import { notFound } from "next/navigation";
import { headers } from "next/headers";
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
  _updatedAt?: string;
  excerpt?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  body: TypedObject[];
}

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getPost(slug: string): Promise<Post | null> {
  try {
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
      _updatedAt,
      excerpt,
      metaTitle,
      metaDescription,
      keywords,
      body
    }`;

    const post = await client.fetch<Post | null>(query, { slug });

    return post;
  } catch (error) {
    console.warn("Sanity client error:", error);
    return null;
  }
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
          <div className="overflow-hidden rounded-3xl border border-white/20 shadow-2xl shadow-black/20">
            <Image
              src={imageUrl}
              alt={value.alt ?? "Blog post image"}
              width={800}
              height={400}
              className="h-auto w-full transition-transform duration-500 hover:scale-105"
            />
          </div>
          {value.alt && (
            <p className="mt-4 text-center text-sm text-slate-600 italic">
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
    h4: ({ children }: { children?: React.ReactNode }) => (
      <h4 className="font-display mt-6 mb-2 text-lg font-semibold text-slate-800">
        {children}
      </h4>
    ),
    normal: ({ children }: { children?: React.ReactNode }) => (
      <p className="mb-6 font-serif text-lg leading-relaxed text-slate-700">
        {children}
      </p>
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="my-8 rounded-2xl border border-white/20 bg-white/10 py-6 pr-6 pl-8 font-serif text-lg text-slate-600 italic shadow-lg shadow-black/10 backdrop-blur-md">
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

  // Use SEO fields if available, fallback to body text
  const title = post.metaTitle ?? post.title;
  const description =
    post.metaDescription ??
    post.excerpt ??
    (post.body?.[0] as { children?: Array<{ text?: string }> })?.children?.[0]
      ?.text ??
    "Read more about this post on the Odis AI blog.";

  const hdrs = await headers();
  const host =
    hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") ?? "https";
  const origin = `${proto}://${host}`;
  const canonicalPath = `/blog/${post.slug.current}`;
  const canonical = `${origin}${canonicalPath}`;

  return {
    title,
    description,
    keywords: post.keywords?.join(", "),
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      images: imageUrl ? [{ url: imageUrl }] : [],
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post._updatedAt,
      authors: [post.author?.name ?? "Unknown Author"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
    other: {
      lastModified: post._updatedAt ?? post.publishedAt,
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

  const hdrs = await headers();
  const host =
    hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") ?? "https";
  const origin = `${proto}://${host}`;
  const canonical = `${origin}/blog/${post.slug.current}`;
  const logoUrl = `${origin}/icon-128.png`;
  const ogImage = post.mainImage
    ? urlFor(post.mainImage).width(1200).height(630).url()
    : undefined;

  return (
    <div className="relative">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 pt-24 pb-4">
        <Breadcrumb>
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
      </div>

      {/* Hero Section */}
      <section className="relative flex min-h-[40vh] items-center justify-center overflow-hidden">
        {/* Enhanced animated background elements */}
        <div
          className="animate-pulse-slow pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 800px 600px at 50% 50%, rgba(49, 171, 163, 0.15) 0%, rgba(49, 171, 163, 0.08) 40%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />

        {/* Additional floating elements */}
        <div
          className="animate-float-slow pointer-events-none absolute top-1/4 left-1/4 h-[400px] w-[400px] rounded-full opacity-20 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(49, 171, 163, 0.1) 0%, transparent 60%)",
          }}
        />
        <div
          className="animate-float-slow-reverse pointer-events-none absolute right-1/3 bottom-1/3 h-[300px] w-[300px] rounded-full opacity-15 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(49, 171, 163, 0.08) 0%, transparent 60%)",
          }}
        />

        <div className="relative mx-auto max-w-3xl px-4 pb-8 sm:px-6">
          <div className="relative space-y-6 text-center">
            {/* Title */}
            <h1 className="font-display animate-fade-in-up text-3xl leading-tight font-bold text-slate-900 sm:text-4xl md:text-5xl">
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
              <div className="flex items-center space-x-4 rounded-2xl border border-white/20 bg-white/10 px-6 py-4 shadow-lg shadow-black/10 backdrop-blur-md">
                <Avatar className="h-14 w-14 ring-2 ring-white/30">
                  <AvatarImage
                    src={authorImageUrl}
                    alt={post.author?.name ?? "Author"}
                  />
                  <AvatarFallback className="bg-white/20 text-lg font-semibold text-slate-700">
                    {post.author?.name?.charAt(0) ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="font-semibold text-slate-900">
                    {post.author?.name ?? "Unknown Author"}
                  </p>
                  <time className="text-sm text-slate-600">
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
        {/* JSON-LD: Article */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              mainEntityOfPage: canonical,
              headline: post.metaTitle ?? post.title,
              description:
                post.metaDescription ??
                post.excerpt ??
                (post.body?.[0] as { children?: Array<{ text?: string }> })
                  ?.children?.[0]?.text ??
                undefined,
              image: ogImage ? [ogImage] : undefined,
              datePublished: post.publishedAt,
              dateModified: post._updatedAt ?? post.publishedAt,
              author: post.author?.name
                ? { "@type": "Person", name: post.author.name }
                : undefined,
              publisher: {
                "@type": "Organization",
                name: "Odis AI",
                logo: { "@type": "ImageObject", url: logoUrl },
              },
            }),
          }}
        />

        {/* JSON-LD: Breadcrumbs */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: `${origin}/`,
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Blog",
                  item: `${origin}/blog`,
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: post.title,
                  item: canonical,
                },
              ],
            }),
          }}
        />
        <article className="mx-auto max-w-3xl">
          {/* Featured Image */}
          <div className="mb-12 overflow-hidden rounded-3xl border border-white/20 shadow-2xl shadow-black/20">
            <Image
              src={imageUrl}
              alt={post.title}
              width={800}
              height={400}
              className="h-auto w-full transition-transform duration-500 hover:scale-105"
            />
          </div>

          {/* Content */}
          <div className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-lg shadow-black/10 backdrop-blur-md sm:p-8">
            <div className="prose prose-lg prose-slate max-w-none">
              <PortableText
                value={post.body}
                components={portableTextComponents}
              />
            </div>
          </div>

          {/* Author Bio */}
          {post.author?.bio && (
            <div className="mt-12 rounded-3xl border border-white/20 bg-white/10 p-6 shadow-lg shadow-black/10 backdrop-blur-md sm:p-8">
              <div className="flex flex-col items-center space-y-6 sm:flex-row sm:items-start sm:space-y-0 sm:space-x-8">
                <Avatar className="h-24 w-24 ring-4 ring-white/30">
                  <AvatarImage
                    src={authorImageUrl}
                    alt={post.author?.name ?? "Author"}
                  />
                  <AvatarFallback className="bg-white/20 text-xl font-semibold text-slate-700">
                    {post.author?.name?.charAt(0) ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="mb-6 text-2xl font-bold text-slate-900">
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
              className="group inline-flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-8 py-4 font-semibold text-slate-700 shadow-lg shadow-black/10 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-white/15 hover:shadow-xl hover:shadow-black/20"
            >
              <svg
                className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
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
