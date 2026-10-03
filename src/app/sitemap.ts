import type { MetadataRoute } from "next";
import { CANONICAL_ORIGIN } from "@/lib/kakao-share";
import { GUIDES } from "@/lib/public-content";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["/", "/about", "/guides", "/example-report", ...GUIDES.map((guide) => `/guides/${guide.slug}`)];
  return paths.map((path) => ({ url: `${CANONICAL_ORIGIN}${path}` }));
}
