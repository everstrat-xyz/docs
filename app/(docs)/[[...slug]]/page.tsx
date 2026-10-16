import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  PageLastUpdate,
  ViewOptionsPopover,
} from "fumadocs-ui/layouts/docs/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChangelogNav } from "@/components/changelog";
import { getMDXComponents } from "@/components/mdx";
import { getGitHubContentUrl, siteConfig } from "@/lib/config";
import { createDocsPageMetadata } from "@/lib/metadata";
import {
  getPageContentPath,
  getPageImage,
  getPageLastModified,
  getPageMarkdownUrl,
  source,
} from "@/lib/source";
import {
  getDocsPageJsonLd,
  getHomePageJsonLd,
  JsonLd,
} from "@/lib/structured-data";

type DocsPageProps = {
  params: Promise<{
    slug?: string[];
  }>;
};

export default async function Page(props: DocsPageProps) {
  const { slug } = await props.params;
  const page = source.getPage(slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const markdownUrl = getPageMarkdownUrl(page).url;
  const pageImage = getPageImage(page);
  const contentPath = getPageContentPath(page);
  const description = page.data.description ?? siteConfig.description;
  const lastModified = getPageLastModified(page);
  const isChangelog = page.slugs[0] === "changelog";

  return (
    <>
      {page.url !== "/" ? (
        <JsonLd
          data={getDocsPageJsonLd({
            title: page.data.title,
            description,
            pageUrl: page.url,
            imageUrl: pageImage.url,
            lastModified,
          })}
        />
      ) : (
        <JsonLd data={getHomePageJsonLd(description)} />
      )}
      <DocsPage
        toc={page.data.toc}
        full={page.data.full ?? (page.url === "/" || isChangelog)}
        tableOfContent={{ enabled: !isChangelog }}
        tableOfContentPopover={{ enabled: !isChangelog }}
        footer={{ enabled: page.url !== "/", className: "docs-page-footer" }}
        className={
          isChangelog
            ? "docs-changelog"
            : page.url === "/"
              ? "docs-home"
              : undefined
        }
      >
        <header className="docs-page-header">
          <DocsTitle>{page.data.title}</DocsTitle>
          <DocsDescription className="mb-0">
            {page.data.description}
          </DocsDescription>
          <div
            className="docs-page-actions flex flex-wrap gap-2 items-center"
            hidden={isChangelog}
          >
            <MarkdownCopyButton markdownUrl={markdownUrl} />
            <ViewOptionsPopover
              markdownUrl={markdownUrl}
              githubUrl={getGitHubContentUrl(`content/docs/${contentPath}`)}
            />
          </div>
        </header>
        {isChangelog ? <ChangelogNav active={page.slugs[1]} /> : null}
        <DocsBody>
          <MDX
            components={getMDXComponents({
              // This allows relative MDX links to resolve against the root docs route.
              a: createRelativeLink(source, page),
            })}
          />
        </DocsBody>
        {lastModified && (
          <PageLastUpdate className="mt-6" date={lastModified} />
        )}
      </DocsPage>
    </>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(
  props: DocsPageProps,
): Promise<Metadata> {
  const { slug } = await props.params;
  const page = source.getPage(slug);
  if (!page) notFound();

  return createDocsPageMetadata(
    page,
    getPageImage(page).url,
    getPageLastModified(page),
  );
}
