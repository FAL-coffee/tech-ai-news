import { createDb, getArticleBySlug, listPublishedArticles } from "@tech-ai-news/db";
import { Hono } from "hono";
import { env } from "./env";
import { runClassify } from "./jobs/classify";
import { runCollect } from "./jobs/collect";
import { runGenerate } from "./jobs/generate";

// Node固有APIには依存しない(将来 Cloudflare Workers へ export default するだけで移行できるように保つ)。
const app = new Hono();

app.get("/health", (c) => c.json({ ok: true }));

app.post("/jobs/collect", async (c) => {
  const summary = await runCollect();
  return c.json(summary);
});

app.post("/jobs/classify", async (c) => {
  const summary = await runClassify();
  return c.json(summary);
});

app.post("/jobs/generate", async (c) => {
  const summary = await runGenerate();
  return c.json(summary);
});

app.get("/articles", async (c) => {
  const db = createDb(env.DATABASE_URL);
  try {
    const topic = c.req.query("topic");
    const articles = await listPublishedArticles(db, { topic });
    return c.json(articles);
  } finally {
    await db.end({ timeout: 5 });
  }
});

app.get("/articles/:slug", async (c) => {
  const db = createDb(env.DATABASE_URL);
  try {
    const article = await getArticleBySlug(db, c.req.param("slug"));
    if (!article || article.status !== "published") return c.json({ error: "not found" }, 404);
    return c.json(article);
  } finally {
    await db.end({ timeout: 5 });
  }
});

export default app;
