export const siteConfig = {
  name: "Everstrat Docs",
  shortName: "Everstrat Docs",
  brandName: "Everstrat",
  projectName: "Everstrat",
  description:
    "Product, protocol, app, data, security, and operations documentation for the Everstrat protocol.",
  locale: "en",
  openGraphLocale: "en_US",
  category: "technology",
  creator: "Guide DAO Organization",
  publisher: "Guide DAO Organization",
  keywords: [
    "Everstrat",
    "Everything Strategy",
    "crypto documentation",
    "protocol documentation",
    "smart contracts",
    "Ethereum mainnet",
    "GoldSky subgraph",
    "web3 app",
  ],
  routes: {
    docs: "/",
    legacyDocs: "/docs",
    docsImage: "/og/docs",
    docsContent: "/llms.mdx/docs",
    llmsIndex: "/llms.txt",
    llmsFull: "/llms-full.txt",
    search: "/api/search",
    manifest: "/manifest.webmanifest",
    sitemap: "/sitemap.xml",
  },
  assets: {
    logo: "/logo.svg",
    favicon: "/favicon.ico",
    icon16: "/favicon-16x16.png",
    icon32: "/favicon-32x32.png",
    icon192: "/icon-192.png",
    icon512: "/icon-512.png",
    appleTouchIcon: "/apple-touch-icon.png",
    appleTouchIconPrecomposed: "/apple-touch-icon-precomposed.png",
  },
  links: {
    website:
      process.env.NEXT_PUBLIC_WEBSITE_URL?.trim() || "https://everstrat.xyz/",
    app:
      process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://app.everstrat.xyz/",
  },
  repository: {
    owner: "everstrat-xyz",
    name: "docs",
    branch: "main",
  },
  seo: {
    siteTitle: "Everstrat.xyz | Docs",
    titleTemplate: "%s | Everstrat Docs",
    defaultSocialImageAlt: "Everstrat Docs social preview image",
    themeColor: "#f5f4f3",
    backgroundColor: "#f5f4f3",
  },
  search: {
    language: "english" as const,
  },
} as const;

const defaultSiteUrl = "http://localhost:3000";

function normalisePath(pathname: string): string {
  if (pathname.length === 0) return siteConfig.routes.docs;
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

export function getSiteUrl(): URL {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const isProductionDeployment = process.env.VERCEL_ENV === "production";

  if (!configuredSiteUrl && isProductionDeployment) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL is required for production deployments.",
    );
  }

  let url: URL;

  try {
    url = new URL(configuredSiteUrl || defaultSiteUrl);
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an absolute HTTP(S) origin.");
  }

  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an absolute HTTP(S) origin.");
  }

  if (
    isProductionDeployment &&
    (url.protocol !== "https:" ||
      /^(localhost|.*\.localhost|127\..*|0\.0\.0\.0|\[::1\])$/.test(
        url.hostname,
      ))
  ) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL must use a public HTTPS origin in production.",
    );
  }

  return url;
}

export function getAbsoluteUrl(
  pathname: string = siteConfig.routes.docs,
): string {
  return new URL(normalisePath(pathname), getSiteUrl()).toString();
}

export function getGitHubRepoUrl(): string {
  const { owner, name } = siteConfig.repository;
  return `https://github.com/${owner}/${name}`;
}

export function getGitHubOrganizationUrl(): string {
  return `https://github.com/${siteConfig.repository.owner}`;
}

export function getGitHubContentUrl(pathname: string): string {
  const { owner, name, branch } = siteConfig.repository;
  return `https://github.com/${owner}/${name}/blob/${branch}/${pathname}`;
}
