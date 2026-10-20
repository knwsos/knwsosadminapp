let all = [];

async function init() {
  const response = await fetch("/api/articles");

  if (!response.ok) {
    console.error("Could not load articles");
    return;
  }

  all = await response.json();

  render(all);

  const searchInput = document.getElementById("search");

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.toLowerCase().trim();

      render(
        all.filter(article =>
          (
            article.title +
            " " +
            article.category +
            " " +
            article.excerpt
          )
            .toLowerCase()
            .includes(query)
        )
      );
    });
  }
}

function render(items) {
  const container = document.getElementById("articles");

  if (!container) return;

  container.innerHTML =
    items.map(articleCard).join("") ||
    '<p class="empty">No matching articles.</p>';
}

function articleCard(article) {
  const image = article.image
    ? `background-image:url('${escapeHtml(article.image)}')`
    : "";

  return `
    <article
      class="card"
      onclick="location='/article.html?id=${encodeURIComponent(article.id)}'"
    >

      <div
        class="pic"
        style="${image}"
      ></div>

      <div class="body">

        <small>
          ${escapeHtml(article.category || "Science")}
          ·
          ${formatDate(article.createdAt)}
        </small>

        <h3>${escapeHtml(article.title)}</h3>

        <p>${escapeHtml(article.excerpt || "")}</p>

      </div>

    </article>
  `;
}

function formatDate(date) {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
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
