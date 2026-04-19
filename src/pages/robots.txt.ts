import type { APIRoute } from 'astro';

const siteUrl = import.meta.env.PUBLIC_SITE_URL || 'https://wickedwick-ebda.vercel.app';

export const GET: APIRoute = () => {
  const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Disallow: /cart
Disallow: /checkout/
Sitemap: ${siteUrl}/sitemap-index.xml
`;
  return new Response(body, { status: 200, headers: { 'Content-Type': 'text/plain' } });
};
