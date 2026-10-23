import { notFound } from "next/navigation";
import { getAbsoluteUrl } from "@/lib/config";
import { getLLMText, getPageMarkdownUrl, source } from "@/lib/source";

export const revalidate = false;

export async function GET(
  _req: Request,
  { params }: RouteContext<"/llms.mdx/docs/[[...slug]]">,
) {
  const { slug } = await params;
  if (slug?.at(-1) !== "content.md") notFound();
  const page = source.getPage(slug?.slice(0, -1));
  if (!page) notFound();

  return new Response(await getLLMText(page), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Link: `<${getAbsoluteUrl(page.url)}>; rel="canonical"`,
    },
  });
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    lang: page.locale,
    slug: getPageMarkdownUrl(page).segments,
  }));
}
