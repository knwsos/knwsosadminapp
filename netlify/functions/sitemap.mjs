import { getStore } from "@netlify/blobs";

const SITE_URL = "https://knwsos.com";
const KEY = "articles.json";

function escapeXml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
  })[character]);
}

export default async () => {
  try {
    const stored = await getStore("knwsos-content").get(KEY, { type: "json" });
    const articles = Array.isArray(stored) ? stored : [];
    const published = articles.filter((article) =>
      article?.published && article.id !== undefined && article.id !== null && String(article.id).trim()
    );

    const urls = [
      `  <url><loc>${SITE_URL}/</loc></url>`,
      `  <url><loc>${SITE_URL}/articles</loc></url>`,
      ...published.map((article) => {
        const loc = `${SITE_URL}/article/${encodeURIComponent(String(article.id))}`;
        const date = new Date(article.updatedAt || article.createdAt || "");
        const lastmod = Number.isNaN(date.getTime())
          ? ""
          : `<lastmod>${date.toISOString().slice(0, 10)}</lastmod>`;
        return `  <url><loc>${escapeXml(loc)}</loc>${lastmod}</url>`;
      }),
    ];

    return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`, {
      status: 200,
      headers: {
        "content-type": "application/xml; charset=utf-8",
        "cache-control": "public, max-age=0, s-maxage=300, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("SITEMAP ERROR:", error);
    return new Response("Sitemap temporarily unavailable.", {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
    });
  }
};
