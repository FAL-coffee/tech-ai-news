import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { requireEnv } from "./loadEnv";
import { createDb } from "../src/index";

const here = dirname(fileURLToPath(import.meta.url));

async function main() {
  const db = createDb(requireEnv("DATABASE_URL"));
  const sql = readFileSync(resolve(here, "../seeds/seed.sql"), "utf8");
  await db.unsafe(sql);

  const [{ count: sourceCount }] = await db<{ count: string }[]>`select count(*) from sources`;
  const [{ count: topicCount }] = await db<{ count: string }[]>`select count(*) from topics`;
  console.log(`seed: done (sources=${sourceCount}, topics=${topicCount})`);

  await db.end({ timeout: 5 });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
