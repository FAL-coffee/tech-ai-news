import { serve } from "@hono/node-server";
import app from "./app";
import { env } from "./env";
import { startScheduler } from "./scheduler";

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`api listening on http://localhost:${info.port}`);
});

startScheduler();
