import { ImageResponse } from "@takumi-rs/image-response";
import { notFound } from "next/navigation";
import { siteConfig } from "@/lib/config";
import { SocialImage } from "@/lib/social-image";
import { getPageImage, source } from "@/lib/source";

export const revalidate = false;

export async function GET(
  _req: Request,
  { params }: RouteContext<"/og/docs/[...slug]">,
) {
  const { slug } = await params;
  if (slug.at(-1) !== "image.webp") notFound();
  const page = source.getPage(slug.slice(0, -1));
  if (!page) notFound();

  return new ImageResponse(
    <SocialImage
      title={page.data.title}
      description={page.data.description ?? siteConfig.description}
    />,
    {
      width: 1200,
      height: 630,
      format: "webp",
    },
  );
}

export function generateStaticParams() {
  return source
    .getPages()
    .map((page) => ({ slug: getPageImage(page).segments }));
}
