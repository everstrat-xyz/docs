import { permanentRedirect } from "next/navigation";
import { siteConfig } from "@/lib/config";

type RedirectPageProps = {
  params: Promise<{
    slug?: string[];
  }>;
};

export default async function LegacyDocsRedirect(props: RedirectPageProps) {
  const { slug } = await props.params;
  const pathname =
    slug && slug.length > 0
      ? `${siteConfig.routes.docs}${slug.join("/")}`
      : siteConfig.routes.docs;

  permanentRedirect(pathname);
}
