import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";

const KEY = "articles.json";

function getArticlesStore() {
  return getStore("knwsos-content");
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET;

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...headers,
    },
  });

async function getArticles() {
  const store = getArticlesStore();
  const result = await store.get(KEY, { type: "json" });
  return Array.isArray(result) ? result : [];
}

async function saveArticles(articles) {
  const store = getArticlesStore();
  await store.setJSON(KEY, articles);
}

function cookies(req) {
  const raw = req.headers.get("cookie") || "";

  return Object.fromEntries(
    raw
      .split(";")
      .map((x) => x.trim())
      .filter(Boolean)
      .map((x) => {
        const i = x.indexOf("=");
        return [
          x.slice(0, i),
          decodeURIComponent(x.slice(i + 1)),
        ];
      })
  );
}

function sign(value) {
  return crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(value)
    .digest("hex");
}

function session() {
  const payload = Buffer.from(
    JSON.stringify({
      ok: true,
      exp: Date.now() + 604800000,
    })
  ).toString("base64url");

  return payload + "." + sign(payload);
}

function valid(req) {
  if (!SESSION_SECRET) return false;

  const token = cookies(req).knwsos_session;

  if (!token) return false;

  const [payload, signature] = token.split(".");

  if (!payload || !signature) return false;

  const expected = sign(payload);

  if (signature.length !== expected.length) return false;

  try {
    return (
      crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expected)
      ) &&
      JSON.parse(
        Buffer.from(payload, "base64url").toString()
      ).exp > Date.now()
    );
  } catch {
    return false;
  }
}

function denied(req) {
  return valid(req)
    ? null
    : json({ error: "Unauthorized" }, 401);
}

function clean(article, old = {}) {
  const now = new Date().toISOString();

  return {
    id: old.id || crypto.randomUUID(),
    title: String(article.title || "").trim(),
    category: String(article.category || "Biology").trim(),
    excerpt: String(article.excerpt || "").trim(),
    content: String(article.content || "").trim(),
    image: String(article.image || "").trim(),
    video: String(article.video || "").trim(),
    sources: String(article.sources || "").trim(),
    published: Boolean(article.published),
    createdAt: old.createdAt || now,
    updatedAt: now,
  };
}

export default async (req) => {
  const url = new URL(req.url);

  const path =
    url.pathname.replace(/^\/api/, "") || "/";

  try {
    // PUBLIC: Get published articles
    if (req.method === "GET" && path === "/articles") {
      const articles = await getArticles();

      return json(
        articles
          .filter((article) => article.published)
          .sort(
            (a, b) =>
              new Date(b.createdAt) -
              new Date(a.createdAt)
          )
      );
    }

    // ADMIN LOGIN
    if (
      req.method === "POST" &&
      path === "/admin/login"
    ) {
      if (!ADMIN_PASSWORD || !SESSION_SECRET) {
        return json(
          {
            error:
              "Admin environment variables are not configured.",
          },
          500
        );
      }

      const body = await req.json().catch(() => ({}));

      if (
        String(body.password || "") !== ADMIN_PASSWORD
      ) {
        return json(
          { error: "Invalid password" },
          401
        );
      }

      return json(
        { ok: true },
        200,
        {
          "set-cookie":
            `knwsos_session=${encodeURIComponent(
              session()
            )}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`,
        }
      );
    }

    // ADMIN LOGOUT
    if (
      req.method === "POST" &&
      path === "/admin/logout"
    ) {
      return json(
        { ok: true },
        200,
        {
          "set-cookie":
            "knwsos_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
        }
      );
    }

    // CHECK LOGIN
    if (
      req.method === "GET" &&
      path === "/admin/me"
    ) {
      return json({
        authenticated: valid(req),
      });
    }

    // ADMIN ARTICLES
    if (path.startsWith("/admin/articles")) {
      const deniedResponse = denied(req);

      if (deniedResponse) {
        return deniedResponse;
      }

      const articles = await getArticles();

      // GET ALL ARTICLES
      if (
        req.method === "GET" &&
        path === "/admin/articles"
      ) {
        return json(
          articles.sort(
            (a, b) =>
              new Date(b.updatedAt) -
              new Date(a.updatedAt)
          )
        );
      }

      // CREATE ARTICLE
      if (
        req.method === "POST" &&
        path === "/admin/articles"
      ) {
        const article = clean(await req.json());

        if (!article.title) {
          return json(
            { error: "Title is required." },
            400
          );
        }

        articles.push(article);

        await saveArticles(articles);

        return json(article, 201);
      }

      // EDIT / DELETE ARTICLE
      const match = path.match(
        /^\/admin\/articles\/([^/]+)$/
      );

      if (match) {
        const id = decodeURIComponent(match[1]);

        const index = articles.findIndex(
          (article) =>
            String(article.id) === String(id)
        );

        if (index < 0) {
          return json(
            { error: "Article not found." },
            404
          );
        }

        // EDIT
        if (req.method === "PUT") {
          const article = clean(
            await req.json(),
            articles[index]
          );

          if (!article.title) {
            return json(
              { error: "Title is required." },
              400
            );
          }

          articles[index] = article;

          await saveArticles(articles);

          return json(article);
        }

        // DELETE
        if (req.method === "DELETE") {
          const removed = articles.splice(
            index,
            1
          )[0];

          await saveArticles(articles);

          return json({
            ok: true,
            removed,
          });
        }
      }
    }

    return json(
      { error: "Not found" },
      404
    );
  } catch (error) {
    console.error("API ERROR:", error);

    return json(
      {
        error:
          error?.message || "Server error",
      },
      500
    );
  }
};
