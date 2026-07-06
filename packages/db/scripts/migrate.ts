import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { requireEnv } from "./loadEnv";
import { createDb } from "../src/index";

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = resolve(here, "../migrations");

async function main() {
  const db = createDb(requireEnv("DATABASE_URL"));

  await db`
    create table if not exists schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )
  `;

  const applied = new Set(
    (await db<{ name: string }[]>`select name from schema_migrations`).map((r) => r.name),
  );

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`skip (already applied): ${file}`);
      continue;
    }
    const sql = readFileSync(resolve(migrationsDir, file), "utf8");
    console.log(`applying: ${file}`);
    await db.begin(async (tx) => {
      await tx.unsafe(sql);
      await tx`insert into schema_migrations (name) values (${file})`;
    });
  }

  console.log("migrate: done");
  await db.end({ timeout: 5 });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
