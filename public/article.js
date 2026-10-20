async function init() {
  const container = document.getElementById("article");

  if (!container) return;

  try {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
      container.innerHTML = `
        <p class="empty">Article not found.</p>
      `;
      return;
    }

    const response = await fetch("/api/articles");

    if (!response.ok) {
      throw new Error("Could not load articles.");
    }

    const articles = await response.json();

    const article = articles.find(
      item => String(item.id) === String(id)
    );

    if (!article) {
      container.innerHTML = `
        <p class="empty">Article not found.</p>
      `;
      return;
    }

    document.title = `${article.title} — knΩsos`;

    container.innerHTML = `
      <article class="article-content">

        <div class="article-meta">
          ${escapeHtml(article.category || "Science")}
          ·
          ${formatDate(article.createdAt)}
        </div>

        <h1>${escapeHtml(article.title)}</h1>

        ${
          article.image
            ? `
              <div class="article-image">
                <img
                  src="${escapeHtml(article.image)}"
                  alt="${escapeHtml(article.title)}"
                >
              </div>
            `
            : ""
        }

        ${
          article.excerpt
            ? `
              <p class="article-excerpt">
                ${escapeHtml(article.excerpt)}
              </p>
            `
            : ""
        }

        <div class="article-text">
          ${formatContent(article.content)}
        </div>

        ${
          article.video
            ? `
              <div class="article-video">
                <iframe
                  src="${youtubeEmbedUrl(article.video)}"
                  title="${escapeHtml(article.title)}"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowfullscreen>
                </iframe>
              </div>
            `
            : ""
        }

        ${
          article.sources
            ? `
              <section class="article-sources">
                <h2>Sources</h2>
                <div class="sources-list">
                  ${formatSources(article.sources)}
                </div>
              </section>
            `
            : ""
        }

      </article>
    `;

  } catch (error) {
    console.error(error);

    container.innerHTML = `
      <p class="empty">
        Could not load this article. Please try again later.
      </p>
    `;
  }
}

function formatDate(date) {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function formatContent(content) {
  return escapeHtml(content || "")
    .split(/\n\s*\n/)
    .map(paragraph => `<p>${paragraph}</p>`)
    .join("");
}

function youtubeEmbedUrl(url) {
  try {
    const parsed = new URL(url);

    let videoId = "";

    if (parsed.hostname === "youtu.be") {
      videoId = parsed.pathname.slice(1);
    } else if (parsed.hostname.includes("youtube.com")) {
      videoId = parsed.searchParams.get("v") || "";

      if (!videoId && parsed.pathname.startsWith("/shorts/")) {
        videoId = parsed.pathname.split("/shorts/")[1];
      }

      if (!videoId && parsed.pathname.startsWith("/embed/")) {
        videoId = parsed.pathname.split("/embed/")[1];
      }
    }

    if (!videoId) return "";

    return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`;
  } catch {
    return "";
  }
}

function formatSources(sources) {
  return String(sources || "")
    .split(/\r?\n/)
    .map(url => url.trim())
    .filter(Boolean)
    .map(url => {
      try {
        const parsed = new URL(url);

        if (!["http:", "https:"].includes(parsed.protocol)) {
          return "";
        }

        return `
          <a
            href="${escapeHtml(parsed.href)}"
            target="_blank"
            rel="noopener noreferrer"
            class="source-link"
          >
            ${escapeHtml(parsed.href)}
          </a>
        `;
      } catch {
        return "";
      }
    })
    .join("");
}

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[character])
  );
}

init();
