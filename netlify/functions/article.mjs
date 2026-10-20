import { getStore } from "@netlify/blobs";

const SITE_URL = "https://knwsos.com";
const KEY = "articles.json";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character]);
}

function safeHttpUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function paragraphs(value) {
  return String(value || "")
    .trim()
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function page(title, description, content, status = 200, canonical = SITE_URL) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const errorStyles = status === 404 ? `<style>
    .not-found{min-height:54vh;max-width:760px;margin:auto;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;position:relative;overflow:hidden}
    .not-found small{letter-spacing:2.4px;font-weight:700;color:var(--g)}
    .not-found h1{font-size:clamp(42px,6vw,68px);line-height:1.03;letter-spacing:-3px;margin:18px 0}
    .not-found p{max-width:550px;color:var(--m);font-size:17px;line-height:1.7}
    .not-found .gold{margin-right:10px}
    .not-found a.back{display:inline-block;margin:18px 0 0 8px;color:var(--g)}
    @media(max-width:800px){.not-found{min-height:58vh}.not-found h1{font-size:44px}}
  </style>` : "";
  return new Response(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDescription}">
  <meta name="robots" content="${status === 200 ? "index,follow" : "noindex,follow"}">
  ${status === 200 ? `<link rel="canonical" href="${escapeHtml(canonical)}">` : ""}
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="KNΩSOS">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDescription}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDescription}">
  <link rel="stylesheet" href="/style.css">
  ${errorStyles}
</head>
<body>
<header>
  <a class="logo" href="/">kn<span>Ω</span>sos</a>
  <nav><a href="/">Home</a><a href="/articles">Articles</a><a href="/#junior">Junior</a><a href="/#about">About</a></nav>
  <a class="pill" href="/articles">Search ⌕</a>
</header>
<main id="article" class="article">${content}</main>
<footer><span class="logo">kn<span>Ω</span>sos</span><span>Science, made clear.</span></footer>
</body>
</html>`, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=300, stale-while-revalidate=86400",
      "x-robots-tag": status === 200 ? "index, follow" : "noindex",
    },
  });
}

export default async (req) => {
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) {
      return page("Article not found — KNΩSOS", "This article could not be found.", '<section class="not-found"><small>404 · OUT OF ORBIT</small><h1>This page seems to have drifted away.</h1><p>The article you’re looking for may have moved, or the address might be slightly off. Let’s get you back to something interesting.</p><a class="gold" href="/">Back to home →</a><a class="back" href="/articles">Explore articles →</a></section>', 404);
    }

    const stored = await getStore("knwsos-content").get(KEY, { type: "json" });
    const articles = Array.isArray(stored) ? stored : [];
    const article = articles.find((item) => String(item.id) === id && item.published);

    if (!article) {
      return page("Article not found — KNΩSOS", "This article could not be found.", '<section class="not-found"><small>404 · OUT OF ORBIT</small><h1>This page seems to have drifted away.</h1><p>The article you’re looking for may have moved, or the address might be slightly off. Let’s get you back to something interesting.</p><a class="gold" href="/">Back to home →</a><a class="back" href="/articles">Explore articles →</a></section>', 404);
    }

    const canonical = `${SITE_URL}/article/${encodeURIComponent(article.id)}`;
    const title = `${article.title} — KNΩSOS`;
    const description = String(article.excerpt || article.content || "Read this science article on KNΩSOS.")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 300);
    const image = safeHttpUrl(article.image);
    const body = `
      <article class="article-content">
        <div class="article-meta">${escapeHtml(article.category || "Science")}${article.createdAt ? ` · ${escapeHtml(formatDate(article.createdAt))}` : ""}</div>
        <h1>${escapeHtml(article.title)}</h1>
        ${image ? `<div class="article-image"><img src="${escapeHtml(image)}" alt="${escapeHtml(article.title)}"></div>` : ""}
        ${article.excerpt ? `<p class="article-excerpt">${escapeHtml(article.excerpt)}</p>` : ""}
        <div class="article-text">${paragraphs(article.content)}</div>
        ${article.video && safeHttpUrl(article.video) ? `<p><a href="${escapeHtml(safeHttpUrl(article.video))}" rel="noopener noreferrer">Watch the related video</a></p>` : ""}
      </article>`;
    const structuredData = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: String(article.title || ""),
      description,
      datePublished: article.createdAt || undefined,
      dateModified: article.updatedAt || article.createdAt || undefined,
      image: image || undefined,
      articleSection: article.category || undefined,
      mainEntityOfPage: canonical,
      publisher: { "@type": "Organization", name: "KNΩSOS", url: SITE_URL },
    }).replace(/</g, "\\u003c");

    const response = page(title, description, `${body}<script type="application/ld+json">${structuredData}</script>`, 200, canonical);
    return response;
  } catch (error) {
    console.error("ARTICLE PAGE ERROR:", error);
    return page("Article unavailable — KNΩSOS", "This article is temporarily unavailable.", '<p class="empty">Could not load this article. Please try again later.</p>', 500);
  }
};
