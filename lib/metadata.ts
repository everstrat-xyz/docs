import type { InferPageType } from "fumadocs-core/source";
import type { Metadata, MetadataRoute } from "next";
import {
  getAbsoluteUrl,
  getGitHubRepoUrl,
  getSiteUrl,
  siteConfig,
} from "@/lib/config";
import { getPageLastModified, source } from "@/lib/source";

type DocsPage = InferPageType<typeof source>;

const rootOpenGraph: NonNullable<Metadata["openGraph"]> = {
  type: "website",
  locale: siteConfig.openGraphLocale,
  url: siteConfig.routes.docs,
  siteName: siteConfig.seo.siteTitle,
  title: siteConfig.name,
  description: siteConfig.description,
  images: [
    {
      url: "/opengraph-image",
      width: 1200,
      height: 630,
      type: "image/png",
      alt: siteConfig.seo.defaultSocialImageAlt,
    },
  ],
};

const rootTwitter: NonNullable<Metadata["twitter"]> = {
  card: "summary_large_image",
  title: siteConfig.name,
  description: siteConfig.description,
  images: [
    {
      url: "/opengraph-image",
      alt: siteConfig.seo.defaultSocialImageAlt,
    },
  ],
};

function getVerificationMetadata(): Metadata["verification"] | undefined {
  const google = process.env.GOOGLE_SITE_VERIFICATION;
  const yandex = process.env.YANDEX_VERIFICATION;
  const yahoo = process.env.YAHOO_SITE_VERIFICATION;
  const bing = process.env.BING_SITE_VERIFICATION;

  if (!google && !yandex && !yahoo && !bing) {
    return undefined;
  }

  return {
    google,
    yandex,
    yahoo,
    other: bing
      ? {
          "msvalidate.01": bing,
        }
      : undefined,
  };
}

export const rootMetadata: Metadata = {
  metadataBase: getSiteUrl(),
  applicationName: siteConfig.name,
  title: {
    default: siteConfig.name,
    template: siteConfig.seo.titleTemplate,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  authors: [
    {
      name: siteConfig.creator,
      url: getGitHubRepoUrl(),
    },
  ],
  creator: siteConfig.creator,
  publisher: siteConfig.publisher,
  category: siteConfig.category,
  alternates: {
    canonical: siteConfig.routes.docs,
  },
  manifest: siteConfig.routes.manifest,
  icons: {
    icon: [
      { url: siteConfig.assets.favicon, sizes: "any" },
      {
        url: siteConfig.assets.icon16,
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: siteConfig.assets.icon32,
        sizes: "32x32",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: siteConfig.assets.appleTouchIcon,
        sizes: "180x180",
      },
      {
        url: siteConfig.assets.appleTouchIconPrecomposed,
        sizes: "180x180",
      },
    ],
  },
  openGraph: rootOpenGraph,
  twitter: rootTwitter,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: {
    address: false,
    email: false,
    telephone: false,
  },
  verification: getVerificationMetadata(),
};

export function createDocsPageMetadata(
  page: DocsPage,
  pageImageUrl: string,
  lastModified?: Date,
): Metadata {
  const description = page.data.description ?? siteConfig.description;
  const imageAlt = `${page.data.title} | ${siteConfig.name}`;

  if (page.url === siteConfig.routes.docs) {
    return {
      title: {
        absolute: siteConfig.name,
      },
      description,
      alternates: {
        canonical: siteConfig.routes.docs,
      },
      openGraph: {
        ...rootOpenGraph,
        title: siteConfig.name,
        description,
        images: [
          {
            url: "/opengraph-image",
            width: 1200,
            height: 630,
            type: "image/png",
            alt: siteConfig.seo.defaultSocialImageAlt,
          },
        ],
      },
      twitter: {
        ...rootTwitter,
        title: siteConfig.name,
        description,
      },
    };
  }

  return {
    title: page.data.title,
    description,
    alternates: {
      canonical: page.url,
    },
    openGraph: {
      ...rootOpenGraph,
      type: "article",
      url: page.url,
      title: page.data.title,
      description,
      images: [
        {
          url: pageImageUrl,
          width: 1200,
          height: 630,
          type: "image/webp",
          alt: imageAlt,
        },
      ],
      modifiedTime: lastModified?.toISOString(),
    },
    twitter: {
      ...rootTwitter,
      title: page.data.title,
      description,
      images: [{ url: pageImageUrl, alt: imageAlt }],
    },
  };
}

export function getDisallowedRobotsPaths(): string[] {
  // Markdown exports advertise their HTML canonical through an HTTP Link header.
  // Crawlers must be able to fetch them to discover that relationship.
  return [siteConfig.routes.search];
}

export async function getSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  return Promise.all(
    source.getPages().map(async (page) => ({
      url: getAbsoluteUrl(page.url),
      lastModified: getPageLastModified(page),
      changeFrequency:
        page.url === siteConfig.routes.docs ? "weekly" : "monthly",
      priority: page.url === siteConfig.routes.docs ? 1 : 0.7,
    })),
  );
}
