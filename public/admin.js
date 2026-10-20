const $ = s => document.querySelector(s);

let articles = [];

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

async function start() {
  try {
    const result = await api("/api/admin/me");

    if (result.authenticated) {
      await dashboard();
    } else {
      login();
    }
  } catch (error) {
    console.error(error);
    login();
  }
}

function login() {
  $("#login").classList.remove("hidden");
  $("#dash").classList.add("hidden");
}

async function dashboard() {
  $("#login").classList.add("hidden");
  $("#dash").classList.remove("hidden");

  await load();
}

$("#loginForm").onsubmit = async event => {
  event.preventDefault();

  $("#error").textContent = "";

  try {
    await api("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({
        password: $("#password").value
      })
    });

    $("#password").value = "";

    await dashboard();

  } catch (error) {
    $("#error").textContent = error.message;
  }
};

$("#logout").onclick = async () => {
  try {
    await api("/api/admin/logout", {
      method: "POST"
    });

    login();
  } catch (error) {
    console.error(error);
  }
};

$("#new").onclick = () => edit();

$("#close").onclick = close;
$("#cancel").onclick = close;

async function load() {
  try {
    articles = await api("/api/admin/articles");

    const list = $("#list");

    if (!articles.length) {
      list.innerHTML = "<p>No articles yet.</p>";
      return;
    }

    list.innerHTML = articles.map(article => `
      <div class="admin-row">

        <div>
          <h3>${esc(article.title)}</h3>

          <small>
            ${esc(article.category || "Science")}
            ·
            ${article.published ? "Published" : "Draft"}
          </small>
        </div>

        <div class="row-actions">

          <button onclick="edit('${esc(article.id)}')">
            Edit
          </button>

          <button
            class="delete"
            onclick="del('${esc(article.id)}')"
          >
            Delete
          </button>

        </div>

      </div>
    `).join("");

  } catch (error) {
    $("#list").innerHTML = `
      <p class="empty">
        ${esc(error.message)}
      </p>
    `;
  }
}

window.edit = id => {

  const article = id
    ? articles.find(item => String(item.id) === String(id))
    : null;

  $("#editor").classList.remove("hidden");

  $("#edTitle").textContent =
    article ? "Edit article" : "New article";

  $("#id").value =
    article?.id || "";

  $("#title").value =
    article?.title || "";

  $("#category").value =
    article?.category || "Biology";

  $("#excerpt").value =
    article?.excerpt || "";

  $("#image").value =
    article?.image || "";

  $("#sources").value = article?.sources || "";

  $("#content").value =
    article?.content || "";

  $("#published").checked =
    Boolean(article?.published);

  $("#editor").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
};

function close() {
  $("#editor").classList.add("hidden");
}

window.del = async id => {

  const article =
    articles.find(item => String(item.id) === String(id));

  if (
    article &&
    !confirm(`Delete "${article.title}"?`)
  ) {
    return;
  }

  try {

    await api(
      "/api/admin/articles/" +
      encodeURIComponent(id),
      {
        method: "DELETE"
      }
    );

    $("#msg").textContent =
      "Article deleted.";

    await load();

  } catch (error) {

    $("#msg").textContent =
      error.message;
  }
};

$("#form").onsubmit = async event => {

  event.preventDefault();

  $("#msg").textContent = "";

  const id = $("#id").value.trim();

  const article = {
    title: $("#title").value.trim(),
    category: $("#category").value,
    excerpt: $("#excerpt").value.trim(),
    image: $("#image").value.trim(),
    video: $("#video").value.trim(),
    sources: $("#sources").value.trim(),
    content: $("#content").value.trim(),
    published: $("#published").checked
  };

  if (!article.title) {
    $("#msg").textContent =
      "Please enter a title.";

    return;
  }

  try {

    if (id) {

      await api(
        "/api/admin/articles/" +
        encodeURIComponent(id),
        {
          method: "PUT",
          body: JSON.stringify(article)
        }
      );

      $("#msg").textContent =
        "Article updated successfully.";

    } else {

      await api(
        "/api/admin/articles",
        {
          method: "POST",
          body: JSON.stringify(article)
        }
      );

      $("#msg").textContent =
        "Article created successfully.";
    }

    close();

    await load();

  } catch (error) {

    console.error(error);

    $("#msg").textContent =
      error.message || "Could not save article.";
  }
};

function esc(value) {

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

start();
