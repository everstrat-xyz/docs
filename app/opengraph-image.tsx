import { ImageResponse } from "@takumi-rs/image-response";
import { siteConfig } from "@/lib/config";
import { SocialImage } from "@/lib/social-image";
import { source } from "@/lib/source";

export const alt = siteConfig.seo.defaultSocialImageAlt;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <SocialImage
      title={siteConfig.name}
      description={
        source.getPage([])?.data.description ?? siteConfig.description
      }
    />,
    { ...size, format: "png" },
  );
}
