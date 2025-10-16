import { Suspense } from "react";
import { client } from "~/sanity/lib/client";
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
import { BlogLayout } from "~/components/BlogLayout";
import { Card } from "~/components/ui/card";
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
  excerpt?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  body: TypedObject[];
}

async function getPosts(): Promise<Post[]> {
  try {
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
      excerpt,
      metaTitle,
      metaDescription,
      keywords,
      body
    }`;

    const posts = await client.fetch<Post[]>(query);

    // If no posts found in Sanity, return empty array
    if (!posts?.length) {
      return [];
    }

    return posts;
  } catch (error) {
    console.warn("Sanity client error:", error);
    // Return empty array if Sanity is not available
    return [];
  }
}

function PostCardSkeleton() {
  return (
    <Card className="group animate-fade-in-up border border-white/20 bg-white/10 shadow-lg shadow-black/10 backdrop-blur-md">
      <div className="p-6 sm:p-8 lg:p-10">
        <div className="grid gap-y-6 sm:grid-cols-10 sm:gap-x-5 sm:gap-y-0 md:items-center md:gap-x-8 lg:gap-x-12">
          {/* Content Section - Left */}
          <div className="sm:col-span-5">
            <div className="mb-6 md:mb-8">
              <div className="flex flex-wrap gap-2 md:gap-3">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>

            <Skeleton className="mb-6 h-8 w-full md:h-10 lg:h-12" />

            <Skeleton className="mb-3 h-4 w-full" />
            <Skeleton className="mb-3 h-4 w-5/6" />
            <Skeleton className="mb-8 h-4 w-4/5" />

            <div className="mb-8 flex items-center space-x-4">
              <Skeleton className="h-4 w-24" />
              <span className="text-slate-300">•</span>
              <Skeleton className="h-4 w-20" />
            </div>

            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </div>
          </div>

          {/* Image Section - Right */}
          <div className="order-first sm:order-last sm:col-span-5">
            <div className="aspect-16/9 overflow-hidden rounded-xl border border-white/20 shadow-md shadow-black/10">
              <Skeleton className="h-full w-full" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

async function BlogPosts() {
  const posts = await getPosts();

  // Transform Sanity posts to BlogLayout format
  const transformedPosts = posts.map((post) => ({
    id: post._id,
    title: post.title,
    summary:
      post.excerpt ??
      (post.body?.[0] as { children?: Array<{ text?: string }> })?.children?.[0]
        ?.text ??
      "No description available",
    label: post.categories?.[0]?.title ?? "General",
    author: post.author?.name ?? "Unknown Author",
    published: post.publishedAt,
    url: `/blog/${post.slug.current}`,
    image: post.mainImage
      ? urlFor(post.mainImage).width(400).height(200).url()
      : `https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=200&fit=crop&crop=center&auto=format&q=80`,
    tags: post.categories?.map((cat) => cat.title) ?? [],
    authorImage: post.author?.image
      ? urlFor(post.author.image).width(40).height(40).url()
      : `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face&auto=format&q=80`,
  }));

  return (
    <BlogLayout
      heading="Latest Insights"
      description="Discover the latest insights and updates on veterinary practice management, technology, and industry trends."
      posts={transformedPosts}
    />
  );
}

export default function BlogPage() {
  return (
    <div className="relative">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 pt-12 sm:px-6 lg:px-8">
        <Breadcrumb className="mb-12">
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
      </div>

      {/* Blog Posts */}
      <Suspense
        fallback={
          <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
            <div className="space-y-8 md:space-y-12">
              {Array.from({ length: 3 }).map((_, i) => (
                <PostCardSkeleton key={i} />
              ))}
            </div>
          </div>
        }
      >
        <BlogPosts />
      </Suspense>
    </div>
  );
}
