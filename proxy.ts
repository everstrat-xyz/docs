import { isMarkdownPreferred, rewritePath } from "fumadocs-core/negotiation";
import { type NextRequest, NextResponse } from "next/server";
import { siteConfig } from "./lib/config";

// The root route already includes the slash before the optional page path.
const docsPath =
  siteConfig.routes.docs === "/"
    ? "/{*path}"
    : `${siteConfig.routes.docs}{/*path}`;

const { rewrite: rewriteDocs } = rewritePath(
  docsPath,
  `${siteConfig.routes.docsContent}{/*path}/content.md`,
);
const { rewrite: rewriteSuffix } = rewritePath(
  `${docsPath}.mdx`,
  `${siteConfig.routes.docsContent}{/*path}/content.md`,
);

export default function proxy(request: NextRequest) {
  let pathname = request.nextUrl.pathname;
  const legacyPrefix = `${siteConfig.routes.legacyDocs}/`;
  if (pathname === siteConfig.routes.legacyDocs) {
    pathname = siteConfig.routes.docs;
  } else if (pathname.startsWith(legacyPrefix)) {
    pathname = `${siteConfig.routes.docs}${pathname.slice(legacyPrefix.length)}`;
  }

  const result = rewriteSuffix(pathname);
  if (result) {
    return NextResponse.rewrite(new URL(result, request.nextUrl));
  }

  if (isMarkdownPreferred(request)) {
    const result = rewriteDocs(pathname);

    if (result) {
      // Keep each representation at its own cache key. Next.js replaces Vary
      // on HTML responses, so a rewritten Markdown body could share that cache.
      const response = NextResponse.redirect(new URL(result, request.nextUrl));
      response.headers.set("Vary", "Accept");
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/search|llms\\.mdx|llms\\.txt|llms-full\\.txt|og/docs|opengraph-image|twitter-image|robots\\.txt|sitemap\\.xml|manifest\\.webmanifest|favicon\\.ico|apple-touch-icon(?:-precomposed)?\\.png|favicon-(?:16x16|32x32)\\.png|icon-(?:192|512)\\.png|_next).*)",
  ],
};
